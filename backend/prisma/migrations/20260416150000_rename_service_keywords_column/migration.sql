DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'serviceKeywords'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'servicePositiveKeyword'
  ) THEN
    ALTER TABLE "FreelancerProfile"
      RENAME COLUMN "serviceKeywords" TO "servicePositiveKeyword";
  END IF;
END $$;
