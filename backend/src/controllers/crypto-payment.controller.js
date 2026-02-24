import prisma from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { isGaslessEnabled, getFiatOnRampConfig, web3Config } from '../config/web3.config.js';

/**
 * Crypto Payment Controller — FlowConnect
 * Gerencia pagamentos USDC nativos na Polygon
 */

const isProduction = process.env.NODE_ENV === 'production';
const network = isProduction ? polygon : polygonAmoy;

const publicClient = createPublicClient({
    chain: network,
    transport: http(process.env.POLYGON_RPC_URL),
});

// ============================================
// CRIAR ORDEM DE PAGAMENTO
// ============================================

/**
 * POST /api/v1/payments/crypto/create-order
 * Cria uma ordem de pagamento crypto e retorna dados para o frontend
 */
export const createCryptoOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { creatorId, type, amountUSD, subscriptionId, postId, messageId } = req.body;

        // Validações
        if (!creatorId) return res.status(400).json({ success: false, message: 'creatorId é obrigatório' });
        if (!amountUSD || amountUSD < 1) return res.status(400).json({ success: false, message: 'Valor mínimo é $1' });
        if (amountUSD > 10000) return res.status(400).json({ success: false, message: 'Valor máximo é $10.000' });
        if (!type) return res.status(400).json({ success: false, message: 'Tipo de pagamento é obrigatório' });

        // Busca criador
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            select: {
                id: true,
                payoutWallet: true,
                displayName: true,
                user: { select: { username: true } },
            },
        });

        if (!creator) return res.status(404).json({ success: false, message: 'Criador não encontrado' });
        if (!creator.payoutWallet) {
            return res.status(400).json({
                success: false,
                message: 'Este criador ainda não configurou a carteira de recebimento',
            });
        }

        // Impede pagamento para si mesmo
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { creatorProfile: { select: { id: true } } } });
        if (user?.creatorProfile?.id === creatorId) {
            return res.status(400).json({ success: false, message: 'Você não pode pagar a si mesmo' });
        }

        // Gera ID único do pedido
        const orderId = `ord_${uuidv4().replace(/-/g, '')}`;

        // Calcula taxas
        const platformFee = parseFloat(amountUSD) * 0.10;
        const netAmount = parseFloat(amountUSD) - platformFee;
        const usdcAmount = BigInt(Math.floor(parseFloat(amountUSD) * 1e6));

        // Cria registro de pagamento
        const payment = await prisma.payment.create({
            data: {
                userId,
                creatorId,
                type,
                amountUSD: parseFloat(amountUSD),
                currency: 'USDC',
                status: 'PENDING',
                gateway: 'CRYPTO_DIRECT',
                gatewayOrderId: orderId,
                platformFee,
                gatewayFee: 0,
                netAmount,
                subscriptionId,
                postId,
                messageId,
                cryptoCurrency: 'USDC',
                cryptoAmount: usdcAmount.toString(),
                expectedAmount: usdcAmount.toString(),
                metadata: {
                    orderId,
                    creatorWallet: creator.payoutWallet,
                    contractAddress: process.env.PAYMENT_CONTRACT_ADDRESS,
                    network: network.name,
                    gasless: isGaslessEnabled(),
                },
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
            },
        });

        logger.info('✅ Ordem crypto criada:', { orderId, paymentId: payment.id, amountUSD });

        // Configurações gasless
        const gaslessConfig = isGaslessEnabled()
            ? {
                enabled: true,
                forwarder: process.env.TRUSTED_FORWARDER_ADDRESS,
                paymasterUrl: web3Config.gasless.biconomy?.paymasterUrl,
            }
            : { enabled: false };

        res.status(201).json({
            success: true,
            data: {
                paymentId: payment.id,
                orderId,

                // Valores
                amountUSD: parseFloat(amountUSD),
                amountUSDC: formatUnits(usdcAmount, 6),
                platformFee,
                netAmount,

                // Contrato
                contractAddress: process.env.PAYMENT_CONTRACT_ADDRESS,
                creatorWallet: creator.payoutWallet,
                usdcAddress: isProduction
                    ? '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
                    : process.env.USDC_ADDRESS_POLYGON,

                // Rede
                network: network.name,
                chainId: network.id,

                // Gasless
                gasless: gaslessConfig,

                // Expiração
                expiresAt: payment.expiresAt,

                // Info do criador
                creator: {
                    id: creator.id,
                    displayName: creator.displayName,
                    username: creator.user.username,
                },
            },
        });

    } catch (error) {
        logger.error('Erro ao criar ordem crypto:', error);
        res.status(500).json({ success: false, message: 'Falha ao criar ordem', error: error.message });
    }
};

// ============================================
// VERIFICAR PAGAMENTO ON-CHAIN
// ============================================

/**
 * POST /api/v1/payments/crypto/verify
 * Verifica transação na blockchain após envio pelo usuário
 */
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, txHash } = req.body;
        const userId = req.user.id;

        if (!txHash?.match(/^0x[a-fA-F0-9]{64}$/)) {
            return res.status(400).json({ success: false, message: 'Hash de transação inválido' });
        }

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, userId, status: 'PENDING' },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado ou já processado',
            });
        }

        // Verifica expiração
        if (payment.expiresAt && payment.expiresAt < new Date()) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'EXPIRED' },
            });
            return res.status(400).json({ success: false, message: 'Ordem de pagamento expirada' });
        }

        // Busca recibo na blockchain
        let receipt;
        try {
            receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Transação não encontrada. Aguarde alguns segundos e tente novamente.',
            });
        }

        if (!receipt) {
            return res.status(400).json({ success: false, message: 'Transação ainda não confirmada' });
        }

        if (receipt.status !== 'success') {
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'FAILED', web3TxHash: txHash },
            });
            return res.status(400).json({ success: false, message: 'Transação falhou na blockchain' });
        }

        // Atualiza com status confirmando
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'CONFIRMING',
                web3TxHash: txHash,
                web3BlockNumber: Number(receipt.blockNumber),
                web3Confirmations: 0,
            },
        });

        logger.info('Verificação iniciada:', { paymentId, txHash });

        res.json({
            success: true,
            message: 'Transação encontrada! Aguardando confirmações da rede...',
            data: {
                paymentId,
                txHash,
                status: 'CONFIRMING',
                blockNumber: Number(receipt.blockNumber),
                explorerUrl: `${isProduction ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com'}/tx/${txHash}`,
            },
        });

    } catch (error) {
        logger.error('Erro ao verificar pagamento:', error);
        res.status(500).json({ success: false, message: 'Falha ao verificar pagamento' });
    }
};

// ============================================
// STATUS DO PAGAMENTO
// ============================================

/**
 * GET /api/v1/payments/crypto/:paymentId/status
 */
export const getCryptoPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, userId },
            include: {
                creator: {
                    select: {
                        displayName: true,
                        payoutWallet: true,
                        user: { select: { username: true, avatar: true } },
                    },
                },
            },
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
        }

        // Atualiza confirmações se ainda confirmando
        let confirmations = payment.web3Confirmations || 0;
        if (payment.web3TxHash && payment.status === 'CONFIRMING') {
            try {
                const currentBlock = await publicClient.getBlockNumber();
                confirmations = Number(currentBlock) - (payment.web3BlockNumber || 0);
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: { web3Confirmations: confirmations },
                });
            } catch (err) {
                logger.error('Erro ao verificar confirmações:', err);
            }
        }

        const explorerBase = isProduction ? 'https://polygonscan.com' : 'https://amoy.polygonscan.com';

        res.json({
            success: true,
            data: {
                id: payment.id,
                status: payment.status,
                amountUSD: payment.amountUSD,
                type: payment.type,
                gateway: payment.gateway,
                web3TxHash: payment.web3TxHash,
                web3Confirmations: confirmations,
                confirmationsRequired: 2,
                confirmedAt: payment.confirmedAt,
                createdAt: payment.createdAt,
                expiresAt: payment.expiresAt,
                explorerUrl: payment.web3TxHash
                    ? `${explorerBase}/tx/${payment.web3TxHash}`
                    : null,
                creator: payment.creator,
            },
        });

    } catch (error) {
        logger.error('Erro ao buscar status:', error);
        res.status(500).json({ success: false, message: 'Falha ao buscar status' });
    }
};

// ============================================
// SALDO DO CRIADOR
// ============================================

/**
 * GET /api/v1/payments/creators/balance
 */
export const getCreatorBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const creator = await prisma.creator.findUnique({
            where: { userId },
            include: { balance: true },
        });

        if (!creator) {
            return res.status(404).json({ success: false, message: 'Perfil de criador não encontrado' });
        }

        // Consulta saldo on-chain
        let onChainBalance = 0;
        if (creator.payoutWallet && process.env.PAYMENT_CONTRACT_ADDRESS) {
            try {
                const balance = await publicClient.readContract({
                    address: process.env.PAYMENT_CONTRACT_ADDRESS,
                    abi: [{
                        name: 'creatorBalances',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [{ name: 'creator', type: 'address' }],
                        outputs: [{ name: '', type: 'uint256' }],
                    }],
                    functionName: 'creatorBalances',
                    args: [creator.payoutWallet],
                });
                onChainBalance = Number(formatUnits(balance, 6));
            } catch (err) {
                logger.error('Erro ao ler saldo on-chain:', err);
            }
        }

        res.json({
            success: true,
            data: {
                availableUSD: creator.balance?.availableUSD || 0,
                lifetimeEarnings: creator.balance?.lifetimeEarnings || 0,
                onChainBalance,           // Disponível para saque no contrato
                payoutWallet: creator.payoutWallet,
                hasWallet: !!creator.payoutWallet,
                canWithdraw: onChainBalance > 0,
            },
        });

    } catch (error) {
        logger.error('Erro ao buscar saldo:', error);
        res.status(500).json({ success: false, message: 'Falha ao buscar saldo' });
    }
};

// ============================================
// FIAT ON-RAMP — URL ASSINADA (Moonpay / Transak)
// ============================================

/**
 * GET /api/v1/payments/crypto/onramp-url
 * Gera URL assinada para compra de USDC via cartão/PIX
 */
export const getOnRampUrl = async (req, res) => {
    try {
        const userId = req.user.id;
        const { provider = 'moonpay', amountUSD, walletAddress } = req.query;

        const fiatConfig = getFiatOnRampConfig();

        if (!fiatConfig.anyEnabled) {
            return res.status(503).json({
                success: false,
                message: 'Compra com cartão não disponível no momento',
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, createdAt: true },
        });

        let url;

        if (provider === 'moonpay' && fiatConfig.moonpay.enabled) {
            url = buildMoonpayUrl({
                apiKey: fiatConfig.moonpay.apiKey,
                secretKey: fiatConfig.moonpay.secretKey,
                walletAddress: walletAddress || '',
                amountUSD: parseFloat(amountUSD) || 10,
                email: user.email,
            });

        } else if (provider === 'transak' && fiatConfig.transak.enabled) {
            url = buildTransakUrl({
                apiKey: fiatConfig.transak.apiKey,
                environment: fiatConfig.transak.environment,
                widgetUrl: fiatConfig.transak.widgetUrl,
                walletAddress: walletAddress || '',
                amountUSD: parseFloat(amountUSD) || 10,
                email: user.email,
            });

        } else {
            return res.status(400).json({ success: false, message: 'Provedor inválido ou não configurado' });
        }

        res.json({ success: true, data: { url, provider } });

    } catch (error) {
        logger.error('Erro ao gerar URL on-ramp:', error);
        res.status(500).json({ success: false, message: 'Falha ao gerar link de compra' });
    }
};

// ============================================
// HELPERS — URLS DE FIAT ON-RAMP
// ============================================

function buildMoonpayUrl({ apiKey, secretKey, walletAddress, amountUSD, email }) {
    const params = new URLSearchParams({
        apiKey,
        currencyCode: 'usdc_polygon',
        walletAddress,
        baseCurrencyAmount: amountUSD.toString(),
        email,
        colorCode: '%23000000', // Cor preta (FlowConnect)
        language: 'pt',
    });

    const urlWithoutSignature = `https://buy.moonpay.com?${params.toString()}`;

    // Assina a URL com HMAC-SHA256
    if (secretKey) {
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(new URL(urlWithoutSignature).search)
            .digest('base64');

        return `${urlWithoutSignature}&signature=${encodeURIComponent(signature)}`;
    }

    return urlWithoutSignature;
}

function buildTransakUrl({ apiKey, environment, widgetUrl, walletAddress, amountUSD, email }) {
    const params = new URLSearchParams({
        apiKey,
        environment,
        defaultCryptoCurrency: 'USDC',
        network: 'polygon',
        walletAddress,
        fiatAmount: amountUSD.toString(),
        fiatCurrency: 'BRL',
        email,
        themeColor: '000000', // Preto
        hideMenu: 'true',
        isFeeCalculationShown: 'true',
    });

    return `${widgetUrl}?${params.toString()}`;
}

// ============================================
// PREÇO / CONVERSÃO
// ============================================

/**
 * GET /api/v1/payments/crypto/price
 */
export const getUSDCPrice = async (req, res) => {
    try {
        const { amount = '10', currency = 'BRL' } = req.query;

        // USDC é 1:1 com USD — converte para moeda local
        const rates = { USD: 1, BRL: 5.5, EUR: 0.92, GBP: 0.79 };
        const rate = rates[currency] || 1;
        const convertedAmount = parseFloat(amount) * rate;

        res.json({
            success: true,
            data: {
                amountUSD: parseFloat(amount),
                amountUSDC: parseFloat(amount), // 1:1
                currency,
                convertedAmount: convertedAmount.toFixed(2),
                rate,
                note: 'USDC é sempre 1:1 com USD',
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Falha ao buscar preço' });
    }
};

export default {
    createCryptoOrder,
    verifyPayment,
    getCryptoPaymentStatus,
    getCreatorBalance,
    getOnRampUrl,
    getUSDCPrice,
};