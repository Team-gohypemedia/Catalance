-- Reconcile schema changes that were introduced via db push/manual edits
-- so the Prisma migration history matches the current schema again.

ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "ProposalStatus" ADD VALUE IF NOT EXISTS 'REPLACED';

ALTER TABLE "ChatMessage"
ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ChatMessage"
ALTER COLUMN "content" DROP NOT NULL;

DROP INDEX IF EXISTS "EngagementAnswerSession_userId_dayKey_key";

ALTER TABLE "EngagementPersonalizedQuestion"
ALTER COLUMN "createdAt" TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3);

ALTER TABLE "FreelancerProfile"
ADD COLUMN IF NOT EXISTS "openToWork" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
ADD COLUMN IF NOT EXISTS "customProjectLimit" INTEGER,
ADD COLUMN IF NOT EXISTS "socialMediaLinks" JSONB DEFAULT '{}'::jsonb;

ALTER TABLE "FreelancerProfile"
DROP COLUMN IF EXISTS "serviceComplexity";

UPDATE "FreelancerProfile"
SET "reviewCount" = 0
WHERE "reviewCount" IS NULL;

ALTER TABLE "FreelancerProfile"
ALTER COLUMN "reviewCount" SET DEFAULT 0,
ALTER COLUMN "reviewCount" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Project_ownerId_fkey'
      AND conrelid = 'public."OnGoingProjects"'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OnGoingProjects_ownerId_fkey'
      AND conrelid = 'public."OnGoingProjects"'::regclass
  ) THEN
    ALTER TABLE "OnGoingProjects"
      RENAME CONSTRAINT "Project_ownerId_fkey" TO "OnGoingProjects_ownerId_fkey";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ProfileUpdateRequest_userId_idx"
ON "ProfileUpdateRequest"("userId");

ALTER TABLE "Proposal"
ADD COLUMN IF NOT EXISTS "budgetReminderSent" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Review"
DROP CONSTRAINT IF EXISTS "Review_serviceId_fkey";

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatar" TEXT,
ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "service_positive_keywords" (
  "id" SERIAL NOT NULL,
  "service_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,

  CONSTRAINT "service_positive_keywords_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "service_positive_keywords_service_id_idx"
ON "service_positive_keywords"("service_id");

CREATE UNIQUE INDEX IF NOT EXISTS "service_positive_keywords_service_id_name_key"
ON "service_positive_keywords"("service_id", "name");

DO $$
BEGIN
  IF to_regclass('public."service_positive_keywords"') IS NOT NULL
     AND to_regclass('public.services') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'service_positive_keywords_service_id_fkey'
     ) THEN
    ALTER TABLE "service_positive_keywords"
      ADD CONSTRAINT "service_positive_keywords_service_id_fkey"
      FOREIGN KEY ("service_id") REFERENCES services(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER INDEX IF EXISTS "niches_pkey" RENAME TO "Niches_pkey";
ALTER INDEX IF EXISTS "niches_name_key" RENAME TO "Niches_name_key";
ALTER INDEX IF EXISTS "freelancer_skills_user_id_service_id_sub_category_id_tool_id_ke"
  RENAME TO "freelancer_skills_user_id_service_id_sub_category_id_tool_i_key";
