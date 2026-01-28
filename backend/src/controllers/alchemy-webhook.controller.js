import depositDetectorService from '../services/deposit-detector.service.js';
import alchemyWebhookService from '../services/alchemy-webhook.service.js';
import logger from '../utils/logger.js';

/**
 * Alchemy webhook handler
 * POST /api/v1/payments/webhook/alchemy
 */
export const alchemyWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-alchemy-signature'];
        const payload = req.body;

        logger.info('📩 Alchemy webhook received');

        // Validate signature
        if (!signature) {
            logger.error('❌ Missing Alchemy signature');
            return res.status(401).json({
                success: false,
                message: 'Missing signature',
            });
        }

        const isValid = alchemyWebhookService.validateAlchemySignature(payload, signature);
        
        if (!isValid) {
            logger.error('❌ Invalid Alchemy signature');
            return res.status(401).json({
                success: false,
                message: 'Invalid signature',
            });
        }

        // Process events
        const { webhookType, event } = payload;

        if (webhookType === 'ADDRESS_ACTIVITY') {
            for (const activity of event.activity) {
                // Check if it's a USDC transfer
                if (activity.category === 'token' && 
                    activity.asset === 'USDC' &&
                    activity.rawContract?.address?.toLowerCase() === process.env.USDC_ADDRESS_POLYGON?.toLowerCase()) {
                    
                    // This is a deposit to a user wallet
                    await depositDetectorService.processDepositEvent(activity);
                    
                } else if (activity.category === 'token' && activity.toAddress?.toLowerCase() === process.env.PAYMENT_CONTRACT_ADDRESS?.toLowerCase()) {
                    
                    // This is a payment to the smart contract
                    await alchemyWebhookService.processPaymentEvent(activity);
                }
            }
        }

        logger.info('✅ Webhook processed successfully');
        
        res.status(200).json({ success: true });

    } catch (error) {
        logger.error('❌ Webhook error:', error);
        
        // Return 200 to prevent Alchemy retries
        res.status(200).json({
            success: false,
            message: 'Error logged',
        });
    }
};

export default {
    alchemyWebhook,
};