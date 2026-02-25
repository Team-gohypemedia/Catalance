ALTER TABLE "FreelancerProfile"
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "jobTitle" TEXT,
ADD COLUMN IF NOT EXISTS "companyName" TEXT,
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "workExperience" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "portfolio" TEXT,
ADD COLUMN IF NOT EXISTS "linkedin" TEXT,
ADD COLUMN IF NOT EXISTS "github" TEXT,
ADD COLUMN IF NOT EXISTS "portfolioProjects" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "resume" TEXT;

INSERT INTO "FreelancerProfile" ("userId", "createdAt", "updatedAt")
SELECT u."id"
     , NOW()
     , NOW()
FROM "User" u
WHERE u."role" = 'FREELANCER'::"UserRole"
   OR u."roles" @> ARRAY['FREELANCER']::TEXT[]
   OR COALESCE(u."bio", '') <> ''
   OR COALESCE(array_length(u."skills", 1), 0) > 0
   OR u."hourlyRate" IS NOT NULL
   OR COALESCE(u."jobTitle", '') <> ''
   OR COALESCE(u."companyName", '') <> ''
   OR COALESCE(u."location", '') <> ''
   OR u."rating" IS NOT NULL
   OR COALESCE(u."reviewCount", 0) > 0
   OR COALESCE(u."experienceYears", 0) > 0
   OR (
     jsonb_typeof(u."workExperience") = 'array'
     AND u."workExperience" <> '[]'::jsonb
   )
   OR COALESCE(array_length(u."services", 1), 0) > 0
   OR COALESCE(u."portfolio", '') <> ''
   OR COALESCE(u."linkedin", '') <> ''
   OR COALESCE(u."github", '') <> ''
   OR (
     jsonb_typeof(u."portfolioProjects") = 'array'
     AND u."portfolioProjects" <> '[]'::jsonb
   )
   OR COALESCE(u."resume", '') <> ''
   OR (
     jsonb_typeof(u."profileDetails") = 'object'
     AND u."profileDetails" <> '{}'::jsonb
   )
ON CONFLICT ("userId") DO NOTHING;

UPDATE "FreelancerProfile" fp
SET
  "bio" = COALESCE(u."bio", fp."bio"),
  "skills" = COALESCE(u."skills", fp."skills", ARRAY[]::TEXT[]),
  "hourlyRate" = COALESCE(u."hourlyRate", fp."hourlyRate"),
  "jobTitle" = COALESCE(u."jobTitle", fp."jobTitle"),
  "companyName" = COALESCE(u."companyName", fp."companyName"),
  "location" = COALESCE(u."location", fp."location"),
  "rating" = COALESCE(u."rating", fp."rating", 0),
  "reviewCount" = COALESCE(u."reviewCount", fp."reviewCount", 0),
  "experienceYears" = COALESCE(u."experienceYears", fp."experienceYears", 0),
  "workExperience" = CASE
    WHEN jsonb_typeof(u."workExperience") = 'array' THEN u."workExperience"
    WHEN fp."workExperience" IS NOT NULL THEN fp."workExperience"
    ELSE '[]'::jsonb
  END,
  "services" = COALESCE(u."services", fp."services", ARRAY[]::TEXT[]),
  "portfolio" = COALESCE(u."portfolio", fp."portfolio"),
  "linkedin" = COALESCE(u."linkedin", fp."linkedin"),
  "github" = COALESCE(u."github", fp."github"),
  "portfolioProjects" = CASE
    WHEN jsonb_typeof(u."portfolioProjects") = 'array' THEN u."portfolioProjects"
    WHEN fp."portfolioProjects" IS NOT NULL THEN fp."portfolioProjects"
    ELSE '[]'::jsonb
  END,
  "resume" = COALESCE(u."resume", fp."resume"),
  "profileDetails" = CASE
    WHEN jsonb_typeof(u."profileDetails") = 'object' THEN u."profileDetails"
    WHEN jsonb_typeof(fp."profileDetails") = 'object' THEN fp."profileDetails"
    ELSE '{}'::jsonb
  END,
  "updatedAt" = NOW()
FROM "User" u
WHERE u."id" = fp."userId";

ALTER TABLE "User"
DROP COLUMN IF EXISTS "bio",
DROP COLUMN IF EXISTS "skills",
DROP COLUMN IF EXISTS "hourlyRate",
DROP COLUMN IF EXISTS "jobTitle",
DROP COLUMN IF EXISTS "companyName",
DROP COLUMN IF EXISTS "location",
DROP COLUMN IF EXISTS "rating",
DROP COLUMN IF EXISTS "reviewCount",
DROP COLUMN IF EXISTS "experienceYears",
DROP COLUMN IF EXISTS "workExperience",
DROP COLUMN IF EXISTS "services",
DROP COLUMN IF EXISTS "portfolio",
DROP COLUMN IF EXISTS "linkedin",
DROP COLUMN IF EXISTS "github",
DROP COLUMN IF EXISTS "portfolioProjects",
DROP COLUMN IF EXISTS "resume",
DROP COLUMN IF EXISTS "profileDetails";
