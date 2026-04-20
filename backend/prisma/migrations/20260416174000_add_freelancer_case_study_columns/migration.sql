ALTER TABLE "FreelancerProfile"
  ADD COLUMN IF NOT EXISTS "caseStudyTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyProjectLink" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyProjectFile" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyYourRole" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyTimeline" TEXT,
  ADD COLUMN IF NOT EXISTS "caseStudyBudget" INTEGER,
  ADD COLUMN IF NOT EXISTS "caseStudyNiche" TEXT;
