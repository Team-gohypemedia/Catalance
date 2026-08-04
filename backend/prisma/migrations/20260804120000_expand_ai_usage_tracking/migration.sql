ALTER TABLE "AIUsage"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "AIUsage"
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'openrouter',
  ADD COLUMN "model" TEXT,
  ADD COLUMN "title" TEXT,
  ADD COLUMN "featureKey" TEXT,
  ADD COLUMN "requestPath" TEXT,
  ADD COLUMN "pagePath" TEXT,
  ADD COLUMN "pageUrl" TEXT,
  ADD COLUMN "routeKey" TEXT,
  ADD COLUMN "visitorType" TEXT NOT NULL DEFAULT 'guest',
  ADD COLUMN "guestSessionId" TEXT,
  ADD COLUMN "guestIdentifier" TEXT,
  ADD COLUMN "responseStatus" TEXT NOT NULL DEFAULT 'success',
  ADD COLUMN "responseStatusCode" INTEGER,
  ADD COLUMN "durationMs" DOUBLE PRECISION,
  ADD COLUMN "totalTokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "AIUsage"
SET "visitorType" = CASE WHEN "userId" IS NULL THEN 'guest' ELSE 'authenticated' END,
    "totalTokens" = COALESCE("promptTokens", 0) + COALESCE("completionTokens", 0);

CREATE INDEX "AIUsage_pagePath_idx" ON "AIUsage"("pagePath");
CREATE INDEX "AIUsage_featureKey_idx" ON "AIUsage"("featureKey");
CREATE INDEX "AIUsage_guestSessionId_idx" ON "AIUsage"("guestSessionId");
CREATE INDEX "AIUsage_guestIdentifier_idx" ON "AIUsage"("guestIdentifier");
CREATE INDEX "AIUsage_visitorType_createdAt_idx" ON "AIUsage"("visitorType", "createdAt");
CREATE INDEX "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");
