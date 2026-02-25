CREATE TABLE "FreelancerProfile" (
    "userId" TEXT NOT NULL,
    "profileDetails" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelancerProfile_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "FreelancerProfile"
ADD CONSTRAINT "FreelancerProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'profileDetails'
  ) THEN
    INSERT INTO "FreelancerProfile" ("userId", "profileDetails", "createdAt", "updatedAt")
    SELECT
      u."id",
      '{}'::jsonb,
      NOW(),
      NOW()
    FROM "User" u
    WHERE u."role" = 'FREELANCER'::"UserRole"
    ON CONFLICT ("userId") DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'profileDetails'
  ) THEN
    INSERT INTO "FreelancerProfile" ("userId", "profileDetails", "createdAt", "updatedAt")
    SELECT
      u."id",
      CASE
        WHEN jsonb_typeof(u."profileDetails") = 'object' THEN u."profileDetails"
        ELSE '{}'::jsonb
      END,
      NOW(),
      NOW()
    FROM "User" u
    WHERE (
      jsonb_typeof(u."profileDetails") = 'object'
      AND u."profileDetails" <> '{}'::jsonb
    )
    ON CONFLICT ("userId") DO UPDATE
    SET
      "profileDetails" = EXCLUDED."profileDetails",
      "updatedAt" = NOW();
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'roles'
  ) THEN
    INSERT INTO "FreelancerProfile" ("userId", "profileDetails", "createdAt", "updatedAt")
    SELECT
      u."id",
      '{}'::jsonb,
      NOW(),
      NOW()
    FROM "User" u
    WHERE u."roles" @> ARRAY['FREELANCER']::TEXT[]
    ON CONFLICT ("userId") DO NOTHING;
  END IF;
END $$;
