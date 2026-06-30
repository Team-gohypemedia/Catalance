-- Backfill the review clientId column before the detail-route index migration.

ALTER TABLE "Review"
ADD COLUMN IF NOT EXISTS "clientId" TEXT;
