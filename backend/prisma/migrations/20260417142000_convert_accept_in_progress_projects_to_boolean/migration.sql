ALTER TABLE "FreelancerProfile"
ALTER COLUMN "acceptInProgressProjects" TYPE BOOLEAN
USING (
  CASE
    WHEN "acceptInProgressProjectsBoolean" IS NOT NULL THEN "acceptInProgressProjectsBoolean"
    WHEN lower(trim(coalesce("acceptInProgressProjects", ''))) IN ('true', '1', 'yes', 'y', 'open') THEN TRUE
    WHEN lower(trim(coalesce("acceptInProgressProjects", ''))) IN ('false', '0', 'no', 'n') THEN FALSE
    ELSE NULL
  END
);

ALTER TABLE "FreelancerProfile"
DROP COLUMN IF EXISTS "acceptInProgressProjectsBoolean";
