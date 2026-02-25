DO $$
BEGIN
  IF to_regclass('"public"."Projects"') IS NOT NULL THEN
    ALTER TABLE "Projects" RENAME TO "MatchingProjects";
  ELSIF to_regclass('"public"."projects"') IS NOT NULL THEN
    ALTER TABLE "projects" RENAME TO "MatchingProjects";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"public"."Projects_pkey"') IS NOT NULL THEN
    ALTER INDEX "Projects_pkey" RENAME TO "MatchingProjects_pkey";
  ELSIF to_regclass('"public"."projects_pkey"') IS NOT NULL THEN
    ALTER INDEX "projects_pkey" RENAME TO "MatchingProjects_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"public"."Projects_freelancerId_idx"') IS NOT NULL THEN
    ALTER INDEX "Projects_freelancerId_idx" RENAME TO "MatchingProjects_freelancerId_idx";
  ELSIF to_regclass('"public"."projects_freelancerId_idx"') IS NOT NULL THEN
    ALTER INDEX "projects_freelancerId_idx" RENAME TO "MatchingProjects_freelancerId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"public"."Projects_freelancerId_serviceKey_idx"') IS NOT NULL THEN
    ALTER INDEX "Projects_freelancerId_serviceKey_idx" RENAME TO "MatchingProjects_freelancerId_serviceKey_idx";
  ELSIF to_regclass('"public"."projects_freelancerId_serviceKey_idx"') IS NOT NULL THEN
    ALTER INDEX "projects_freelancerId_serviceKey_idx" RENAME TO "MatchingProjects_freelancerId_serviceKey_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'MatchingProjects'
      AND constraint_name = 'Projects_freelancerId_fkey'
  ) THEN
    ALTER TABLE "MatchingProjects"
    RENAME CONSTRAINT "Projects_freelancerId_fkey" TO "MatchingProjects_freelancerId_fkey";
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'MatchingProjects'
      AND constraint_name = 'projects_freelancerId_fkey'
  ) THEN
    ALTER TABLE "MatchingProjects"
    RENAME CONSTRAINT "projects_freelancerId_fkey" TO "MatchingProjects_freelancerId_fkey";
  END IF;
END $$;
