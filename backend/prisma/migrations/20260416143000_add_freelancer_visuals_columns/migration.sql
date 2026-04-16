ALTER TABLE "FreelancerProfile"
ADD COLUMN "serviceKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "serviceMedia" JSONB DEFAULT '[]';
