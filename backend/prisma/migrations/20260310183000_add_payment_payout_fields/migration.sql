ALTER TABLE "Payment"
ADD COLUMN "payoutSequence" INTEGER,
ADD COLUMN "payoutKey" TEXT,
ADD COLUMN "payoutLabel" TEXT,
ADD COLUMN "payoutPercentage" INTEGER,
ADD COLUMN "payoutPhaseNumber" INTEGER;

CREATE UNIQUE INDEX "Payment_projectId_freelancerId_payoutSequence_key"
ON "Payment"("projectId", "freelancerId", "payoutSequence");
