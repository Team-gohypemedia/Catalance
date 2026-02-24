UPDATE "Marketplace"
SET "serviceKey" = 'web-development'
WHERE "serviceKey" = 'website_ui_ux';

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "freelancerId", "serviceKey"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "Marketplace"
)
DELETE FROM "Marketplace" m
USING ranked
WHERE m."id" = ranked."id"
  AND ranked.rn > 1;

UPDATE "Marketplace"
SET "serviceDetails" = jsonb_set(
  CASE
    WHEN jsonb_typeof("serviceDetails") = 'object' THEN "serviceDetails"
    ELSE '{}'::jsonb
  END,
  '{key}',
  to_jsonb("serviceKey"),
  true
);
