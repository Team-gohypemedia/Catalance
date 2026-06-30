-- Backfill project columns that were introduced outside migration history
-- before the project detail index migration references them.

ALTER TABLE "OnGoingProjects"
ADD COLUMN IF NOT EXISTS "managerId" TEXT,
ADD COLUMN IF NOT EXISTS "customSop" JSONB,
ADD COLUMN IF NOT EXISTS "externalLink" TEXT,
ADD COLUMN IF NOT EXISTS "paymentPlanVersion" TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS "closureHandoverConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "closureDeliverablesConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "closureReceiptConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "closureNoIssuesConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "closureVerifiedById" TEXT,
ADD COLUMN IF NOT EXISTS "closureVerifiedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'OnGoingProjects_managerId_fkey'
     ) THEN
    ALTER TABLE "OnGoingProjects"
      ADD CONSTRAINT "OnGoingProjects_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'OnGoingProjects_closureVerifiedById_fkey'
     ) THEN
    ALTER TABLE "OnGoingProjects"
      ADD CONSTRAINT "OnGoingProjects_closureVerifiedById_fkey"
      FOREIGN KEY ("closureVerifiedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
