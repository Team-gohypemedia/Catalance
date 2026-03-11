ALTER TABLE "FreelancerProfile"
ADD COLUMN IF NOT EXISTS "profileDetails" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "profileRole" TEXT,
ADD COLUMN IF NOT EXISTS "professionalBio" TEXT,
ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deliveryPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "communicationPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "acceptInProgressProjects" TEXT,
ADD COLUMN IF NOT EXISTS "globalIndustryOther" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "username" TEXT,
ADD COLUMN IF NOT EXISTS "githubUrl" TEXT,
ADD COLUMN IF NOT EXISTS "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT,
ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT,
ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT,
ADD COLUMN IF NOT EXISTS "otherLanguage" TEXT,
ADD COLUMN IF NOT EXISTS "professionalTitle" TEXT,
ADD COLUMN IF NOT EXISTS "skillLevels" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "education" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "serviceDetails" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "globalIndustryFocus" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "availabilityHoursPerWeek" TEXT,
ADD COLUMN IF NOT EXISTS "availabilityStartTimeline" TEXT,
ADD COLUMN IF NOT EXISTS "availabilityWorkingSchedule" TEXT,
ADD COLUMN IF NOT EXISTS "reliabilityDelayHandling" TEXT,
ADD COLUMN IF NOT EXISTS "reliabilityMissedDeadlines" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Freelancer Profile Details'
  ) THEN
    UPDATE "FreelancerProfile" AS fp
    SET
      "profileDetails" = CASE
        WHEN jsonb_typeof(fpd."profileDetails") = 'object' THEN fpd."profileDetails"
        ELSE fp."profileDetails"
      END,
      "profileRole" = COALESCE(fpd."profileRole", fp."profileRole"),
      "professionalBio" = COALESCE(fpd."professionalBio", fp."professionalBio"),
      "termsAccepted" = COALESCE(fpd."termsAccepted", fp."termsAccepted"),
      "deliveryPolicyAccepted" = COALESCE(
        fpd."deliveryPolicyAccepted",
        fp."deliveryPolicyAccepted"
      ),
      "communicationPolicyAccepted" = COALESCE(
        fpd."communicationPolicyAccepted",
        fp."communicationPolicyAccepted"
      ),
      "acceptInProgressProjects" = COALESCE(
        fpd."acceptInProgressProjects",
        fp."acceptInProgressProjects"
      ),
      "globalIndustryOther" = COALESCE(
        fpd."globalIndustryOther",
        fp."globalIndustryOther"
      ),
      "city" = COALESCE(fpd."city", fp."city"),
      "country" = COALESCE(fpd."country", fp."country"),
      "username" = COALESCE(fpd."username", fp."username"),
      "githubUrl" = COALESCE(fpd."githubUrl", fp."githubUrl"),
      "languages" = CASE
        WHEN COALESCE(array_length(fp."languages", 1), 0) > 0 THEN fp."languages"
        WHEN COALESCE(array_length(fpd."languages", 1), 0) > 0 THEN fpd."languages"
        ELSE fp."languages"
      END,
      "coverImage" = COALESCE(fpd."coverImage", fp."coverImage"),
      "linkedinUrl" = COALESCE(fpd."linkedinUrl", fp."linkedinUrl"),
      "portfolioUrl" = COALESCE(fpd."portfolioUrl", fp."portfolioUrl"),
      "profilePhoto" = COALESCE(fpd."profilePhoto", fp."profilePhoto"),
      "otherLanguage" = COALESCE(fpd."otherLanguage", fp."otherLanguage"),
      "professionalTitle" = COALESCE(
        fpd."professionalTitle",
        fp."professionalTitle"
      ),
      "skillLevels" = CASE
        WHEN jsonb_typeof(fpd."skillLevels") IN ('object', 'array') THEN fpd."skillLevels"
        ELSE fp."skillLevels"
      END,
      "education" = CASE
        WHEN jsonb_typeof(fpd."education") = 'array' THEN fpd."education"
        ELSE fp."education"
      END,
      "serviceDetails" = CASE
        WHEN jsonb_typeof(fpd."serviceDetails") = 'object' THEN fpd."serviceDetails"
        ELSE fp."serviceDetails"
      END,
      "globalIndustryFocus" = CASE
        WHEN COALESCE(array_length(fp."globalIndustryFocus", 1), 0) > 0
          THEN fp."globalIndustryFocus"
        WHEN COALESCE(array_length(fpd."globalIndustryFocus", 1), 0) > 0
          THEN fpd."globalIndustryFocus"
        ELSE fp."globalIndustryFocus"
      END,
      "availabilityHoursPerWeek" = COALESCE(
        fpd."availabilityHoursPerWeek",
        fp."availabilityHoursPerWeek"
      ),
      "availabilityStartTimeline" = COALESCE(
        fpd."availabilityStartTimeline",
        fp."availabilityStartTimeline"
      ),
      "availabilityWorkingSchedule" = COALESCE(
        fpd."availabilityWorkingSchedule",
        fp."availabilityWorkingSchedule"
      ),
      "reliabilityDelayHandling" = COALESCE(
        fpd."reliabilityDelayHandling",
        fp."reliabilityDelayHandling"
      ),
      "reliabilityMissedDeadlines" = COALESCE(
        fpd."reliabilityMissedDeadlines",
        fp."reliabilityMissedDeadlines"
      ),
      "skills" = CASE
        WHEN COALESCE(array_length(fp."skills", 1), 0) > 0 THEN fp."skills"
        WHEN COALESCE(array_length(fpd."skills", 1), 0) > 0 THEN fpd."skills"
        ELSE fp."skills"
      END,
      "services" = CASE
        WHEN COALESCE(array_length(fp."services", 1), 0) > 0 THEN fp."services"
        WHEN COALESCE(array_length(fpd."services", 1), 0) > 0 THEN fpd."services"
        ELSE fp."services"
      END,
      "portfolioProjects" = CASE
        WHEN jsonb_typeof(fp."portfolioProjects") = 'array'
          AND jsonb_array_length(fp."portfolioProjects") > 0
          THEN fp."portfolioProjects"
        WHEN jsonb_typeof(fpd."portfolioProjects") = 'array'
          AND jsonb_array_length(fpd."portfolioProjects") > 0
          THEN fpd."portfolioProjects"
        ELSE fp."portfolioProjects"
      END
    FROM "Freelancer Profile Details" AS fpd
    WHERE fpd."userId" = fp."userId";

    DROP TABLE "Freelancer Profile Details";
  END IF;
END $$;
