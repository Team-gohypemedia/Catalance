import { prisma } from "../src/lib/prisma.js";
import { createUser, updateUserProfile } from "../src/modules/users/user.service.js";
import { hashPassword } from "../src/modules/users/password.utils.js";
import { normalizeSkills } from "../src/utils/skill-utils.js";
import { fileURLToPath } from "url";
import path from "path";

const DEFAULT_FREELANCER_PASSWORD = "Password123!";
const DEFAULT_COUNTRY = "India";
const DEFAULT_WORK_HOURS = "30_plus";
const DEFAULT_START_TIMELINE = "Within 1 week";
const DEFAULT_WORKING_SCHEDULE = "Mon-Fri with 4+ hours of overlap for client communication.";
const DEFAULT_DELAY_HANDLING =
  "I communicate delays early, propose recovery options, and rebalance scope when needed.";
const DEFAULT_MISSED_DEADLINES =
  "I use weekly checkpoints and written delivery plans to avoid missed deadlines.";

const SERVICE_COVER_IMAGE_BY_KEY = Object.freeze({
  branding: "/assets/services/branding-cover.jpg",
  web_development: "/assets/services/web-development-cover.jpg",
  seo: "/assets/services/seo-cover.jpg",
  social_media_marketing: "/assets/services/social-media-cover.jpg",
  paid_advertising: "/assets/services/paid-ads-cover.jpg",
  app_development: "/assets/services/app-development-cover.jpg",
  software_development: "/assets/services/software-development-cover.jpg",
  lead_generation: "/assets/services/lead-generation-cover.jpg",
  video_services: "/assets/services/video-services-cover.jpg",
  writing_content: "/assets/services/writing-content-cover.jpg",
  customer_support: "/assets/services/customer-support-cover.jpg",
  influencer_marketing: "/assets/services/influencer-marketing-cover.jpg",
  ugc_marketing: "/assets/services/ugc-marketing-cover.jpg",
  ai_automation: "/assets/services/ai-automation-cover.jpg",
  whatsapp_chatbot: "/assets/services/whatsapp-chatbot-cover.jpg",
  creative_design: "/assets/services/creative-design-cover.jpg",
  "3d_modeling": "/assets/services/3d-modeling-cover.jpg",
  cgi_videos: "/assets/services/cgi-videos-cover.jpg",
  crm_erp: "/assets/services/crm-erp-cover.jpg",
  voice_agent: "/assets/services/voice-agent-cover.jpg"
});

const STRICT_PROFILE_SKILLS_BY_KEY = Object.freeze({
  branding: [
    "Figma",
    "Adobe Illustrator",
    "Adobe Photoshop",
    "UI Design",
    "UX Research"
  ],
  web_development: ["Next.js", "React", "Node.js", "PostgreSQL", "Tailwind CSS"],
  seo: [
    "SEO",
    "GA4",
    "Analytics",
    "Ahrefs",
    "Google Search Console"
  ],
  social_media_marketing: [
    "Figma",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "GA4",
    "Analytics"
  ],
  paid_advertising: [
    "Google Ads",
    "GA4",
    "Analytics",
    "HubSpot",
    "Figma"
  ],
  app_development: [
    "React Native",
    "TypeScript",
    "Node.js",
    "REST APIs",
    "Figma"
  ],
  software_development: [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Microservices",
    "System Design"
  ],
  lead_generation: [
    "HubSpot",
    "CRM",
    "Zapier",
    "Analytics",
    "API Integrations"
  ],
  video_services: [
    "Adobe Premiere Pro",
    "Adobe After Effects",
    "Adobe Photoshop",
    "Illustrator",
    "Figma"
  ],
  writing_content: ["SEO", "Analytics", "GA4", "Figma", "HubSpot"],
  customer_support: ["CRM", "HubSpot", "Zapier", "Analytics", "API Workflows"],
  influencer_marketing: [
    "Analytics",
    "GA4",
    "Figma",
    "Adobe Photoshop",
    "CRM"
  ],
  ugc_marketing: [
    "Analytics",
    "GA4",
    "Figma",
    "Adobe Premiere Pro",
    "Adobe Photoshop"
  ],
  ai_automation: ["AI Automation", "Zapier", "n8n", "Python", "API Integrations"],
  whatsapp_chatbot: ["WhatsApp API", "CRM", "Zapier", "n8n", "API Integrations"],
  creative_design: [
    "Figma",
    "Adobe Illustrator",
    "Adobe Photoshop",
    "UI Design",
    "UX Design"
  ],
  "3d_modeling": [
    "Adobe Photoshop",
    "Illustrator",
    "Figma",
    "UI Design",
    "UX Design"
  ],
  cgi_videos: [
    "Adobe After Effects",
    "Adobe Photoshop",
    "Illustrator",
    "Figma",
    "UI Design"
  ],
  crm_erp: ["CRM", "ERP", "HubSpot", "Zapier", "API Integrations"],
  voice_agent: ["AI Voice", "CRM", "Zapier", "n8n", "API Integrations"]
});

const STRICT_SKILL_FILLERS = Object.freeze([
  "Figma",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Analytics",
  "GA4",
  "HubSpot",
  "Zapier",
  "CRM",
  "API Integrations",
  "Python",
  "Node.js"
]);

const SHOWCASE_FREELANCER_SERVICE_SEEDS = Object.freeze([
  {
    key: "branding",
    fullName: "Aarav Mehta",
    city: "Mumbai",
    headline: "Brand Identity Strategist",
    companyName: "North Frame Studio",
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 34,
    skills: [
      "Brand Strategy",
      "Logo Design",
      "Visual Identity",
      "Packaging Design",
      "Brand Guidelines"
    ],
    industries: ["D2C Brands", "Wellness"],
    school: "National Institute of Design",
    degree: "B.Des",
    field: "Communication Design",
    employer: "North Frame Studio",
    projectName: "Astera Naturals Rebrand",
    projectSummary:
      "Reframed a fast-growing wellness label with a premium identity system, packaging direction, and launch toolkit.",
    serviceDescription:
      "I build complete brand systems for founders who need clearer positioning, stronger recall, and launch-ready visual assets.",
    seedBudget: 180000,
    deliveryTime: "4-6 weeks",
    projectComplexity: "Mid-market brand refresh"
  },
  {
    key: "web_development",
    fullName: "Ishita Kapoor",
    city: "Bengaluru",
    headline: "Full-Stack Web Developer",
    companyName: "Blue Circuit Labs",
    experienceYears: 7,
    rating: 4.8,
    reviewCount: 41,
    skills: ["Next.js", "React", "Node.js", "PostgreSQL", "Tailwind CSS"],
    industries: ["SaaS", "Fintech"],
    school: "PES University",
    degree: "B.Tech",
    field: "Computer Science",
    employer: "Blue Circuit Labs",
    projectName: "OrbitOps SaaS Platform",
    projectSummary:
      "Built a multi-page SaaS marketing site and authenticated dashboard experience with strong Core Web Vitals.",
    serviceDescription:
      "I design and ship fast, conversion-focused websites and product surfaces with clean frontend architecture and scalable backend APIs.",
    seedBudget: 240000,
    deliveryTime: "5-7 weeks",
    projectComplexity: "Custom product build"
  },
  {
    key: "seo",
    fullName: "Vivaan Nair",
    city: "Kochi",
    headline: "SEO Growth Consultant",
    companyName: "Search Harbor",
    experienceYears: 5,
    rating: 4.9,
    reviewCount: 29,
    skills: [
      "Technical SEO",
      "Content Strategy",
      "Keyword Research",
      "Google Search Console",
      "On-Page SEO"
    ],
    industries: ["B2B SaaS", "Ecommerce"],
    school: "MICA",
    degree: "PGDM",
    field: "Marketing",
    employer: "Search Harbor",
    projectName: "RankLift Organic Growth Sprint",
    projectSummary:
      "Lifted non-brand traffic and lead quality for a SaaS company through technical fixes, content briefs, and measurement cleanup.",
    serviceDescription:
      "I improve organic visibility with technical SEO, search intent mapping, and editorial systems that convert traffic into pipeline.",
    seedBudget: 120000,
    deliveryTime: "8 weeks",
    projectComplexity: "Growth retainers"
  },
  {
    key: "social_media_marketing",
    fullName: "Ananya Rao",
    city: "Hyderabad",
    headline: "Social Media Strategist",
    companyName: "Signal Story Co",
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 37,
    skills: [
      "Content Planning",
      "Instagram Growth",
      "LinkedIn Strategy",
      "Community Management",
      "Analytics Reporting"
    ],
    industries: ["Consumer Tech", "Hospitality"],
    school: "St. Francis College",
    degree: "BA",
    field: "Mass Communication",
    employer: "Signal Story Co",
    projectName: "Luma Stay Social Launch",
    projectSummary:
      "Launched a hospitality social calendar with content pillars, reels concepts, and a reporting cadence tied to bookings.",
    serviceDescription:
      "I create social systems that keep brands consistent, relevant, and measurable across content, community, and reporting.",
    seedBudget: 95000,
    deliveryTime: "Monthly retainer",
    projectComplexity: "Content and growth operations"
  },
  {
    key: "paid_advertising",
    fullName: "Rohan Bhatia",
    city: "Delhi",
    headline: "Performance Marketing Specialist",
    companyName: "Scale Orbit Media",
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 43,
    skills: [
      "Meta Ads",
      "Google Ads",
      "Landing Page Testing",
      "Attribution",
      "Retargeting"
    ],
    industries: ["D2C", "Education"],
    school: "Delhi University",
    degree: "B.Com",
    field: "Marketing Analytics",
    employer: "Scale Orbit Media",
    projectName: "EduPeak Paid Funnel",
    projectSummary:
      "Built paid acquisition campaigns with segmented creatives, landing-page testing, and weekly budget reallocation.",
    serviceDescription:
      "I run paid media systems focused on CAC efficiency, stronger funnel conversion, and creative testing discipline.",
    seedBudget: 150000,
    deliveryTime: "4 weeks to launch",
    projectComplexity: "Multi-channel acquisition"
  },
  {
    key: "app_development",
    fullName: "Priya Sethi",
    city: "Pune",
    headline: "Mobile App Product Engineer",
    companyName: "Launchpad Mobile",
    experienceYears: 7,
    rating: 4.8,
    reviewCount: 31,
    skills: ["Flutter", "React Native", "Firebase", "REST APIs", "UI Engineering"],
    industries: ["Healthtech", "Consumer Apps"],
    school: "MIT Pune",
    degree: "B.Tech",
    field: "Information Technology",
    employer: "Launchpad Mobile",
    projectName: "PulseMate Member App",
    projectSummary:
      "Delivered a mobile member app with onboarding, notifications, subscriptions, and analytics-ready event tracking.",
    serviceDescription:
      "I build polished mobile products for startups that need reliable releases, intuitive UX, and backend-friendly architecture.",
    seedBudget: 280000,
    deliveryTime: "6-8 weeks",
    projectComplexity: "Cross-platform mobile product"
  },
  {
    key: "software_development",
    fullName: "Arjun Malhotra",
    city: "Noida",
    headline: "Custom Software Architect",
    companyName: "Forge Stack Systems",
    experienceYears: 9,
    rating: 4.9,
    reviewCount: 39,
    skills: ["Python", "FastAPI", "Microservices", "PostgreSQL", "System Design"],
    industries: ["Logistics", "Enterprise SaaS"],
    school: "IIIT Delhi",
    degree: "B.Tech",
    field: "Computer Science",
    employer: "Forge Stack Systems",
    projectName: "RouteSync Ops Suite",
    projectSummary:
      "Architected a custom operations platform for internal teams with role-based access, reporting, and workflow automation.",
    serviceDescription:
      "I design custom software systems for operational efficiency, integrations, and long-term maintainability.",
    seedBudget: 420000,
    deliveryTime: "8-10 weeks",
    projectComplexity: "Enterprise workflow platform"
  },
  {
    key: "lead_generation",
    fullName: "Neha Verma",
    city: "Gurugram",
    headline: "B2B Lead Generation Consultant",
    companyName: "Pipeline Mint",
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 28,
    skills: [
      "Outbound Prospecting",
      "Apollo",
      "Cold Email",
      "CRM Hygiene",
      "List Building"
    ],
    industries: ["Agencies", "B2B SaaS"],
    school: "Christ University",
    degree: "BBA",
    field: "Business Analytics",
    employer: "Pipeline Mint",
    projectName: "RevPilot SDR Engine",
    projectSummary:
      "Set up list building, outbound messaging, and qualification workflows that improved booked meetings for a B2B SaaS team.",
    serviceDescription:
      "I build outbound lead-generation systems that combine sharper targeting, tighter CRM hygiene, and measurable pipeline creation.",
    seedBudget: 110000,
    deliveryTime: "3-4 weeks",
    projectComplexity: "Outbound pipeline setup"
  },
  {
    key: "video_services",
    fullName: "Kabir Shah",
    city: "Ahmedabad",
    headline: "Video Editor and Producer",
    companyName: "Motion Harbor",
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 36,
    skills: [
      "Video Editing",
      "Motion Graphics",
      "Storyboarding",
      "Color Grading",
      "Sound Design"
    ],
    industries: ["Creators", "D2C"],
    school: "CEPT University",
    degree: "Bachelor of Design",
    field: "Visual Communication",
    employer: "Motion Harbor",
    projectName: "NovaWear Product Film Series",
    projectSummary:
      "Produced a campaign-ready set of product films and short-form edits for paid social and ecommerce launches.",
    serviceDescription:
      "I create video systems for brands that need sharper storytelling, platform-ready edits, and faster post-production loops.",
    seedBudget: 140000,
    deliveryTime: "2-3 weeks",
    projectComplexity: "Campaign video package"
  },
  {
    key: "writing_content",
    fullName: "Meera Iyer",
    city: "Chennai",
    headline: "Content Strategist and Copywriter",
    companyName: "Narrative Grid",
    experienceYears: 6,
    rating: 4.8,
    reviewCount: 33,
    skills: [
      "Website Copy",
      "Content Strategy",
      "SEO Writing",
      "Thought Leadership",
      "Editorial Planning"
    ],
    industries: ["SaaS", "Consulting"],
    school: "Madras Christian College",
    degree: "BA",
    field: "English Literature",
    employer: "Narrative Grid",
    projectName: "ClearOps Content Engine",
    projectSummary:
      "Created website messaging, category pages, and blog briefs that aligned organic growth with sales narratives.",
    serviceDescription:
      "I help teams turn complex offers into clear messaging, scalable content operations, and conversion-friendly copy.",
    seedBudget: 90000,
    deliveryTime: "3 weeks",
    projectComplexity: "Positioning-led content system"
  },
  {
    key: "customer_support",
    fullName: "Aditya Kulkarni",
    city: "Indore",
    headline: "Customer Support Operations Lead",
    companyName: "Careline Ops",
    experienceYears: 7,
    rating: 4.9,
    reviewCount: 27,
    skills: [
      "Helpdesk Setup",
      "SLA Design",
      "Quality Assurance",
      "Knowledge Base",
      "Support Metrics"
    ],
    industries: ["SaaS", "Edtech"],
    school: "Symbiosis Institute of Management",
    degree: "MBA",
    field: "Operations",
    employer: "Careline Ops",
    projectName: "SupportScale Revamp",
    projectSummary:
      "Rebuilt support operations with macros, knowledge base structure, staffing flows, and QA scorecards.",
    serviceDescription:
      "I set up customer support operations that reduce response time, improve CSAT, and make quality measurable.",
    seedBudget: 100000,
    deliveryTime: "4 weeks",
    projectComplexity: "Support process redesign"
  },
  {
    key: "influencer_marketing",
    fullName: "Sana Khan",
    city: "Lucknow",
    headline: "Influencer Campaign Manager",
    companyName: "Creator Orbit",
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 30,
    skills: [
      "Creator Outreach",
      "Campaign Planning",
      "Usage Rights",
      "Negotiation",
      "Performance Reporting"
    ],
    industries: ["Beauty", "Lifestyle"],
    school: "Amity University",
    degree: "BA",
    field: "Journalism and Mass Communication",
    employer: "Creator Orbit",
    projectName: "GlowBar Creator Launch",
    projectSummary:
      "Managed influencer sourcing, briefs, content approvals, and reporting for a nationwide product launch.",
    serviceDescription:
      "I run influencer programs that balance creator fit, campaign execution, and measurable performance outcomes.",
    seedBudget: 130000,
    deliveryTime: "3-5 weeks",
    projectComplexity: "Multi-creator launch campaign"
  },
  {
    key: "ugc_marketing",
    fullName: "Dev Patel",
    city: "Surat",
    headline: "UGC Campaign Producer",
    companyName: "Proof Loop Studio",
    experienceYears: 4,
    rating: 4.8,
    reviewCount: 26,
    skills: [
      "UGC Scripting",
      "Creator Briefing",
      "Ad Creative",
      "Content QA",
      "Performance Iteration"
    ],
    industries: ["Consumer Apps", "D2C"],
    school: "Nirma University",
    degree: "BBA",
    field: "Marketing",
    employer: "Proof Loop Studio",
    projectName: "ShopNest UGC Ad Library",
    projectSummary:
      "Produced a reusable UGC ad library with hooks, creator briefs, and performance-led iteration notes.",
    serviceDescription:
      "I help brands turn creator content into repeatable UGC systems for paid social and ecommerce growth.",
    seedBudget: 85000,
    deliveryTime: "2-4 weeks",
    projectComplexity: "UGC production system"
  },
  {
    key: "ai_automation",
    fullName: "Naina Joshi",
    city: "Jaipur",
    headline: "AI Automation Consultant",
    companyName: "FlowKernel AI",
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 35,
    skills: [
      "Workflow Automation",
      "LLM Integrations",
      "Zapier",
      "n8n",
      "Prompt Design"
    ],
    industries: ["Operations", "Services"],
    school: "BITS Pilani",
    degree: "B.E.",
    field: "Electrical and Electronics",
    employer: "FlowKernel AI",
    projectName: "OpsPilot Automation Stack",
    projectSummary:
      "Automated lead routing, internal reporting, and support summaries using AI-assisted workflows and integrations.",
    serviceDescription:
      "I automate repetitive business workflows using AI, orchestration tools, and clean operational handoffs.",
    seedBudget: 210000,
    deliveryTime: "4-6 weeks",
    projectComplexity: "AI operations automation"
  },
  {
    key: "whatsapp_chatbot",
    fullName: "Yash Arora",
    city: "Chandigarh",
    headline: "WhatsApp Automation Specialist",
    companyName: "Chatlane Systems",
    experienceYears: 5,
    rating: 4.8,
    reviewCount: 24,
    skills: [
      "WhatsApp API",
      "Chatbot Flows",
      "CRM Integration",
      "Lead Qualification",
      "Automation Logic"
    ],
    industries: ["Real Estate", "Education"],
    school: "Panjab University",
    degree: "B.Tech",
    field: "Computer Engineering",
    employer: "Chatlane Systems",
    projectName: "LeadBridge WhatsApp Bot",
    projectSummary:
      "Built a WhatsApp assistant for inquiries, routing, reminders, and CRM updates across inbound campaigns.",
    serviceDescription:
      "I build WhatsApp automation flows that qualify leads, reduce manual follow-up, and improve response speed.",
    seedBudget: 125000,
    deliveryTime: "3-4 weeks",
    projectComplexity: "Conversational automation setup"
  },
  {
    key: "creative_design",
    fullName: "Ritika Menon",
    city: "Bengaluru",
    headline: "Creative Designer for Growth Teams",
    companyName: "Studio Atlas",
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 38,
    skills: [
      "Campaign Design",
      "Social Creatives",
      "Pitch Decks",
      "Figma",
      "Design Systems"
    ],
    industries: ["Startups", "Consumer Brands"],
    school: "Srishti Institute of Art",
    degree: "B.Des",
    field: "Visual Design",
    employer: "Studio Atlas",
    projectName: "LaunchGrid Creative System",
    projectSummary:
      "Created a modular campaign design system covering social creatives, landing sections, and sales enablement assets.",
    serviceDescription:
      "I support growth teams with high-velocity design systems that keep campaigns sharp, consistent, and conversion-aware.",
    seedBudget: 115000,
    deliveryTime: "2-3 weeks",
    projectComplexity: "Creative system build"
  },
  {
    key: "3d_modeling",
    fullName: "Kunal Desai",
    city: "Vadodara",
    headline: "3D Product Visualization Artist",
    companyName: "Voxel Craft Lab",
    experienceYears: 7,
    rating: 4.8,
    reviewCount: 22,
    skills: [
      "Blender",
      "3D Modeling",
      "Texturing",
      "Lighting",
      "Product Visualization"
    ],
    industries: ["Furniture", "Consumer Electronics"],
    school: "MS University of Baroda",
    degree: "Bachelor of Fine Arts",
    field: "Applied Arts",
    employer: "Voxel Craft Lab",
    projectName: "Forma Home 3D Catalog",
    projectSummary:
      "Modeled a catalog-ready 3D asset library for ecommerce listings, campaign renders, and launch visuals.",
    serviceDescription:
      "I create production-ready 3D assets for product launches, ecommerce catalogs, and brand visualization pipelines.",
    seedBudget: 175000,
    deliveryTime: "3-5 weeks",
    projectComplexity: "High-detail product visualization"
  },
  {
    key: "cgi_videos",
    fullName: "Tara Bansal",
    city: "Delhi",
    headline: "CGI Motion Director",
    companyName: "Frame Reactor",
    experienceYears: 7,
    rating: 4.9,
    reviewCount: 25,
    skills: [
      "CGI Animation",
      "Cinema 4D",
      "Motion Direction",
      "Compositing",
      "Rendering"
    ],
    industries: ["Luxury", "Beauty"],
    school: "Pearl Academy",
    degree: "BA",
    field: "Animation and VFX",
    employer: "Frame Reactor",
    projectName: "LuxeSkin CGI Launch Film",
    projectSummary:
      "Directed a CGI-first launch film with premium motion language, product reveals, and platform cutdowns.",
    serviceDescription:
      "I develop CGI-led brand films that elevate product storytelling with premium motion, lighting, and detail.",
    seedBudget: 260000,
    deliveryTime: "4-6 weeks",
    projectComplexity: "Premium CGI production"
  },
  {
    key: "crm_erp",
    fullName: "Manav Chawla",
    city: "Noida",
    headline: "CRM and ERP Implementation Consultant",
    companyName: "Ops Ledger Labs",
    experienceYears: 8,
    rating: 4.8,
    reviewCount: 21,
    skills: [
      "HubSpot",
      "Zoho",
      "ERP Workflows",
      "Data Migration",
      "Process Automation"
    ],
    industries: ["Manufacturing", "Professional Services"],
    school: "Amity University",
    degree: "MBA",
    field: "Operations Management",
    employer: "Ops Ledger Labs",
    projectName: "Mira Systems CRM Rollout",
    projectSummary:
      "Rolled out CRM and ERP workflows across sales, operations, and reporting with documented automations.",
    serviceDescription:
      "I implement CRM and ERP systems that improve visibility, data quality, and process accountability across teams.",
    seedBudget: 320000,
    deliveryTime: "6-8 weeks",
    projectComplexity: "Cross-functional system rollout"
  },
  {
    key: "voice_agent",
    fullName: "Aisha Siddiqui",
    city: "Hyderabad",
    headline: "AI Voice Agent Engineer",
    companyName: "Callflow Intelligence",
    experienceYears: 5,
    rating: 4.9,
    reviewCount: 23,
    skills: [
      "Voice AI",
      "Conversation Design",
      "Twilio",
      "Speech-to-Text",
      "Intent Routing"
    ],
    industries: ["Clinics", "Local Services"],
    school: "Osmania University",
    degree: "B.Tech",
    field: "Electronics and Communication",
    employer: "Callflow Intelligence",
    projectName: "ClinicConnect Voice Receptionist",
    projectSummary:
      "Built a voice agent for appointment booking, reminder flows, and high-intent call routing for clinics.",
    serviceDescription:
      "I deploy AI voice systems that qualify calls, automate routine conversations, and connect customers to the right next step.",
    seedBudget: 225000,
    deliveryTime: "4-5 weeks",
    projectComplexity: "Voice automation deployment"
  }
]);

const WEB_DEVELOPMENT_SEED_SKILLS = Object.freeze([
  "Next.js",
  "React",
  "Node.js",
  "PostgreSQL",
  "Tailwind CSS"
]);

const WEB_DEVELOPMENT_FREELANCER_SEEDS = Object.freeze(
  [
    {
      fullName: "Reyansh Malhotra",
      city: "Pune",
      headline: "Next.js SaaS Engineer",
      companyName: "Launchframe Digital",
      experienceYears: 6,
      rating: 4.9,
      reviewCount: 48,
      industries: ["SaaS", "B2B Platforms"],
      school: "Vishwakarma Institute of Technology",
      degree: "B.Tech",
      field: "Information Technology",
      employer: "Launchframe Digital",
      projectName: "SignalDesk Customer Portal",
      projectSummary:
        "Built a high-performing marketing site and authenticated customer portal for a SaaS team rolling out new onboarding flows.",
      serviceDescription:
        "I build fast, scalable web experiences for SaaS teams that need polished UX, dependable integrations, and clean implementation.",
      seedBudget: 255000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "SaaS website plus dashboard"
    },
    {
      fullName: "Kiara Fernandes",
      city: "Panaji",
      headline: "React Commerce Developer",
      companyName: "Tidepixel Studio",
      experienceYears: 5,
      rating: 4.8,
      reviewCount: 33,
      industries: ["D2C Brands", "Lifestyle Ecommerce"],
      school: "Goa University",
      degree: "BCA",
      field: "Computer Applications",
      employer: "Tidepixel Studio",
      projectName: "Mysa Home Storefront",
      projectSummary:
        "Delivered a conversion-focused storefront with reusable product modules, checkout improvements, and CMS-driven campaigns.",
      serviceDescription:
        "I help ecommerce brands move faster with responsive storefronts, reusable sections, and better conversion-ready frontend systems.",
      seedBudget: 185000,
      deliveryTime: "3-5 weeks",
      projectComplexity: "Custom ecommerce build"
    },
    {
      fullName: "Dev Patel",
      city: "Ahmedabad",
      headline: "Full-Stack Product Engineer",
      companyName: "Sprintbay Labs",
      experienceYears: 7,
      rating: 4.9,
      reviewCount: 44,
      industries: ["Fintech", "Internal Tools"],
      school: "Nirma University",
      degree: "B.Tech",
      field: "Computer Engineering",
      employer: "Sprintbay Labs",
      projectName: "LedgerLite Ops Console",
      projectSummary:
        "Shipped an internal operations console with role-based access, reporting views, and API integrations for a finance team.",
      serviceDescription:
        "I build full-stack web apps for teams that need secure workflows, thoughtful frontend architecture, and reliable backend delivery.",
      seedBudget: 275000,
      deliveryTime: "5-7 weeks",
      projectComplexity: "Internal web platform"
    },
    {
      fullName: "Meher Oberoi",
      city: "Delhi",
      headline: "Frontend Performance Specialist",
      companyName: "Pixel Current",
      experienceYears: 6,
      rating: 4.8,
      reviewCount: 39,
      industries: ["SaaS", "Creator Economy"],
      school: "Netaji Subhas University of Technology",
      degree: "B.E.",
      field: "Information Technology",
      employer: "Pixel Current",
      projectName: "CreatorPilot Marketing Hub",
      projectSummary:
        "Rebuilt a content-heavy growth site with improved Core Web Vitals, structured CMS authoring, and cleaner conversion paths.",
      serviceDescription:
        "I turn slow, cluttered websites into fast product marketing surfaces that feel sharper, lighter, and easier to maintain.",
      seedBudget: 210000,
      deliveryTime: "4-5 weeks",
      projectComplexity: "Performance-focused website rebuild"
    },
    {
      fullName: "Pranav Kulkarni",
      city: "Mumbai",
      headline: "Jamstack Web Developer",
      companyName: "Northloop Works",
      experienceYears: 8,
      rating: 4.9,
      reviewCount: 52,
      industries: ["Media", "B2B Services"],
      school: "D J Sanghvi College of Engineering",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Northloop Works",
      projectName: "Briefcase Studio Website Rebuild",
      projectSummary:
        "Migrated a services brand to a modular Jamstack setup with reusable landing pages, lead capture, and editorial flexibility.",
      serviceDescription:
        "I build editorially flexible marketing websites for teams that need speed, maintainability, and conversion-ready sections.",
      seedBudget: 235000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "Multi-page content platform"
    },
    {
      fullName: "Sana Sheikh",
      city: "Hyderabad",
      headline: "React and Node.js Developer",
      companyName: "Buildmint Tech",
      experienceYears: 5,
      rating: 4.8,
      reviewCount: 31,
      industries: ["Edtech", "Services"],
      school: "Jawaharlal Nehru Technological University",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Buildmint Tech",
      projectName: "TutorFlow Booking Platform",
      projectSummary:
        "Built a lead capture and session booking platform with reminders, account areas, and admin workflows for an education business.",
      serviceDescription:
        "I build web apps for service businesses that need clear booking flows, smooth admin tooling, and stable backend logic.",
      seedBudget: 195000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "Service booking application"
    },
    {
      fullName: "Arjun Bhatia",
      city: "Chandigarh",
      headline: "Web App Engineer",
      companyName: "HexaDock Systems",
      experienceYears: 6,
      rating: 4.9,
      reviewCount: 36,
      industries: ["Logistics", "Operations"],
      school: "Punjab Engineering College",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "HexaDock Systems",
      projectName: "DispatchHQ Tracking Dashboard",
      projectSummary:
        "Created a logistics dashboard with live shipment states, team permissions, and workflow shortcuts for faster operations.",
      serviceDescription:
        "I build data-rich web dashboards that keep operations teams aligned, reduce manual steps, and stay easy to extend.",
      seedBudget: 265000,
      deliveryTime: "5-7 weeks",
      projectComplexity: "Operations dashboard"
    },
    {
      fullName: "Diya Iyer",
      city: "Chennai",
      headline: "Next.js UX Engineer",
      companyName: "Velvetbyte Labs",
      experienceYears: 7,
      rating: 4.9,
      reviewCount: 42,
      industries: ["Healthtech", "B2B SaaS"],
      school: "Anna University",
      degree: "B.E.",
      field: "Computer Science",
      employer: "Velvetbyte Labs",
      projectName: "CareRoute Client Workspace",
      projectSummary:
        "Designed and built a client workspace with onboarding steps, reporting views, and strong accessibility for healthcare teams.",
      serviceDescription:
        "I build polished web products that balance usability, accessibility, and maintainable frontend systems for growing teams.",
      seedBudget: 285000,
      deliveryTime: "5-6 weeks",
      projectComplexity: "Client workspace application"
    },
    {
      fullName: "Lakshya Soni",
      city: "Jaipur",
      headline: "MERN Stack Developer",
      companyName: "Rapid Lantern",
      experienceYears: 4,
      rating: 4.7,
      reviewCount: 27,
      industries: ["Local Services", "Marketplaces"],
      school: "Malaviya National Institute of Technology",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Rapid Lantern",
      projectName: "Fixly Marketplace Platform",
      projectSummary:
        "Launched a service marketplace with customer request flows, vendor dashboards, and streamlined booking management.",
      serviceDescription:
        "I help early-stage products launch web marketplaces with practical workflows, clean UI patterns, and scalable foundations.",
      seedBudget: 175000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "Marketplace MVP"
    },
    {
      fullName: "Neha Krishnan",
      city: "Kochi",
      headline: "Frontend Systems Developer",
      companyName: "Harbor Nine",
      experienceYears: 6,
      rating: 4.8,
      reviewCount: 34,
      industries: ["Martech", "B2B SaaS"],
      school: "Cochin University of Science and Technology",
      degree: "B.Tech",
      field: "Information Technology",
      employer: "Harbor Nine",
      projectName: "GrowthLoop Website Migration",
      projectSummary:
        "Migrated a large marketing website to a component-driven stack with reusable content blocks and stronger editor workflows.",
      serviceDescription:
        "I build maintainable frontend systems that let growth teams ship pages faster without sacrificing quality or consistency.",
      seedBudget: 220000,
      deliveryTime: "4-5 weeks",
      projectComplexity: "Component-based website migration"
    },
    {
      fullName: "Aditya Ghosh",
      city: "Kolkata",
      headline: "Full-Stack Dashboard Developer",
      companyName: "Riverstack Tech",
      experienceYears: 7,
      rating: 4.9,
      reviewCount: 40,
      industries: ["Analytics", "Fintech"],
      school: "Jadavpur University",
      degree: "B.E.",
      field: "Information Technology",
      employer: "Riverstack Tech",
      projectName: "MetricRail Reporting Suite",
      projectSummary:
        "Built a reporting suite with chart-heavy dashboards, saved views, and secure team access for finance operations.",
      serviceDescription:
        "I build web platforms for reporting-heavy teams that need crisp interfaces, robust APIs, and dependable release cycles.",
      seedBudget: 290000,
      deliveryTime: "5-7 weeks",
      projectComplexity: "Analytics dashboard platform"
    },
    {
      fullName: "Tanvi Purohit",
      city: "Indore",
      headline: "React UI Engineer",
      companyName: "Codenest Studio",
      experienceYears: 5,
      rating: 4.8,
      reviewCount: 30,
      industries: ["D2C Brands", "Wellness"],
      school: "IPS Academy",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Codenest Studio",
      projectName: "Glowkind Product Microsites",
      projectSummary:
        "Delivered reusable campaign microsites with product storytelling blocks, waitlist flows, and mobile-first polish.",
      serviceDescription:
        "I build visual, conversion-focused frontend experiences for brands that need flexible landing pages and smooth launches.",
      seedBudget: 165000,
      deliveryTime: "3-4 weeks",
      projectComplexity: "Campaign microsite system"
    },
    {
      fullName: "Rohan Wagle",
      city: "Nagpur",
      headline: "API-Driven Web Developer",
      companyName: "ForgePeak Labs",
      experienceYears: 6,
      rating: 4.8,
      reviewCount: 32,
      industries: ["Manufacturing", "Internal Ops"],
      school: "Visvesvaraya National Institute of Technology",
      degree: "B.Tech",
      field: "Electronics and Communication",
      employer: "ForgePeak Labs",
      projectName: "PlantFlow Operations Portal",
      projectSummary:
        "Connected multiple backend systems into a single web portal for approvals, reports, and team-specific operations views.",
      serviceDescription:
        "I build practical web applications that connect APIs, simplify workflows, and give teams one clean place to work from.",
      seedBudget: 245000,
      deliveryTime: "5-6 weeks",
      projectComplexity: "Operations integration portal"
    },
    {
      fullName: "Zoya Khan",
      city: "Lucknow",
      headline: "Next.js Conversion Engineer",
      companyName: "Northstar Pixel",
      experienceYears: 5,
      rating: 4.8,
      reviewCount: 29,
      industries: ["Healthcare", "Consumer Apps"],
      school: "Dr A P J Abdul Kalam Technical University",
      degree: "B.Tech",
      field: "Information Technology",
      employer: "Northstar Pixel",
      projectName: "Wellnest Acquisition Site",
      projectSummary:
        "Built a patient-friendly acquisition site with conversion experiments, structured forms, and strong mobile responsiveness.",
      serviceDescription:
        "I build fast, high-converting websites that help growth teams improve lead quality without sacrificing clarity or trust.",
      seedBudget: 180000,
      deliveryTime: "3-5 weeks",
      projectComplexity: "Conversion-focused marketing site"
    },
    {
      fullName: "Harsh Vora",
      city: "Surat",
      headline: "Full-Stack Ecommerce Developer",
      companyName: "Cart Harbor",
      experienceYears: 7,
      rating: 4.9,
      reviewCount: 41,
      industries: ["Fashion", "D2C Brands"],
      school: "Sardar Vallabhbhai National Institute of Technology",
      degree: "B.Tech",
      field: "Computer Engineering",
      employer: "Cart Harbor",
      projectName: "Threadsmith Commerce Stack",
      projectSummary:
        "Built an ecommerce stack with merchandising tools, campaign landing pages, and better performance across mobile devices.",
      serviceDescription:
        "I help commerce brands grow with scalable storefronts, strong merchandising workflows, and reliable backend integrations.",
      seedBudget: 260000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "Custom storefront and ops tooling"
    },
    {
      fullName: "Simran Chawla",
      city: "Noida",
      headline: "React Product Builder",
      companyName: "Canary Circuit",
      experienceYears: 6,
      rating: 4.9,
      reviewCount: 37,
      industries: ["HR Tech", "SaaS"],
      school: "Jaypee Institute of Information Technology",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Canary Circuit",
      projectName: "TalentGrid Hiring Workspace",
      projectSummary:
        "Delivered a hiring workspace with candidate pipelines, team reviews, and analytics views for recruitment teams.",
      serviceDescription:
        "I build product-led web apps that feel polished, move quickly, and stay maintainable as features keep growing.",
      seedBudget: 270000,
      deliveryTime: "5-7 weeks",
      projectComplexity: "Hiring workflow application"
    },
    {
      fullName: "Kabir Anand",
      city: "Bengaluru",
      headline: "Senior Web Platform Engineer",
      companyName: "Southline Digital",
      experienceYears: 8,
      rating: 4.9,
      reviewCount: 54,
      industries: ["AI Tools", "B2B SaaS"],
      school: "RV College of Engineering",
      degree: "B.E.",
      field: "Computer Science",
      employer: "Southline Digital",
      projectName: "PromptDock Product Platform",
      projectSummary:
        "Built a web platform for AI workflow setup, billing controls, and workspace management with clean frontend systems.",
      serviceDescription:
        "I build robust web platforms for software companies that need strong architecture, thoughtful UX, and dependable delivery.",
      seedBudget: 320000,
      deliveryTime: "6-8 weeks",
      projectComplexity: "Complex product platform"
    },
    {
      fullName: "Pooja Menon",
      city: "Thiruvananthapuram",
      headline: "Accessible Frontend Developer",
      companyName: "Limegrid Studio",
      experienceYears: 5,
      rating: 4.8,
      reviewCount: 28,
      industries: ["Clinics", "Edtech"],
      school: "College of Engineering Trivandrum",
      degree: "B.Tech",
      field: "Computer Science",
      employer: "Limegrid Studio",
      projectName: "Learnwise Student Portal",
      projectSummary:
        "Built an accessible student portal with content modules, progress tracking, and responsive interfaces across devices.",
      serviceDescription:
        "I build inclusive web interfaces that stay fast, clear, and dependable across desktop, tablet, and mobile experiences.",
      seedBudget: 190000,
      deliveryTime: "4-5 weeks",
      projectComplexity: "Accessible portal build"
    },
    {
      fullName: "Nikhil Bendre",
      city: "Nashik",
      headline: "Full-Stack Next.js Consultant",
      companyName: "Turbo Orchard",
      experienceYears: 6,
      rating: 4.8,
      reviewCount: 35,
      industries: ["Real Estate", "Lead Generation"],
      school: "K K Wagh Institute of Engineering Education and Research",
      degree: "B.E.",
      field: "Computer Engineering",
      employer: "Turbo Orchard",
      projectName: "EstateFlow Lead Platform",
      projectSummary:
        "Built a lead capture and inventory platform with agent dashboards, campaign pages, and CRM sync for a property brand.",
      serviceDescription:
        "I build lead-driven web systems that combine clean frontend experiences with useful admin tooling and integrations.",
      seedBudget: 225000,
      deliveryTime: "4-6 weeks",
      projectComplexity: "Lead generation platform"
    },
    {
      fullName: "Aditi Rao",
      city: "Mysuru",
      headline: "Modern Web Applications Developer",
      companyName: "Cedarline Labs",
      experienceYears: 4,
      rating: 4.7,
      reviewCount: 26,
      industries: ["B2B Services", "Nonprofits"],
      school: "Mysore University",
      degree: "MCA",
      field: "Computer Applications",
      employer: "Cedarline Labs",
      projectName: "Grantline Partner Portal",
      projectSummary:
        "Built a partner portal with application tracking, document uploads, and stakeholder dashboards for a nonprofit network.",
      serviceDescription:
        "I build reliable web apps for teams that need structured workflows, clear interfaces, and sustainable delivery pace.",
      seedBudget: 170000,
      deliveryTime: "4-5 weeks",
      projectComplexity: "Partner portal application"
    }
  ].map((seed) => ({
    key: "web_development",
    skills: [...WEB_DEVELOPMENT_SEED_SKILLS],
    ...seed
  }))
);

// Preserve existing showcase indices and append the dedicated web-development batch after them.
const FREELANCER_SERVICE_SEEDS = Object.freeze([
  ...SHOWCASE_FREELANCER_SERVICE_SEEDS,
  ...WEB_DEVELOPMENT_FREELANCER_SEEDS
]);

const slugify = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildAvatarUrl = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

const buildUsername = (fullName, index) => {
  const compact = String(fullName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `seed${String(index + 1).padStart(2, "0")}${compact.slice(0, 10)}`.slice(0, 20);
};

const buildSkillLevels = (skills = []) =>
  skills.reduce((acc, skill, index) => {
    acc[skill] = Math.max(6, 10 - index);
    return acc;
  }, {});

const buildEducationEntry = (seed) => ({
  school: seed.school,
  degree: seed.degree,
  field: seed.field,
  country: DEFAULT_COUNTRY,
  startMonth: "July",
  startYear: "2013",
  endMonth: "May",
  endYear: "2017",
  graduationYear: "2017",
  grade: "First Class",
  activities:
    "Built client case studies, led capstone projects, and contributed to collaborative studios."
});

const buildWorkExperienceEntry = (seed, portfolioUrl, linkedinUrl) => ({
  title: `${seed.employer} - ${seed.headline}`,
  period: "2021 - Present",
  description: `${seed.projectSummary} I own discovery, execution, client communication, and final delivery across the engagement.`,
  location: `${seed.city}, ${DEFAULT_COUNTRY}`,
  locationType: "Remote",
  employmentType: "Freelance",
  companyWebsite: portfolioUrl,
  linkedinUrl
});

const buildPortfolioProject = (seed, slug, coverImage, effectiveSkills) => ({
  title: seed.projectName,
  description: seed.projectSummary,
  link: `https://portfolio.catalance.dev/${slug}/${seed.key}`,
  readme: `https://portfolio.catalance.dev/${slug}/${seed.key}/case-study`,
  image: coverImage,
  role: seed.headline,
  timeline: seed.deliveryTime,
  budget: seed.seedBudget,
  tags: effectiveSkills.slice(0, 3),
  techStack: effectiveSkills
});

const buildEffectiveSkills = (seed) => {
  const preferred = STRICT_PROFILE_SKILLS_BY_KEY[seed.key] || seed.skills;
  const effective = normalizeSkills([...preferred, ...STRICT_SKILL_FILLERS], {
    strictTech: true,
    max: 5
  });

  if (effective.length < 5) {
    throw new Error(`Unable to derive 5 strict skills for ${seed.key}.`);
  }

  return effective;
};

const buildFreelancerSeedPayload = (seed, index) => {
  const slug = slugify(seed.fullName);
  const username = buildUsername(seed.fullName, index);
  const avatar = buildAvatarUrl(seed.fullName);
  const coverImage = SERVICE_COVER_IMAGE_BY_KEY[seed.key];
  const portfolioUrl = `https://portfolio.catalance.dev/${slug}`;
  const linkedinUrl = `https://www.linkedin.com/in/${slug}`;
  const githubUrl = `https://github.com/${slug}`;
  const resume = `https://cdn.catalance.dev/resumes/${slug}.pdf`;
  const effectiveSkills = buildEffectiveSkills(seed);
  const education = [buildEducationEntry(seed)];
  const workExperience = [buildWorkExperienceEntry(seed, portfolioUrl, linkedinUrl)];
  const portfolioProjects = [buildPortfolioProject(seed, slug, coverImage, effectiveSkills)];
  const bio = `${seed.serviceDescription} I usually partner with ${seed.industries.join(
    " and "
  )} teams that want polished execution and dependable communication.`;
  const profileDetails = {
    role: "individual",
    professionalBio: bio,
    termsAccepted: true,
    deliveryPolicyAccepted: true,
    communicationPolicyAccepted: true,
    acceptInProgressProjects: "Yes, when documentation and ownership are clear.",
    globalIndustryFocus: seed.industries,
    skills: effectiveSkills,
    skillLevels: buildSkillLevels(effectiveSkills),
    education,
    services: [seed.key],
    serviceDetails: {
      [seed.key]: {
        serviceDescription: seed.serviceDescription,
        coverImage,
        averageProjectPrice: `INR ${seed.seedBudget.toLocaleString("en-IN")}`,
        deliveryTime: seed.deliveryTime,
        projectComplexity: seed.projectComplexity,
        skillsAndTechnologies: effectiveSkills,
        projects: portfolioProjects,
        platformLinks: {
          portfolio: portfolioUrl,
          linkedin: linkedinUrl,
          github: githubUrl
        }
      }
    },
    availability: {
      hoursPerWeek: DEFAULT_WORK_HOURS,
      startTimeline: DEFAULT_START_TIMELINE,
      workingSchedule: DEFAULT_WORKING_SCHEDULE
    },
    reliability: {
      delayHandling: DEFAULT_DELAY_HANDLING,
      missedDeadlines: DEFAULT_MISSED_DEADLINES
    },
    identity: {
      city: seed.city,
      country: DEFAULT_COUNTRY,
      username,
      githubUrl,
      languages: ["English", "Hindi"],
      coverImage,
      linkedinUrl,
      portfolioUrl,
      profilePhoto: avatar,
      professionalTitle: seed.headline
    }
  };

  return {
    email: `seed.freelancer.${String(index + 1).padStart(2, "0")}@catalance.dev`,
    fullName: seed.fullName,
    companyName: seed.companyName,
    avatar,
    bio,
    experienceYears: seed.experienceYears,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    services: [seed.key],
    skills: effectiveSkills,
    portfolio: portfolioUrl,
    linkedin: linkedinUrl,
    github: githubUrl,
    resume,
    workExperience,
    portfolioProjects,
    profileDetails
  };
};

const hasText = (value) => String(value || "").trim().length > 0;

const assertCompleteFreelancerPayload = (payload) => {
  const profileDetails = payload.profileDetails || {};
  const identity = profileDetails.identity || {};
  const availability = profileDetails.availability || {};
  const serviceDetails = profileDetails.serviceDetails || {};
  const selectedServices = Array.isArray(payload.services) ? payload.services : [];
  const serviceCoverageComplete =
    selectedServices.length > 0 &&
    selectedServices.every((serviceKey) => {
      const detail = serviceDetails[serviceKey] || {};
      return hasText(detail.serviceDescription || detail.description) && hasText(detail.coverImage);
    });
  const availableLinks = [payload.portfolio, payload.linkedin, payload.github].filter(hasText);
  const hasEducation = Array.isArray(profileDetails.education)
    ? profileDetails.education.some((entry) => hasText(entry?.school) || hasText(entry?.degree))
    : false;
  const checklist = [
    hasText(payload.avatar),
    hasText(identity.coverImage),
    hasText(identity.professionalTitle),
    hasText(payload.bio),
    hasText(identity.city) && hasText(identity.country),
    selectedServices.length > 0,
    serviceCoverageComplete,
    Array.isArray(payload.skills) && payload.skills.length >= 5,
    hasText(availability.hoursPerWeek) && hasText(availability.startTimeline),
    availableLinks.length >= 2,
    Array.isArray(payload.portfolioProjects) && payload.portfolioProjects.length > 0,
    hasText(payload.resume),
    Array.isArray(payload.workExperience) && payload.workExperience.length > 0,
    hasEducation,
    Array.isArray(profileDetails.globalIndustryFocus) &&
      profileDetails.globalIndustryFocus.length > 0,
    profileDetails.deliveryPolicyAccepted === true,
    profileDetails.communicationPolicyAccepted === true,
    hasText(profileDetails.acceptInProgressProjects)
  ];

  if (checklist.some((item) => !item)) {
    throw new Error(`Seeded freelancer payload for ${payload.email} is incomplete.`);
  }
};

const upsertFreelancerShowcaseAccount = async (payload, passwordHash) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true }
  });

  let userId = existingUser?.id || null;
  let action = "updated";

  if (!userId) {
    const createdUser = await createUser({
      email: payload.email,
      fullName: payload.fullName,
      password: DEFAULT_FREELANCER_PASSWORD,
      role: "FREELANCER",
      onboardingComplete: true
    });
    userId = createdUser.id;
    action = "created";
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: payload.fullName,
      passwordHash,
      role: "FREELANCER",
      roles: ["FREELANCER"],
      status: "ACTIVE",
      isVerified: true,
      onboardingComplete: true,
      avatar: payload.avatar
    }
  });

  await updateUserProfile(userId, {
    avatar: payload.avatar,
    bio: payload.bio,
    available: true,
    experienceYears: payload.experienceYears,
    jobTitle: payload.profileDetails?.identity?.professionalTitle || "",
    location: `${payload.profileDetails.identity.city}, ${payload.profileDetails.identity.country}`,
    companyName: payload.companyName,
    skills: payload.skills,
    services: payload.services,
    portfolio: payload.portfolio,
    linkedin: payload.linkedin,
    github: payload.github,
    resume: payload.resume,
    portfolioProjects: payload.portfolioProjects,
    workExperience: payload.workExperience,
    profileDetails: payload.profileDetails,
    onboardingComplete: true
  });

  await prisma.freelancerProfile.upsert({
    where: { userId },
    update: {
      companyName: payload.companyName,
      location: `${payload.profileDetails.identity.city}, ${payload.profileDetails.identity.country}`,
      available: true,
      rating: payload.rating,
      reviewCount: payload.reviewCount,
      experienceYears: payload.experienceYears
    },
    create: {
      userId,
      companyName: payload.companyName,
      location: `${payload.profileDetails.identity.city}, ${payload.profileDetails.identity.country}`,
      available: true,
      rating: payload.rating,
      reviewCount: payload.reviewCount,
      experienceYears: payload.experienceYears
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      isVerified: true,
      onboardingComplete: true
    }
  });

  return { userId, action };
};

export const seedFreelancerShowcaseAccounts = async () => {
  const passwordHash = await hashPassword(DEFAULT_FREELANCER_PASSWORD);
  let createdCount = 0;
  let updatedCount = 0;

  for (const [index, seed] of FREELANCER_SERVICE_SEEDS.entries()) {
    const payload = buildFreelancerSeedPayload(seed, index);
    assertCompleteFreelancerPayload(payload);
    const { action } = await upsertFreelancerShowcaseAccount(payload, passwordHash);

    if (action === "created") {
      createdCount += 1;
    } else {
      updatedCount += 1;
    }

    console.log(
      `[Seed] ${action === "created" ? "Created" : "Updated"} freelancer ${payload.email} for ${seed.key}.`
    );
  }

  return {
    createdCount,
    updatedCount,
    total: FREELANCER_SERVICE_SEEDS.length,
    password: DEFAULT_FREELANCER_PASSWORD
  };
};

const currentFilePath = fileURLToPath(import.meta.url);
const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(currentFilePath);

if (isDirectExecution) {
  seedFreelancerShowcaseAccounts()
    .then((result) => {
      console.log(
        `[Seed] Freelancer showcase complete. Created ${result.createdCount}, updated ${result.updatedCount}, total ${result.total}.`
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
