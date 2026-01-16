import paymentService from '../services/payment/index.js';
import logger from '../utils/logger.js';

/**
 * Webhook do NOWPayments
 * POST /api/v1/payments/webhook/nowpayments
 */
export const nowpaymentsWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-nowpayments-sig'];
    const webhookData = req.body;

    logger.info('📩 NowPayments webhook received:', {
      payment_id: webhookData.payment_id,
      payment_status: webhookData.payment_status,
    });

    if (!signature) {
      logger.error('❌ Missing webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Missing signature',
      });
    }

    // ⭐ IMPORTANTE: Usar o service correto
    const result = await nowpaymentsService.processWebhook(webhookData, signature);

    if (result.success) {
      logger.info('✅ Webhook processed successfully');
      return res.status(200).json({ success: true });
    } else {
      logger.error('❌ Webhook processing failed:', result.message);
      return res.status(400).json(result);
    }

  } catch (error) {
    logger.error('❌ NowPayments webhook error:', error);

    // ⭐ Retornar 200 mesmo com erro (prevenir retries desnecessários)
    return res.status(200).json({
      success: false,
      message: 'Error logged',
    });
  }
};


/**
 * Webhook do BTCPay Server
 * POST /api/v1/payments/webhook/btcpay
 */
export const btcpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['btcpay-sig'];
    const payload = req.body;

    // Validar assinatura
    const isValid = paymentService.btcpay.validateWebhookSignature(payload, signature);

    if (!isValid) {
      logger.error('Invalid BTCPay webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('BTCPay webhook received:', payload);

    // Processar invoice
    const { invoiceId, status, metadata } = payload;

    await paymentService.updatePaymentStatus(metadata.orderId, {
      status,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('BTCPay webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

/**
 * Webhook do PIX (Mercado Pago)
 * POST /api/v1/payments/webhook/pix
 */
export const pixWebhook = async (req, res) => {
  try {
    const payload = req.body;

    logger.info('PIX webhook received:', payload);

    // Mercado Pago envia notificações diferentes
    const { type, data } = payload;

    if (type === 'payment') {
      const paymentId = data.id;

      // Buscar status atualizado
      const paymentStatus = await paymentService.pix.getPaymentStatus(paymentId);

      // Atualizar no banco
      await paymentService.updatePaymentStatus(paymentId, {
        status: paymentStatus.status,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('PIX webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};

/**
 * Webhook do Stripe
 * POST /api/v1/payments/webhook/stripe
 */
export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Validar webhook
    const event = paymentService.stripe.constructWebhookEvent(
      JSON.stringify(payload),
      signature
    );

    logger.info('Stripe webhook received:', event.type);

    // Processar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent. payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

// ============================================
// STRIPE EVENT HANDLERS
// ============================================

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    await paymentService.updatePaymentStatus(orderId, {
      status: 'finished',
      tx_hash: paymentIntent.id,
    });

    logger.info(`Payment succeeded:  ${orderId}`);
  } catch (error) {
    logger.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    await paymentService.updatePaymentStatus(orderId, {
      status: 'failed',
    });

    logger.info(`Payment failed: ${orderId}`);
  } catch (error) {
    logger.error('Error handling payment intent failed:', error);
  }
}

async function handleCheckoutSessionCompleted(session) {
  try {
    const orderId = session.metadata.orderId;

    await paymentService.updatePaymentStatus(orderId, {
      status: 'finished',
      tx_hash: session.payment_intent,
    });

    logger.info(`Checkout completed: ${orderId}`);
  } catch (error) {
    logger.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaid(invoice) {
  try {
    const subscriptionId = invoice.subscription;

    // Atualizar assinatura no banco
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'ACTIVE',
        endDate: new Date(invoice.period_end * 1000),
      },
    });

    logger.info(`Invoice paid for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling invoice paid:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscriptionId = invoice.subscription;

    // Marcar assinatura como expirada
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'EXPIRED',
      },
    });

    logger.info(`Invoice payment failed for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'EXPIRED',
        endDate: new Date(subscription.current_period_end * 1000),
      },
    });

    logger.info(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    logger.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
      },
    });

    logger.info(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    logger.error('Error handling subscription deleted:', error);
  }
}

export default {
  nowpaymentsWebhook,
  btcpayWebhook,
  pixWebhook,
  stripeWebhook,
};