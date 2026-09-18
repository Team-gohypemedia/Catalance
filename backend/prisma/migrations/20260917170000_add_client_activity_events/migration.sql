-- AlterTable: Add visitorId to AiGuestSession
ALTER TABLE "AiGuestSession" ADD COLUMN IF NOT EXISTS "visitorId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiGuestSession_visitorId_idx" ON "AiGuestSession"("visitorId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "client_activity_events" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT,
    "pageUrl" TEXT,
    "referrer" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_visitorId_idx" ON "client_activity_events"("visitorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_userId_idx" ON "client_activity_events"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_sessionId_idx" ON "client_activity_events"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_eventType_idx" ON "client_activity_events"("eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_serviceId_idx" ON "client_activity_events"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "client_activity_events_createdAt_idx" ON "client_activity_events"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'client_activity_events_userId_fkey'
    ) THEN
        ALTER TABLE "client_activity_events" ADD CONSTRAINT "client_activity_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'client_activity_events_sessionId_fkey'
    ) THEN
        ALTER TABLE "client_activity_events" ADD CONSTRAINT "client_activity_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiGuestSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
