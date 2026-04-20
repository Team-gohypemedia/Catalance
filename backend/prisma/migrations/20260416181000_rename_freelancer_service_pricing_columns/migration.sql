DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'deliveryTimeline'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'serviceDeliveryTimeline'
  ) THEN
    ALTER TABLE "FreelancerProfile"
      RENAME COLUMN "deliveryTimeline" TO "serviceDeliveryTimeline";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'startingPrice'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FreelancerProfile'
      AND column_name = 'serviceStartingPrice'
  ) THEN
    ALTER TABLE "FreelancerProfile"
      RENAME COLUMN "startingPrice" TO "serviceStartingPrice";
  END IF;
END $$;
