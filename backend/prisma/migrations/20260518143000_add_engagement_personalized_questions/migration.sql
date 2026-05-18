CREATE TABLE "EngagementPersonalizedQuestion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "questionId" TEXT,
  "questionText" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "skillTag" TEXT,
  "focusReason" TEXT,
  "generationSource" TEXT NOT NULL DEFAULT 'fallback',
  "sourceReportSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "aiMetadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngagementPersonalizedQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EngagementPersonalizedQuestion_userId_dayKey_key"
  ON "EngagementPersonalizedQuestion"("userId", "dayKey");

CREATE INDEX "EngagementPersonalizedQuestion_dayKey_idx"
  ON "EngagementPersonalizedQuestion"("dayKey");

ALTER TABLE "EngagementPersonalizedQuestion"
  ADD CONSTRAINT "EngagementPersonalizedQuestion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
