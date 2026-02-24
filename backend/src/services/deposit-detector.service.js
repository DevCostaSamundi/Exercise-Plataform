import { createPublicClient, http, formatUnits } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Deposit Detector Service
 * Monitora depósitos USDC nas carteiras pessoais dos usuários
 * Acionado pelo Alchemy Webhook (ADDRESS_ACTIVITY)
 */
class DepositDetectorService {
    constructor() {
        const network = process.env.NODE_ENV === 'production' ? polygon : polygonAmoy;

        this.client = createPublicClient({
            chain: network,
            transport: http(process.env.POLYGON_RPC_URL),
        });

        this.usdcAddress = process.env.USDC_ADDRESS_POLYGON;
    }

    /**
     * Processa um evento de depósito USDC recebido do Alchemy webhook
     * @param {Object} activity - Objeto activity do Alchemy ADDRESS_ACTIVITY
     *
     * Formato correto do Alchemy:
     * {
     *   hash: "0x...",
     *   fromAddress: "0x...",
     *   toAddress: "0x...",
     *   asset: "USDC",
     *   category: "token",
     *   rawContract: { rawValue: "1000000", address: "0x...", decimals: 6 }
     * }
     */
    async processDepositEvent(activity) {
        try {
            // ✅ FORMATO CORRETO do Alchemy ADDRESS_ACTIVITY
            const txHash = activity.hash;
            const to = activity.toAddress?.toLowerCase();
            const rawAmount = activity.rawContract?.rawValue;

            if (!txHash || !to || !rawAmount) {
                logger.warn('⚠️ Dados incompletos na activity do Alchemy:', {
                    hasHash: !!txHash,
                    hasTo: !!to,
                    hasRawAmount: !!rawAmount,
                });
                return { success: false, reason: 'incomplete_data' };
            }

            const amount = BigInt(rawAmount);
            const amountUSD = Number(formatUnits(amount, 6));

            logger.info('💰 Evento de depósito recebido:', { txHash, to, amountUSD });

            // Depósito mínimo
            if (amountUSD < 1) {
                logger.warn('Depósito abaixo do mínimo:', { amountUSD, txHash });
                return { success: false, reason: 'below_minimum' };
            }

            // Busca o usuário dono desta carteira
            const user = await prisma.user.findUnique({
                where: { web3Wallet: to },
                include: { wallet: true },
            });

            if (!user) {
                logger.warn('Depósito para carteira desconhecida:', { to, amountUSD });
                return { success: false, reason: 'unknown_wallet' };
            }

            // Idempotência: verifica se já foi processado
            const existingDeposit = await prisma.payment.findFirst({
                where: {
                    web3TxHash: txHash,
                    type: 'WALLET_DEPOSIT',
                },
            });

            if (existingDeposit) {
                logger.info('Depósito já processado anteriormente:', { txHash });
                return { success: true, alreadyProcessed: true };
            }

            // Cria o registro e atualiza saldo atomicamente
            const deposit = await prisma.$transaction(async (tx) => {
                const dep = await tx.payment.create({
                    data: {
                        userId: user.id,
                        type: 'WALLET_DEPOSIT',
                        amountUSD,
                        currency: 'USDC',
                        cryptoCurrency: 'USDC',
                        cryptoAmount: amount.toString(),
                        cryptoAddress: to,
                        status: 'COMPLETED',
                        gateway: 'WEB3_DIRECT',
                        gatewayOrderId: `dep_${txHash.slice(2, 18)}`,
                        web3TxHash: txHash,
                        web3Confirmations: 2,
                        confirmedAt: new Date(),
                        paidAt: new Date(),
                    },
                });

                await tx.userWallet.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        balanceUSD: amountUSD,
                        totalDeposited: amountUSD,
                    },
                    update: {
                        balanceUSD: { increment: amountUSD },
                        totalDeposited: { increment: amountUSD },
                    },
                });

                await tx.notification.create({
                    data: {
                        userId: user.id,
                        type: 'PAYMENT',
                        title: '✅ Depósito Recebido',
                        message: `$${amountUSD.toFixed(2)} USDC foi adicionado ao seu saldo`,
                        metadata: {
                            depositId: dep.id,
                            txHash,
                            amount: amountUSD,
                        },
                    },
                });

                return dep;
            });

            logger.info('✅ Depósito processado com sucesso:', {
                userId: user.id,
                amountUSD,
                txHash,
                novoSaldo: (user.wallet?.balanceUSD || 0) + amountUSD,
            });

            return { success: true, deposit };

        } catch (error) {
            logger.error('❌ Erro ao processar depósito:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Retorna o endereço de depósito do usuário (sua própria carteira)
     */
    async getDepositAddress(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { web3Wallet: true },
            });

            if (!user || !user.web3Wallet) {
                throw new Error('Carteira do usuário não configurada');
            }

            return {
                address: user.web3Wallet,
                currency: 'USDC',
                network: 'Polygon',
                minAmount: 1,
            };
        } catch (error) {
            logger.error('Erro ao obter endereço de depósito:', error);
            throw error;
        }
    }

    /**
     * Instruções de depósito para o usuário
     */
    getDepositInstructions(address) {
        return {
            steps: [
                {
                    step: 1,
                    title: 'Compre USDC',
                    description: 'Compre USDC em qualquer exchange (Binance, Coinbase, etc.)',
                },
                {
                    step: 2,
                    title: 'Selecione a rede Polygon',
                    description: 'Ao sacar, escolha obrigatoriamente a rede Polygon (não Ethereum)',
                },
                {
                    step: 3,
                    title: 'Envie para seu endereço',
                    description: `Envie USDC para: ${address}`,
                },
                {
                    step: 4,
                    title: 'Aguarde a confirmação',
                    description: 'Seu saldo será atualizado em 1-2 minutos',
                },
            ],
            warnings: [
                'Envie apenas USDC na rede Polygon',
                'Envios em outras redes resultarão em perda de fundos',
                'Depósito mínimo: $1 USDC',
                'Depósitos são processados automaticamente em até 2 minutos',
            ],
            exchanges: [
                { name: 'Binance', url: 'https://www.binance.com', supported: true, recommended: true },
                { name: 'Coinbase', url: 'https://www.coinbase.com', supported: true },
                { name: 'KuCoin', url: 'https://www.kucoin.com', supported: true },
            ],
        };
    }

    /**
     * Histórico de depósitos do usuário
     */
    async getDepositHistory(userId, limit = 20) {
        try {
            return await prisma.payment.findMany({
                where: {
                    userId,
                    type: 'WALLET_DEPOSIT',
                    status: 'COMPLETED',
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    amountUSD: true,
                    cryptoCurrency: true,
                    web3TxHash: true,
                    confirmedAt: true,
                    createdAt: true,
                },
            });
        } catch (error) {
            logger.error('Erro ao buscar histórico de depósitos:', error);
            throw error;
        }
    }

    /**
     * Valida se o usuário tem saldo suficiente
     */
    async validateBalance(userId, requiredAmount) {
        try {
            const wallet = await prisma.userWallet.findUnique({ where: { userId } });

            if (!wallet) {
                return {
                    valid: false,
                    balance: 0,
                    required: requiredAmount,
                    message: 'Carteira não encontrada',
                };
            }

            const hasEnough = wallet.balanceUSD >= requiredAmount;

            return {
                valid: hasEnough,
                balance: wallet.balanceUSD,
                required: requiredAmount,
                shortage: hasEnough ? 0 : requiredAmount - wallet.balanceUSD,
                message: hasEnough
                    ? 'Saldo suficiente'
                    : `Saldo insuficiente. Deposite mais $${(requiredAmount - wallet.balanceUSD).toFixed(2)} USDC`,
            };
        } catch (error) {
            logger.error('Erro ao validar saldo:', error);
            throw error;
        }
    }
}

export default new DepositDetectorService();