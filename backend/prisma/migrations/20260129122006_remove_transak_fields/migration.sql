

BEGIN;
CREATE TYPE "PaymentGateway_new" AS ENUM ('WEB3_DIRECT', 'CRYPTO_DIRECT', 'BALANCE', 'MANUAL');
ALTER TABLE "payments" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TABLE "withdrawals" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
DROP TYPE "PaymentGateway_old";
COMMIT;

-- AlterTable

