-- CreateTable
CREATE TABLE "FreelancerOnboardingContent" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelancerOnboardingContent_pkey" PRIMARY KEY ("id")
);
