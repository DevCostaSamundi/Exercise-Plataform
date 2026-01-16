import paymentService from '../services/payment/index.js';
import nowpaymentsService from '../services/payment/nowpayments.service.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obter moedas disponíveis
 */
export const getAvailableCurrencies = async (req, res) => {
  try {
    // Lista combinada:  stablecoins + cryptos selecionadas
    const currencies = [
      // Stablecoins
      {
        code: 'USDT_TRC20',
        name: 'Tether (TRC20)',
        network: 'TRON',
        icon: '₮',
        recommended: true,
        minAmount: 5,
        avgConfirmTime: '1-3 min',
        type: 'stablecoin',
      },
      {
        code:  'USDT_BEP20',
        name: 'Tether (BEP20)',
        network: 'BSC',
        icon: '₮',
        minAmount: 5,
        avgConfirmTime:  '1-3 min',
        type: 'stablecoin',
      },
      {
        code: 'USDC',
        name: 'USD Coin',
        network: 'Ethereum',
        icon: 'USDC',
        minAmount: 10,
        avgConfirmTime:  '2-5 min',
        type: 'stablecoin',
      },
      {
        code: 'DAI',
        name: 'Dai',
        network: 'Ethereum',
        icon: 'DAI',
        minAmount: 10,
        avgConfirmTime: '2-5 min',
        type: 'stablecoin',
      },
      
      // Cryptos
      {
        code: 'MATIC',
        name: 'Polygon',
        network: 'Polygon',
        icon: 'MATIC',
        minAmount:  5,
        avgConfirmTime:  '30 sec',
        recommended: true,
        type: 'crypto',
      },
      {
        code: 'LTC',
        name: 'Litecoin',
        network: 'Litecoin',
        icon: 'Ł',
        minAmount: 5,
        avgConfirmTime:  '5-15 min',
        type: 'crypto',
      },
      {
        code: 'XMR',
        name: 'Monero',
        network:  'Monero',
        icon: 'ɱ',
        minAmount: 5,
        avgConfirmTime:  '5-20 min',
        privacy: true,
        type: 'crypto',
      },
    ];

    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    logger.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get currencies',
    });
  }
};

/**
 * Estimar preço em cripto
 */
export const estimatePrice = async (req, res) => {
  try {
    const { amountUSD, currency } = req.query;

    if (!amountUSD || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required',
      });
    }

    // Se for PIX, apenas converter USD para BRL
    if (currency === 'PIX') {
      const brlRate = 5.5;
      
      return res.json({
        success: true,
        data: {
          amountUSD: parseFloat(amountUSD),
          currency: 'BRL',
          estimatedAmount: (parseFloat(amountUSD) * brlRate).toFixed(2),
          exchangeRate: brlRate,
        },
      });
    }

    // Para cryptos, usar NowPayments API
    try {
      // ✅ CORRIGIR: Usar getEstimate (não estimatePrice)
      const payCurrency = currency. toLowerCase().replace('_', '');
      
      const estimate = await nowpaymentsService. getEstimate(
        parseFloat(amountUSD),
        'usd',
        payCurrency
      );

      res.json({
        success: true,
        data: {
          amountUSD: parseFloat(amountUSD),
          currency: currency,
          estimatedAmount: estimate.estimatedAmount,
          minAmount: estimate.minAmount,
          maxAmount: estimate.maxAmount,
        },
      });
    } catch (error) {
      logger.error('Estimate price error:', error);
      
      // ✅ FALLBACK: Retornar estimativa 1: 1 se NowPayments falhar
      res.json({
        success: true,
        data: {
          amountUSD: parseFloat(amountUSD),
          currency: currency,
          estimatedAmount: parseFloat(amountUSD).toFixed(8),
          minAmount: 1,
          maxAmount: 10000,
          isEstimated: true, // Flag indicando que é aproximado
        },
      });
    }
  } catch (error) {
    logger.error('Estimate price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate price',
    });
  }
};

/**
 * Criar novo pagamento
 */
export const createPayment = async (req, res) => {
  try {
    const userId = req.user. id;
    const {
      creatorId,
      type,
      amountUSD,
      cryptoCurrency,
      subscriptionId,
      postId,
      messageId,
    } = req. body;

    // Validações
    if (!amountUSD || amountUSD <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    if (!cryptoCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Cryptocurrency is required',
      });
    }

    if (!['SUBSCRIPTION', 'PPV_MESSAGE', 'PPV_POST', 'TIP', 'WALLET_DEPOSIT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type',
      });
    }

    logger.info('Creating payment:', {
      userId,
      creatorId,
      type,
      amountUSD,
      cryptoCurrency,
    });

    // Criar pagamento
    const payment = await paymentService.createPayment({
      userId,
      creatorId,
      type,
      amountUSD,
      cryptoCurrency,
      subscriptionId,
      postId,
      messageId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info('Payment created successfully:', {
      paymentId: payment. paymentId,
      cryptoCurrency:  payment.payCurrency || payment.cryptoCurrency,
      hasQrCode: !!payment.qrCode,
      hasAddress: !!payment.payAddress || !!payment.address,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment',
    });
  }
};

/**
 * Obter status do pagamento
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verificar se é o dono do pagamento
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Atualizar status do gateway
    const updatedPayment = await paymentService.checkPaymentStatus(paymentId);

    res.json({
      success: true,
      data: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        cryptoCurrency: updatedPayment. cryptoCurrency,
        cryptoAmount: updatedPayment. expectedAmount,
        address: updatedPayment.cryptoAddress,
        txHash: updatedPayment.txHash,
        confirmations: updatedPayment.confirmations,
        expiresAt: updatedPayment.expiresAt,
        createdAt: updatedPayment.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
    });
  }
};

/**
 * Listar pagamentos do usuário
 */
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user. id;
    const { status, type, limit = 20, offset = 0 } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        creator: {
          select: {
            id:  true,
            displayName: true,
            userId: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.payment.count({ where });

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        limit:  parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
    });
  }
};

export default {
  createPayment,
  getPaymentStatus,
  getUserPayments,
  getAvailableCurrencies,
  estimatePrice,
};