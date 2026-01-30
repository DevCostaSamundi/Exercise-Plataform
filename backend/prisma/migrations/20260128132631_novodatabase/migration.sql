/*
  Warnings:

  - You are about to drop the column `cryptoWallets` on the `creators` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[txHash]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[web3TxHash]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[web3Wallet]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentGateway" ADD VALUE 'WEB3_DIRECT';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "creators" DROP COLUMN "cryptoWallets",
ADD COLUMN     "payoutWallet" TEXT,
ADD COLUMN     "walletVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "withdrawMethod" SET DEFAULT 'web3';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "" TEXT,

ADD COLUMN     "web3BlockNumber" INTEGER,
ADD COLUMN     "web3Confirmations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "web3ContractAddress" TEXT,
ADD COLUMN     "web3TxHash" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "web3Provider" TEXT,
ADD COLUMN     "web3Verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "web3VerifiedAt" TIMESTAMP(3),
ADD COLUMN     "web3Wallet" TEXT;

-- DropTable
DROP TABLE "Notification";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "actionUrl" TEXT,
    "unread" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_unread_idx" ON "notifications"("userId", "unread");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_txHash_key" ON "payments"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "payments_web3TxHash_key" ON "payments"("web3TxHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_web3Wallet_key" ON "users"("web3Wallet");

-- CreateIndex
CREATE INDEX "users_web3Wallet_idx" ON "users"("web3Wallet");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
