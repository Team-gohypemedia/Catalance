CREATE TABLE IF NOT EXISTS "ClientProfile" (
    "userId" TEXT NOT NULL,
    "profileDetails" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("userId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ClientProfile_userId_fkey'
  ) THEN
    ALTER TABLE "ClientProfile"
    ADD CONSTRAINT "ClientProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "ClientProfile" ("userId", "profileDetails", "createdAt", "updatedAt")
SELECT
  u."id",
  '{}'::jsonb,
  NOW(),
  NOW()
FROM "User" u
WHERE u."role" = 'CLIENT'::"UserRole"
ON CONFLICT ("userId") DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'roles'
  ) THEN
    INSERT INTO "ClientProfile" ("userId", "profileDetails", "createdAt", "updatedAt")
    SELECT
      u."id",
      '{}'::jsonb,
      NOW(),
      NOW()
    FROM "User" u
    WHERE u."roles" @> ARRAY['CLIENT']::TEXT[]
    ON CONFLICT ("userId") DO NOTHING;
  END IF;
END $$;
