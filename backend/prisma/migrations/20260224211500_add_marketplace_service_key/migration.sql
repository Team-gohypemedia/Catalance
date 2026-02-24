ALTER TABLE "Marketplace"
ADD COLUMN "serviceKey" TEXT;

WITH mapped AS (
  SELECT
    m."id",
    COALESCE(
      NULLIF(TRIM(m."serviceDetails"->>'key'), ''),
      CASE regexp_replace(lower(trim(COALESCE(m."service", ''))), '[^a-z0-9]+', '_', 'g')
        WHEN 'web_development' THEN 'website_ui_ux'
        WHEN 'website_ui_ux' THEN 'website_ui_ux'
        WHEN 'seo' THEN 'seo'
        WHEN 'ai_automation' THEN 'ai_automation'
        WHEN 'branding' THEN 'branding'
        WHEN 'video_services' THEN 'video_services'
        WHEN 'app_development' THEN 'app_development'
        WHEN 'lead_generation' THEN 'lead_generation'
        WHEN 'writing_content' THEN 'writing_content'
        WHEN 'performance_marketing_paid_ads' THEN 'paid_advertising'
        WHEN 'paid_advertising' THEN 'paid_advertising'
        WHEN 'software_development' THEN 'software_development'
        WHEN 'social_media_management' THEN 'social_media_marketing'
        WHEN 'social_media_marketing' THEN 'social_media_marketing'
        WHEN 'customer_support_services' THEN 'customer_support'
        WHEN 'influencer_marketing' THEN 'influencer_marketing'
        WHEN 'ugc_marketing' THEN 'ugc_marketing'
        WHEN 'whatsapp_chatbot' THEN 'whatsapp_chatbot'
        WHEN 'creative_design' THEN 'creative_design'
        WHEN '3d_modeling' THEN '3d_modeling'
        WHEN 'cgi_video_services' THEN 'cgi_videos'
        WHEN 'crm_erp_solutions' THEN 'crm_erp'
        WHEN 'voice_agent_ai_calling' THEN 'voice_agent'
        ELSE regexp_replace(lower(trim(COALESCE(m."service", ''))), '[^a-z0-9]+', '_', 'g')
      END,
      'service'
    ) AS mapped_key
  FROM "Marketplace" m
)
UPDATE "Marketplace" m
SET "serviceKey" = mapped.mapped_key
FROM mapped
WHERE mapped."id" = m."id";

UPDATE "Marketplace"
SET "serviceKey" = regexp_replace(lower(trim(COALESCE("service", 'service'))), '[^a-z0-9]+', '_', 'g')
WHERE COALESCE(trim("serviceKey"), '') = '';

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

ALTER TABLE "Marketplace"
ALTER COLUMN "serviceKey" SET NOT NULL,
ALTER COLUMN "serviceKey" SET DEFAULT '';

CREATE INDEX "Marketplace_serviceKey_idx" ON "Marketplace"("serviceKey");
CREATE UNIQUE INDEX "Marketplace_freelancerId_serviceKey_key" ON "Marketplace"("freelancerId", "serviceKey");
