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
        ELSE fpd."profileDetails"
    END,
    "updatedAt" = CURRENT_TIMESTAMP
FROM "FreelancerProfile" fp
WHERE fpd."userId" = fp."userId"
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'profileDetails'
  );

ALTER TABLE "FreelancerProfile"
DROP COLUMN IF EXISTS "profileDetails";
