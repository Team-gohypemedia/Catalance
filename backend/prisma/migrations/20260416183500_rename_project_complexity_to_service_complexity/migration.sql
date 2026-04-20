DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'projectComplexity'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'serviceComplexity'
  ) THEN
    ALTER TABLE "FreelancerProfile"
      RENAME COLUMN "projectComplexity" TO "serviceComplexity";
  END IF;
END $$;
