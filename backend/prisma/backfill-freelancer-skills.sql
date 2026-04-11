-- Backfill freelancer_skills from legacy marketplace/profile/project data.
-- Safe + idempotent: INSERT with ON CONFLICT DO NOTHING.

WITH service_key_map AS (
  SELECT *
  FROM (VALUES
    ('branding', 'Branding'),
    ('branding_kit', 'Branding'),
    ('brand_identity', 'Branding'),

    ('web_development', 'Web Development'),
    ('website_development', 'Web Development'),
    ('website_uiux', 'Web Development'),
    ('website_ui_ux', 'Web Development'),
    ('web_development_service', 'Web Development'),

    ('seo', 'SEO'),
    ('seo_service', 'SEO'),
    ('search_engine_optimization', 'SEO'),

    ('social_media_management', 'Social Media Management'),
    ('social_media_marketing', 'Social Media Management'),

    ('paid_advertising', 'Performance Marketing'),
    ('performance_marketing', 'Performance Marketing'),
    ('paid_ads', 'Performance Marketing'),

    ('app_development', 'App Development'),
    ('software_development', 'Software Development'),
    ('lead_generation', 'Lead Generation'),

    ('video_services', 'Video Services'),
    ('video_service', 'Video Services'),

    ('writing_content', 'Writing & Content'),
    ('writing_and_content', 'Writing & Content'),

    ('customer_support', 'Customer Support'),
    ('customer_support_services', 'Customer Support'),

    ('influencer_marketing', 'Influencer Marketing'),
    ('ugc_marketing', 'UGC Marketing'),
    ('ai_automation', 'AI Automation'),
    ('whatsapp_chatbot', 'WhatsApp Chatbot'),
    ('creative_design', 'Creative & Design'),

    ('3d_modeling', '3D Modeling'),
    ('cgi_videos', 'CGI / VFX'),
    ('cgi_video_services', 'CGI / VFX'),
    ('cgi_vfx', 'CGI / VFX'),

    ('crm_erp', 'CRM & ERP'),
    ('crm_and_erp_solutions', 'CRM & ERP'),

    ('voice_agent', 'Voice AI / AI Calling'),
    ('voice_agent_ai_calling', 'Voice AI / AI Calling'),
    ('voice_ai_ai_calling', 'Voice AI / AI Calling')
  ) AS t(service_key, service_name)
),
marketplace_service_rows AS (
  SELECT DISTINCT
    m."freelancerId" AS user_id,
    lower(coalesce(m."serviceKey", '')) AS service_key,
    coalesce(m."serviceDetails", '{}'::jsonb) AS service_details
  FROM "Marketplace" m
  WHERE trim(coalesce(m."serviceKey", '')) <> ''
),
marketplace_array_tokens AS (
  SELECT
    ms.user_id,
    ms.service_key,
    trim(tok) AS token
  FROM marketplace_service_rows ms
  CROSS JOIN LATERAL (
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'techStack', '[]'::jsonb)) AS tok
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'activeTechnologies', '[]'::jsonb))
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'skillsAndTechnologies', '[]'::jsonb))
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'tools', '[]'::jsonb))
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'platforms', '[]'::jsonb))
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(ms.service_details->'technologies', '[]'::jsonb))
  ) src
),
marketplace_json_tokens AS (
  SELECT
    ms.user_id,
    ms.service_key,
    trim(BOTH '"' FROM node::text) AS token
  FROM marketplace_service_rows ms
  CROSS JOIN LATERAL jsonb_path_query(ms.service_details, '$.**') AS node
  WHERE jsonb_typeof(node) = 'string'
),
profile_skill_tokens AS (
  SELECT
    ms.user_id,
    ms.service_key,
    trim(skill) AS token
  FROM marketplace_service_rows ms
  JOIN "FreelancerProfile" fp ON fp."userId" = ms.user_id
  CROSS JOIN LATERAL unnest(coalesce(fp.skills, ARRAY[]::text[])) AS skill
),
profile_service_detail_tokens AS (
  SELECT
    ms.user_id,
    ms.service_key,
    trim(BOTH '"' FROM node::text) AS token
  FROM marketplace_service_rows ms
  JOIN "FreelancerProfile" fp ON fp."userId" = ms.user_id
  CROSS JOIN LATERAL (
    SELECT jsonb_path_query(coalesce(fp."serviceDetails", '{}'::jsonb), '$.**') AS node
    UNION ALL
    SELECT jsonb_path_query(
      coalesce(
        jsonb_extract_path(coalesce(fp."profileDetails", '{}'::jsonb), 'serviceDetails', ms.service_key),
        '{}'::jsonb
      ),
      '$.**'
    ) AS node
  ) tokens
  WHERE jsonb_typeof(node) = 'string'
),
project_tokens AS (
  SELECT
    ms.user_id,
    ms.service_key,
    trim(token) AS token
  FROM marketplace_service_rows ms
  JOIN "MatchingProjects" mp
    ON mp."freelancerId" = ms.user_id
   AND lower(coalesce(mp."serviceKey", '')) = ms.service_key
  CROSS JOIN LATERAL (
    SELECT unnest(coalesce(mp."activeTechnologies", ARRAY[]::text[])) AS token
    UNION ALL
    SELECT unnest(coalesce(mp."techStack", ARRAY[]::text[]))
    UNION ALL
    SELECT unnest(coalesce(mp."serviceSpecializations", ARRAY[]::text[]))
    UNION ALL
    SELECT unnest(coalesce(mp.tags, ARRAY[]::text[]))
  ) src
),
raw_tokens AS (
  SELECT user_id, service_key, token FROM marketplace_array_tokens
  UNION ALL
  SELECT user_id, service_key, token FROM marketplace_json_tokens
  UNION ALL
  SELECT user_id, service_key, token FROM profile_skill_tokens
  UNION ALL
  SELECT user_id, service_key, token FROM profile_service_detail_tokens
  UNION ALL
  SELECT user_id, service_key, token FROM project_tokens
),
token_candidates AS (
  SELECT
    user_id,
    service_key,
    trim(token) AS token
  FROM raw_tokens

  UNION ALL

  SELECT
    user_id,
    service_key,
    trim(part) AS token
  FROM raw_tokens
  CROSS JOIN LATERAL regexp_split_to_table(
    coalesce(raw_tokens.token, ''),
    '\\s*(?:,|/|\\||;|>|->|:|\\+|\\(|\\))\\s*'
  ) AS part
),
all_tokens AS (
  SELECT DISTINCT
    tc.user_id,
    tc.service_key,
    tc.token,
    regexp_replace(lower(coalesce(tc.token, '')), '[^a-z0-9]+', '', 'g') AS token_norm
  FROM token_candidates tc
  WHERE tc.token IS NOT NULL
    AND trim(tc.token) <> ''
    AND char_length(trim(tc.token)) BETWEEN 2 AND 80
),
tool_norms AS (
  SELECT
    s.id AS service_id,
    sc.id AS sub_category_id,
    t.id AS tool_id,
    regexp_replace(lower(t.name), '[^a-z0-9]+', '', 'g') AS token_norm
  FROM services s
  JOIN sub_categories sc ON sc.service_id = s.id
  JOIN tools t ON t.sub_category_id = sc.id

  UNION

  SELECT
    s.id AS service_id,
    sc.id AS sub_category_id,
    t.id AS tool_id,
    regexp_replace(
      lower(regexp_replace(t.name, '\\s*\\(.*?\\)\\s*', ' ', 'g')),
      '[^a-z0-9]+',
      '',
      'g'
    ) AS token_norm
  FROM services s
  JOIN sub_categories sc ON sc.service_id = s.id
  JOIN tools t ON t.sub_category_id = sc.id

  UNION

  SELECT
    s.id AS service_id,
    sc.id AS sub_category_id,
    t.id AS tool_id,
    regexp_replace(lower(match[1]), '[^a-z0-9]+', '', 'g') AS token_norm
  FROM services s
  JOIN sub_categories sc ON sc.service_id = s.id
  JOIN tools t ON t.sub_category_id = sc.id
  CROSS JOIN LATERAL regexp_matches(t.name, '\\(([^)]*)\\)', 'g') AS match
),
tool_rows AS (
  SELECT DISTINCT
    service_id,
    sub_category_id,
    tool_id,
    token_norm
  FROM tool_norms
  WHERE token_norm IS NOT NULL
    AND token_norm <> ''
),
matched AS (
  SELECT DISTINCT
    at.user_id,
    tr.service_id,
    tr.sub_category_id,
    tr.tool_id
  FROM all_tokens at
  JOIN service_key_map sk ON sk.service_key = at.service_key
  JOIN services s ON s.name = sk.service_name
  JOIN tool_rows tr ON tr.service_id = s.id
  WHERE at.token_norm <> ''
    AND (
      tr.token_norm = at.token_norm
      OR (char_length(at.token_norm) >= 8 AND at.token_norm LIKE '%' || tr.token_norm || '%')
    )
)
INSERT INTO freelancer_skills (user_id, service_id, sub_category_id, tool_id)
SELECT user_id, service_id, sub_category_id, tool_id
FROM matched
ON CONFLICT (user_id, service_id, sub_category_id, tool_id) DO NOTHING;
