-- Remove one-row-per-freelancer uniqueness to allow one-row-per-service.
DROP INDEX IF EXISTS "Marketplace_freelancerId_key";

-- Add row-level service column.
ALTER TABLE "Marketplace"
ADD COLUMN "service" TEXT;

-- Expand comma-separated services text into one row per service.
WITH expanded AS (
  SELECT
    m."id" AS source_id,
    m."freelancerId",
    TRIM(split_value.value) AS service,
    m."isFeatured",
    m."createdAt",
    m."updatedAt",
    CASE
      WHEN jsonb_typeof(m."serviceDetails") = 'array' THEN
        COALESCE(
          (
            SELECT detail
            FROM jsonb_array_elements(m."serviceDetails") AS detail
            WHERE COALESCE(TRIM(detail->>'title'), '') = TRIM(split_value.value)
            LIMIT 1
          ),
          '{}'::jsonb
        )
      WHEN jsonb_typeof(m."serviceDetails") = 'object' THEN
        m."serviceDetails"
      ELSE
        '{}'::jsonb
    END AS detail
  FROM "Marketplace" m
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(m."services", ''), '\s*,\s*') AS split_value(value)
  WHERE TRIM(split_value.value) <> ''
),
deduped AS (
  SELECT DISTINCT ON (source_id, service)
    source_id,
    "freelancerId",
    service,
    "isFeatured",
    "createdAt",
    "updatedAt",
    detail
  FROM expanded
  ORDER BY source_id, service
),
ranked AS (
  SELECT
    deduped.*,
    ROW_NUMBER() OVER (PARTITION BY source_id ORDER BY service) AS rn
  FROM deduped
)
UPDATE "Marketplace" m
SET
  "service" = ranked.service,
  "serviceDetails" = ranked.detail
FROM ranked
WHERE ranked.rn = 1
  AND m."id" = ranked.source_id;

-- Insert additional rows for extra services belonging to the same freelancer.
WITH expanded AS (
  SELECT
    m."id" AS source_id,
    m."freelancerId",
    TRIM(split_value.value) AS service,
    m."isFeatured",
    m."createdAt",
    m."updatedAt",
    CASE
      WHEN jsonb_typeof(m."serviceDetails") = 'array' THEN
        COALESCE(
          (
            SELECT detail
            FROM jsonb_array_elements(m."serviceDetails") AS detail
            WHERE COALESCE(TRIM(detail->>'title'), '') = TRIM(split_value.value)
            LIMIT 1
          ),
          '{}'::jsonb
        )
      WHEN jsonb_typeof(m."serviceDetails") = 'object' THEN
        m."serviceDetails"
      ELSE
        '{}'::jsonb
    END AS detail
  FROM "Marketplace" m
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(m."services", ''), '\s*,\s*') AS split_value(value)
  WHERE TRIM(split_value.value) <> ''
),
deduped AS (
  SELECT DISTINCT ON (source_id, service)
    source_id,
    "freelancerId",
    service,
    "isFeatured",
    "createdAt",
    "updatedAt",
    detail
  FROM expanded
  ORDER BY source_id, service
),
ranked AS (
  SELECT
    deduped.*,
    ROW_NUMBER() OVER (PARTITION BY source_id ORDER BY service) AS rn
  FROM deduped
)
INSERT INTO "Marketplace" (
  "id",
  "freelancerId",
  "service",
  "serviceDetails",
  "isFeatured",
  "createdAt",
  "updatedAt"
)
SELECT
  'mkt_' || substr(md5(random()::text || clock_timestamp()::text || ranked.source_id || ranked.service), 1, 24),
  ranked."freelancerId",
  ranked.service,
  ranked.detail,
  ranked."isFeatured",
  ranked."createdAt",
  ranked."updatedAt"
FROM ranked
WHERE ranked.rn > 1;

-- Fallback defaults for rows that had no services text.
UPDATE "Marketplace"
SET
  "service" = COALESCE(NULLIF(TRIM("service"), ''), 'Service'),
  "serviceDetails" = CASE
    WHEN jsonb_typeof("serviceDetails") = 'object' THEN "serviceDetails"
    ELSE '{}'::jsonb
  END;

ALTER TABLE "Marketplace"
ALTER COLUMN "service" SET NOT NULL,
ALTER COLUMN "service" SET DEFAULT '';

ALTER TABLE "Marketplace"
ALTER COLUMN "serviceDetails" SET DEFAULT '{}'::jsonb;

-- Drop legacy multi-service column.
ALTER TABLE "Marketplace"
DROP COLUMN "services";

-- Enforce one row per (freelancer, service string).
CREATE INDEX "Marketplace_freelancerId_idx" ON "Marketplace"("freelancerId");
CREATE UNIQUE INDEX "Marketplace_freelancerId_service_key" ON "Marketplace"("freelancerId", "service");
