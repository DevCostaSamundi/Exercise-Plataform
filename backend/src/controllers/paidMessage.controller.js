import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ethers } from 'ethers';
import { getUSDCConfig, getCurrentNetwork } from '../config/web3.config.js';

// ─── ABI mínima para verificar transferência USDC ────────────────────────────
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

/**
 * Verificar se existe pagamento USDC confirmado on-chain
 * Verifica se o tx hash fornecido corresponde a uma transferência válida
 */
const verifyOnChainPayment = async (txHash, fromAddress, toAddress, expectedAmountUSD) => {
  try {
    const network = getCurrentNetwork();
    const usdcConfig = getUSDCConfig();
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    // Buscar recibo da transacção
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return { valid: false, reason: 'Transaction not found or failed' };
    }

    // Verificar confirmações mínimas
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    if (confirmations < 2) {
      return { valid: false, reason: 'Insufficient confirmations' };
    }

    // Verificar evento Transfer do USDC
    const usdcInterface = new ethers.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ]);

    const usdcTransferTopic = usdcInterface.getEvent('Transfer').topicHash;

    const usdcLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === usdcConfig.address.toLowerCase() &&
        log.topics[0] === usdcTransferTopic
    );

    if (!usdcLog) {
      return { valid: false, reason: 'No USDC transfer found in transaction' };
    }

    const parsed = usdcInterface.parseLog(usdcLog);
    const from = parsed.args[0].toLowerCase();
    const to = parsed.args[1].toLowerCase();
    const value = parsed.args[2]; // BigInt, 6 decimais

    // Verificar endereços
    if (from !== fromAddress.toLowerCase()) {
      return { valid: false, reason: 'Sender address mismatch' };
    }
    if (to !== toAddress.toLowerCase()) {
      return { valid: false, reason: 'Recipient address mismatch' };
    }

    // Verificar valor (USDC tem 6 decimais)
    const expectedRaw = BigInt(Math.round(expectedAmountUSD * 1_000_000));
    if (value < expectedRaw) {
      return { valid: false, reason: `Insufficient amount: got ${value}, expected ${expectedRaw}` };
    }

    return { valid: true, amount: Number(value) / 1_000_000 };
  } catch (error) {
    logger.error('Error verifying on-chain payment:', error);
    return { valid: false, reason: error.message };
  }
};

/**
 * Enviar mensagem paga
 * POST /api/v1/messages/paid
 */
export const sendPaidMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, recipientId, content, price } = req.body;

    // Validações
    if (!price || price < 5 || price > 500) {
      return res.status(400).json({
        success: false,
        message: 'Preço deve estar entre $5.00 e $500.00',
      });
    }

    if (!content?.mediaUrl || content.mediaUrl.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mensagens pagas devem conter mídia',
      });
    }

    // Buscar conversa
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada',
      });
    }

    // Apenas criadores podem enviar mensagens pagas
    if (conversation.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Apenas criadores podem enviar mensagens pagas',
      });
    }

    // Criar mensagem paga
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        recipientId,
        type: 'paid',
        contentText: content.text || 'Conteúdo exclusivo 🔒',
        contentMediaUrl: content.mediaUrl,
        contentPrice: price,
        contentIsPaid: false,
        status: 'sent',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    // Actualizar conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: `💰 Conteúdo pago - $${price.toFixed(2)}`,
        lastMessageSenderId: userId,
        lastMessageTimestamp: new Date(),
        unreadCountSubscriber: { increment: 1 },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        _id: message.id,
        sender: {
          _id: message.sender.id,
          username: message.sender.username,
          displayName: message.sender.displayName,
          avatar: message.sender.avatar,
        },
        content: {
          text: message.contentText,
          mediaUrl: null, // Nunca expõe URL antes do pagamento
          price: message.contentPrice,
          isPaid: false,
        },
        type: message.type,
        status: message.status,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error sending paid message:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem paga',
    });
  }
};

/**
 * Desbloquear mensagem paga com verificação on-chain
 * POST /api/v1/messages/:messageId/unlock
 * Body: { txHash, fromAddress }
 */
export const unlockPaidMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { txHash, fromAddress } = req.body;

    // Validar campos obrigatórios
    if (!txHash || !fromAddress) {
      return res.status(400).json({
        success: false,
        message: 'txHash e fromAddress são obrigatórios',
      });
    }

    // Buscar mensagem
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            web3Wallet: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada',
      });
    }

    // Verificar se é o destinatário
    if (message.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
    }

    // Se já foi paga, retornar directamente
    if (message.contentIsPaid) {
      return res.json({
        success: true,
        message: 'Mensagem já desbloqueada',
        data: { mediaUrl: message.contentMediaUrl },
      });
    }

    // Verificar se este txHash já foi usado (prevenir reuse)
    const existingPayment = await prisma.payment.findFirst({
      where: { txHash },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Esta transacção já foi utilizada',
      });
    }

    // Verificar carteira do criador
    const creatorWallet = message.sender.web3Wallet;
    if (!creatorWallet) {
      return res.status(400).json({
        success: false,
        message: 'Criador não tem carteira configurada',
      });
    }

    // Verificar pagamento on-chain
    const verification = await verifyOnChainPayment(
      txHash,
      fromAddress,
      creatorWallet,
      parseFloat(message.contentPrice)
    );

    if (!verification.valid) {
      logger.warn('Invalid payment attempt:', {
        messageId,
        userId,
        txHash,
        reason: verification.reason,
      });

      return res.status(402).json({
        success: false,
        message: `Pagamento inválido: ${verification.reason}`,
      });
    }

    // Pagamento confirmado — desbloquear em transacção atómica
    const [updatedMessage] = await prisma.$transaction([
      prisma.message.update({
        where: { id: messageId },
        data: { contentIsPaid: true },
      }),
      prisma.payment.create({
        data: {
          userId,
          creatorId: message.sender.id,
          type: 'PPV_MESSAGE',
          status: 'COMPLETED',
          amountUSD: parseFloat(message.contentPrice),
          txHash,
          gateway: 'WEB3_DIRECT',
          completedAt: new Date(),
        },
      }),
    ]);

    logger.info('Paid message unlocked:', { messageId, userId, txHash });

    res.json({
      success: true,
      message: 'Mensagem desbloqueada com sucesso',
      data: {
        mediaUrl: updatedMessage.contentMediaUrl,
        price: updatedMessage.contentPrice,
      },
    });
  } catch (error) {
    logger.error('Error unlocking paid message:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desbloquear mensagem',
    });
  }
};

export default {
  sendPaidMessage,
  unlockPaidMessage,
};