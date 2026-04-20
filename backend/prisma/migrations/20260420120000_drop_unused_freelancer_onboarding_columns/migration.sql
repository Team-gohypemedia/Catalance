UPDATE "FreelancerProfile"
SET "profileDetails" = jsonb_strip_nulls(
  COALESCE("profileDetails", '{}'::jsonb) ||
  jsonb_build_object(
    'termsAccepted',
      CASE
        WHEN "termsAccepted" = true
          OR lower(COALESCE("profileDetails"->>'termsAccepted', '')) IN ('true', '1', 'yes', 'y')
          THEN true
        ELSE NULL
      END,
    'globalIndustryOther',
      COALESCE(
        NULLIF(BTRIM("globalIndustryOther"), ''),
        NULLIF(BTRIM(COALESCE("profileDetails"->>'globalIndustryOther', '')), '')
      ),
    'skillLevels',
      CASE
        WHEN "skillLevels" IS NOT NULL AND "skillLevels" <> '{}'::jsonb
          THEN "skillLevels"
        WHEN jsonb_typeof("profileDetails"->'skillLevels') = 'object'
          THEN "profileDetails"->'skillLevels'
        ELSE NULL
      END,
    'education',
      CASE
        WHEN "education" IS NOT NULL AND "education" <> '[]'::jsonb
          THEN "education"
        WHEN jsonb_typeof("profileDetails"->'education') = 'array'
          THEN "profileDetails"->'education'
        ELSE NULL
      END,
    'globalIndustryFocus',
      CASE
        WHEN cardinality("globalIndustryFocus") > 0
          THEN to_jsonb("globalIndustryFocus")
        WHEN jsonb_typeof("profileDetails"->'globalIndustryFocus') = 'array'
          THEN "profileDetails"->'globalIndustryFocus'
        ELSE NULL
      END,
    'identity',
      CASE
        WHEN jsonb_strip_nulls(
          COALESCE("profileDetails"->'identity', '{}'::jsonb) ||
          jsonb_build_object(
            'githubUrl',
              COALESCE(
                NULLIF(BTRIM("githubUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'githubUrl', '')), '')
              ),
            'coverImage',
              COALESCE(
                NULLIF(BTRIM("coverImage"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'coverImage', '')), '')
              ),
            'linkedinUrl',
              COALESCE(
                NULLIF(BTRIM("linkedinUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'linkedinUrl', '')), '')
              ),
            'portfolioUrl',
              COALESCE(
                NULLIF(BTRIM("portfolioUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'portfolioUrl', '')), '')
              ),
            'otherLanguage',
              COALESCE(
                NULLIF(BTRIM("otherLanguage"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'otherLanguage', '')), '')
              ),
            'professionalTitle',
              COALESCE(
                NULLIF(BTRIM("professionalTitle"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'professionalTitle', '')), '')
              )
          )
        ) = '{}'::jsonb
          THEN NULL
        ELSE jsonb_strip_nulls(
          COALESCE("profileDetails"->'identity', '{}'::jsonb) ||
          jsonb_build_object(
            'githubUrl',
              COALESCE(
                NULLIF(BTRIM("githubUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'githubUrl', '')), '')
              ),
            'coverImage',
              COALESCE(
                NULLIF(BTRIM("coverImage"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'coverImage', '')), '')
              ),
            'linkedinUrl',
              COALESCE(
                NULLIF(BTRIM("linkedinUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'linkedinUrl', '')), '')
              ),
            'portfolioUrl',
              COALESCE(
                NULLIF(BTRIM("portfolioUrl"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'portfolioUrl', '')), '')
              ),
            'otherLanguage',
              COALESCE(
                NULLIF(BTRIM("otherLanguage"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'otherLanguage', '')), '')
              ),
            'professionalTitle',
              COALESCE(
                NULLIF(BTRIM("professionalTitle"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'identity'->>'professionalTitle', '')), '')
              )
          )
        )
      END,
    'availability',
      CASE
        WHEN jsonb_strip_nulls(
          COALESCE("profileDetails"->'availability', '{}'::jsonb) ||
          jsonb_build_object(
            'hoursPerWeek',
              COALESCE(
                NULLIF(BTRIM("availabilityHoursPerWeek"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'hoursPerWeek', '')), '')
              ),
            'startTimeline',
              COALESCE(
                NULLIF(BTRIM("availabilityStartTimeline"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'startTimeline', '')), '')
              ),
            'workingSchedule',
              COALESCE(
                NULLIF(BTRIM("availabilityWorkingSchedule"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'workingSchedule', '')), '')
              )
          )
        ) = '{}'::jsonb
          THEN NULL
        ELSE jsonb_strip_nulls(
          COALESCE("profileDetails"->'availability', '{}'::jsonb) ||
          jsonb_build_object(
            'hoursPerWeek',
              COALESCE(
                NULLIF(BTRIM("availabilityHoursPerWeek"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'hoursPerWeek', '')), '')
              ),
            'startTimeline',
              COALESCE(
                NULLIF(BTRIM("availabilityStartTimeline"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'startTimeline', '')), '')
              ),
            'workingSchedule',
              COALESCE(
                NULLIF(BTRIM("availabilityWorkingSchedule"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'availability'->>'workingSchedule', '')), '')
              )
          )
        )
      END,
    'reliability',
      CASE
        WHEN jsonb_strip_nulls(
          COALESCE("profileDetails"->'reliability', '{}'::jsonb) ||
          jsonb_build_object(
            'delayHandling',
              COALESCE(
                NULLIF(BTRIM("reliabilityDelayHandling"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'reliability'->>'delayHandling', '')), '')
              ),
            'missedDeadlines',
              COALESCE(
                NULLIF(BTRIM("reliabilityMissedDeadlines"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'reliability'->>'missedDeadlines', '')), '')
              )
          )
        ) = '{}'::jsonb
          THEN NULL
        ELSE jsonb_strip_nulls(
          COALESCE("profileDetails"->'reliability', '{}'::jsonb) ||
          jsonb_build_object(
            'delayHandling',
              COALESCE(
                NULLIF(BTRIM("reliabilityDelayHandling"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'reliability'->>'delayHandling', '')), '')
              ),
            'missedDeadlines',
              COALESCE(
                NULLIF(BTRIM("reliabilityMissedDeadlines"), ''),
                NULLIF(BTRIM(COALESCE("profileDetails"->'reliability'->>'missedDeadlines', '')), '')
              )
          )
        )
      END
  )
);

ALTER TABLE "FreelancerProfile"
  DROP COLUMN IF EXISTS "termsAccepted",
  DROP COLUMN IF EXISTS "globalIndustryOther",
  DROP COLUMN IF EXISTS "githubUrl",
  DROP COLUMN IF EXISTS "coverImage",
  DROP COLUMN IF EXISTS "linkedinUrl",
  DROP COLUMN IF EXISTS "portfolioUrl",
  DROP COLUMN IF EXISTS "otherLanguage",
  DROP COLUMN IF EXISTS "professionalTitle",
  DROP COLUMN IF EXISTS "skillLevels",
  DROP COLUMN IF EXISTS "education",
  DROP COLUMN IF EXISTS "caseStudyTitle",
  DROP COLUMN IF EXISTS "caseStudyDescription",
  DROP COLUMN IF EXISTS "caseStudyProjectLink",
  DROP COLUMN IF EXISTS "caseStudyProjectFile",
  DROP COLUMN IF EXISTS "caseStudyYourRole",
  DROP COLUMN IF EXISTS "caseStudyTimeline",
  DROP COLUMN IF EXISTS "caseStudyBudget",
  DROP COLUMN IF EXISTS "caseStudyNiche",
  DROP COLUMN IF EXISTS "globalIndustryFocus",
  DROP COLUMN IF EXISTS "availabilityHoursPerWeek",
  DROP COLUMN IF EXISTS "availabilityStartTimeline",
  DROP COLUMN IF EXISTS "availabilityWorkingSchedule",
  DROP COLUMN IF EXISTS "reliabilityDelayHandling",
  DROP COLUMN IF EXISTS "reliabilityMissedDeadlines";
