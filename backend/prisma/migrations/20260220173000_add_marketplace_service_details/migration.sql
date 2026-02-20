-- AlterTable
ALTER TABLE "Marketplace"
ADD COLUMN "serviceDetails" JSONB NOT NULL DEFAULT '[]'::jsonb;
