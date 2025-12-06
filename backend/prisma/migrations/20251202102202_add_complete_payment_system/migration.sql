/*
  Warnings:

  - You are about to drop the column `followersCount` on the `creators` table. All the data in the column will be lost.
  - You are about to drop the column `postsCount` on the `creators` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "creators" DROP COLUMN "followersCount",
DROP COLUMN "postsCount",
ADD COLUMN     "allowTips" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoPublish" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoWithdraw" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoWithdrawMin" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "blockedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blockedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blockedWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cryptoWallets" JSONB,
ADD COLUMN     "defaultPPV" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultPPVPrice" DOUBLE PRECISION NOT NULL DEFAULT 9.99,
ADD COLUMN     "disableScreenshots" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discounts" JSONB DEFAULT '{"threeMonths": 10, "sixMonths": 15, "twelveMonths": 20}',
ADD COLUMN     "emailNotifications" JSONB,
ADD COLUMN     "hideFromSearch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageQuality" TEXT NOT NULL DEFAULT 'high',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messagePermission" TEXT NOT NULL DEFAULT 'subscribers',
ADD COLUMN     "newsletter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "pixType" TEXT,
ADD COLUMN     "promoActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoDiscount" INTEGER,
ADD COLUMN     "promoDuration" INTEGER,
ADD COLUMN     "promoExpiry" TEXT,
ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushNotifications" JSONB,
ADD COLUMN     "showActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showSubscriberCount" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trialDays" INTEGER,
ADD COLUMN     "trialEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoQuality" TEXT NOT NULL DEFAULT '1080p',
ADD COLUMN     "watermark" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "withdrawMethod" TEXT NOT NULL DEFAULT 'pix';
