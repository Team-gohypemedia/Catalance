CREATE TABLE IF NOT EXISTS "Freelancer Profile Details" (
    "userId" TEXT NOT NULL,
    "profileDetails" JSONB NOT NULL DEFAULT '{}',
    "profileRole" TEXT,
    "professionalBio" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "deliveryPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "communicationPolicyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptInProgressProjects" TEXT,
    "globalIndustryOther" TEXT,
    "city" TEXT,
    "country" TEXT,
    "username" TEXT,
    "githubUrl" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImage" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "profilePhoto" TEXT,
    "otherLanguage" TEXT,
    "professionalTitle" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillLevels" JSONB NOT NULL DEFAULT '{}',
    "education" JSONB NOT NULL DEFAULT '[]',
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceDetails" JSONB NOT NULL DEFAULT '{}',
    "portfolioProjects" JSONB NOT NULL DEFAULT '[]',
    "globalIndustryFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availabilityHoursPerWeek" TEXT,
    "availabilityStartTimeline" TEXT,
    "availabilityWorkingSchedule" TEXT,
    "reliabilityDelayHandling" TEXT,
    "reliabilityMissedDeadlines" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Freelancer Profile Details_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "Freelancer Profile Details"
ADD COLUMN IF NOT EXISTS "profileDetails" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "skillLevels" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "education" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "serviceDetails" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "portfolioProjects" JSONB NOT NULL DEFAULT '[]';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Freelancer Profile Details_userId_fkey'
    ) THEN
        ALTER TABLE "Freelancer Profile Details"
        ADD CONSTRAINT "Freelancer Profile Details_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "FreelancerProfile"("userId")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;

INSERT INTO "Freelancer Profile Details" (
    "userId",
    "createdAt",
    "updatedAt"
)
SELECT
    fp."userId",
    COALESCE(fp."createdAt", CURRENT_TIMESTAMP),
    COALESCE(fp."updatedAt", CURRENT_TIMESTAMP)
FROM "FreelancerProfile" fp
WHERE NOT EXISTS (
    SELECT 1
    FROM "Freelancer Profile Details" fpd
    WHERE fpd."userId" = fp."userId"
);

UPDATE "Freelancer Profile Details" fpd
SET
    "profileDetails" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN fp."profileDetails"
        ELSE '{}'::jsonb
    END,
    "profileRole" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->>'role'), '')
        ELSE NULL
    END,
    "professionalBio" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->>'professionalBio'), '')
        ELSE NULL
    END,
    "termsAccepted" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN COALESCE((fp."profileDetails"->>'termsAccepted')::boolean, false)
        ELSE false
    END,
    "deliveryPolicyAccepted" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN COALESCE((fp."profileDetails"->>'deliveryPolicyAccepted')::boolean, false)
        ELSE false
    END,
    "communicationPolicyAccepted" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN COALESCE((fp."profileDetails"->>'communicationPolicyAccepted')::boolean, false)
        ELSE false
    END,
    "acceptInProgressProjects" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->>'acceptInProgressProjects'), '')
        ELSE NULL
    END,
    "globalIndustryOther" = CASE
        WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->>'globalIndustryOther'), '')
        ELSE NULL
    END,
    "city" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'city'), '')
        ELSE NULL
    END,
    "country" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'country'), '')
        ELSE NULL
    END,
    "username" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'username'), '')
        ELSE NULL
    END,
    "githubUrl" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'githubUrl'), '')
        ELSE NULL
    END,
    "languages" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity'->'languages') = 'array' THEN ARRAY(
            SELECT jsonb_array_elements_text(fp."profileDetails"->'identity'->'languages')
        )
        ELSE ARRAY[]::TEXT[]
    END,
    "coverImage" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'coverImage'), '')
        ELSE NULL
    END,
    "linkedinUrl" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'linkedinUrl'), '')
        ELSE NULL
    END,
    "portfolioUrl" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'portfolioUrl'), '')
        ELSE NULL
    END,
    "profilePhoto" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'profilePhoto'), '')
        ELSE NULL
    END,
    "otherLanguage" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'otherLanguage'), '')
        ELSE NULL
    END,
    "professionalTitle" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'identity') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'identity'->>'professionalTitle'), '')
        ELSE NULL
    END,
    "skills" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'skills') = 'array' THEN ARRAY(
            SELECT jsonb_array_elements_text(fp."profileDetails"->'skills')
        )
        ELSE COALESCE(fp."skills", ARRAY[]::TEXT[])
    END,
    "skillLevels" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'skillLevels') = 'object' THEN fp."profileDetails"->'skillLevels'
        ELSE '{}'::jsonb
    END,
    "education" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'education') = 'array' THEN fp."profileDetails"->'education'
        ELSE '[]'::jsonb
    END,
    "services" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'services') = 'array' THEN ARRAY(
            SELECT jsonb_array_elements_text(fp."profileDetails"->'services')
        )
        ELSE COALESCE(fp."services", ARRAY[]::TEXT[])
    END,
    "serviceDetails" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'serviceDetails') = 'object' THEN fp."profileDetails"->'serviceDetails'
        ELSE '{}'::jsonb
    END,
    "portfolioProjects" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'portfolioProjects') = 'array' THEN fp."profileDetails"->'portfolioProjects'
        WHEN jsonb_typeof(fp."portfolioProjects") = 'array' THEN fp."portfolioProjects"
        ELSE '[]'::jsonb
    END,
    "globalIndustryFocus" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'globalIndustryFocus') = 'array' THEN ARRAY(
            SELECT jsonb_array_elements_text(fp."profileDetails"->'globalIndustryFocus')
        )
        ELSE ARRAY[]::TEXT[]
    END,
    "availabilityHoursPerWeek" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'availability') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'availability'->>'hoursPerWeek'), '')
        ELSE NULL
    END,
    "availabilityStartTimeline" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'availability') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'availability'->>'startTimeline'), '')
        ELSE NULL
    END,
    "availabilityWorkingSchedule" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'availability') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'availability'->>'workingSchedule'), '')
        ELSE NULL
    END,
    "reliabilityDelayHandling" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'reliability') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'reliability'->>'delayHandling'), '')
        ELSE NULL
    END,
    "reliabilityMissedDeadlines" = CASE
        WHEN jsonb_typeof(fp."profileDetails"->'reliability') = 'object' THEN NULLIF(BTRIM(fp."profileDetails"->'reliability'->>'missedDeadlines'), '')
        ELSE NULL
    END,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "FreelancerProfile" fp
WHERE fpd."userId" = fp."userId";

DROP TABLE IF EXISTS "FreelancerProfileDetailsServiceGroup" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsServicePlatformLink" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsServiceProject" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsServiceDetail" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsPortfolioProject" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsEducation" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfileDetailsSkill" CASCADE;
