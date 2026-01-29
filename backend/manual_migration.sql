-- Manual Migration Script: Remove Legacy Payment Methods
-- This script safely migrates existing data before applying schema changes

-- Step 1: Check current payment gateways in use
SELECT gateway, COUNT(*) as count 
FROM payments 
GROUP BY gateway;

-- Step 2: Update deprecated payment gateways to MANUAL
-- (Run this only if deprecated gateways exist)
UPDATE payments 
SET gateway = 'MANUAL' 
WHERE gateway IN ('NOWPAYMENTS', 'BTCPAY', 'COINPAYMENTS', 'PIX', 'STRIPE');

-- Step 3: Update deprecated withdrawal gateways to MANUAL
UPDATE withdrawals 
SET gateway = 'MANUAL' 
WHERE gateway IN ('NOWPAYMENTS', 'BTCPAY', 'COINPAYMENTS', 'PIX', 'STRIPE');

-- Step 4: Verify no deprecated gateways remain
SELECT gateway, COUNT(*) as count 
FROM payments 
GROUP BY gateway;

SELECT gateway, COUNT(*) as count 
FROM withdrawals 
GROUP BY gateway;

-- After running this script successfully, run:
-- npx prisma db push --accept-data-loss
