import prisma from '../config/database.js';
import alchemyWebhookService from '../services/alchemy-webhook.service.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Alchemy Webhook Controller — FlowConnect
 * POST /api/v1/payments/webhook/alchemy
 *
 * Fluxo:
 * 1. Alchemy detecta transação USDC no contrato → envia webhook
 * 2. Validamos assinatura HMAC (segurança)
 * 3. Respondemos 200 IMEDIATAMENTE (evita timeout/retry do Alchemy)
 * 4. Processamos de forma assíncrona:
 *    a. Depósito em carteira pessoal → credita saldo do usuário
 *    b. Pagamento no contrato → confirma pagamento + libera conteúdo
 */
export const alchemyWebhook = async (req, res) => {
    // ✅ CRÍTICO: Responde 200 imediatamente para evitar retry
    res.status(200).json({ received: true });

    // Processamento assíncrono após resposta
    setImmediate(async () => {
        try {
            const signature = req.headers['x-alchemy-signature'];
            const rawBody = req.rawBody || JSON.stringify(req.body);
            const payload = req.body;

            // Valida assinatura HMAC
            if (!validateSignature(rawBody, signature)) {
                logger.error('❌ Assinatura Alchemy inválida — webhook ignorado');
                return;
            }

            const { webhookType, event } = payload;

            if (webhookType !== 'ADDRESS_ACTIVITY') {
                logger.debug(`ℹ️ Tipo de webhook ignorado: ${webhookType}`);
                return;
            }

            if (!event?.activity?.length) {
                logger.debug('ℹ️ Webhook sem atividades');
                return;
            }

            logger.info(`📩 Webhook recebido: ${event.activity.length} atividade(s)`);

            // Processa cada atividade em paralelo
            await Promise.allSettled(
                event.activity.map((activity) => processActivity(activity))
            );

            logger.info('✅ Webhook processado com sucesso');

        } catch (error) {
            logger.error('❌ Erro crítico no webhook:', { error: error.message, stack: error.stack });
        }
    });
};

// ============================================
// VALIDAÇÃO DE ASSINATURA
// ============================================

function validateSignature(rawBody, signature) {
    if (!signature) return false;

    const secret = process.env.ALCHEMY_SIGNING_KEY;
    if (!secret) {
        logger.warn('⚠️ ALCHEMY_SIGNING_KEY não configurado — pulando validação');
        return process.env.NODE_ENV !== 'production'; // Apenas em dev
    }

    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
        const computed = hmac.digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(computed, 'hex'),
            Buffer.from(signature, 'hex')
        );
    } catch {
        return false;
    }
}

// ============================================
// PROCESSAMENTO DE ATIVIDADE
// ============================================

async function processActivity(activity) {
    try {
        // Verifica se é transferência USDC
        const isUSDCTransfer = (
            activity.category === 'token' &&
            activity.asset === 'USDC' &&
            activity.rawContract?.address?.toLowerCase() ===
            process.env.USDC_ADDRESS_POLYGON?.toLowerCase()
        );

        if (!isUSDCTransfer) {
            logger.debug('ℹ️ Atividade ignorada (não é USDC)');
            return;
        }

        const toAddress = activity.toAddress?.toLowerCase();
        const contractAddress = process.env.PAYMENT_CONTRACT_ADDRESS?.toLowerCase();
        const isContractPayment = toAddress === contractAddress;

        if (isContractPayment) {
            // Pagamento via PaymentSplitter → confirma e libera conteúdo
            logger.info(`🔗 Pagamento no contrato: ${activity.hash}`);
            await processContractPayment(activity);
        } else {
            // Depósito direto → credita saldo do usuário
            logger.info(`💰 Depósito detectado: ${activity.hash} → ${toAddress}`);
            await processDirectDeposit(activity);
        }

    } catch (error) {
        logger.error('❌ Erro ao processar atividade:', {
            txHash: activity.hash,
            error: error.message,
        });
        throw error;
    }
}

// ============================================
// PAGAMENTO NO CONTRATO
// ============================================

async function processContractPayment(activity) {
    const txHash = activity.hash;

    // Evita processamento duplicado
    const existingPayment = await prisma.payment.findFirst({
        where: { web3TxHash: txHash, status: 'COMPLETED' },
    });

    if (existingPayment) {
        logger.info(`ℹ️ Pagamento ${txHash} já processado`);
        return;
    }

    // Busca pagamento pendente pela tx hash ou pelo valor
    const payment = await prisma.payment.findFirst({
        where: {
            web3TxHash: txHash,
            status: { in: ['PENDING', 'CONFIRMING'] },
        },
        include: {
            creator: { select: { id: true, payoutWallet: true } },
            user: { select: { id: true } },
        },
    });

    if (!payment) {
        logger.warn(`⚠️ Pagamento não encontrado para tx: ${txHash}`);
        return;
    }

    // Extrai valor da transação
    const rawValue = activity.rawContract?.rawValue;
    const decimals = activity.rawContract?.decimals || 6;
    const amount = rawValue
        ? Number(BigInt(rawValue)) / Math.pow(10, decimals)
        : 0;

    logger.info(`💳 Confirmando pagamento ${payment.id} — $${amount} USDC`);

    // Confirma pagamento e libera conteúdo em transação atômica
    await prisma.$transaction(async (tx) => {
        // 1. Atualiza status do pagamento
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                confirmedAt: new Date(),
                paidAt: new Date(),
                web3TxHash: txHash,
                web3Confirmations: 2, // Alchemy só notifica após confirmação
            },
        });

        // 2. Credita saldo do criador no banco (espelho do on-chain)
        await tx.creatorBalance.upsert({
            where: { creatorId: payment.creatorId },
            create: {
                creatorId: payment.creatorId,
                availableUSD: payment.netAmount,
                lifetimeEarnings: payment.netAmount,
                lastPaymentAt: new Date(),
            },
            update: {
                availableUSD: { increment: payment.netAmount },
                lifetimeEarnings: { increment: payment.netAmount },
                lastPaymentAt: new Date(),
            },
        });

        // 3. Libera conteúdo baseado no tipo de pagamento
        await unlockContent(tx, payment);

        // 4. Cria notificações
        await tx.notification.createMany({
            data: [
                {
                    userId: payment.userId,
                    type: 'PAYMENT_CONFIRMED',
                    title: 'Pagamento confirmado! ✅',
                    message: `Seu pagamento de $${payment.amountUSD.toFixed(2)} foi confirmado na blockchain.`,
                    metadata: { paymentId: payment.id, txHash },
                },
                {
                    userId: payment.creatorId,
                    type: 'PAYMENT_RECEIVED',
                    title: 'Você recebeu um pagamento! 💰',
                    message: `$${payment.netAmount.toFixed(2)} USDC chegou na sua carteira.`,
                    metadata: { paymentId: payment.id, txHash },
                },
            ],
        });
    });

    logger.info(`✅ Pagamento ${payment.id} confirmado e conteúdo liberado`);
}

// ============================================
// LIBERAÇÃO DE CONTEÚDO
// ============================================

async function unlockContent(tx, payment) {
    const { type, userId, creatorId, subscriptionId, postId, messageId } = payment;

    switch (type) {
        case 'SUBSCRIPTION':
        case 'SUBSCRIPTION_RENEWAL':
            if (subscriptionId) {
                // Renova assinatura existente
                await tx.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        renewedAt: new Date(),
                    },
                });
            } else {
                // Cria nova assinatura
                await tx.subscription.create({
                    data: {
                        userId,
                        creatorId,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        amount: payment.amountUSD,
                        paymentMethod: 'CRYPTO',
                    },
                });
            }
            logger.info(`🔓 Assinatura ativada para usuário ${userId}`);
            break;

        case 'PPV_POST':
            if (postId) {
                await tx.postAccess.upsert({
                    where: { userId_postId: { userId, postId } },
                    create: { userId, postId, grantedAt: new Date(), paymentId: payment.id },
                    update: { grantedAt: new Date() },
                });
                logger.info(`🔓 Post ${postId} desbloqueado para usuário ${userId}`);
            }
            break;

        case 'PPV_MESSAGE':
            if (messageId) {
                await tx.message.update({
                    where: { id: messageId },
                    data: { unlockedAt: new Date(), isUnlocked: true },
                });
                logger.info(`🔓 Mensagem ${messageId} desbloqueada para usuário ${userId}`);
            }
            break;

        case 'TIP':
            // Tip não libera conteúdo — apenas credita o criador
            logger.info(`💝 Tip processado para criador ${creatorId}`);
            break;

        default:
            logger.warn(`⚠️ Tipo de pagamento desconhecido: ${type}`);
    }
}

// ============================================
// DEPÓSITO DIRETO NA CARTEIRA
// ============================================

async function processDirectDeposit(activity) {
    const toAddress = activity.toAddress?.toLowerCase();
    const txHash = activity.hash;

    // Evita processamento duplicado
    const existing = await prisma.deposit.findFirst({
        where: { txHash },
    });

    if (existing) {
        logger.info(`ℹ️ Depósito ${txHash} já processado`);
        return;
    }

    // Busca usuário pelo endereço da carteira
    const userWallet = await prisma.userWallet.findFirst({
        where: { walletAddress: toAddress },
        include: { user: true },
    });

    if (!userWallet) {
        logger.debug(`ℹ️ Carteira ${toAddress} não associada a nenhum usuário`);
        return;
    }

    // Calcula valor depositado
    const rawValue = activity.rawContract?.rawValue;
    const decimals = activity.rawContract?.decimals || 6;
    const amountUSD = rawValue
        ? Number(BigInt(rawValue)) / Math.pow(10, decimals)
        : 0;

    if (amountUSD <= 0) {
        logger.warn('⚠️ Depósito com valor zero ignorado');
        return;
    }

    logger.info(`💰 Creditando $${amountUSD} USDC para usuário ${userWallet.userId}`);

    // Credita saldo e registra depósito
    await prisma.$transaction(async (tx) => {
        // Atualiza saldo da carteira
        await tx.userWallet.update({
            where: { id: userWallet.id },
            data: {
                balanceUSD: { increment: amountUSD },
                totalDeposited: { increment: amountUSD },
            },
        });

        // Registra depósito
        await tx.deposit.create({
            data: {
                userId: userWallet.userId,
                walletId: userWallet.id,
                txHash,
                amountUSD,
                currency: 'USDC',
                status: 'COMPLETED',
                confirmedAt: new Date(),
                metadata: {
                    fromAddress: activity.fromAddress,
                    blockNum: activity.blockNum,
                },
            },
        });

        // Notifica usuário
        await tx.notification.create({
            data: {
                userId: userWallet.userId,
                type: 'DEPOSIT_CONFIRMED',
                title: 'Depósito confirmado! 💰',
                message: `$${amountUSD.toFixed(2)} USDC foi adicionado ao seu saldo.`,
                metadata: { txHash, amountUSD },
            },
        });
    });

    logger.info(`✅ Depósito de $${amountUSD} confirmado para usuário ${userWallet.userId}`);
}

// ============================================
// ENDPOINT DE TESTE (desenvolvimento)
// ============================================

export const testAlchemyWebhook = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Não disponível em produção' });
    }

    try {
        const { txHash, type = 'contract', amountUSDC = '10', paymentId } = req.body;

        if (!txHash) {
            return res.status(400).json({ error: 'txHash é obrigatório' });
        }

        const baseActivity = {
            category: 'token',
            hash: txHash,
            fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            asset: 'USDC',
            rawContract: {
                rawValue: String(Math.floor(parseFloat(amountUSDC) * 1e6)),
                address: process.env.USDC_ADDRESS_POLYGON,
                decimals: 6,
            },
        };

        if (type === 'deposit') {
            const mockActivity = {
                ...baseActivity,
                toAddress: '0xUSER_WALLET_HERE', // Substituir com carteira real
            };
            await processDirectDeposit(mockActivity);
        } else if (type === 'contract') {
            const mockActivity = {
                ...baseActivity,
                toAddress: process.env.PAYMENT_CONTRACT_ADDRESS,
            };

            // Se paymentId fornecido, atualiza web3TxHash para simular
            if (paymentId) {
                await prisma.payment.updateMany({
                    where: { id: paymentId, status: 'PENDING' },
                    data: { web3TxHash: txHash, status: 'CONFIRMING' },
                });
            }

            await processContractPayment(mockActivity);
        }

        res.json({ success: true, message: `Webhook de teste (${type}) processado`, txHash });

    } catch (error) {
        logger.error('❌ Erro no webhook de teste:', error);
        res.status(500).json({ error: error.message });
    }
};

export default { alchemyWebhook, testAlchemyWebhook };