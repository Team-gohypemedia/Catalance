-- Backfill Service and ServiceQuestion so later ALTER TABLE migrations
-- can replay cleanly in the shadow database.

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "aiPrompt" TEXT,
  "minBudget" INTEGER DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ServiceQuestion" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "options" JSONB,
  "logic" JSONB,
  "subtitle" TEXT,
  "saveResponse" BOOLEAN NOT NULL DEFAULT false,
  "nextQuestionSlug" TEXT,
  "serviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Service_slug_key"
ON "Service"("slug");

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceQuestion_serviceId_slug_key"
ON "ServiceQuestion"("serviceId", "slug");

DO $$
BEGIN
  IF to_regclass('public."ServiceQuestion"') IS NOT NULL
     AND to_regclass('public."Service"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ServiceQuestion_serviceId_fkey'
     ) THEN
    ALTER TABLE "ServiceQuestion"
      ADD CONSTRAINT "ServiceQuestion_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
