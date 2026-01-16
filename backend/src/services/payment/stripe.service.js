import Stripe from 'stripe';
import logger from '../../utils/logger. js';

export class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Criar PaymentIntent (Cartão de Crédito)
   */
  async createPaymentIntent(data) {
    try {
      const paymentIntent = await this.stripe. paymentIntents.create({
        amount: Math.round(data.amountUSD * 100), // Converter para centavos
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          orderId: data.orderId,
          type: data.type,
          creatorId: data.creatorId,
        },
      });

      logger.info('Stripe PaymentIntent created:', paymentIntent. id);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      logger.error('Stripe create payment error:', error);
      throw new Error('Failed to create Stripe payment');
    }
  }

  /**
   * Criar Checkout Session (PayPal + Cartão)
   */
  async createCheckoutSession(data) {
    try {
      const session = await this.stripe.checkout. sessions.create({
        payment_method_types: ['card', 'paypal'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: data.description || 'PrideConnect Payment',
              },
              unit_amount: Math.round(data. amountUSD * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          orderId:  data.orderId,
          type: data.type,
          creatorId: data.creatorId,
        },
      });

      logger.info('Stripe Checkout Session created:', session.id);

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      logger.error('Stripe create checkout error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Criar assinatura recorrente
   */
  async createSubscription(data) {
    try {
      // Criar ou buscar customer
      let customer;
      if (data.customerId) {
        customer = await this.stripe.customers.retrieve(data.customerId);
      } else {
        customer = await this.stripe.customers. create({
          email: data. email,
          metadata: {
            userId: data.userId,
          },
        });
      }

      // Criar ou buscar produto
      let product = await this.stripe.products.create({
        name: `Subscription to ${data.creatorName}`,
        metadata: {
          creatorId: data.creatorId,
        },
      });

      // Criar preço
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(data.amountUSD * 100),
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });

      // Criar subscription
      const subscription = await this. stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card', 'paypal'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice. payment_intent'],
        metadata:  {
          creatorId: data.creatorId,
          userId: data.userId,
        },
      });

      logger.info('Stripe Subscription created:', subscription.id);

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent. client_secret,
        customerId: customer.id,
      };
    } catch (error) {
      logger.error('Stripe create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Validar webhook
   */
  constructWebhookEvent(payload, signature) {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (error) {
      logger.error('Stripe webhook validation error:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      logger.info('Stripe Subscription cancelled:', subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Stripe cancel subscription error:', error);
      throw error;
    }
  }
}