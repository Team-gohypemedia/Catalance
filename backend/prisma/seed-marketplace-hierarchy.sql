-- Marketplace hierarchy seed (idempotent, non-destructive)

INSERT INTO services (name) VALUES ('Branding') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Logo Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Logo Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Logo Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Photoshop' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Logo Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CorelDRAW' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Logo Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Logo Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Canva' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Brand Identity' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Identity'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Identity'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Photoshop' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Identity'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Identity'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'InDesign' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Brand Guidelines' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Guidelines'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'InDesign' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Guidelines'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Packaging Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Packaging Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Packaging Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Photoshop' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Packaging Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CorelDRAW' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Typography' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Typography'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Adobe Fonts' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Typography'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Fonts' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Color Systems' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Color Systems'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Adobe Color' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Color Systems'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Coolors' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Brand Assets & Mockups' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Assets & Mockups'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Placeit' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Assets & Mockups'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Smartmockups' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Brand Assets & Mockups'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mockup World' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Branding')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Iconography' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Iconography'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Iconography'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Branding' AND sc.name = 'Iconography'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Noun Project' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Web Development') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CMS Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WordPress' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Shopify' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Webflow' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Wix' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Squarespace' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CMS Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WooCommerce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Frontend Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'HTML' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CSS' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'JavaScript' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'TypeScript' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'React' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Next.js' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Vue' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Angular' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Tailwind' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Bootstrap' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Frontend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sass' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Backend Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Backend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Node.js' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Backend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Express.js' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Backend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PHP (Laravel)' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Backend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Python (Django, Flask)' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Backend Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Ruby on Rails' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Full Stack' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Full Stack'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MERN' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Full Stack'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MEAN' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Full Stack'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'LAMP' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'E-commerce Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'E-commerce Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Shopify' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'E-commerce Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Magento' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'E-commerce Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WooCommerce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'E-commerce Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'BigCommerce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Static Sites' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Static Sites'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Gatsby' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Static Sites'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hugo' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Static Sites'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Jekyll' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Database' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MySQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PostgreSQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MongoDB' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Firebase' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Supabase' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'API Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'API Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'REST API' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'API Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GraphQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'API Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Postman' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'API Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Swagger' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Authentication' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Authentication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Firebase Auth' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Authentication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Auth0' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Authentication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'OAuth' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Authentication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'JWT' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Version Control' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Git' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitHub' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitLab' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Bitbucket' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Dev Tools' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Dev Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'VS Code' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Dev Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WebStorm' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Dev Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sublime Text' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Build Tools' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Build Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Webpack' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Build Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Vite' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Build Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Parcel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Package Managers' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Package Managers'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'npm' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Package Managers'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'yarn' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Package Managers'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'pnpm' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Testing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Jest' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Cypress' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Selenium' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Deployment' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Deployment'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Vercel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Deployment'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Netlify' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Deployment'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'AWS' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Deployment'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'DigitalOcean' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Deployment'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'cPanel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CI/CD' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Jenkins' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitHub Actions' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitLab CI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Hosting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Hosting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hostinger' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Hosting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Bluehost' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Hosting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SiteGround' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Web Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Performance Optimization' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Performance Optimization'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GTmetrix' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Web Development' AND sc.name = 'Performance Optimization'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PageSpeed Insights' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('SEO') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Keyword Research' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Keyword Research'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Ahrefs' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Keyword Research'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SEMrush' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Keyword Research'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Ubersuggest' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Keyword Research'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Keyword Planner' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Keyword Research'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Moz' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'On-Page SEO' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'On-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Yoast' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'On-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Rank Math' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'On-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Surfer SEO' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Technical SEO' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Technical SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Screaming Frog' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Technical SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Search Console' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Technical SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PageSpeed Insights' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Technical SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GTmetrix' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Off-Page SEO' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Off-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Ahrefs' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Off-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SEMrush' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Off-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Majestic' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Off-Page SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Pitchbox' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Local SEO' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Local SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Business Profile' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Local SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'BrightLocal' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Local SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Whitespark' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Content SEO' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Content SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Clearscope' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Content SEO'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Frase' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Rank Tracking' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Rank Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SERPWatcher' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Rank Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'AccuRanker' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'SEO')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Analytics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Analytics' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'SEO' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Looker Studio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Social Media Management') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Content Creation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Creation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Canva' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Creation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Photoshop' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Creation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Creation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Adobe Express' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Content Posting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Posting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instagram' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Posting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Facebook' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Posting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'LinkedIn' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Posting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Twitter' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Content Posting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Threads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Short Video Platforms' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Short Video Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'YouTube Shorts' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Short Video Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'TikTok' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Short Video Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instagram Reels' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Scheduling' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Scheduling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Buffer' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Scheduling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hootsuite' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Scheduling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Later' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Scheduling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SocialBee' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Analytics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Meta Business Suite' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sprout Social' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Community Management' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Community Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Agorapulse' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Community Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sprinklr' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Social Media Management')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Social Listening' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Social Listening'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Brand24' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Social Media Management' AND sc.name = 'Social Listening'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mention' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Performance Marketing') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Paid Ads' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Paid Ads'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Ads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Paid Ads'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Meta Ads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Paid Ads'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'LinkedIn Ads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Paid Ads'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'YouTube Ads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Paid Ads'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Microsoft Ads' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Tracking' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Tag Manager' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Meta Pixel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Conversion API' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Analytics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Analytics' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Looker Studio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Landing Pages' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Landing Pages'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Unbounce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Landing Pages'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instapage' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Landing Pages'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Leadpages' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'A/B Testing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'A/B Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'VWO' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'A/B Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Optimizely' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Heatmaps' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Heatmaps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hotjar' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Heatmaps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Microsoft Clarity' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Performance Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Attribution' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Performance Marketing' AND sc.name = 'Attribution'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Triple Whale' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('App Development') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Native Development' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Native Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Kotlin' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Native Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Java' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Native Development'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Swift' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Cross Platform' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Cross Platform'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Flutter' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Cross Platform'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'React Native' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Cross Platform'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Xamarin' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Backend' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Firebase' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Supabase' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Node.js' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Database' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SQLite' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MongoDB' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PostgreSQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Testing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'BrowserStack' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Firebase Test Lab' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'App Distribution' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'App Distribution'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Play Console' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'App Distribution'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'App Store Connect' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Push Notifications' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Push Notifications'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'OneSignal' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Analytics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Firebase Analytics' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mixpanel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CI/CD' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Bitrise' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Codemagic' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'App Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Tools' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Android Studio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'App Development' AND sc.name = 'Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Xcode' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Software Development') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Backend' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Java' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, '.NET' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Python' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Node.js' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PHP' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Backend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Go' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Frontend' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Frontend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'React' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Frontend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Angular' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Frontend'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Vue' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Desktop Apps' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Desktop Apps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Electron' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Desktop Apps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, '.NET WPF' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Database' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PostgreSQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MySQL' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'MongoDB' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Database'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Redis' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'DevOps' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'DevOps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Docker' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'DevOps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Kubernetes' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'DevOps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'AWS' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'DevOps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Azure' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'DevOps'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GCP' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CI/CD' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Jenkins' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitHub Actions' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'CI/CD'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CircleCI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Testing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Selenium' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Cypress' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Jest' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mocha' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Version Control' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Git' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitHub' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Version Control'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GitLab' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Monitoring' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Monitoring'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Datadog' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Monitoring'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'New Relic' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'Monitoring'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Prometheus' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Software Development')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'API Testing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Software Development' AND sc.name = 'API Testing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Postman' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Lead Generation') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CRM' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'HubSpot' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zoho' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Salesforce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Pipedrive' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Freshsales' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Prospecting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Prospecting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Apollo' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Prospecting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hunter' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Prospecting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Snov.io' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Prospecting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Clearbit' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Outreach' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Lemlist' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instantly' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mailshake' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'LinkedIn Outreach' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'LinkedIn Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sales Navigator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Cold Calling' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Cold Calling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Aircall' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Cold Calling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Dialpad' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Email Verification' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Email Verification'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'NeverBounce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Email Verification'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'ZeroBounce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Data Management' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Data Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Sheets' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Data Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Airtable' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Lead Generation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Data Scraping' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Lead Generation' AND sc.name = 'Data Scraping'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Phantombuster' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Video Services') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Video Editing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Video Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Premiere Pro' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Video Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Final Cut Pro' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Video Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'DaVinci Resolve' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Video Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CapCut' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Video Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Filmora' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Motion Graphics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Motion Graphics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'After Effects' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Color Grading' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Color Grading'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'DaVinci Resolve' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Audio Editing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Audio Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Audition' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Audio Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Audacity' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Subtitles' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Subtitles'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'VEED' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Subtitles'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Kapwing' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Stock Footage' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Stock Footage'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Artgrid' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Stock Footage'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Storyblocks' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Stock Footage'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Envato Elements' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Screen Recording' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Screen Recording'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'OBS Studio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Screen Recording'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Camtasia' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Video Services')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Collaboration' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Video Services' AND sc.name = 'Collaboration'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Frame.io' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Writing & Content') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Writing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Docs' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Notion' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Microsoft Word' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'SEO Writing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'SEO Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Surfer SEO' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'SEO Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Ahrefs' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'SEO Writing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SEMrush' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Proofreading' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Proofreading'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Grammarly' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Proofreading'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Hemingway' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Plagiarism' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Plagiarism'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Copyscape' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Plagiarism'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Quetext' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Content Planning' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Content Planning'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Trello' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Content Planning'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Notion' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Content Planning'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'ClickUp' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Email Marketing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Email Marketing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Mailchimp' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Email Marketing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'ConvertKit' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Email Marketing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Klaviyo' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Writing & Content')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Documentation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Writing & Content' AND sc.name = 'Documentation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Confluence' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Customer Support') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Helpdesk' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Helpdesk'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zendesk' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Helpdesk'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Freshdesk' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Helpdesk'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zoho Desk' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Live Chat' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Live Chat'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Intercom' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Live Chat'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'LiveChat' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Live Chat'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Tawk.to' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CRM Support' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'CRM Support'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'HubSpot Service Hub' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'CRM Support'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Salesforce Service Cloud' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Communication' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Communication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Slack' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Communication'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WhatsApp Business' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Knowledge Base' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Knowledge Base'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Document360' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Knowledge Base'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Helpjuice' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Customer Support')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Call Center' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Call Center'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Aircall' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Customer Support' AND sc.name = 'Call Center'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'RingCentral' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Influencer Marketing') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Influencer Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Platforms' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instagram' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'YouTube' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'TikTok' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'LinkedIn' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Influencer Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Discovery' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Discovery'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Modash' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Discovery'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Upfluence' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Discovery'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Aspire' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Discovery'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Heepsy' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Influencer Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Campaign Management' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Campaign Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'GRIN' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Campaign Management'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CreatorIQ' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Influencer Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Outreach' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Gmail' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Outreach'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instantly' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Influencer Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Payments' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Payments'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Razorpay' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Influencer Marketing' AND sc.name = 'Payments'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Stripe' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('UGC Marketing') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'UGC Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Platforms' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'TikTok' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Instagram Reels' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'YouTube Shorts' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'UGC Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Editing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CapCut' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'InShot' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'VN Editor' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'UGC Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Canva' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'UGC Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Publishing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Publishing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Meta Creator Studio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'UGC Marketing')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Creator Sourcing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Creator Sourcing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Billo' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'UGC Marketing' AND sc.name = 'Creator Sourcing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Insense' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('AI Automation') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'AI Automation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Workflow Automation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Workflow Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zapier' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Workflow Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Make' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Workflow Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'n8n' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Workflow Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Pabbly' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'AI Automation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'RPA' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'RPA'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'UiPath' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'AI Automation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Scripting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Scripting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Google Apps Script' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'AI Automation')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Data Handling' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'AI Automation' AND sc.name = 'Data Handling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Airtable' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('WhatsApp Chatbot') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'WhatsApp Chatbot')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'API' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'API'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WhatsApp Business API' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'API'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Twilio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'API'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, '360dialog' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'WhatsApp Chatbot')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Platforms' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WATI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Gupshup' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Platforms'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Interakt' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'WhatsApp Chatbot')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Bot Builder' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Bot Builder'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Dialogflow' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Bot Builder'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Botpress' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'WhatsApp Chatbot')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Automation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Make' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'WhatsApp Chatbot')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Broadcasting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Broadcasting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Interakt' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'WhatsApp Chatbot' AND sc.name = 'Broadcasting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'WATI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Creative & Design') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'UI/UX' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'UI/UX'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'UI/UX'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Adobe XD' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'UI/UX'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Sketch' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Graphic Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Graphic Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Photoshop' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Graphic Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Illustrator' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Graphic Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Canva' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Publishing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Publishing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'InDesign' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Motion Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Motion Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'After Effects' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Prototyping' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Prototyping'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Figma' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Prototyping'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'InVision' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Creative & Design')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Presentation Design' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Presentation Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PowerPoint' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Creative & Design' AND sc.name = 'Presentation Design'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Pitch' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('3D Modeling') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = '3D Modeling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Modeling' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Modeling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Blender' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Modeling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Maya' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Modeling'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, '3ds Max' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = '3D Modeling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Sculpting' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Sculpting'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'ZBrush' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = '3D Modeling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Texturing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Texturing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Substance Painter' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = '3D Modeling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Rendering' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Rendering'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'KeyShot' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Rendering'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'V-Ray' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = '3D Modeling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Real-Time' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Real-Time'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Unreal Engine' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = '3D Modeling' AND sc.name = 'Real-Time'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Unity' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('CGI / VFX') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, '3D Tools' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = '3D Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Blender' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = '3D Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Cinema 4D' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = '3D Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Maya' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = '3D Tools'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Houdini' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Rendering' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Rendering'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Octane' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Rendering'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Redshift' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Rendering'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Arnold' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Compositing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Compositing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Nuke' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Compositing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'After Effects' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Tracking' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'PFTrack' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Simulation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Simulation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Houdini' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CGI / VFX')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Editing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CGI / VFX' AND sc.name = 'Editing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'DaVinci Resolve' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('CRM & ERP') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'CRM & ERP')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'CRM' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Salesforce' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zoho' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'HubSpot' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'CRM'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Pipedrive' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CRM & ERP')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'ERP' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'ERP'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Odoo' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'ERP'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'SAP' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'ERP'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Oracle NetSuite' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CRM & ERP')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Analytics' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Power BI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'Analytics'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Tableau' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CRM & ERP')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Automation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Zapier' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'CRM & ERP')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Sales Automation' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'CRM & ERP' AND sc.name = 'Sales Automation'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Freshsales' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

INSERT INTO services (name) VALUES ('Voice AI / AI Calling') ON CONFLICT (name) DO NOTHING;
WITH svc AS (SELECT id FROM services WHERE name = 'Voice AI / AI Calling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Voice API' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Voice API'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Twilio' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Voice API'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Exotel' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Voice AI / AI Calling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Speech Processing' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Speech Processing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Deepgram' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Speech Processing'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'AssemblyAI' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Voice AI / AI Calling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Calling Systems' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Calling Systems'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Aircall' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Calling Systems'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Dialpad' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Voice AI / AI Calling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'Call Tracking' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'Call Tracking'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'CallRail' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

WITH svc AS (SELECT id FROM services WHERE name = 'Voice AI / AI Calling')
INSERT INTO sub_categories (service_id, name)
SELECT svc.id, 'IVR Systems' FROM svc
ON CONFLICT (service_id, name) DO NOTHING;
WITH sub AS (
  SELECT sc.id
  FROM sub_categories sc
  JOIN services s ON s.id = sc.service_id
  WHERE s.name = 'Voice AI / AI Calling' AND sc.name = 'IVR Systems'
)
INSERT INTO tools (sub_category_id, name)
SELECT sub.id, 'Knowlarity' FROM sub
ON CONFLICT (sub_category_id, name) DO NOTHING;

-- Niche options seed (idempotent)
INSERT INTO "Niches" (name)
VALUES
  ('Organic Farming'),
  ('Dairy Farming'),
  ('Poultry Farming'),
  ('Hydroponics'),
  ('Smartphone Accessories'),
  ('Phone Repair Services'),
  ('Computer Hardware'),
  ('Wearable Tech'),
  ('Fast Food Chains'),
  ('Cloud Kitchens'),
  ('Vegan Food'),
  ('Packaged Snacks'),
  ('Clothing (Men''s/Women''s/Kids)'),
  ('Streetwear'),
  ('Sustainable Fashion'),
  ('Footwear'),
  ('Fitness Training'),
  ('Yoga Studios'),
  ('Supplements & Nutrition'),
  ('Mental Wellness'),
  ('Online Coaching'),
  ('Test Preparation'),
  ('Skill-Based Courses'),
  ('Language Learning'),
  ('Mobile Apps'),
  ('SaaS (Software as a Service)'),
  ('Cybersecurity'),
  ('AI Tools'),
  ('Digital Marketing'),
  ('Social Media Management'),
  ('Influencer Marketing'),
  ('SEO Services'),
  ('Stock Trading'),
  ('Cryptocurrency'),
  ('Personal Finance Consulting'),
  ('Insurance Advisory'),
  ('Residential Real Estate'),
  ('Commercial Real Estate'),
  ('Property Management'),
  ('Short-Term Rentals (Airbnb)'),
  ('Travel Blogging'),
  ('Budget Travel'),
  ('Luxury Travel'),
  ('Adventure Tourism'),
  ('Gaming Content'),
  ('Esports Teams'),
  ('Streaming (YouTube/Twitch)'),
  ('Mobile Gaming'),
  ('Solar Panels'),
  ('EV Charging Stations'),
  ('Recycling'),
  ('Sustainable Products')
ON CONFLICT (name) DO NOTHING;

