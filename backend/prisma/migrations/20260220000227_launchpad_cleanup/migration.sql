-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('TOKEN_CREATION', 'TOKEN_PURCHASE', 'TOKEN_SALE', 'YIELD_CLAIM', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TOKEN_CREATED', 'TOKEN_GRADUATED', 'TRADE_EXECUTED', 'YIELD_AVAILABLE', 'YIELD_CLAIMED', 'PRICE_ALERT', 'MILESTONE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "displayName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3),
    "avatar" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "web3Wallet" TEXT,
    "web3Provider" TEXT,
    "web3Verified" BOOLEAN NOT NULL DEFAULT false,
    "web3VerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "balanceUSD" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDeposited" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amountUSD" DECIMAL(10,2) NOT NULL,
    "amountETH" DECIMAL(28,18),
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "tokenAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_strategies" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "engagement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVolume" DECIMAL(28,2) NOT NULL DEFAULT 0,
    "volumeChange" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "newTokens" INTEGER NOT NULL DEFAULT 0,
    "activeTokens" INTEGER NOT NULL DEFAULT 0,
    "graduatedTokens" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "uniqueTraders" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "platform_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_data" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "mentions" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_tactics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "tested" BOOLEAN NOT NULL DEFAULT false,
    "testedAt" TIMESTAMP(3),
    "actualImpact" JSONB,
    "success" BOOLEAN,
    "aiScore" DECIMAL(3,2),
    "aiReasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_tactics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "creatorId" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "currentPrice" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "marketCap" DECIMAL(28,2) NOT NULL DEFAULT 0,
    "totalVolume" DECIMAL(28,2) NOT NULL DEFAULT 0,
    "volume24h" DECIMAL(28,2) NOT NULL DEFAULT 0,
    "priceChange24h" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "holderCount" INTEGER NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "bondingCurveAddress" TEXT,
    "liquidityLocked" BOOLEAN NOT NULL DEFAULT false,
    "isGraduated" BOOLEAN NOT NULL DEFAULT false,
    "graduatedAt" TIMESTAMP(3),
    "dexPoolAddress" TEXT,
    "blockNumber" INTEGER,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "traderId" TEXT,
    "type" "TradeType" NOT NULL,
    "ethAmount" DECIMAL(28,18) NOT NULL,
    "tokenAmount" DECIMAL(28,18) NOT NULL,
    "price" DECIMAL(28,18) NOT NULL,
    "platformFee" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "creatorFee" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_holders" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "holderId" TEXT,
    "balance" DECIMAL(28,18) NOT NULL,
    "percentage" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "firstBuyAt" TIMESTAMP(3),
    "lastTradeAt" TIMESTAMP(3),
    "totalBought" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "totalSold" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(28,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_claims" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "claimerAddress" TEXT NOT NULL,
    "claimerId" TEXT,
    "amount" DECIMAL(28,18) NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_ratings" (
    "id" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "raterAddress" TEXT NOT NULL,
    "raterId" TEXT,
    "rating" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_status" (
    "id" TEXT NOT NULL,
    "contractName" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "lastSyncedBlock" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_web3Wallet_key" ON "users"("web3Wallet");

-- CreateIndex
CREATE INDEX "users_web3Wallet_idx" ON "users"("web3Wallet");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_walletAddress_key" ON "user_wallets"("walletAddress");

-- CreateIndex
CREATE INDEX "user_wallets_userId_idx" ON "user_wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_txHash_key" ON "payments"("txHash");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_txHash_idx" ON "payments"("txHash");

-- CreateIndex
CREATE INDEX "notifications_userId_unread_idx" ON "notifications"("userId", "unread");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "marketing_strategies_type_idx" ON "marketing_strategies"("type");

-- CreateIndex
CREATE INDEX "marketing_strategies_posted_idx" ON "marketing_strategies"("posted");

-- CreateIndex
CREATE UNIQUE INDEX "platform_analytics_date_key" ON "platform_analytics"("date");

-- CreateIndex
CREATE INDEX "platform_analytics_date_idx" ON "platform_analytics"("date");

-- CreateIndex
CREATE INDEX "sentiment_data_source_createdAt_idx" ON "sentiment_data"("source", "createdAt");

-- CreateIndex
CREATE INDEX "growth_tactics_category_idx" ON "growth_tactics"("category");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_address_key" ON "tokens"("address");

-- CreateIndex
CREATE INDEX "tokens_creatorAddress_idx" ON "tokens"("creatorAddress");

-- CreateIndex
CREATE INDEX "tokens_isGraduated_idx" ON "tokens"("isGraduated");

-- CreateIndex
CREATE INDEX "tokens_volume24h_idx" ON "tokens"("volume24h");

-- CreateIndex
CREATE INDEX "tokens_createdAt_idx" ON "tokens"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "trades_txHash_key" ON "trades"("txHash");

-- CreateIndex
CREATE INDEX "trades_tokenAddress_idx" ON "trades"("tokenAddress");

-- CreateIndex
CREATE INDEX "trades_traderAddress_idx" ON "trades"("traderAddress");

-- CreateIndex
CREATE INDEX "trades_timestamp_idx" ON "trades"("timestamp");

-- CreateIndex
CREATE INDEX "token_holders_tokenAddress_idx" ON "token_holders"("tokenAddress");

-- CreateIndex
CREATE INDEX "token_holders_holderAddress_idx" ON "token_holders"("holderAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_holders_tokenAddress_holderAddress_key" ON "token_holders"("tokenAddress", "holderAddress");

-- CreateIndex
CREATE UNIQUE INDEX "yield_claims_txHash_key" ON "yield_claims"("txHash");

-- CreateIndex
CREATE INDEX "yield_claims_tokenAddress_idx" ON "yield_claims"("tokenAddress");

-- CreateIndex
CREATE INDEX "yield_claims_claimerAddress_idx" ON "yield_claims"("claimerAddress");

-- CreateIndex
CREATE UNIQUE INDEX "creator_ratings_txHash_key" ON "creator_ratings"("txHash");

-- CreateIndex
CREATE INDEX "creator_ratings_creatorAddress_idx" ON "creator_ratings"("creatorAddress");

-- CreateIndex
CREATE UNIQUE INDEX "creator_ratings_creatorAddress_raterAddress_key" ON "creator_ratings"("creatorAddress", "raterAddress");

-- CreateIndex
CREATE UNIQUE INDEX "sync_status_contractName_key" ON "sync_status"("contractName");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holders" ADD CONSTRAINT "token_holders_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_holders" ADD CONSTRAINT "token_holders_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_claims" ADD CONSTRAINT "yield_claims_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "tokens"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_claims" ADD CONSTRAINT "yield_claims_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_ratings" ADD CONSTRAINT "creator_ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
