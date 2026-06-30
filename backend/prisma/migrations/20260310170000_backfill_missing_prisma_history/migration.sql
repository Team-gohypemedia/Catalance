-- Backfill schema objects that were introduced outside Prisma Migrate history.
-- Keep this migration idempotent so it can be safely applied to databases that
-- already contain these tables from prior db push/manual SQL changes.

DO $$
BEGIN
  CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ProjectTaskStatus" AS ENUM ('TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "UserRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ManagerProfile" (
  "userId" TEXT NOT NULL,
  "profileDetails" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ManagerProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "ManagerAvailability" (
  "id" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "startHour" INTEGER NOT NULL,
  "endHour" INTEGER NOT NULL,
  "isBooked" BOOLEAN NOT NULL DEFAULT false,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ManagerAvailability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATE NOT NULL,
  "startHour" INTEGER NOT NULL,
  "endHour" INTEGER NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "meetingLink" TEXT,
  "bookedById" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "platformFee" INTEGER NOT NULL DEFAULT 0,
  "freelancerAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "description" TEXT,
  "projectId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiGuestSession" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "answers" JSONB DEFAULT '{}',

  CONSTRAINT "AiGuestSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiGuestMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiGuestMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProjectTask" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectTaskStatus" NOT NULL DEFAULT 'TO_DO',
  "deadline" TIMESTAMP(3),
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MilestoneApproval" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "phase" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MilestoneApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InternalFreelancerReview" (
  "id" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "projectId" TEXT,
  "rating" INTEGER,
  "strengths" TEXT,
  "issues" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InternalFreelancerReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminEscalation" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "raisedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminEscalation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfileUpdateRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userRole" TEXT NOT NULL DEFAULT 'PROJECT_MANAGER',
  "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
  "requestedData" JSONB NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProfileUpdateRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "request" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "status" "UserRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedType" TEXT,
  "adminNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedAsType" TEXT,
  "approvedEntityId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EngagementUserDailyQuestionSet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "questionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "questionSnapshots" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "generationSource" TEXT NOT NULL DEFAULT 'fallback',
  "profileSnapshot" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "aiMetadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "EngagementUserDailyQuestionSet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ManagerAvailability_managerId_date_idx"
ON "ManagerAvailability"("managerId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "ManagerAvailability_managerId_date_startHour_key"
ON "ManagerAvailability"("managerId", "date", "startHour");

CREATE INDEX IF NOT EXISTS "Appointment_managerId_date_idx"
ON "Appointment"("managerId", "date");

CREATE INDEX IF NOT EXISTS "Appointment_bookedById_idx"
ON "Appointment"("bookedById");

CREATE INDEX IF NOT EXISTS "Payment_freelancerId_idx"
ON "Payment"("freelancerId");

CREATE INDEX IF NOT EXISTS "Payment_projectId_idx"
ON "Payment"("projectId");

CREATE INDEX IF NOT EXISTS "ProjectTask_projectId_idx"
ON "ProjectTask"("projectId");

CREATE INDEX IF NOT EXISTS "MilestoneApproval_managerId_idx"
ON "MilestoneApproval"("managerId");

CREATE UNIQUE INDEX IF NOT EXISTS "MilestoneApproval_projectId_phase_key"
ON "MilestoneApproval"("projectId", "phase");

CREATE INDEX IF NOT EXISTS "InternalFreelancerReview_freelancerId_idx"
ON "InternalFreelancerReview"("freelancerId");

CREATE INDEX IF NOT EXISTS "InternalFreelancerReview_managerId_idx"
ON "InternalFreelancerReview"("managerId");

CREATE INDEX IF NOT EXISTS "InternalFreelancerReview_projectId_idx"
ON "InternalFreelancerReview"("projectId");

CREATE INDEX IF NOT EXISTS "AdminEscalation_projectId_idx"
ON "AdminEscalation"("projectId");

CREATE INDEX IF NOT EXISTS "AdminEscalation_raisedById_idx"
ON "AdminEscalation"("raisedById");

CREATE INDEX IF NOT EXISTS "user_requests_userId_idx"
ON "user_requests"("userId");

CREATE INDEX IF NOT EXISTS "user_requests_status_idx"
ON "user_requests"("status");

CREATE INDEX IF NOT EXISTS "user_requests_reviewedById_idx"
ON "user_requests"("reviewedById");

CREATE UNIQUE INDEX IF NOT EXISTS "user_requests_normalizedName_status_key"
ON "user_requests"("normalizedName", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "EngagementUserDailyQuestionSet_userId_dayKey_key"
ON "EngagementUserDailyQuestionSet"("userId", "dayKey");

CREATE INDEX IF NOT EXISTS "EngagementUserDailyQuestionSet_dayKey_idx"
ON "EngagementUserDailyQuestionSet"("dayKey");

DO $$
BEGIN
  IF to_regclass('public."ManagerProfile"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ManagerProfile_userId_fkey'
     ) THEN
    ALTER TABLE "ManagerProfile"
      ADD CONSTRAINT "ManagerProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."ManagerAvailability"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ManagerAvailability_managerId_fkey'
     ) THEN
    ALTER TABLE "ManagerAvailability"
      ADD CONSTRAINT "ManagerAvailability_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Appointment"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_bookedById_fkey'
     ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_bookedById_fkey"
      FOREIGN KEY ("bookedById") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Appointment"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_managerId_fkey'
     ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Appointment"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_projectId_fkey'
     ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Payment"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'Payment_projectId_fkey'
     ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Payment"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'Payment_freelancerId_fkey'
     ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_freelancerId_fkey"
      FOREIGN KEY ("freelancerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."AiGuestMessage"') IS NOT NULL
     AND to_regclass('public."AiGuestSession"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'AiGuestMessage_sessionId_fkey'
     ) THEN
    ALTER TABLE "AiGuestMessage"
      ADD CONSTRAINT "AiGuestMessage_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "AiGuestSession"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."ProjectTask"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ProjectTask_projectId_fkey'
     ) THEN
    ALTER TABLE "ProjectTask"
      ADD CONSTRAINT "ProjectTask_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."MilestoneApproval"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'MilestoneApproval_projectId_fkey'
     ) THEN
    ALTER TABLE "MilestoneApproval"
      ADD CONSTRAINT "MilestoneApproval_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."MilestoneApproval"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'MilestoneApproval_managerId_fkey'
     ) THEN
    ALTER TABLE "MilestoneApproval"
      ADD CONSTRAINT "MilestoneApproval_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."InternalFreelancerReview"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'InternalFreelancerReview_freelancerId_fkey'
     ) THEN
    ALTER TABLE "InternalFreelancerReview"
      ADD CONSTRAINT "InternalFreelancerReview_freelancerId_fkey"
      FOREIGN KEY ("freelancerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."InternalFreelancerReview"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'InternalFreelancerReview_managerId_fkey'
     ) THEN
    ALTER TABLE "InternalFreelancerReview"
      ADD CONSTRAINT "InternalFreelancerReview_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."InternalFreelancerReview"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'InternalFreelancerReview_projectId_fkey'
     ) THEN
    ALTER TABLE "InternalFreelancerReview"
      ADD CONSTRAINT "InternalFreelancerReview_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."AdminEscalation"') IS NOT NULL
     AND to_regclass('public."OnGoingProjects"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'AdminEscalation_projectId_fkey'
     ) THEN
    ALTER TABLE "AdminEscalation"
      ADD CONSTRAINT "AdminEscalation_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "OnGoingProjects"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."AdminEscalation"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'AdminEscalation_raisedById_fkey'
     ) THEN
    ALTER TABLE "AdminEscalation"
      ADD CONSTRAINT "AdminEscalation_raisedById_fkey"
      FOREIGN KEY ("raisedById") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."ProfileUpdateRequest"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ProfileUpdateRequest_userId_fkey'
     ) THEN
    ALTER TABLE "ProfileUpdateRequest"
      ADD CONSTRAINT "ProfileUpdateRequest_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."ProfileUpdateRequest"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'ProfileUpdateRequest_reviewedById_fkey'
     ) THEN
    ALTER TABLE "ProfileUpdateRequest"
      ADD CONSTRAINT "ProfileUpdateRequest_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.user_requests') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'user_requests_userId_fkey'
     ) THEN
    ALTER TABLE "user_requests"
      ADD CONSTRAINT "user_requests_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.user_requests') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'user_requests_reviewedById_fkey'
     ) THEN
    ALTER TABLE "user_requests"
      ADD CONSTRAINT "user_requests_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."EngagementUserDailyQuestionSet"') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'EngagementUserDailyQuestionSet_userId_fkey'
     ) THEN
    ALTER TABLE "EngagementUserDailyQuestionSet"
      ADD CONSTRAINT "EngagementUserDailyQuestionSet_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
