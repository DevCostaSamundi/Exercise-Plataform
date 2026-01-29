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

export const testAlchemyWebhook = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        const { txHash, paymentId } = req.body;

        if (!txHash || !paymentId) {
            return res.status(400).json({
                error: 'txHash and paymentId are required',
            });
        }

        // Simular atividade do Alchemy
        const mockActivity = {
            category: 'token',
            hash: txHash,
            fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            toAddress: process.env.USDC_RECEIVER_ADDRESS,
            value: '1000000', // 1 USDC (6 decimals)
            asset: 'USDC',
            rawContract: {
                address: process.env.USDC_CONTRACT_ADDRESS,
                decimals: 6,
            },
        };

        await processAlchemyActivity(mockActivity);

        res.status(200).json({
            success: true,
            message: 'Test webhook processed',
            txHash,
            paymentId,
        });
    } catch (error) {
        console.error('❌ Test webhook error:', error);
        res.status(500).json({ error: error.message });
    }
};

export default {
    alchemyWebhook,
};