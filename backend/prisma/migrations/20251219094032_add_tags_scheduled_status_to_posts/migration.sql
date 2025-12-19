-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
