WITH normalized AS (
  SELECT
    m."id",
    m."freelancerId",
    CASE
      WHEN m."serviceKey" IN ('website_ui_ux', 'web-development') THEN 'web_development'
      ELSE m."serviceKey"
    END AS normalized_key,
    ROW_NUMBER() OVER (
      PARTITION BY m."freelancerId",
      CASE
        WHEN m."serviceKey" IN ('website_ui_ux', 'web-development') THEN 'web_development'
        ELSE m."serviceKey"
      END
      ORDER BY m."createdAt" ASC, m."id" ASC
    ) AS rn
  FROM "Marketplace" m
)
DELETE FROM "Marketplace" m
USING normalized n
WHERE m."id" = n."id"
  AND n.rn > 1;

UPDATE "Marketplace"
SET
  "serviceKey" = 'web_development',
  "service" = 'Web Development'
WHERE "serviceKey" IN ('website_ui_ux', 'web-development');

UPDATE "Marketplace"
SET "serviceDetails" = jsonb_set(
  CASE
    WHEN jsonb_typeof("serviceDetails") = 'object' THEN "serviceDetails"
    ELSE '{}'::jsonb
  END,
  '{key}',
  '"web_development"'::jsonb,
  true
)
WHERE "serviceKey" = 'web_development';

UPDATE "Projects"
SET "serviceKey" = 'web_development'
WHERE "serviceKey" IN ('website_ui_ux', 'web-development');

UPDATE "User" u
SET "services" = COALESCE(
  ARRAY(
    SELECT DISTINCT s_norm
    FROM (
      SELECT CASE
        WHEN s IN (
          'website_ui_ux',
          'web-development',
          'website_uiux',
          'website_ui_ux_design',
          'website_ui_ux_design_2d_3d'
        ) THEN 'web_development'
        ELSE s
      END AS s_norm
      FROM unnest(COALESCE(u."services", ARRAY[]::text[])) AS s
    ) t
    WHERE COALESCE(trim(s_norm), '') <> ''
  ),
  ARRAY[]::text[]
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(COALESCE(u."services", ARRAY[]::text[])) AS s
  WHERE s IN (
    'website_ui_ux',
    'web-development',
    'website_uiux',
    'website_ui_ux_design',
    'website_ui_ux_design_2d_3d'
  )
);

UPDATE "User" u
SET "profileDetails" = jsonb_set(
  CASE
    WHEN jsonb_typeof(u."profileDetails") = 'object' THEN u."profileDetails"
    ELSE '{}'::jsonb
  END,
  '{services}',
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT normalized_value)
      FROM (
        SELECT CASE
          WHEN value IN (
            'website_ui_ux',
            'web-development',
            'website_uiux',
            'website_ui_ux_design',
            'website_ui_ux_design_2d_3d'
          ) THEN 'web_development'
          ELSE value
        END AS normalized_value
        FROM jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(u."profileDetails"->'services') = 'array'
              THEN u."profileDetails"->'services'
            ELSE '[]'::jsonb
          END
        ) AS value
      ) x
      WHERE COALESCE(trim(normalized_value), '') <> ''
    ),
    '[]'::jsonb
  ),
  true
)
WHERE jsonb_typeof(u."profileDetails") = 'object'
  AND jsonb_typeof(u."profileDetails"->'services') = 'array';

UPDATE "User" u
SET "profileDetails" = jsonb_set(
  u."profileDetails",
  '{serviceDetails}',
  CASE
    WHEN jsonb_typeof(u."profileDetails"->'serviceDetails') = 'object' THEN
      (
        ((u."profileDetails"->'serviceDetails') - 'website_ui_ux' - 'web-development')
        || jsonb_build_object(
          'web_development',
          COALESCE(
            u."profileDetails"->'serviceDetails'->'web_development',
            u."profileDetails"->'serviceDetails'->'website_ui_ux',
            u."profileDetails"->'serviceDetails'->'web-development',
            '{}'::jsonb
          )
        )
      )
    ELSE '{}'::jsonb
  END,
  true
)
WHERE jsonb_typeof(u."profileDetails") = 'object'
  AND jsonb_typeof(u."profileDetails"->'serviceDetails') = 'object'
  AND (
    (u."profileDetails"->'serviceDetails') ? 'website_ui_ux'
    OR (u."profileDetails"->'serviceDetails') ? 'web-development'
  );
