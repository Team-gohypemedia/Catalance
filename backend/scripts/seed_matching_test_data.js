import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/modules/users/password.utils.js";

const DEFAULT_TARGET_ACCOUNT_ID = "cmm08ca3d00016c9k7xyc4sab";
const DEFAULT_FREELANCER_COUNT = 15;
const MIN_FREELANCER_COUNT = 10;
const MAX_FREELANCER_COUNT = 20;
const PROPOSAL_COUNT = 10;
const DEFAULT_PASSWORD = "Test@123456";

const STATUS_ROTATION = ["PENDING", "PENDING", "ACCEPTED", "REJECTED"];
const EXPERIENCE_VALUES = ["less_than_1", "1_3", "3_5", "5_plus"];

const SERVICE_FIXTURES = [
  {
    key: "web_development",
    title: "Web Development",
    projectTitle: "B2B SaaS Platform Website",
    summary:
      "Design and develop a conversion-focused multi-page website with CMS support and analytics tracking.",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"],
    specializations: ["SaaS Platforms", "Landing Pages", "Corporate / Business"],
    industries: ["Technology", "Startups"],
    budget: 180000,
    timeline: "8 weeks",
    complexity: "medium",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "app_development",
    title: "App Development",
    projectTitle: "Cross Platform Fitness Mobile App",
    summary:
      "Build iOS and Android fitness app with subscriptions, push notifications, and workout planner.",
    technologies: ["Flutter", "Firebase", "Node.js", "PostgreSQL"],
    specializations: ["Mobile App", "Web Application", "SaaS Platforms"],
    industries: ["Healthcare", "Technology"],
    budget: 250000,
    timeline: "10 weeks",
    complexity: "large",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "software_development",
    title: "Software Development",
    projectTitle: "Inventory and Order Management Suite",
    summary:
      "Develop internal business software with role permissions, reporting, and API integrations.",
    technologies: ["React", "Node.js", "Prisma", "PostgreSQL", "Docker"],
    specializations: ["SaaS Platforms", "Corporate / Business"],
    industries: ["E-commerce", "Finance"],
    budget: 300000,
    timeline: "12 weeks",
    complexity: "large",
    priceRange: "INR 3 Lakhs - 5 Lakhs"
  },
  {
    key: "branding",
    title: "Branding",
    projectTitle: "Brand Identity Revamp for D2C Brand",
    summary:
      "Create complete brand system including logo, typography, visual language, and messaging tone.",
    technologies: ["Figma", "Adobe Illustrator", "Adobe Photoshop"],
    specializations: ["Corporate / Business", "Portfolio"],
    industries: ["Fashion & Apparel", "E-commerce"],
    budget: 90000,
    timeline: "5 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "creative_design",
    title: "Creative & Design",
    projectTitle: "Always On Social Creative Production",
    summary:
      "Produce monthly ad creatives, social graphics, and campaign visuals with performance variants.",
    technologies: ["Figma", "Adobe Photoshop", "Canva"],
    specializations: ["Landing Pages", "Corporate / Business"],
    industries: ["E-commerce", "Entertainment"],
    budget: 70000,
    timeline: "4 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "seo",
    title: "SEO",
    projectTitle: "Technical and Content SEO Scale Plan",
    summary:
      "Audit technical SEO, improve on-page content, and build keyword clusters for organic growth.",
    technologies: ["Google Search Console", "GA4", "Ahrefs", "Semrush"],
    specializations: ["Corporate / Business", "SaaS Platforms"],
    industries: ["Technology", "Education"],
    budget: 60000,
    timeline: "12 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "social_media_marketing",
    title: "Social Media Marketing",
    projectTitle: "Organic Social Growth Program",
    summary:
      "Plan and execute monthly social content calendar with platform-native growth experiments.",
    technologies: ["Meta Business Suite", "Buffer", "Canva", "Notion"],
    specializations: ["Corporate / Business", "Portfolio"],
    industries: ["Food & Beverage", "Fashion & Apparel"],
    budget: 55000,
    timeline: "8 weeks",
    complexity: "small",
    priceRange: "INR 25,000 - 50,000"
  },
  {
    key: "paid_advertising",
    title: "Paid Advertising",
    projectTitle: "Performance Marketing Funnel Buildout",
    summary:
      "Launch and optimize paid campaigns on Meta and Google with full-funnel tracking and creatives.",
    technologies: ["Meta Ads", "Google Ads", "GA4", "Tag Manager"],
    specializations: ["Corporate / Business", "E-commerce"],
    industries: ["E-commerce", "Technology"],
    budget: 120000,
    timeline: "6 weeks",
    complexity: "medium",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "lead_generation",
    title: "Lead Generation",
    projectTitle: "B2B Lead Engine and Outreach Setup",
    summary:
      "Set up list building, multi-step outreach, qualification logic, and CRM handoff workflows.",
    technologies: ["Apollo", "HubSpot", "LinkedIn Sales Navigator", "Zapier"],
    specializations: ["Corporate / Business", "SaaS Platforms"],
    industries: ["Technology", "Finance"],
    budget: 85000,
    timeline: "6 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "ai_automation",
    title: "AI Automation",
    projectTitle: "Operations Workflow Automation with AI Agents",
    summary:
      "Build AI-assisted workflows for lead routing, support triage, and internal knowledge automation.",
    technologies: ["OpenAI API", "n8n", "Node.js", "PostgreSQL"],
    specializations: ["SaaS Platforms", "Corporate / Business"],
    industries: ["Technology", "Customer Support"],
    budget: 220000,
    timeline: "9 weeks",
    complexity: "large",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "voice_agent",
    title: "Voice Agent",
    projectTitle: "AI Voice Assistant for Booking Calls",
    summary:
      "Deploy AI voice assistant for inbound calls with appointment scheduling and CRM syncing.",
    technologies: ["Twilio", "Node.js", "OpenAI API", "PostgreSQL"],
    specializations: ["Mobile App", "Corporate / Business"],
    industries: ["Healthcare", "Real Estate"],
    budget: 190000,
    timeline: "7 weeks",
    complexity: "large",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "whatsapp_chatbot",
    title: "WhatsApp Chatbot",
    projectTitle: "WhatsApp Sales and Support Bot",
    summary:
      "Implement WhatsApp automation for lead capture, qualification, and customer support handover.",
    technologies: ["WhatsApp API", "Node.js", "Redis", "PostgreSQL"],
    specializations: ["Corporate / Business", "SaaS Platforms"],
    industries: ["E-commerce", "Customer Support"],
    budget: 110000,
    timeline: "5 weeks",
    complexity: "medium",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "video_services",
    title: "Video Services",
    projectTitle: "Video Production Sprint for Launch Campaign",
    summary:
      "Produce launch campaign videos including edits, captions, and platform-specific variants.",
    technologies: ["Premiere Pro", "After Effects", "DaVinci Resolve"],
    specializations: ["Portfolio", "Corporate / Business"],
    industries: ["Entertainment", "E-commerce"],
    budget: 80000,
    timeline: "4 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "writing_content",
    title: "Writing & Content",
    projectTitle: "Content Engine for Product Led Growth",
    summary:
      "Create SEO articles, landing page copy, and email nurture sequences aligned with funnel goals.",
    technologies: ["Notion", "Surfer SEO", "GA4"],
    specializations: ["SaaS Platforms", "Landing Pages"],
    industries: ["Technology", "Education"],
    budget: 50000,
    timeline: "6 weeks",
    complexity: "small",
    priceRange: "INR 25,000 - 50,000"
  },
  {
    key: "customer_support",
    title: "Customer Support",
    projectTitle: "Support Operations Setup with SLA Monitoring",
    summary:
      "Configure support workflows, escalation matrix, and response quality monitoring dashboard.",
    technologies: ["Zendesk", "Intercom", "Notion", "Google Sheets"],
    specializations: ["Corporate / Business", "SaaS Platforms"],
    industries: ["Customer Support", "Technology"],
    budget: 65000,
    timeline: "6 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "influencer_marketing",
    title: "Influencer Marketing",
    projectTitle: "Creator Partnership Campaign Program",
    summary:
      "Source creators, negotiate deliverables, and manage campaign performance reporting.",
    technologies: ["Airtable", "Instagram", "YouTube Studio", "Google Sheets"],
    specializations: ["Portfolio", "Corporate / Business"],
    industries: ["Fashion & Apparel", "Food & Beverage"],
    budget: 95000,
    timeline: "7 weeks",
    complexity: "medium",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "ugc_marketing",
    title: "UGC Marketing",
    projectTitle: "UGC Asset Pipeline for Paid Social",
    summary:
      "Build repeatable UGC creator pipeline with briefs, asset QA, and ad-ready handoff process.",
    technologies: ["Canva", "Notion", "Meta Ads"],
    specializations: ["Portfolio", "E-commerce"],
    industries: ["E-commerce", "Fashion & Apparel"],
    budget: 78000,
    timeline: "5 weeks",
    complexity: "small",
    priceRange: "INR 50,000 - 1 Lakh"
  },
  {
    key: "crm_erp",
    title: "CRM & ERP Solutions",
    projectTitle: "CRM Rollout and Automation Blueprint",
    summary:
      "Implement CRM and workflow automation for sales operations, reporting, and lifecycle messaging.",
    technologies: ["HubSpot", "Salesforce", "Zapier", "PostgreSQL"],
    specializations: ["Corporate / Business", "SaaS Platforms"],
    industries: ["Finance", "Real Estate"],
    budget: 280000,
    timeline: "10 weeks",
    complexity: "large",
    priceRange: "INR 3 Lakhs - 5 Lakhs"
  },
  {
    key: "3d_modeling",
    title: "3D Modeling",
    projectTitle: "3D Product Visualization Library",
    summary:
      "Create high-quality 3D product models and rendered assets for catalog and campaign use.",
    technologies: ["Blender", "Cinema 4D", "Substance Painter"],
    specializations: ["Portfolio", "Corporate / Business"],
    industries: ["E-commerce", "Real Estate"],
    budget: 140000,
    timeline: "8 weeks",
    complexity: "medium",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  },
  {
    key: "cgi_videos",
    title: "CGI Videos",
    projectTitle: "CGI Product Storytelling Campaign",
    summary:
      "Produce CGI motion assets for brand storytelling with cinematic look and campaign variants.",
    technologies: ["After Effects", "Cinema 4D", "Redshift"],
    specializations: ["Portfolio", "Corporate / Business"],
    industries: ["Entertainment", "E-commerce"],
    budget: 210000,
    timeline: "9 weeks",
    complexity: "large",
    priceRange: "INR 1 Lakh - 3 Lakhs"
  }
];

const CITY_POOL = [
  "Bengaluru",
  "Delhi",
  "Mumbai",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Indore"
];

const FIRST_NAMES = [
  "Aarav",
  "Ishaan",
  "Vivaan",
  "Aditya",
  "Kabir",
  "Arjun",
  "Reyansh",
  "Krishna",
  "Anaya",
  "Diya",
  "Myra",
  "Aanya",
  "Sara",
  "Ira",
  "Riya",
  "Naina",
  "Tara",
  "Meera",
  "Saanvi",
  "Kiara"
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Nair",
  "Patel",
  "Khan",
  "Mehta",
  "Rao",
  "Mishra",
  "Kapoor",
  "Iyer",
  "Singh"
];

const slugify = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueStrings = (items = []) =>
  Array.from(
    new Set(
      items
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )
  );

const parseCliArgs = () => {
  const args = process.argv.slice(2);
  const options = {};

  args.forEach((arg) => {
    if (!arg.startsWith("--")) return;
    const [rawKey, rawValue = ""] = arg.slice(2).split("=");
    const key = String(rawKey || "").trim();
    const value = String(rawValue || "").trim();
    if (!key) return;
    options[key] = value;
  });

  const targetAccountId =
    options.targetAccountId || options.accountId || DEFAULT_TARGET_ACCOUNT_ID;
  const proposalOwnerAccountId =
    options.ownerAccountId || options.clientAccountId || targetAccountId;
  const requestedFreelancers = Number.parseInt(
    options.freelancers || options.count || `${DEFAULT_FREELANCER_COUNT}`,
    10
  );
  const freelancerCount = Number.isFinite(requestedFreelancers)
    ? Math.min(Math.max(requestedFreelancers, MIN_FREELANCER_COUNT), MAX_FREELANCER_COUNT)
    : DEFAULT_FREELANCER_COUNT;

  return {
    targetAccountId,
    proposalOwnerAccountId,
    freelancerCount
  };
};

const buildProjectDescription = (service, sequence) => {
  const deliverables = [
    `Initial strategy and discovery workshop for ${service.title}`,
    `Execution plan with milestones and ownership matrix`,
    `Implementation with weekly demos and transparent progress logs`,
    `QA checklist, handover documents, and post-launch support plan`
  ];

  return [
    `Service: ${service.title}`,
    `Project Name: ${service.projectTitle}`,
    "",
    "Project Scope:",
    service.summary,
    "",
    "Required Stack:",
    `- ${service.technologies.join(", ")}`,
    "",
    "Target Industries:",
    `- ${service.industries.join(", ")}`,
    "",
    "Delivery Timeline:",
    `- ${service.timeline}`,
    "",
    "Expected Deliverables:",
    ...deliverables.map((item) => `- ${item}`),
    "",
    "Success Criteria:",
    "- Delivered within timeline with zero blocker spillover",
    "- Documentation for operations and future maintenance",
    "- Performance and quality baseline shared with client team",
    "",
    `Seed Ref: MATCH-PROJECT-${sequence + 1}-${service.key}`
  ].join("\n");
};

const buildCoverLetter = (service, sequence, freelancerName) => {
  const amount = Math.round(service.budget * 0.9);
  return [
    `Hello ${freelancerName},`,
    "",
    `I am sharing a detailed ${service.title} proposal for "${service.projectTitle}".`,
    "",
    "Why this is a fit:",
    `- Primary service alignment: ${service.title}`,
    `- Strong stack requirement: ${service.technologies.join(", ")}`,
    `- Business context: ${service.industries.join(", ")}`,
    "",
    "Execution plan:",
    "- Phase 1: Discovery, requirement freeze, and architecture blueprint",
    "- Phase 2: Production execution with weekly demos and progress reviews",
    "- Phase 3: QA hardening, handover, and launch support",
    "",
    `Commercials: INR ${amount.toLocaleString("en-IN")} fixed for the scoped timeline.`,
    `Timeline commitment: ${service.timeline}.`,
    "",
    `Seed Ref: MATCH-PROPOSAL-${sequence + 1}-${service.key}`
  ].join("\n");
};

const buildPortfolioProjects = ({ service, seedIndex }) => {
  const slug = slugify(service.key);
  const base = `https://portfolio-seed-${seedIndex + 1}-${slug}.example.com`;

  return [
    {
      title: `${service.title} Accelerator ${seedIndex + 1}`,
      description: `Delivered ${service.title.toLowerCase()} execution with measurable quality and growth impact.`,
      link: base,
      role: "Lead Specialist",
      timeline: service.timeline,
      budget: service.budget,
      tags: service.specializations.slice(0, 3),
      techStack: service.technologies.slice(0, 5)
    },
    {
      title: `${service.title} Optimization Sprint ${seedIndex + 1}`,
      description: `Optimization-focused engagement improving delivery velocity and stakeholder visibility.`,
      link: `${base}/sprint`,
      role: "Project Owner",
      timeline: "4 weeks",
      budget: Math.round(service.budget * 0.55),
      tags: service.specializations.slice(0, 2),
      techStack: service.technologies.slice(0, 4)
    }
  ];
};

const buildServiceDetail = ({ service, seedIndex, city, jobTitle, languages }) => {
  const projects = buildPortfolioProjects({ service, seedIndex });
  return {
    serviceDescription: `${service.summary} Focused on reliable delivery, stakeholder communication, and measurable outcomes.`,
    experienceYears: EXPERIENCE_VALUES[seedIndex % EXPERIENCE_VALUES.length],
    averageProjectPrice: service.priceRange,
    projectComplexity: service.complexity,
    acceptInProgressProjects: "yes",
    groups: {
      technologyStack: service.technologies,
      projectTypes: service.specializations
    },
    groupOther: {
      technologyStackOther: "Monitoring, QA automation, release checklist",
      projectTypesOther: "Business process optimization"
    },
    niches: service.specializations,
    otherNiche: "",
    caseStudy: {
      title: `${service.title} Case Study ${seedIndex + 1}`,
      challenge: `Client required faster turnaround for ${service.title.toLowerCase()} execution across multiple priorities.`,
      solution:
        "Planned milestones, standardized deliverables, and set up quality gates for every iteration.",
      impact:
        "Improved delivery predictability, reduced revision cycles, and increased confidence of stakeholders.",
      techStack: service.technologies,
      techStackOther: "",
      liveUrl: projects[0].link,
      readmeUrl: `${projects[0].link}/readme`
    },
    projects: projects.map((project, projectIndex) => ({
      ...project,
      title: project.title,
      description: project.description,
      location: `${city}, India`,
      role: project.role,
      timeline: project.timeline,
      budget: project.budget,
      tags: project.tags,
      techStack: project.techStack,
      sortOrder: projectIndex
    })),
    profileSnapshot: {
      professionalTitle: jobTitle,
      city,
      country: "India",
      languages
    }
  };
};

const buildFreelancerProjectRows = ({
  userId,
  services,
  seedIndex,
  jobTitle,
  city: _city,
  languages
}) =>
  services.map((service, index) => {
    const portfolioProjects = buildPortfolioProjects({ service, seedIndex });
    const primaryProject = portfolioProjects[0];
    return {
      freelancerId: userId,
      serviceKey: service.key,
      serviceName: service.title,
      professionalTitle: jobTitle,
      languages,
      industriesOrNiches: service.industries,
      yearsOfExperienceInService: EXPERIENCE_VALUES[(seedIndex + index) % EXPERIENCE_VALUES.length],
      serviceSpecializations: service.specializations,
      activeTechnologies: service.technologies,
      averageProjectPriceRange: service.priceRange,
      projectComplexityLevel: service.complexity,
      acceptInProgressProjects: "yes",
      title: primaryProject.title,
      description: primaryProject.description,
      link: primaryProject.link,
      readme: `${primaryProject.link}/readme`,
      role: "Lead Specialist",
      timeline: service.timeline,
      budget: service.budget,
      tags: uniqueStrings([...service.specializations, service.title]),
      techStack: service.technologies.slice(0, 6),
      sortOrder: index
    };
  });

const buildMarketplaceDetails = (service) => ({
  key: service.key,
  title: service.title,
  description: service.summary,
  technologies: service.technologies,
  industries: service.industries,
  complexity: service.complexity,
  averageProjectPriceRange: service.priceRange
});

const buildWorkExperienceRows = ({ service, seedIndex }) => {
  const currentYear = new Date().getUTCFullYear();
  return [
    {
      title: `${service.title} Consultant`,
      company: `Seed Studio ${seedIndex + 1}`,
      location: "India",
      startDate: `${currentYear - 3}-01-01`,
      endDate: null,
      currentlyWorking: true,
      description: `Leading ${service.title.toLowerCase()} initiatives for growth-stage businesses.`
    },
    {
      title: `${service.title} Specialist`,
      company: `Agency Pod ${seedIndex + 1}`,
      location: "India",
      startDate: `${currentYear - 5}-01-01`,
      endDate: `${currentYear - 3}-01-01`,
      currentlyWorking: false,
      description: "Handled delivery, QA handoff, and client operations alignment."
    }
  ];
};

const ensureTargetFreelancer = async ({ targetAccountId, passwordHash }) => {
  const existing = await prisma.user.findUnique({
    where: { id: targetAccountId },
    include: { freelancerProfile: true }
  });

  if (existing) {
    if (existing.role !== "FREELANCER" && !(existing.roles || []).includes("FREELANCER")) {
      throw new Error(
        `Target account ${targetAccountId} exists but is not a freelancer. Role: ${existing.role}`
      );
    }
    return existing;
  }

  const fallbackEmail = `target-${targetAccountId}@catalance.test`;
  const created = await prisma.user.create({
    data: {
      id: targetAccountId,
      email: fallbackEmail,
      fullName: "Target Freelancer Seed Account",
      passwordHash,
      role: "FREELANCER",
      roles: ["FREELANCER"],
      status: "ACTIVE",
      onboardingComplete: true,
      isVerified: true,
      phoneNumber: "+91-9000000000",
      avatar: "https://i.pravatar.cc/300?img=18"
    }
  });

  await prisma.freelancerProfile.create({
    data: {
      userId: created.id,
      bio: "Seed target freelancer account for proposal and matching tests.",
      skills: ["React", "Node.js", "TypeScript", "Project Delivery"],
      jobTitle: "Senior Full Stack Freelancer",
      companyName: "Catalance Seed Network",
      location: "Bengaluru, India",
      rating: 4.6,
      reviewCount: 18,
      experienceYears: 6,
      services: ["web_development", "software_development", "ai_automation"],
      portfolio: "https://portfolio-target-seed.example.com",
      linkedin: "https://linkedin.com/in/target-seed-freelancer",
      github: "https://github.com/target-seed-freelancer",
      portfolioProjects: buildPortfolioProjects({
        service: SERVICE_FIXTURES[0],
        seedIndex: 0
      }),
      resume: "https://cdn.example.com/resumes/target-seed-freelancer.pdf",
      workExperience: buildWorkExperienceRows({
        service: SERVICE_FIXTURES[0],
        seedIndex: 0
      }),
      profileDetails: {
        identity: {
          professionalTitle: "Senior Full Stack Freelancer",
          city: "Bengaluru",
          country: "India",
          languages: ["English", "Hindi"],
          profilePhoto: "https://i.pravatar.cc/300?img=18"
        },
        services: ["web_development", "software_development", "ai_automation"],
        globalIndustryFocus: ["Technology", "Startups"],
        serviceDetails: {
          web_development: buildServiceDetail({
            service: SERVICE_FIXTURES[0],
            seedIndex: 0,
            city: "Bengaluru",
            jobTitle: "Senior Full Stack Freelancer",
            languages: ["English", "Hindi"]
          })
        }
      }
    }
  });

  await prisma.freelancerProject.createMany({
    data: buildFreelancerProjectRows({
      userId: created.id,
      services: [SERVICE_FIXTURES[0], SERVICE_FIXTURES[2], SERVICE_FIXTURES[9]],
      seedIndex: 0,
      jobTitle: "Senior Full Stack Freelancer",
      city: "Bengaluru",
      languages: ["English", "Hindi"]
    })
  });

  return created;
};

const ensureSeedClient = async ({ passwordHash, proposalOwnerAccountId }) => {
  const profileDetails = {
    companyName: "Catalance QA Labs",
    industry: "Technology",
    location: "Bengaluru, India"
  };

  const upsertClientProfile = async (userId) => {
    await prisma.clientProfile.upsert({
      where: { userId },
      update: { profileDetails },
      create: { userId, profileDetails }
    });
  };

  if (proposalOwnerAccountId) {
    const existing = await prisma.user.findUnique({
      where: { id: proposalOwnerAccountId }
    });

    if (existing) {
      const roles = uniqueStrings([
        ...(Array.isArray(existing.roles) ? existing.roles : []),
        existing.role,
        "CLIENT"
      ]).map((role) => String(role || "").toUpperCase());

      const client = await prisma.user.update({
        where: { id: existing.id },
        data: {
          roles,
          status: "ACTIVE",
          isVerified: true,
          onboardingComplete: true,
          ...(existing.passwordHash ? {} : { passwordHash })
        }
      });

      await upsertClientProfile(client.id);
      return client;
    }

    const fallbackEmail = `matching.client.seed+${proposalOwnerAccountId}@catalance.test`;
    const created = await prisma.user.create({
      data: {
        id: proposalOwnerAccountId,
        email: fallbackEmail,
        fullName: "Matching Test Client",
        passwordHash,
        role: "CLIENT",
        roles: ["CLIENT"],
        status: "ACTIVE",
        isVerified: true,
        onboardingComplete: true,
        phoneNumber: "+91-9888800011",
        avatar: "https://i.pravatar.cc/300?img=26"
      }
    });

    await upsertClientProfile(created.id);
    return created;
  }

  const email = "matching.client.seed@catalance.test";
  const client = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "Matching Test Client",
      role: "CLIENT",
      roles: ["CLIENT"],
      status: "ACTIVE",
      isVerified: true,
      onboardingComplete: true,
      phoneNumber: "+91-9888800011",
      avatar: "https://i.pravatar.cc/300?img=26"
    },
    create: {
      email,
      fullName: "Matching Test Client",
      passwordHash,
      role: "CLIENT",
      roles: ["CLIENT"],
      status: "ACTIVE",
      isVerified: true,
      onboardingComplete: true,
      phoneNumber: "+91-9888800011",
      avatar: "https://i.pravatar.cc/300?img=26"
    }
  });

  await upsertClientProfile(client.id);
  return client;
};

const upsertProjectAndProposal = async ({
  service,
  sequence,
  clientId,
  freelancerId,
  freelancerName
}) => {
  const title = `[MATCH-SEED] ${service.title} :: ${service.projectTitle}`;
  const description = buildProjectDescription(service, sequence);
  const amount = Math.round(service.budget * 0.9);
  const proposalStatus = STATUS_ROTATION[sequence % STATUS_ROTATION.length];
  const coverLetter = buildCoverLetter(service, sequence, freelancerName);

  const existingProject = await prisma.project.findFirst({
    where: {
      ownerId: clientId,
      title
    },
    select: { id: true }
  });

  const project = existingProject
    ? await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          description,
          budget: service.budget,
          status: "OPEN",
          notes: `Seeded for matching tests (${service.key}).`
        }
      })
    : await prisma.project.create({
        data: {
          title,
          description,
          budget: service.budget,
          status: "OPEN",
          notes: `Seeded for matching tests (${service.key}).`,
          ownerId: clientId
        }
      });

  const existingProposals = await prisma.proposal.findMany({
    where: {
      projectId: project.id,
      freelancerId
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  let proposal;
  if (existingProposals.length > 0) {
    proposal = await prisma.proposal.update({
      where: { id: existingProposals[0].id },
      data: {
        coverLetter,
        amount,
        status: proposalStatus
      }
    });

    if (existingProposals.length > 1) {
      const redundantIds = existingProposals.slice(1).map((entry) => entry.id);
      await prisma.proposal.deleteMany({
        where: { id: { in: redundantIds } }
      });
    }
  } else {
    proposal = await prisma.proposal.create({
      data: {
        coverLetter,
        amount,
        status: proposalStatus,
        freelancerId,
        projectId: project.id
      }
    });
  }

  return {
    serviceKey: service.key,
    projectId: project.id,
    proposalId: proposal.id,
    status: proposal.status
  };
};

const seedServiceProposals = async ({ client, recipients }) => {
  const proposalServices = SERVICE_FIXTURES.slice(0, PROPOSAL_COUNT);
  const rows = [];
  const pool = Array.isArray(recipients) ? recipients.filter(Boolean) : [];
  if (pool.length === 0) {
    throw new Error("No freelancer recipients available for seeded proposals.");
  }

  for (let i = 0; i < proposalServices.length; i += 1) {
    const recipient = pool[i % pool.length];
    const result = await upsertProjectAndProposal({
      service: proposalServices[i],
      sequence: i,
      clientId: client.id,
      freelancerId: recipient.id,
      freelancerName: recipient.fullName || "Freelancer"
    });
    rows.push(result);
  }

  return rows;
};

const seedFreelancerAccounts = async ({ freelancerCount, passwordHash }) => {
  const created = [];

  for (let i = 0; i < freelancerCount; i += 1) {
    const primaryService = SERVICE_FIXTURES[(i + 3) % SERVICE_FIXTURES.length];
    const secondaryService =
      i % 2 === 0 ? SERVICE_FIXTURES[(i + 9) % SERVICE_FIXTURES.length] : null;
    const services = secondaryService
      ? [primaryService, secondaryService]
      : [primaryService];
    const uniqueServices = uniqueStrings(services.map((entry) => entry.key))
      .map((key) => SERVICE_FIXTURES.find((entry) => entry.key === key))
      .filter(Boolean);

    const city = CITY_POOL[i % CITY_POOL.length];
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 2) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const email = `match.freelancer${String(i + 1).padStart(2, "0")}@catalance.test`;
    const phone = `+91-98000${String(10000 + i).slice(-5)}`;
    const avatar = `https://i.pravatar.cc/300?img=${(i % 70) + 1}`;
    const jobTitle = `${primaryService.title} Specialist`;
    const languages = i % 3 === 0 ? ["English", "Hindi", "Marathi"] : ["English", "Hindi"];
    const reviewCount = 6 + i * 2;
    const rating = Number((4.1 + (i % 6) * 0.12).toFixed(1));
    const experienceYears = 2 + (i % 7);
    const profileDetails = {
      identity: {
        professionalTitle: jobTitle,
        city,
        country: "India",
        languages,
        profilePhoto: avatar
      },
      services: uniqueServices.map((entry) => entry.key),
      globalIndustryFocus: uniqueStrings(
        uniqueServices.flatMap((entry) => entry.industries)
      ),
      globalIndustryOther: "",
      availability: {
        weeklyHours: 20 + (i % 4) * 10,
        timezone: "Asia/Kolkata",
        responseTime: "Within 12 hours"
      },
      serviceDetails: Object.fromEntries(
        uniqueServices.map((service) => [
          service.key,
          buildServiceDetail({
            service,
            seedIndex: i,
            city,
            jobTitle,
            languages
          })
        ])
      )
    };

    const skills = uniqueStrings(
      uniqueServices.flatMap((entry) => entry.technologies).concat([
        "Client Communication",
        "Project Delivery",
        "Quality Assurance"
      ])
    );
    const portfolioProjects = uniqueServices.flatMap((service) =>
      buildPortfolioProjects({ service, seedIndex: i })
    );

    const status = i % 8 === 0 ? "PENDING_APPROVAL" : "ACTIVE";

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        passwordHash,
        role: "FREELANCER",
        roles: ["FREELANCER"],
        status,
        isVerified: true,
        onboardingComplete: true,
        phoneNumber: phone,
        avatar
      },
      create: {
        email,
        fullName,
        passwordHash,
        role: "FREELANCER",
        roles: ["FREELANCER"],
        status,
        isVerified: true,
        onboardingComplete: true,
        phoneNumber: phone,
        avatar
      }
    });

    await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: `Verified freelancer profile for ${primaryService.title}. Focuses on structured execution, measurable outcomes, and proactive communication.`,
        skills,
        jobTitle,
        companyName: `Seed Freelancer Studio ${i + 1}`,
        location: `${city}, India`,
        rating,
        reviewCount,
        experienceYears,
        workExperience: buildWorkExperienceRows({
          service: primaryService,
          seedIndex: i
        }),
        services: uniqueServices.map((entry) => entry.key),
        portfolio: `https://seed-freelancer-${i + 1}.example.com`,
        linkedin: `https://linkedin.com/in/seed-freelancer-${i + 1}`,
        github: `https://github.com/seed-freelancer-${i + 1}`,
        portfolioProjects,
        resume: `https://cdn.example.com/resumes/seed-freelancer-${i + 1}.pdf`,
        profileDetails
      },
      create: {
        userId: user.id,
        bio: `Verified freelancer profile for ${primaryService.title}. Focuses on structured execution, measurable outcomes, and proactive communication.`,
        skills,
        jobTitle,
        companyName: `Seed Freelancer Studio ${i + 1}`,
        location: `${city}, India`,
        rating,
        reviewCount,
        experienceYears,
        workExperience: buildWorkExperienceRows({
          service: primaryService,
          seedIndex: i
        }),
        services: uniqueServices.map((entry) => entry.key),
        portfolio: `https://seed-freelancer-${i + 1}.example.com`,
        linkedin: `https://linkedin.com/in/seed-freelancer-${i + 1}`,
        github: `https://github.com/seed-freelancer-${i + 1}`,
        portfolioProjects,
        resume: `https://cdn.example.com/resumes/seed-freelancer-${i + 1}.pdf`,
        profileDetails
      }
    });

    await prisma.freelancerProject.deleteMany({
      where: { freelancerId: user.id }
    });

    const projectRows = buildFreelancerProjectRows({
      userId: user.id,
      services: uniqueServices,
      seedIndex: i,
      jobTitle,
      city,
      languages
    });

    if (projectRows.length > 0) {
      await prisma.freelancerProject.createMany({
        data: projectRows
      });
    }

    const serviceKeys = uniqueServices.map((entry) => entry.key);

    await prisma.marketplace.deleteMany({
      where: {
        freelancerId: user.id,
        serviceKey: { notIn: serviceKeys }
      }
    });

    for (const service of uniqueServices) {
      await prisma.marketplace.upsert({
        where: {
          freelancerId_serviceKey: {
            freelancerId: user.id,
            serviceKey: service.key
          }
        },
        update: {
          service: service.title,
          serviceDetails: buildMarketplaceDetails(service),
          isFeatured: i % 5 === 0
        },
        create: {
          freelancerId: user.id,
          serviceKey: service.key,
          service: service.title,
          serviceDetails: buildMarketplaceDetails(service),
          isFeatured: i % 5 === 0
        }
      });
    }

    created.push({
      id: user.id,
      email,
      fullName,
      status,
      services: serviceKeys
    });
  }

  return created;
};

const run = async () => {
  const { targetAccountId, proposalOwnerAccountId, freelancerCount } = parseCliArgs();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  console.log(
    `[seed_matching_test_data] Starting with targetAccountId=${targetAccountId}, proposalOwnerAccountId=${proposalOwnerAccountId}, freelancerCount=${freelancerCount}`
  );

  const targetFreelancer = await ensureTargetFreelancer({
    targetAccountId,
    passwordHash
  });
  const freelancerRows = await seedFreelancerAccounts({
    freelancerCount,
    passwordHash
  });
  const client = await ensureSeedClient({ passwordHash, proposalOwnerAccountId });

  const recipientPool = uniqueStrings([
    targetFreelancer?.id,
    ...freelancerRows.map((entry) => entry.id)
  ])
    .filter((id) => id && id !== client.id)
    .map((id) =>
      id === targetFreelancer.id
        ? {
            id: targetFreelancer.id,
            fullName: targetFreelancer.fullName || "Target Freelancer"
          }
        : freelancerRows.find((entry) => entry.id === id)
    )
    .filter(Boolean);

  const proposalRows = await seedServiceProposals({
    client,
    recipients: recipientPool
  });

  console.log("");
  console.log("[seed_matching_test_data] Completed successfully.");
  console.log(`- Target account: ${targetFreelancer.id}`);
  console.log(`- Proposal owner account: ${client.id}`);
  console.log(`- Seeded proposals: ${proposalRows.length}`);
  proposalRows.forEach((row, index) => {
    console.log(
      `  ${index + 1}. ${row.serviceKey} -> proposal ${row.proposalId} (project ${row.projectId}, status ${row.status})`
    );
  });
  console.log(`- Seeded freelancers: ${freelancerRows.length}`);
  console.log(`- Test password for seeded users: ${DEFAULT_PASSWORD}`);
  console.log("- Seeded freelancer emails:");
  freelancerRows.forEach((entry) => {
    console.log(`  - ${entry.email} [${entry.services.join(", ")}]`);
  });
};

run()
  .catch((error) => {
    console.error("[seed_matching_test_data] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
