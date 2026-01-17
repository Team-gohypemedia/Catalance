import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servicesData = JSON.parse(
  readFileSync(join(__dirname, "../data/servicesComplete.json"), "utf-8")
);

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_REFERER = process.env.FRONTEND_URL || "http://localhost:5173";

const stripMarkdownHeadings = (text = "") =>
  text.replace(/^\s*#{1,6}\s+/gm, "");

const formatWebsiteTypeLabel = (value = "") =>
  value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");

const buildWebsiteTypeReference = () => {
  const websiteService = servicesData.services.find(
    (service) => service.id === "website_uiux"
  );
  const websiteTypes = Array.isArray(websiteService?.website_types)
    ? websiteService.website_types
    : [];

  if (websiteTypes.length === 0) {
    return "";
  }

  const typeLines = websiteTypes.map((entry) => {
    const label = formatWebsiteTypeLabel(entry.type || "");
    const pages = Array.isArray(entry.pages) ? entry.pages.join(", ") : "";
    return `- ${entry.type} (${label}): ${pages}`;
  });

  const universalPages = Array.isArray(websiteService?.universal_pages)
    ? websiteService.universal_pages
    : [];
  const universalLine = universalPages.length
    ? `Universal pages (add when relevant): ${universalPages.join(", ")}`
    : "";

  return [
    "WEBSITE TYPE REFERENCE (use only for Website / UI-UX service):",
    ...typeLines,
    universalLine
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSystemPrompt = (selectedServiceName = "") => {
  const normalizedServiceName =
    typeof selectedServiceName === "string" ? selectedServiceName.trim() : "";
  const serviceContext = normalizedServiceName
    ? `SERVICE CONTEXT (preselected):
The user already chose the service: ${normalizedServiceName}.
Treat this as confirmed and DO NOT ask which service they want.`
    : "SERVICE CONTEXT: No preselected service.";
  const websiteTypeReference = buildWebsiteTypeReference();
  const servicesWithQuestions = servicesData.services
    .map((service) => {
      const questions = Array.isArray(service.questions)
        ? service.questions
          .map((q, idx) => {
            // For budget questions, replace with generic question without minimum
            if (q.id === "user_budget" || q.type === "number") {
              return `Q${idx + 1}: What is your budget for this project?`;
            }
            let questionText = `Q${idx + 1}: ${q.question}`;
            if (Array.isArray(q.options) && q.options.length > 0) {
              const options = q.options.map((o) => o.label).join(" | ");
              questionText += `\n   Options: ${options}`;
            }
            return questionText;
          })
          .join("\n")
        : "No specific questions";

      return [
        `SERVICE ${service.number}: ${service.name}`,
        `ID: ${service.id}`,
        "QUESTIONS TO ASK:",
        questions,
        "---"
      ].join("\n");
    })
    .join("\n");

  return `You are CATA, an expert business consultant AI for Catalance, a premium digital services agency. Your role is to understand client needs through a structured consultation process and generate detailed proposals.

${serviceContext}

CRITICAL CONTEXT AWARENESS RULES:
================================
1. ALWAYS read and remember EVERYTHING the user has mentioned in the conversation.
2. NEVER ask about information the user has already provided.
3. Extract ALL details from the user's messages, including:
   - Type of project (3D website, e-commerce, mobile app, etc.)
   - Industry/niche (restaurant, fitness, real estate, etc.)
   - Specific features mentioned (animations, payment integration, etc.)
   - Budget if mentioned
   - Timeline if mentioned
   - Any preferences or requirements stated
4. If the user says "I want a 3D website for my restaurant", you KNOW:
   - Service: Website Development
   - Type: 3D/Interactive website
   - Industry: Restaurant/Food & Beverage
   - DO NOT ask "What type of website?" or "What industry?"
5. Only ask questions about information NOT yet provided.
6. Acknowledge what they've already told you before asking new questions.

YOUR CONSULTATION PROCESS:

PHASE 0: INTRODUCTION & NAME COLLECTION
First, you MUST ask for the user's name. If the user provided it, confirm it (e.g., "Nice to meet you, [Name]!").
CRITICAL: Do NOT proceed to service identification or ask any other questions until you have the user's name.

PHASE 1: SERVICE IDENTIFICATION (with Context Awareness)
Once the name is known:
- Identify which service(s) they need based on their ENTIRE message history.
- If SERVICE CONTEXT is preselected, acknowledge it and move to requirements. Do NOT ask which service they want.
- If they already specified details (like "3D website", "e-commerce with payment", "mobile app for iOS"), acknowledge these and skip related questions.
- Only ask clarifying questions for missing information.

PHASE 2: REQUIREMENTS GATHERING (Smart Questioning)
Rules:
1. Review the ENTIRE conversation before asking each question.
2. Skip any question whose answer was already provided by the user.
3. Ask questions one at a time for better conversation flow.
4. When presenting options, EXCLUDE options the user has already chosen or ruled out.
5. Summarize what you know before asking the next question: "So you want a 3D website for your restaurant. Now, regarding the number of pages..."
6. Be conversational, not robotic.
7. For Website / UI-UX projects, when the user states a website type, check WEBSITE TYPE REFERENCE. If it matches, show the usual pages for that type and mention they can add or remove pages.
8. If the website type is unclear, ask a clarifying question and offer a few example types.
9. When confirming a website type, keep the response structured and clean using this exact format:
   Summary: <short acknowledgement + website type>
   Usual pages: <compact list>
   Note: You can add or remove pages as needed.
   Question: <ONE next question about missing requirements, with 2-4 examples in parentheses>

Examples of GOOD context-aware responses:
- User: "I want a 3D website for my fitness studio"
- Good: "A 3D website for your fitness studio sounds exciting! How many pages do you envision for the site?"
- Bad: "What type of website would you like?" (WRONG - they already said 3D website)

- User: "I need an iOS app for my delivery business with real-time tracking"
- Good: "An iOS delivery app with real-time tracking - great choice! Would you also need an Android version?"
- Bad: "What platform do you want the app on?" (WRONG - they said iOS)

PHASE 3: PROPOSAL GENERATION
CRITICAL ACCURACY RULES FOR PROPOSALS:
======================================
1. Use the EXACT values the user chose - do not paraphrase or change them.
2. If user chose "Flexible" timeline, write "Flexible" NOT "2-3 months".
3. If user said "5 pages", write "5 pages" NOT "5-10 pages".
4. If user chose a specific option from a list, use that EXACT option text.
5. Never override, interpret, or "improve" the user's stated choices.
6. When in doubt, quote exactly what the user said.

After gathering all required information, generate a detailed proposal using this structure:

PROJECT PROPOSAL
================
Client: [Name - EXACT name they provided]
Project Type: [Specific type based on conversation, e.g., "3D Interactive Restaurant Website"]

Understanding Your Needs:
[Summarize EVERYTHING they mentioned - be specific and accurate!]

Recommended Service: [Service Name]

Scope of Work:
[Detailed list of deliverables based on THEIR specific answers]

Timeline: [USE EXACT USER CHOICE - If they said "Flexible", write "Flexible". If they said "1 month", write "1 month". Do NOT change or interpret this value!]

Investment:
- Service Cost: INR [amount] (based on their stated budget and requirements)
- Payment Terms: [suggest terms based on their preference if mentioned]

What's Included:
[List specific deliverables - use EXACT options they selected]

Next Steps:
1. Confirm this proposal meets your requirements.
2. Schedule a discovery call with our team.
3. Begin project kick-off.
================

BUDGET HANDLING RULES (VERY IMPORTANT):
=======================================
1. If the user has not shared a budget yet, ask for it before moving on.
2. Set MIN_BUDGET to the minimum required for the selected service using the list below.
3. When asking about budget, DO NOT mention the minimum amount upfront.
4. Simply ask: "What is your budget for this project?" or "What budget do you have in mind for this?"
5. NEVER say things like "minimum ₹25,000" when asking.
6. ONLY AFTER the user gives their budget amount, compare it to MIN_BUDGET:
   - If the budget is EQUAL TO OR GREATER than MIN_BUDGET: Confirm it meets the minimum and continue to the next step.
   - If the budget is LOWER than MIN_BUDGET: Politely inform them that their amount is below the minimum required and ask if they can increase it.
   - If the user insists on proceeding with a lower budget after being informed: Explain you can continue but the quality may not be good due to the limited budget, then ask if they want to proceed with the current budget or increase it.
7. Use a friendly tone when informing about low budget, like:
   "I appreciate your budget of ₹15,000! However, for our [service name] service, we have a minimum project investment of ₹25,000 (MIN_BUDGET) to ensure we can deliver quality results. Would you be able to adjust your budget, or would you like me to suggest alternatives?"
8. NEVER reject the client outright - always offer to discuss or find alternatives.

Minimum budgets for reference (DO NOT mention to user unless they provide a lower amount):
- Branding: ₹25,000/project
- Website/UI-UX: ₹25,000/project
- SEO: ₹10,000/month
- Social Media Marketing: ₹10,000/month
- Paid Advertising: ₹25,000/month ad spend
- App Development: ₹1,00,000/project
- Software Development: ₹1,00,000/project
- Lead Generation: ₹15,000/month
- Influencer Marketing: ₹25,000/campaign
- Email Marketing: ₹10,000/month
- Video Production: ₹2,000/video
- CGI Videos: ₹25,000/project
- 3D Modeling: ₹1,00,000/project
- E-commerce Setup: ₹50,000/project

${websiteTypeReference}

AVAILABLE SERVICES AND QUESTIONS:
${servicesWithQuestions}

CONVERSATION GUIDELINES:
- Be warm, professional, and consultative.
- Use INR for all pricing.
- Keep responses focused and actionable.
- When asking questions, briefly explain why the information matters.
- If the user seems overwhelmed, offer to simplify.
- Do not use Markdown headings or bold. Avoid lines that start with # (including ##).
- Track conversation progress internally.
- ALWAYS acknowledge what you've learned before asking more questions.
- When enough information is gathered (at least 5 to 7 key questions answered), offer to generate the proposal.
- Always confirm before generating the final proposal.
- EVERY response must follow a structured format with labeled lines.
- Do NOT use the words "Options" or "Option" when listing choices.
- If presenting choices, ALWAYS list them as numbered items (1., 2., 3., ...), each on its own line.
- Never inline choices in a sentence like "(Options include: ...)".

REMEMBER: Your #1 job is to make the client feel HEARD. Never make them repeat themselves!`;
};

// ============================================
// PROPOSAL EXTRACTION & GENERATION LOGIC
// ============================================

const PROPOSAL_FIELDS = [
  "clientName",
  "serviceName",
  "projectType",
  "requirements",
  "timeline",
  "budget",
  "additionalDetails"
];

/**
 * Extract proposal data from conversation history
 */
const extractProposalData = (conversationHistory, aiResponse) => {
  const allMessages = [...conversationHistory, { role: "assistant", content: aiResponse }];
  const fullConversation = allMessages.map(m => m.content).join("\n");

  const proposalData = {
    clientName: null,
    serviceName: null,
    projectType: null,
    requirements: [],
    timeline: null,
    budget: null,
    additionalDetails: [],
    phases: []
  };

  // Extract client name
  const namePatterns = [
    /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /(?:name[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi
  ];
  for (const pattern of namePatterns) {
    const match = pattern.exec(fullConversation);
    if (match) {
      proposalData.clientName = match[1].trim();
      break;
    }
  }

  // Extract service type from conversation
  const servicePatterns = [
    /(?:want|need|looking for|interested in)\s+(?:a|an)?\s*(website|app|mobile app|branding|seo|marketing|e-commerce|ecommerce)/gi,
    /(?:service[:\s]+)(website|app|branding|seo|marketing|e-commerce)/gi,
    /(short[-\s]?news\s+app|news\s+app|mobile\s+app|web\s+app|saas|website)/gi
  ];
  for (const pattern of servicePatterns) {
    const match = pattern.exec(fullConversation);
    if (match) {
      proposalData.serviceName = match[1].trim();
      break;
    }
  }

  // Extract project type/description
  const projectPatterns = [
    /(?:build|create|develop|make)\s+(?:a|an)?\s*(.+?)(?:\.|for|with|that)/gi,
    /(?:project|idea|concept)[:\s]+(.+?)(?:\.|$)/gim
  ];
  for (const pattern of projectPatterns) {
    const match = pattern.exec(fullConversation);
    if (match && match[1].length > 10 && match[1].length < 200) {
      proposalData.projectType = match[1].trim();
      break;
    }
  }

  // Extract budget
  const budgetPatterns = [
    /(?:budget|spend|invest|pay)\s*(?:is|of|around|about|:)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)/gi,
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)/gi
  ];
  for (const pattern of budgetPatterns) {
    const match = pattern.exec(fullConversation);
    if (match) {
      let amount = match[1].replace(/,/g, "").trim();
      if (/lakh|lac|L/i.test(amount)) {
        amount = parseInt(amount) * 100000;
      } else if (/k/i.test(amount)) {
        amount = parseInt(amount) * 1000;
      }
      proposalData.budget = parseInt(amount) || null;
      break;
    }
  }

  // Extract timeline
  const timelinePatterns = [
    /(?:timeline|deadline|complete|launch|deliver)\s*(?:is|of|by|in|within|:)?\s*(\d+\s*(?:week|month|day)s?)/gi,
    /(?:within|in|by)\s+(\d+[-–]\d+\s*(?:week|month)s?)/gi,
    /(flexible|asap|urgent|no rush)/gi
  ];
  for (const pattern of timelinePatterns) {
    const match = pattern.exec(fullConversation);
    if (match) {
      proposalData.timeline = match[1].trim();
      break;
    }
  }

  // Extract requirements/features mentioned
  const featureKeywords = [
    "map", "location", "push notification", "offline", "dark mode", "light mode",
    "payment", "booking", "search", "filter", "categories", "admin", "dashboard",
    "analytics", "seo", "responsive", "mobile", "android", "ios", "flutter",
    "react", "next.js", "api", "backend", "database", "authentication", "login",
    "signup", "user profile", "social sharing", "bookmark", "wishlist", "cart"
  ];

  const lowerConv = fullConversation.toLowerCase();
  featureKeywords.forEach(keyword => {
    if (lowerConv.includes(keyword)) {
      proposalData.requirements.push(keyword);
    }
  });

  // Calculate collected fields
  let collectedCount = 0;
  if (proposalData.clientName) collectedCount++;
  if (proposalData.serviceName) collectedCount++;
  if (proposalData.projectType) collectedCount++;
  if (proposalData.requirements.length > 0) collectedCount++;
  if (proposalData.timeline) collectedCount++;
  if (proposalData.budget) collectedCount++;

  proposalData.progress = {
    collected: collectedCount,
    total: 6,
    isComplete: collectedCount >= 4 // Consider complete when 4+ fields are filled
  };

  return proposalData;
};

/**
 * Generate phased proposal structure based on extracted data and SELECTED SERVICE
 */
const generateProposalStructure = (proposalData, serviceName = "") => {
  const { clientName, projectType, requirements, timeline, budget } = proposalData;

  // Normalize the service name for matching
  const normalizedService = (serviceName || proposalData.serviceName || "").toLowerCase();

  // Service-specific phase definitions
  const SERVICE_PHASES = {
    // Branding Service
    branding: [
      {
        number: 1,
        name: "Discovery & Research",
        description: "Understanding your brand values, target audience, and market positioning.",
        deliverables: [
          "Brand audit & competitor analysis",
          "Target audience research",
          "Brand positioning strategy",
          "Mood board & creative direction"
        ],
        value: ["Clear brand direction", "Market differentiation", "Audience alignment"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Brand Identity Design",
        description: "Creating your complete visual identity system.",
        deliverables: [
          "Logo design (3 concepts + refinements)",
          "Color palette & typography system",
          "Brand guidelines document",
          "Social media kit",
          "Business card & letterhead design"
        ],
        value: ["Professional brand image", "Consistent identity", "Market-ready assets"],
        estimatedCost: 15000,
        estimatedDuration: "2 weeks"
      }
    ],

    // Website / UI-UX Service
    website: [
      {
        number: 1,
        name: "Discovery & Planning",
        description: "Understanding your requirements and planning the website structure.",
        deliverables: [
          "Requirements gathering",
          "Sitemap & information architecture",
          "Content strategy outline",
          "Technology recommendations"
        ],
        value: ["Clear project roadmap", "Structured approach", "Reduced revisions"],
        estimatedCost: 5000,
        estimatedDuration: "3-5 days"
      },
      {
        number: 2,
        name: "UI/UX Design",
        description: "Creating beautiful and functional designs.",
        deliverables: [
          "Wireframes for all pages",
          "High-fidelity UI designs",
          "Mobile responsive layouts",
          "Interactive prototype"
        ],
        value: ["User-friendly interface", "Modern aesthetics", "Conversion-optimized"],
        estimatedCost: 15000,
        estimatedDuration: "1-2 weeks"
      },
      {
        number: 3,
        name: "Development & Launch",
        description: "Building and deploying your website.",
        deliverables: [
          "Frontend development",
          "CMS integration",
          "SEO optimization",
          "Performance optimization",
          "Deployment & launch"
        ],
        value: ["Fast-loading website", "Easy content updates", "Search engine visibility"],
        estimatedCost: 15000,
        estimatedDuration: "2-3 weeks"
      }
    ],

    // App Development Service
    app: [
      {
        number: 1,
        name: "Planning & Architecture",
        description: "Defining the app structure and technical requirements.",
        deliverables: [
          "Feature specification document",
          "Technical architecture",
          "Database design",
          "API planning"
        ],
        value: ["Clear development roadmap", "Scalable foundation", "Reduced rework"],
        estimatedCost: 25000,
        estimatedDuration: "1-2 weeks"
      },
      {
        number: 2,
        name: "UI/UX Design",
        description: "Creating the app's visual design and user experience.",
        deliverables: [
          "User flow diagrams",
          "Wireframes",
          "High-fidelity app screens",
          "Dark & light mode designs",
          "Interactive prototype"
        ],
        value: ["Intuitive user experience", "Modern app design", "Design system"],
        estimatedCost: 40000,
        estimatedDuration: "2-3 weeks"
      },
      {
        number: 3,
        name: "App Development",
        description: "Building your mobile application.",
        deliverables: [
          "Cross-platform app (iOS & Android)",
          "Backend API development",
          "Database implementation",
          "Push notifications",
          "Third-party integrations"
        ],
        value: ["High-performance app", "Scalable backend", "Native-like experience"],
        estimatedCost: 300000,
        estimatedDuration: "8-12 weeks"
      },
      {
        number: 4,
        name: "Testing & Launch",
        description: "Quality assurance and app store deployment.",
        deliverables: [
          "Comprehensive testing",
          "Bug fixes & optimization",
          "App Store submission",
          "Play Store submission",
          "Launch support"
        ],
        value: ["Bug-free launch", "Store approval", "Smooth rollout"],
        estimatedCost: 35000,
        estimatedDuration: "1-2 weeks"
      }
    ],

    // SEO Service
    seo: [
      {
        number: 1,
        name: "SEO Audit & Strategy",
        description: "Comprehensive analysis and strategic planning.",
        deliverables: [
          "Technical SEO audit",
          "Keyword research",
          "Competitor analysis",
          "SEO strategy document"
        ],
        value: ["Clear SEO roadmap", "Targeted keywords", "Competitive edge"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "On-Page Optimization",
        description: "Optimizing your website for search engines.",
        deliverables: [
          "Meta tags optimization",
          "Content optimization",
          "Schema markup",
          "Internal linking structure",
          "Page speed improvements"
        ],
        value: ["Better rankings", "Improved CTR", "Faster loading"],
        estimatedCost: 15000,
        estimatedDuration: "2 weeks"
      },
      {
        number: 3,
        name: "Off-Page & Ongoing",
        description: "Building authority and continuous improvement.",
        deliverables: [
          "Backlink building",
          "Local SEO optimization",
          "Monthly performance reports",
          "Ongoing optimizations"
        ],
        value: ["Domain authority", "Local visibility", "Sustained growth"],
        estimatedCost: 10000,
        estimatedDuration: "Ongoing (monthly)"
      }
    ],

    // Social Media Marketing
    social: [
      {
        number: 1,
        name: "Strategy & Setup",
        description: "Creating your social media strategy.",
        deliverables: [
          "Platform strategy",
          "Content calendar",
          "Profile optimization",
          "Brand voice guidelines"
        ],
        value: ["Clear direction", "Consistent posting", "Brand consistency"],
        estimatedCost: 8000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Content Creation",
        description: "Creating engaging content for your platforms.",
        deliverables: [
          "20 social media posts/month",
          "Story designs",
          "Reel concepts & editing",
          "Caption writing"
        ],
        value: ["Engaging content", "Professional visuals", "Audience growth"],
        estimatedCost: 15000,
        estimatedDuration: "Ongoing (monthly)"
      }
    ],

    // E-commerce Service
    ecommerce: [
      {
        number: 1,
        name: "Store Planning",
        description: "Planning your online store structure.",
        deliverables: [
          "Store architecture",
          "Product categorization",
          "Payment gateway selection",
          "Shipping integration planning"
        ],
        value: ["Optimized store structure", "Clear product hierarchy", "Smooth checkout"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      },
      {
        number: 2,
        name: "Store Design & Development",
        description: "Building your e-commerce store.",
        deliverables: [
          "Custom store design",
          "Product page optimization",
          "Cart & checkout flow",
          "Payment integration",
          "Inventory management"
        ],
        value: ["Beautiful store", "High conversion rate", "Easy management"],
        estimatedCost: 40000,
        estimatedDuration: "3-4 weeks"
      },
      {
        number: 3,
        name: "Launch & Optimization",
        description: "Launching and optimizing your store.",
        deliverables: [
          "Product upload assistance",
          "SEO for products",
          "Performance optimization",
          "Analytics setup"
        ],
        value: ["Ready to sell", "Search visibility", "Data-driven growth"],
        estimatedCost: 10000,
        estimatedDuration: "1 week"
      }
    ]
  };

  // Map service name to phase key
  const getServiceKey = (name) => {
    const lowered = name.toLowerCase();
    if (lowered.includes("brand") || lowered.includes("logo") || lowered.includes("identity")) return "branding";
    if (lowered.includes("website") || lowered.includes("ui") || lowered.includes("ux") || lowered.includes("web")) return "website";
    if (lowered.includes("app") || lowered.includes("mobile") || lowered.includes("ios") || lowered.includes("android")) return "app";
    if (lowered.includes("seo") || lowered.includes("search engine")) return "seo";
    if (lowered.includes("social") || lowered.includes("marketing") || lowered.includes("instagram") || lowered.includes("facebook")) return "social";
    if (lowered.includes("ecommerce") || lowered.includes("e-commerce") || lowered.includes("shop") || lowered.includes("store")) return "ecommerce";
    return "website"; // Default to website
  };

  const serviceKey = getServiceKey(normalizedService);
  const selectedPhases = SERVICE_PHASES[serviceKey] || SERVICE_PHASES.website;

  // Renumber phases
  const phases = selectedPhases.map((phase, idx) => ({
    ...phase,
    number: idx + 1
  }));

  // Calculate total cost
  const totalCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

  // Build investment summary
  const investmentSummary = phases
    .filter(p => p.estimatedCost > 0)
    .map(p => ({
      component: p.name,
      cost: p.estimatedCost
    }));

  // Calculate total duration
  const getTotalDuration = () => {
    if (timeline) return timeline;
    if (serviceKey === "app") return "12-16 weeks";
    if (serviceKey === "ecommerce") return "5-6 weeks";
    if (serviceKey === "website") return "4-6 weeks";
    if (serviceKey === "branding") return "3 weeks";
    if (serviceKey === "seo") return "Ongoing";
    if (serviceKey === "social") return "Ongoing";
    return "4-6 weeks";
  };

  // Get service display name
  const getServiceDisplayName = () => {
    const names = {
      branding: "Branding & Identity",
      website: "Website Development",
      app: "App Development",
      seo: "SEO Services",
      social: "Social Media Marketing",
      ecommerce: "E-Commerce Store"
    };
    return names[serviceKey] || serviceName || "Digital Services";
  };

  return {
    projectTitle: projectType || `${getServiceDisplayName()} Project`,
    clientName: clientName || "Valued Client",
    serviceName: getServiceDisplayName(),
    objective: `To deliver a professional ${getServiceDisplayName().toLowerCase()} solution tailored to your specific needs and goals.`,
    phases: phases,
    investmentSummary: investmentSummary,
    totalInvestment: totalCost,
    timeline: {
      total: getTotalDuration()
    },
    features: requirements,
    isComplete: proposalData.progress?.isComplete || false,
    generatedAt: new Date().toISOString()
  };
};


/**
 * Check if AI response contains a proposal
 */
const containsProposal = (content) => {
  const proposalIndicators = [
    /PROJECT\s+PROPOSAL/i,
    /PROPOSAL/i,
    /Understanding\s+Your\s+Needs/i,
    /Scope\s+of\s+Work/i,
    /Investment:/i,
    /Recommended\s+Service/i
  ];
  return proposalIndicators.some(pattern => pattern.test(content));
};

export const chatWithAI = async (
  messages,
  conversationHistory = [],
  selectedServiceName = ""
) => {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured", 500);
  }

  const systemMessage = {
    role: "system",
    content: buildSystemPrompt(selectedServiceName)
  };

  const formattedHistory = Array.isArray(conversationHistory)
    ? conversationHistory
      .filter((msg) => msg && msg.content)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }))
    : [];

  const formattedMessages = Array.isArray(messages)
    ? messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }))
    : [];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": DEFAULT_REFERER,
      "X-Title": "Catalance AI Assistant"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [systemMessage, ...formattedHistory, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error?.message || "AI API request failed";
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      /user not found|invalid api key|unauthorized/i.test(errorMessage);

    if (isAuthError) {
      throw new AppError(
        "OpenRouter authentication failed. Verify OPENROUTER_API_KEY in your .env.",
        502
      );
    }

    throw new AppError(errorMessage, 502);
  }

  if (!data) {
    throw new AppError("AI API returned an invalid response", 502);
  }

  const content = data.choices?.[0]?.message?.content || "";

  // Extract proposal data from conversation
  const allHistory = [...formattedHistory, ...formattedMessages];
  const proposalData = extractProposalData(allHistory, content);

  // Generate proposal structure if enough data collected
  let proposal = null;
  let proposalProgress = proposalData.progress;

  if (proposalData.progress.collected >= 3 || containsProposal(content)) {
    proposal = generateProposalStructure(proposalData, selectedServiceName);
    proposal.isComplete = containsProposal(content) || proposalData.progress.isComplete;
  }

  return {
    success: true,
    message: stripMarkdownHeadings(content),
    usage: data.usage || null,
    proposal: proposal,
    proposalProgress: proposalProgress
  };
};

export const getServiceInfo = (serviceId) =>
  servicesData.services.find((service) => service.id === serviceId);

export const getAllServices = () => servicesData.services;

