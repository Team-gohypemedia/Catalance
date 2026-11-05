/**
 * Demo seed for the catalogue (spec §6): 5 categories → 26 skills, each with level formats and the client services it
 * will supply later. All skills start as DRAFT except the 3 pilot skills (spec: "launch 2–3 after client-demand validation").
 * Ids are stable: categories `cat_<slug>`, skills `sk_<slug>`. Courses link to skills via `skillId` (see ./learning.js).
 */
import { daysAgo } from "../utils";

const B = "BEGINNER";
const I = "INTERMEDIATE";
const A = "ADVANCED";
const S = "STANDARD";

const PILOT = new Set(["ui-ux-design", "short-form-video-editing", "frontend-development"]);

// [slug, name, description, formats, clientServices, tags]
const CATALOGUE = [
  {
    slug: "design-creative",
    name: "Design & Creative",
    skills: [
      ["canva-graphic-design", "Canva Graphic Design", "Fast, on-brand social and ad creatives in Canva.", [B, I, A], "Social posts, carousels, ad creatives, brand kits", ["Canva", "Social media", "Brand kits"]],
      ["professional-graphic-design", "Professional Graphic Design", "Brand assets and print-ready artwork in professional tools.", [B, I, A], "Brand assets, brochures, ad creatives, print-ready artwork", ["Illustrator", "Photoshop", "Print"]],
      ["ui-ux-design", "UI/UX Design", "Wireframes to tested, responsive screens in Figma.", [B, I, A], "Wireframes, responsive screens, prototypes, design systems", ["Figma", "Prototyping", "User research"]],
      ["short-form-video-editing", "Short-Form Video Editing", "Reels and Shorts that hold attention past the first second.", [B, I, A], "Reels, Shorts, captions, hooks, branded edits, campaign variants", ["Premiere Pro", "CapCut", "Captions"]],
      ["motion-graphics", "Motion Graphics", "Animated text, logos and promos for ads and social.", [B, I, A], "Animated text, logo reveals, ad motion, product promos", ["After Effects", "Animation"]],
      ["presentation-design", "Presentation & Pitch Deck Design", "Clear business and investor decks with strong data slides.", [S, A], "Business decks, data slides, investor presentations", ["PowerPoint", "Google Slides", "Storytelling"]],
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    skills: [
      ["social-media-management", "Social Media Management", "Plan, publish and report on a brand's social channels.", [S, A], "Content calendars, captions, scheduling, reporting, campaign coordination", ["Instagram", "LinkedIn", "Scheduling"]],
      ["seo", "SEO", "Get pages found on Google with research, fixes and reporting.", [B, I, A], "Keyword research, on-page SEO, technical audits, reporting", ["Keyword research", "On-page", "Search Console"]],
      ["google-ads", "Google Ads", "Set up and optimise search campaigns that pay back.", [B, I, A], "Keyword research, campaign setup, optimisation, reporting", ["Search ads", "Google Ads"]],
      ["meta-ads", "Meta Ads", "Run Facebook and Instagram campaigns with real tests.", [B, I, A], "Campaign setup, creative and audience tests, funnel optimisation", ["Facebook", "Instagram", "Ads Manager"]],
      ["content-writing-ugc", "Content Writing & UGC Scripting", "Captions, product copy and reel scripts that sell.", [S, A], "Captions, product descriptions, hooks, reel scripts, campaign messaging", ["Copywriting", "Scripts", "UGC"]],
      ["email-marketing", "Email Marketing", "Newsletters and automated sequences that get opened.", [S, A], "Newsletters, segmentation, automated sequences, lifecycle campaigns", ["Mailchimp", "Automation"]],
      ["local-seo-gbp", "Local SEO & Google Business Profile", "Help local businesses show up on Maps and get reviews.", [S, A], "Profile audits, local keyword research, review workflows, multi-location reporting", ["Google Business Profile", "Maps"]],
    ],
  },
  {
    slug: "website-technology",
    name: "Website & Technology",
    skills: [
      ["wordpress-development", "WordPress Website Development", "Business websites on WordPress, kept fast and safe.", [B, I, A], "Basic pages, responsive business sites, plugins, maintenance, troubleshooting", ["WordPress", "Elementor"]],
      ["shopify-ecommerce", "Shopify & E-commerce Management", "Run and improve Shopify stores day to day.", [B, I, A], "Product uploads, collections, theme changes, catalogue optimisation", ["Shopify", "E-commerce"]],
      ["frontend-development", "Frontend Development", "Responsive sites and components with HTML, CSS, JavaScript and React.", [B, I, A], "HTML/CSS/JS, responsive layouts, components, APIs, testing", ["HTML", "CSS", "JavaScript", "React"]],
      ["website-qa-testing", "Website QA & Testing", "Find and document bugs before clients do.", [S, A], "Browser and mobile checks, test cases, regression, automated test basics", ["Testing", "Bug reports"]],
      ["no-code-websites", "No-Code Website Building", "Launch sites with templates, a CMS and no code.", [B, I, A], "Templates, CMS, responsive pages, integrations and interactions", ["Webflow", "Framer", "Wix"]],
    ],
  },
  {
    slug: "business-support",
    name: "Business Support",
    skills: [
      ["lead-generation", "Lead Generation & Prospect Research", "Find and qualify the right companies and contacts.", [S], "Company research, contact discovery, qualification, CRM updates and data QA", ["Research", "CRM"]],
      ["virtual-assistant", "Virtual Assistant & Online Operations", "Keep inboxes, calendars and operations running.", [S, A], "Email, scheduling, task tracking, CRM, documentation, operations workflows", ["Operations", "Google Workspace"]],
      ["excel-google-sheets", "Excel & Google Sheets", "Formulas, pivots and dashboards that save hours.", [B, I, A], "Formulas, lookups, pivots, dashboards, automated reporting", ["Excel", "Google Sheets"]],
      ["ai-tools-productivity", "AI Tools for Business Productivity", "Use AI tools for research and drafts, with human checks.", [S, A], "Research, drafting, summaries, repeatable workflows and human QA", ["ChatGPT", "Prompting"]],
      ["ecommerce-catalogue", "E-commerce Catalogue Management", "Clean, complete product data across marketplaces.", [S], "Product data, SKUs, variants, bulk updates, catalogue audits", ["Amazon", "Flipkart", "Bulk uploads"]],
      ["basic-data-analytics", "Basic Data Analytics", "Clean data, build charts and report the KPIs that matter.", [B, I, A], "Data cleaning, charts, dashboards, KPI reporting and analysis", ["Excel", "SQL", "Power BI"]],
    ],
  },
  {
    slug: "3d-automation",
    name: "3D & Automation",
    skills: [
      ["3d-cgi-fundamentals", "3D & CGI Fundamentals", "Simple models, materials and product scenes.", [B, I, A], "Simple models, materials, lighting, product scenes, animation and CGI", ["Blender", "Rendering"]],
      ["ai-automation-no-code", "AI Automation & No-Code Workflows", "Connect apps and AI into reliable workflows.", [B, I, A], "Triggers and actions, multi-step workflows, APIs, error handling and monitoring", ["Zapier", "Make", "APIs"]],
    ],
  },
];

const categories = CATALOGUE.map((c, i) => ({
  id: `cat_${c.slug}`,
  slug: c.slug,
  name: c.name,
  order: i,
  status: "PUBLISHED",
  createdAt: daysAgo(120),
  updatedAt: daysAgo(30),
}));

const skills = CATALOGUE.flatMap((c) =>
  c.skills.map(([slug, name, description, formats, clientServices, tags], i) => ({
    id: `sk_${slug}`,
    categoryId: `cat_${c.slug}`,
    slug,
    name,
    description,
    tags,
    formats,
    clientServices,
    status: PILOT.has(slug) ? "PUBLISHED" : "DRAFT",
    order: i,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(30),
  })),
);

export default { categories, skills };
