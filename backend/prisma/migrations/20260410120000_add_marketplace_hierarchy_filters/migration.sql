-- Add hierarchical marketplace filters (safe and additive)

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sub_categories (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    sub_category_id INTEGER NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS freelancer_skills (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    sub_category_id INTEGER NOT NULL,
    tool_id INTEGER NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS services_name_key
  ON services (name);

CREATE UNIQUE INDEX IF NOT EXISTS sub_categories_service_id_name_key
  ON sub_categories (service_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS tools_sub_category_id_name_key
  ON tools (sub_category_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS freelancer_skills_user_id_service_id_sub_category_id_tool_id_key
  ON freelancer_skills (user_id, service_id, sub_category_id, tool_id);

CREATE INDEX IF NOT EXISTS sub_categories_service_id_idx
  ON sub_categories (service_id);

CREATE INDEX IF NOT EXISTS tools_sub_category_id_idx
  ON tools (sub_category_id);

CREATE INDEX IF NOT EXISTS freelancer_skills_user_id_idx
  ON freelancer_skills (user_id);

CREATE INDEX IF NOT EXISTS freelancer_skills_service_id_idx
  ON freelancer_skills (service_id);

CREATE INDEX IF NOT EXISTS freelancer_skills_sub_category_id_idx
  ON freelancer_skills (sub_category_id);

CREATE INDEX IF NOT EXISTS freelancer_skills_tool_id_idx
  ON freelancer_skills (tool_id);

DO $$
BEGIN
  IF to_regclass('public.sub_categories') IS NOT NULL
     AND to_regclass('public.services') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'sub_categories_service_id_fkey'
     ) THEN
    ALTER TABLE sub_categories
      ADD CONSTRAINT sub_categories_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES services(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.tools') IS NOT NULL
     AND to_regclass('public.sub_categories') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'tools_sub_category_id_fkey'
     ) THEN
    ALTER TABLE tools
      ADD CONSTRAINT tools_sub_category_id_fkey
      FOREIGN KEY (sub_category_id)
      REFERENCES sub_categories(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.freelancer_skills') IS NOT NULL
     AND to_regclass('public."User"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'freelancer_skills_user_id_fkey'
     ) THEN
    ALTER TABLE freelancer_skills
      ADD CONSTRAINT freelancer_skills_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES "User"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.freelancer_skills') IS NOT NULL
     AND to_regclass('public.services') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'freelancer_skills_service_id_fkey'
     ) THEN
    ALTER TABLE freelancer_skills
      ADD CONSTRAINT freelancer_skills_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES services(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.freelancer_skills') IS NOT NULL
     AND to_regclass('public.sub_categories') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'freelancer_skills_sub_category_id_fkey'
     ) THEN
    ALTER TABLE freelancer_skills
      ADD CONSTRAINT freelancer_skills_sub_category_id_fkey
      FOREIGN KEY (sub_category_id)
      REFERENCES sub_categories(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.freelancer_skills') IS NOT NULL
     AND to_regclass('public.tools') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'freelancer_skills_tool_id_fkey'
     ) THEN
    ALTER TABLE freelancer_skills
      ADD CONSTRAINT freelancer_skills_tool_id_fkey
      FOREIGN KEY (tool_id)
      REFERENCES tools(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;
