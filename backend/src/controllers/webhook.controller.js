import paymentService from '../services/payment/index.js';
import logger from '../utils/logger.js';

/**
 * Webhook NOWPayments
 */
export const nowpaymentsWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-nowpayments-sig'];
    const payload = req.body;

    // Validar assinatura
    const isValid = paymentService.nowpayments.validateIPNSignature(payload, signature);
    
    if (!isValid) {
      logger.warn('Invalid NOWPayments webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('NOWPayments webhook received:', {
      payment_id: payload.payment_id,
      payment_status: payload.payment_status,
      order_id: payload.order_id,
    });

    // Processar webhook
    await paymentService.updatePaymentStatus(payload.order_id, {
      status: payload.payment_status,
      actually_paid: payload.actually_paid,
      tx_hash: payload.outcome_hash || payload.payment_hash,
      confirmations: payload.confirmations || 0,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger. error('NOWPayments webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Webhook BTCPay Server
 */
export const btcpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['btcpay-sig'];
    const payload = req. body;

    // Validar assinatura
    const isValid = paymentService.btcpay.validateWebhookSignature(payload, signature);
    
    if (!isValid) {
      logger.warn('Invalid BTCPay webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    logger.info('BTCPay webhook received:', {
      type: payload.type,
      invoiceId: payload.invoiceId,
      status: payload.status,
    });

    // Extrair order ID do metadata
    const orderId = payload.metadata?.orderId;
    
    if (!orderId) {
      logger.warn('BTCPay webhook missing orderId');
      return res.status(400).json({ error: 'Missing orderId' });
    }

    // Mapear evento para status
    let status = 'PENDING';
    switch (payload.type) {
      case 'InvoiceReceivedPayment':
        status = 'CONFIRMING';
        break;
      case 'InvoiceProcessing':
        status = 'CONFIRMING';
        break;
      case 'InvoiceSettled':
        status = 'COMPLETED';
        break;
      case 'InvoiceExpired':
        status = 'EXPIRED';
        break;
      case 'InvoiceInvalid':
        status = 'FAILED';
        break;
    }

    await paymentService.updatePaymentStatus(orderId, {
      status,
      tx_hash: payload.transactionHash,
      confirmations: payload.confirmations || 0,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('BTCPay webhook error:', error);
    res.status(500). json({ error: 'Webhook processing failed' });
  }
};

/**
 * Webhook PIX (Mercado Pago)
 */
export const pixWebhook = async (req, res) => {
  try {
    const payload = req.body;

    logger.info('PIX webhook received:', payload);

    // Mercado Pago envia notificações de diferentes tipos
    if (payload.type === 'payment') {
      const paymentId = payload.data.id;
      
      // Buscar detalhes do pagamento
      const paymentDetails = await paymentService.pix.getPaymentStatus(paymentId);
      
      // Buscar nosso payment pelo external_reference
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: paymentId. toString(),
        },
      });

      if (payment) {
        await paymentService.updatePaymentStatus(payment.id, {
          status: paymentDetails.status,
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('PIX webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export default {
  nowpaymentsWebhook,
  btcpayWebhook,
  pixWebhook,
};