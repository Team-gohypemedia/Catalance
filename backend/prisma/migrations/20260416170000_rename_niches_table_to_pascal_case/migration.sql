DO $$
BEGIN
  IF to_regclass('public.niches') IS NOT NULL
     AND to_regclass('public."Niches"') IS NULL THEN
    ALTER TABLE niches RENAME TO "Niches";
  END IF;
END $$;
