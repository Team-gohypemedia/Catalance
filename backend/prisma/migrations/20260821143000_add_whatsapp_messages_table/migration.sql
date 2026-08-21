-- CreateTable
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "senderName" TEXT,
    "toPhone" TEXT NOT NULL DEFAULT '918882855425',
    "wamid" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT,
    "mediaUrl" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "rawPayload" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_messages_wamid_key" ON "whatsapp_messages"("wamid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "whatsapp_messages_fromPhone_createdAt_idx" ON "whatsapp_messages"("fromPhone", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "whatsapp_messages_direction_createdAt_idx" ON "whatsapp_messages"("direction", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "whatsapp_messages_createdAt_idx" ON "whatsapp_messages"("createdAt");
