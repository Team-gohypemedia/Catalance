-- CreateEnum
CREATE TYPE "EngagementLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'GOLD');

-- CreateEnum
CREATE TYPE "EngagementQuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'SCENARIO_MCQ');

-- CreateEnum
CREATE TYPE "EngagementQuestionCategory" AS ENUM ('CLIENT_COMMUNICATION', 'SCOPE_MANAGEMENT', 'DELIVERY', 'QUALITY_CONTROL', 'PLATFORM_RULES', 'BUSINESS_BASICS');

-- CreateEnum
CREATE TYPE "EngagementDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EngagementQuestionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DailyQuestionSetStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PointsLedgerType" AS ENUM ('EARN', 'SPEND', 'ADJUSTMENT', 'REVERSAL');

-- CreateTable
CREATE TABLE "EngagementProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "engagementLevel" "EngagementLevel" NOT NULL DEFAULT 'LEVEL_1',
  "xp" INTEGER NOT NULL DEFAULT 0,
  "lifetimeXp" INTEGER NOT NULL DEFAULT 0,
  "loyaltyCoins" INTEGER NOT NULL DEFAULT 0,
  "lifetimeCoinsEarned" INTEGER NOT NULL DEFAULT 0,
  "lifetimeCoinsSpent" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastCompletedDayKey" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "freezeTokens" INTEGER NOT NULL DEFAULT 0,
  "dailyCompletionCount" INTEGER NOT NULL DEFAULT 0,
  "totalQuestionsAnswered" INTEGER NOT NULL DEFAULT 0,
  "totalCorrectAnswers" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngagementProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementQuestion" (
  "id" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "type" "EngagementQuestionType" NOT NULL DEFAULT 'MCQ',
  "category" "EngagementQuestionCategory" NOT NULL,
  "skillTag" TEXT NOT NULL,
  "difficulty" "EngagementDifficulty" NOT NULL DEFAULT 'BEGINNER',
  "options" JSONB NOT NULL,
  "correctOptionId" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'template',
  "status" "EngagementQuestionStatus" NOT NULL DEFAULT 'DRAFT',
  "aiMetadata" JSONB NOT NULL DEFAULT '{}',
  "contentHash" TEXT NOT NULL,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "successRate" DOUBLE PRECISION,
  "rejectedReason" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngagementQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestionSet" (
  "id" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "questionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "DailyQuestionSetStatus" NOT NULL DEFAULT 'DRAFT',
  "generatedBy" TEXT NOT NULL DEFAULT 'fallback',
  "approvedById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DailyQuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementAnswerSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "dailyQuestionSetId" TEXT,
  "answers" JSONB NOT NULL,
  "questionSnapshots" JSONB NOT NULL DEFAULT '[]',
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "correctCount" INTEGER NOT NULL DEFAULT 0,
  "questionCount" INTEGER NOT NULL DEFAULT 0,
  "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "xpAwarded" INTEGER NOT NULL DEFAULT 0,
  "coinsAwarded" INTEGER NOT NULL DEFAULT 0,
  "resultSummary" JSONB NOT NULL DEFAULT '{}',
  "idempotencyKey" TEXT,
  "streakApplied" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngagementAnswerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "PointsLedgerType" NOT NULL,
  "reason" TEXT NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "balanceAfter" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementBadge" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "milestoneDays" INTEGER,
  "icon" TEXT NOT NULL DEFAULT 'award',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngagementBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementUserBadge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EngagementUserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementProcessReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rollingAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rolling7DayAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "topicStats" JSONB NOT NULL DEFAULT '{}',
  "weakTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "strongTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "recommendedNextTopic" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EngagementProcessReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementAdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "oldValue" JSONB,
  "newValue" JSONB,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EngagementAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EngagementProfile_userId_key" ON "EngagementProfile"("userId");
CREATE INDEX "EngagementProfile_engagementLevel_idx" ON "EngagementProfile"("engagementLevel");
CREATE INDEX "EngagementProfile_currentStreak_idx" ON "EngagementProfile"("currentStreak");
CREATE INDEX "EngagementProfile_lastCompletedDayKey_idx" ON "EngagementProfile"("lastCompletedDayKey");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementQuestion_contentHash_key" ON "EngagementQuestion"("contentHash");
CREATE INDEX "EngagementQuestion_status_category_difficulty_idx" ON "EngagementQuestion"("status", "category", "difficulty");
CREATE INDEX "EngagementQuestion_skillTag_idx" ON "EngagementQuestion"("skillTag");
CREATE INDEX "EngagementQuestion_approvedById_idx" ON "EngagementQuestion"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionSet_dayKey_key" ON "DailyQuestionSet"("dayKey");
CREATE INDEX "DailyQuestionSet_status_dayKey_idx" ON "DailyQuestionSet"("status", "dayKey");
CREATE INDEX "DailyQuestionSet_approvedById_idx" ON "DailyQuestionSet"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementAnswerSession_idempotencyKey_key" ON "EngagementAnswerSession"("idempotencyKey");
CREATE UNIQUE INDEX "EngagementAnswerSession_userId_dayKey_key" ON "EngagementAnswerSession"("userId", "dayKey");
CREATE INDEX "EngagementAnswerSession_dayKey_idx" ON "EngagementAnswerSession"("dayKey");
CREATE INDEX "EngagementAnswerSession_dailyQuestionSetId_idx" ON "EngagementAnswerSession"("dailyQuestionSetId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsLedger_idempotencyKey_key" ON "PointsLedger"("idempotencyKey");
CREATE INDEX "PointsLedger_userId_createdAt_idx" ON "PointsLedger"("userId", "createdAt");
CREATE INDEX "PointsLedger_referenceType_referenceId_idx" ON "PointsLedger"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementBadge_key_key" ON "EngagementBadge"("key");
CREATE UNIQUE INDEX "EngagementUserBadge_userId_key_key" ON "EngagementUserBadge"("userId", "key");
CREATE INDEX "EngagementUserBadge_badgeId_idx" ON "EngagementUserBadge"("badgeId");
CREATE UNIQUE INDEX "EngagementProcessReport_userId_key" ON "EngagementProcessReport"("userId");
CREATE INDEX "EngagementAdminAuditLog_adminId_createdAt_idx" ON "EngagementAdminAuditLog"("adminId", "createdAt");
CREATE INDEX "EngagementAdminAuditLog_targetUserId_createdAt_idx" ON "EngagementAdminAuditLog"("targetUserId", "createdAt");
CREATE INDEX "EngagementAdminAuditLog_entityType_entityId_idx" ON "EngagementAdminAuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "EngagementProfile" ADD CONSTRAINT "EngagementProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementQuestion" ADD CONSTRAINT "EngagementQuestion_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DailyQuestionSet" ADD CONSTRAINT "DailyQuestionSet_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngagementAnswerSession" ADD CONSTRAINT "EngagementAnswerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementAnswerSession" ADD CONSTRAINT "EngagementAnswerSession_dailyQuestionSetId_fkey" FOREIGN KEY ("dailyQuestionSetId") REFERENCES "DailyQuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementUserBadge" ADD CONSTRAINT "EngagementUserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementUserBadge" ADD CONSTRAINT "EngagementUserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "EngagementBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementProcessReport" ADD CONSTRAINT "EngagementProcessReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementAdminAuditLog" ADD CONSTRAINT "EngagementAdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngagementAdminAuditLog" ADD CONSTRAINT "EngagementAdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
