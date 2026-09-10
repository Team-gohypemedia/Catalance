-- AlterTable
ALTER TABLE "FreelancerProfile" ADD COLUMN IF NOT EXISTS "paymentDetails" JSONB DEFAULT '{}';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "upiId" TEXT,
    "upiQrCode" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "accountHolderName" TEXT,
    "bankBranch" TEXT,
    "notes" TEXT,
    "adminNote" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoutRequest_freelancerId_idx" ON "PayoutRequest"("freelancerId");
CREATE INDEX IF NOT EXISTS "PayoutRequest_projectId_idx" ON "PayoutRequest"("projectId");
CREATE INDEX IF NOT EXISTS "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
