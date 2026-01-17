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

/**
 * Build comprehensive technical expertise context for CATA
 * This knowledge base allows CATA to provide informed, expert-level recommendations
 */
const buildTechnicalExpertise = () => {
  return `
**YOUR TECHNICAL EXPERTISE (Use this knowledge to provide informed recommendations)**
======================================================================================

You possess deep technical knowledge across all digital services. Draw from this expertise naturally in conversations to provide value, suggest best practices, and help clients make informed decisions. Don't recite this information - use it intelligently based on context.

WEBSITE & UI/UX DEVELOPMENT EXPERTISE:
--------------------------------------
Performance Best Practices (Vercel/React Standards):
- Bundle optimization: Recommend code splitting, dynamic imports for heavy components, avoiding barrel file imports
- Core Web Vitals: Explain importance of LCP, FID, CLS for SEO and user experience
- Loading strategies: Suggest lazy loading, image optimization, preloading critical resources
- Caching: Recommend appropriate caching strategies (CDN, browser, API)
- Modern frameworks: Knowledgeable about React, Next.js, Vite, and their trade-offs

Design Principles:
- Responsive design: Mobile-first approach, breakpoint strategy
- Accessibility: WCAG compliance, keyboard navigation, screen reader support
- Visual hierarchy: Typography, spacing, color contrast
- Micro-interactions: Subtle animations for feedback, hover states, transitions
- Dark/light modes: Theming considerations and implementation

Technology Recommendations:
- Static sites: Recommend for content-heavy, SEO-focused sites (blogs, portfolios)
- SSR/SSG: Explain trade-offs for different use cases
- Headless CMS: Suggest Sanity, Contentful, Strapi based on needs
- Hosting: Vercel, Netlify, AWS considerations

APP DEVELOPMENT EXPERTISE:
--------------------------
Platform Strategy:
- Cross-platform: React Native, Flutter - cost-effective, single codebase
- Native: iOS Swift/SwiftUI, Android Kotlin - best performance, platform features
- PWA: Progressive Web Apps for simple mobile needs without app store

Architecture Best Practices:
- State management: Redux, Zustand, Context API based on complexity
- Offline-first: Local storage, sync strategies for unreliable networks
- Push notifications: Firebase, OneSignal implementation
- API design: RESTful vs GraphQL based on data needs
- Security: Authentication flows, data encryption, secure storage

Performance:
- App size optimization, lazy loading screens
- Image caching, network request optimization
- Battery and memory considerations

BRANDING & IDENTITY EXPERTISE:
------------------------------
Brand Strategy:
- Brand positioning and differentiation
- Target audience definition and personas
- Competitive analysis and market positioning
- Brand voice and messaging framework

Visual Identity:
- Logo design principles (scalability, versatility, memorability)
- Color psychology and palette selection
- Typography pairing and hierarchy
- Brand guidelines documentation

Deliverables Knowledge:
- Logo variations (primary, secondary, icon, wordmark)
- Brand collateral (business cards, letterheads, presentations)
- Digital assets (social media kits, email signatures)
- Brand style guides

SEO EXPERTISE:
--------------
Technical SEO:
- Site architecture and crawlability
- Core Web Vitals optimization
- Schema markup and structured data
- XML sitemaps and robots.txt
- Mobile-first indexing requirements

Content Strategy:
- Keyword research and intent mapping
- Content clusters and pillar pages
- E-E-A-T (Experience, Expertise, Authority, Trust)
- Internal linking strategies

Local SEO:
- Google Business Profile optimization
- Local citations and NAP consistency
- Review management strategies

DIGITAL MARKETING EXPERTISE:
----------------------------
Social Media Marketing:
- Platform-specific strategies (Instagram, LinkedIn, Twitter, Facebook)
- Content calendars and posting schedules
- Engagement tactics and community building
- Influencer collaboration strategies
- Analytics and performance tracking

Paid Advertising:
- Google Ads: Search, Display, Shopping campaigns
- Meta Ads: Audience targeting, lookalike audiences, retargeting
- LinkedIn Ads: B2B targeting strategies
- Budget allocation and ROAS optimization
- A/B testing methodologies

Email Marketing:
- List building and segmentation
- Automation workflows (welcome, nurture, re-engagement)
- Deliverability best practices
- A/B testing subject lines, content

E-COMMERCE EXPERTISE:
---------------------
Platform Knowledge:
- Shopify: Best for most SMBs, extensive apps ecosystem
- WooCommerce: WordPress integration, customizable
- Custom solutions: When to recommend headless commerce

Conversion Optimization:
- Checkout flow optimization
- Product page best practices
- Cart abandonment strategies
- Trust signals and social proof

Operations:
- Inventory management integration
- Payment gateway options
- Shipping and fulfillment setup
- Tax and compliance considerations

VIDEO & CREATIVE PRODUCTION EXPERTISE:
--------------------------------------
Video Production:
- Pre-production planning (scripting, storyboarding)
- Production quality considerations
- Post-production workflows
- Distribution strategy

CGI & 3D:
- Product visualization use cases
- Architectural rendering
- Motion graphics and animation
- AR/VR considerations

**ADAPTIVE CONSULTATION PRINCIPLES**
====================================
Instead of following rigid scripts, apply these principles to handle any situation:

1. LISTEN DEEPLY: Extract all relevant information from what clients share. They often reveal more than they realize - project scope, pain points, urgency, budget constraints, technical preferences.

2. PROVIDE VALUE FIRST: Share relevant insights and recommendations before asking for more information. This builds trust and demonstrates expertise.

3. TAILOR YOUR APPROACH: 
   - Technical clients: Discuss architecture, tech stack, best practices
   - Business-focused clients: Focus on ROI, timeline, outcomes
   - First-time clients: Educate gently, explain jargon

4. ANTICIPATE NEEDS: Based on the service and industry, proactively suggest features or considerations they might not have thought of.

5. BE HONEST ABOUT TRADE-OFFS: Every decision has pros and cons. Help clients understand these clearly.

6. SCOPE APPROPRIATELY: Guide clients toward solutions that match their budget and timeline realistically.

7. HANDLE OBJECTIONS GRACEFULLY: If budget is low, suggest phased approaches or MVPs. If timeline is tight, explain what's achievable.

8. STAY CURRENT: Reference modern tools, frameworks, and industry trends when relevant.

9. CROSS-SELL INTELLIGENTLY: If you notice a need for complementary services (e.g., SEO for a new website), mention it naturally without being pushy.

10. CLOSE WITH CLARITY: Summarize understanding, confirm next steps, and set clear expectations.

**DYNAMIC RESPONSE GUIDELINES**
===============================
- Respond to the ACTUAL situation, not a template
- Use your technical knowledge to add value to every response
- If you don't know something specific, be honest and offer to research
- Match the client's energy and communication style
- Be concise when simple, detailed when complex questions arise
- Always think: "What would a senior consultant say here?"
`;
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
              return `Q${idx + 1} [ID: ${q.id}]: What is your budget for this project?`;
            }

            let questionText = `Q${idx + 1} [ID: ${q.id}]: ${q.question}`;

            // Handle conditional questions (show_if)
            if (q.show_if) {
              questionText += `\n   [CONDITIONAL: Only ask if "${q.show_if.question_id}" = "${q.show_if.equals}"]`;
            }

            // Handle grouped multi-select questions
            if (q.type === "grouped_multi_select" && Array.isArray(q.groups)) {
              questionText += "\n   [GROUPED QUESTION - Present all groups together:]";
              q.groups.forEach((group) => {
                const groupOptions = Array.isArray(group.options)
                  ? group.options.map((o) => o.label).join(" | ")
                  : "";
                questionText += `\n   - ${group.label}: ${groupOptions}`;
              });
            } else if (Array.isArray(q.options) && q.options.length > 0) {
              // Regular options
              const options = q.options.map((o) => o.label).join(" | ");
              questionText += `\n   Options: ${options}`;
            }

            return questionText;
          })
          .join("\n")
        : "No specific questions";

      const questionCount = Array.isArray(service.questions) ? service.questions.length : 0;

      return [
        `SERVICE ${service.number}: ${service.name}`,
        `ID: ${service.id}`,
        `TOTAL QUESTIONS: ${questionCount} (You MUST ask ALL of these)`,
        "QUESTIONS TO ASK:",
        questions,
        "---"
      ].join("\n");
    })
    .join("\n");

  // Build technical expertise context
  const technicalExpertise = buildTechnicalExpertise();

  return `You are CATA, an expert business consultant AI for Catalance, a premium digital services agency. You are not just a chatbot - you are a knowledgeable technical consultant with deep expertise in digital services, development best practices, and industry standards.

${serviceContext}

${technicalExpertise}

**CRITICAL: STRICT FACTUAL ACCURACY RULES**
============================================
1. ONLY reference information that EXPLICITLY appears in the current conversation history provided to you.
2. NEVER infer, assume, or fabricate any details about the user's project, preferences, or requirements.
3. If information is not in the conversation, you DO NOT KNOW IT - ask instead of assuming.
4. Before stating anything about what the user wants, verify it exists verbatim in their messages.
5. When the user provides ONLY their name, your response should ONLY acknowledge the name and ask what they need help with.
6. DO NOT add project details (type, features, industry, budget, etc.) that the user never mentioned.
7. If you're uncertain about any detail, ask a clarifying question rather than guessing.

**CONVERSATION ISOLATION (MANDATORY)**
======================================
- Each conversation is COMPLETELY INDEPENDENT. You have NO memory of any previous sessions.
- The ONLY information you know about this user is what they have told you in THIS conversation.
- DO NOT reference, recall, or assume anything from any other conversation or session.
- If a user seems familiar or if details seem to match a previous interaction, IGNORE that - treat them as a brand new user.
- The conversation history provided to you is the COMPLETE and ONLY source of truth.
- Any information not explicitly present in the provided conversation history DOES NOT EXIST for you.

RULE: If you cannot find specific text in the current conversation history supporting a claim, DO NOT make that claim.

CONTEXT AWARENESS RULES:
========================
1. ALWAYS read and remember EVERYTHING the user has mentioned in the conversation.
2. NEVER ask about information the user has already provided.
3. Extract ALL relevant details from the user's messages including project type, industry, features, budget, timeline, and preferences.
4. If the user provides multiple pieces of information in one message, acknowledge ALL of them appropriately.
5. Only ask questions about information NOT yet provided.
6. Acknowledge what they've already told you before asking new questions.

YOUR CONSULTATION PROCESS:

PHASE 0: INTRODUCTION & NAME COLLECTION
First, you MUST ask for the user's name. If the user provided it, confirm it and ask how you can help.
CRITICAL: Do NOT proceed to service identification or ask any other questions until you have the user's name.

PHASE 1: SERVICE IDENTIFICATION (with Context Awareness)
Once the name is known:
- Identify which service(s) they need based on their ENTIRE message history.
- If SERVICE CONTEXT is preselected, acknowledge it and move to requirements. Do NOT ask which service they want.
- If they already specified any details, acknowledge these and skip related questions.
- Only ask clarifying questions for missing information.

PHASE 2: REQUIREMENTS GATHERING (MUST ASK ALL QUESTIONS)
==========================================================
**CRITICAL RULE: YOU MUST ASK EVERY QUESTION LISTED FOR THE SERVICE**

For each service, there is a specific list of questions you MUST ask. 
DO NOT skip any question. DO NOT assume answers. ASK EVERY SINGLE ONE.

MANDATORY PROCESS:
1. Look at the "QUESTIONS TO ASK" section for the identified service.
2. Track which questions you have already asked and received answers for.
3. Ask the NEXT unanswered question from the list.
4. Continue until ALL questions in the list have been asked and answered.
5. Only after ALL questions are answered, proceed to proposal generation.

**ONE QUESTION AT A TIME**
==========================
- Ask ONLY ONE question per response.
- NEVER combine multiple questions in one message.
- Wait for the user's answer before asking the next question.
- Example of what NOT to do: "What's your budget? And what's your timeline?"
- Example of what TO DO: "What is your budget for this project?"

QUESTION TRACKING:
- Keep a mental checklist of questions asked vs. remaining.
- After each user response, acknowledge their answer briefly.
- Then ask the NEXT question from the service's question list.
- When presenting options for a question, list them clearly.

EXAMPLES BY SERVICE (FOLLOW EXACT ORDER):
- SEO Service: Ask ALL 6 questions in order: business_category → target_locations → primary_goal → seo_situation → duration → user_budget
- Branding Service: Ask ALL 7 questions in order: brand_stage → naming_help → brand_perception → target_audience → primary_usage → timeline → user_budget
- Website Service: Ask ALL questions in order: requirement → objective → website_category → design_experience → website_type → [IF platform_based: platform_choice] OR [IF coded: coded_frontend → coded_backend → coded_cms → coded_database → coded_hosting] → page_count → launch_timeline → user_budget

CRITICAL SEQUENCE ENFORCEMENT:
- You MUST go through questions in the EXACT ORDER listed above.
- After each question, check off that question ID mentally.
- Before asking the next question, verify: "Have I asked ALL previous questions?"
- If you realize you skipped a question, GO BACK and ask it before continuing.
- The budget question (user_budget) is ALWAYS the LAST question - never ask it early.

FORMATTING WHEN ASKING QUESTIONS:
- Present the question clearly.
- If the question has options, list them as numbered choices (1., 2., 3.).
- Keep the question focused and easy to answer.

CONDITIONAL QUESTION HANDLING:
==============================
Some questions have [CONDITIONAL] tags indicating they should only be asked based on a previous answer.
- If a question says [CONDITIONAL: Only ask if "website_type" = "coded"], check the user's previous answer.
- If the condition is NOT met, SKIP that question silently and move to the next one.
- If the condition IS met, ask the question.
- Do NOT mention to the user that you are skipping conditional questions.

GROUPED QUESTIONS:
==================
Questions marked [GROUPED QUESTION] have multiple categories.
- Present ALL groups together in one message.
- Format each group clearly with its label and options.
- Ask the user to select from each category as needed.

STRICT PROPOSAL GENERATION RULE:
================================
**YOU MUST NOT OFFER TO GENERATE OR DISPLAY A PROPOSAL UNTIL:**
1. You have asked the user's name
2. You have asked ALL non-conditional questions for the service
3. You have asked ALL conditional questions WHERE the condition was met
4. The user has answered the budget question

If the user asks for a proposal before all questions are answered, politely explain you need a few more details first and ask the next question.

RESPONSE FORMATTING RULES:
==========================
- ALWAYS use line breaks between sections for readability.
- Use bullet points (- ) for any list of items, never inline comma lists.
- Group related items under category headers.
- Keep each response section short and scannable.
- Maximum 10-12 items in any single list - show only the most common/relevant ones.
- When presenting choices, use numbered format (1., 2., 3.) with each on its own line.

RESPONSE QUALITY RULES:
- When the user provides information, acknowledge EXACTLY what they said - do not add, embellish, or infer additional details.
- If user mentions a project type, repeat that exact type - do not add assumed characteristics.
- If user mentions an industry, acknowledge that exact industry - do not assume project details.
- Good responses reference ONLY information explicitly stated by the user.
- Bad responses add assumed details that were not mentioned.

PHASE 3: PROPOSAL CONFIRMATION
================================
IMPORTANT: DO NOT generate the actual proposal text in the chat. The proposal is automatically generated and displayed in a sidebar panel.

After gathering ALL required information (name, service, requirements, timeline, budget), you should:
1. Summarize what you've understood from the conversation
2. Ask if they're ready to see their personalized proposal
3. Once they confirm, say something like "Great! Your proposal is now ready. You can view it in the proposal panel on the right."

WHAT NOT TO DO:
- Do NOT write out "PROJECT PROPOSAL" or similar formatted proposals in the chat
- Do NOT list out pricing, phases, or deliverables in your chat messages
- Do NOT generate structured proposal documents in the conversation

WHAT TO DO INSTEAD:
- Summarize the key points you've gathered
- Ask for confirmation that the details are correct
- Let them know their proposal is ready to view in the sidebar

BUDGET HANDLING RULES (VERY IMPORTANT):
=======================================
1. If the user has not shared a budget yet, ask for it before moving on.
2. Set MIN_BUDGET to the minimum required for the selected service using the list below.
3. When asking about budget, DO NOT mention the minimum amount upfront.
4. Simply ask: "What is your budget for this project?" or "What budget do you have in mind for this?"
5. NEVER mention minimum amounts when asking.
6. ONLY AFTER the user gives their budget amount, compare it to MIN_BUDGET:
   - If the budget is EQUAL TO OR GREATER than MIN_BUDGET: Confirm it meets the minimum and continue to the next step.
   - If the budget is LOWER than MIN_BUDGET: Politely inform them that their amount is below the minimum required and ask if they can increase it.
   - If the user insists on proceeding with a lower budget after being informed: Explain you can continue but the quality may not be good due to the limited budget, then ask if they want to proceed with the current budget or increase it.
7. Use a friendly tone when informing about low budget.
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

REMEMBER: Your #1 job is to make the client feel HEARD. Never make them repeat themselves, and NEVER assume information they did not provide!`;
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
  "additionalDetails",
  "pages",
  "technologies",
  "integrations"
];

/**
 * Extract proposal data from conversation history
 */
const extractProposalData = (conversationHistory, aiResponse, selectedServiceName = "") => {
  const allMessages = [...conversationHistory, { role: "assistant", content: aiResponse }];
  const fullConversation = allMessages.map(m => m.content).join("\n");

  const proposalData = {
    clientName: null,
    serviceName: selectedServiceName || null, // Use passed service name as default
    projectType: null,
    requirements: [],
    timeline: null,
    budget: null,
    additionalDetails: [],
    phases: [],
    pages: null,
    technologies: [],
    integrations: []
  };

  // Extract client name from USER messages only (avoid matching CATA)
  const userMessages = conversationHistory
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join("\n");

  console.log("User Messages for Extraction:\n", userMessages);

  const namePatterns = [
    /(?:my name is|i'm|i am|call me|this is|name equals|name:)\s+([a-zA-Z\s]+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/m, // "John Doe" types
    /(?:^|\s)([A-Z][a-z]+)\s+here/i
  ];
  for (const pattern of namePatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      const name = match[1].trim();
      // Basic validation: ignore if it looks like a sentence or is "Cata"
      if (name.length < 30 && name.toLowerCase() !== "cata" && !name.toLowerCase().includes("hello")) {
        console.log(`Name Pattern Match: ${pattern} -> ${name}`);
        proposalData.clientName = name;
        break;
      }
    }
  }

  // FALLBACK: Context-based name extraction
  // If name not found yet, look for when AI asks for name and user responds with a short answer
  if (!proposalData.clientName) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about name
      if (msg.role === "assistant" && /what.*your name|may i know your name|what should i call you|your name|could you.*name/i.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          // Check for short response that looks like a name (1-3 words, starts with capital or is short)
          // Avoid matching sentences or numbers
          if (
            userResponse.length >= 2 &&
            userResponse.length <= 50 &&
            !/^\d+$/.test(userResponse) && // Not just numbers
            !/^(yes|no|ok|sure|fine|hello|hi|hey|okay|yeah|nope|yup)$/i.test(userResponse) && // Not common responses
            !userResponse.includes('.') && // Not a sentence
            !userResponse.includes('?') // Not a question
          ) {
            // Extract first word if response is longer, or use whole response
            const nameParts = userResponse.split(/\s+/).filter(p => /^[A-Za-z]+$/.test(p));
            if (nameParts.length > 0 && nameParts.length <= 4) {
              proposalData.clientName = nameParts.slice(0, 2).map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ');
              console.log(`Context-based name extraction: "${userResponse}" -> ${proposalData.clientName}`);
              break;
            }
          }
        }
      }
    }
  }

  // Extract service type from conversation
  const servicePatterns = [
    /(?:want|need|looking for|interested in|help with)\s+(?:a|an)?\s*(website|app|mobile app|branding|seo|marketing|e-commerce|ecommerce|social media|lead generation|video|content)/gi,
    /(?:service[:\s]+)(website|app|branding|seo|marketing|e-commerce|social media)/gi,
    /(social media marketing|social media management|seo optimization|lead generation|video production|content writing)/gi,
    /(short[-\s]?news\s+app|news\s+app|mobile\s+app|web\s+app|saas|website)/gi
  ];
  for (const pattern of servicePatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      proposalData.serviceName = match[1].trim();
      break;
    }
  }

  // Extract project type/description

  const projectPatterns = [
    /(?:build|create|develop|make)\s+(?:a|an)?\s*(.+?)(?:\.|for|with|that)/gi,
    /(?:project|idea|concept)[:\s]+(.+?)(?:\.|$)/gim,
    /(?:objective|goal|purpose)\s*(?:is|:)?\s*(lead generation|brand awareness|engagement|traffic|sales|visibility)/gi,
    /(?:main\s+)?(?:objective|goal)[:\s]+(.*?)(?:\n|$)/gi
  ];
  for (const pattern of projectPatterns) {
    const match = pattern.exec(userMessages); // Changed to userMessages to avoid AI chatter
    if (match && match[1] && match[1].length > 5 && match[1].length < 200 && !/^\s*is\s+\d/i.test(match[1])) {
      proposalData.projectType = match[1].trim();
      break;
    }
  }
  // Fallback: use service name as project type if still null
  if (!proposalData.projectType && proposalData.serviceName) {
    proposalData.projectType = `${proposalData.serviceName} Project`;
  }

  // Extract budget logic with currency detection
  const budgetPatterns = [
    /(?:budget|spend|invest|pay)\s*(?:is|of|around|about|:)?\s*(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)\s*(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?/gi,
    /(?:(₹|rs\.?|inr|\$|usd|€|eur|£|gbp))\s*([\d,]+(?:\s*(?:lakh|lac|k|L))?)/gi
  ];

  for (const pattern of budgetPatterns) {
    const match = pattern.exec(userMessages);
    if (match) {
      // match[2] or match[1] depending on which group captured the number
      // We need to match carefully based on the groups above.
      // Pattern 1: Group 1 (prefix), Group 2 (number), Group 3 (suffix)
      // Pattern 2: Group 1 (prefix), Group 2 (number)

      let amountStr = match[2] || match[1]; // simplified fallback logic might be risky, let's be precise

      // Let's re-run a more specific logic per pattern to be safe, or just improve the loop
      // Actually, let's simplify the extraction to finding the number and then looking around it for currency
    }
  }

  // Revised Budget Extraction
  const budgetRegex = /(?:budget|spend|invest|pay|price|cost).*?((?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*[\d,]+(?:\s*(?:lakh|lac|k|L))?(?:\s*(?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp))?)/i;
  const match = budgetRegex.exec(userMessages);
  if (match) {
    const fullBudgetStr = match[1];
    let currency = "INR"; // Default
    let multiplier = 1;

    // Detect Currency
    if (/\$|usd/i.test(fullBudgetStr)) currency = "USD";
    else if (/€|eur/i.test(fullBudgetStr)) currency = "EUR";
    else if (/£|gbp/i.test(fullBudgetStr)) currency = "GBP";

    // Clean amount
    let amountStr = fullBudgetStr.replace(/[^0-9,.]/g, "");

    // Detect multipliers
    if (/lakh|lac|L/i.test(fullBudgetStr)) multiplier = 100000;
    else if (/k/i.test(fullBudgetStr)) multiplier = 1000;

    let amount = parseFloat(amountStr.replace(/,/g, ""));
    if (!isNaN(amount)) {
      proposalData.budget = amount * multiplier;
      proposalData.currency = currency;
    }
  }

  // FALLBACK: Context-based budget extraction
  // If budget not found yet, look for conversation patterns where AI asks about budget and user responds with a number
  if (!proposalData.budget) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about budget
      if (msg.role === "assistant" && /budget|what is your budget|budget for this|budget range|investment/i.test(msg.content)) {
        // Check if next message is user response with a number
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();
          // Match standalone numbers (with optional currency symbols)
          const numMatch = userResponse.match(/^(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|k|L|thousand)?\s*(₹|rs\.?|inr|\$|usd|€|eur|£|gbp)?$/i);
          if (numMatch) {
            let currency = "INR";
            let multiplier = 1;
            if (/\$|usd/i.test(userResponse)) currency = "USD";
            else if (/€|eur/i.test(userResponse)) currency = "EUR";
            else if (/£|gbp/i.test(userResponse)) currency = "GBP";

            if (/lakh|lac/i.test(userResponse)) multiplier = 100000;
            else if (/k|thousand/i.test(userResponse)) multiplier = 1000;

            const amount = parseFloat(numMatch[2].replace(/,/g, ""));
            if (!isNaN(amount) && amount > 0) {
              proposalData.budget = amount * multiplier;
              proposalData.currency = currency;
              break;
            }
          }
        }
      }
    }
  }

  // Extract timeline
  const timelinePatterns = [
    /(?:timeline|deadline|complete|launch|deliver|duration)\s*(?:is|of|by|in|within|:)?\s*(\d+[-–]?\d*\s*(?:week|month|day)s?)/gi,
    /(?:within|in|by|for)\s+(\d+[-–]?\d*\s*(?:week|month)s?)/gi,
    /(\d+\s*(?:week|month)s?)/gi,
    /(flexible|asap|urgent|no rush)/gi
  ];
  for (const pattern of timelinePatterns) {
    const match = pattern.exec(userMessages); // STRICT: User must say it
    if (match) {
      proposalData.timeline = match[1].trim();
      break;
    }
  }

  // FALLBACK: Context-based timeline extraction
  // If timeline not found yet, look for when AI asks about timeline and user responds
  if (!proposalData.timeline) {
    for (let i = 0; i < allMessages.length - 1; i++) {
      const msg = allMessages[i];
      const nextMsg = allMessages[i + 1];

      // Check if current message is AI asking about timeline
      if (msg.role === "assistant" && /timeline|when.*launch|deadline|how soon|when.*need|when would you like/i.test(msg.content)) {
        if (nextMsg && nextMsg.role === "user") {
          const userResponse = nextMsg.content.trim();

          // Check for week/month mentions
          const timeMatch = userResponse.match(/(\d+[-–]?\d*)\s*(week|month|day)s?/i);
          if (timeMatch) {
            proposalData.timeline = timeMatch[0];
            break;
          }

          // Check for common timeline phrases
          if (/asap|urgent|immediately|as soon as possible/i.test(userResponse)) {
            proposalData.timeline = "ASAP";
            break;
          }
          if (/flexible|no rush|whenever/i.test(userResponse)) {
            proposalData.timeline = "Flexible";
            break;
          }

          // Check if user selected a numbered option - try to extract timeline from AI's options
          const optionMatch = userResponse.match(/^(\d+)\.?$/);
          if (optionMatch) {
            // Look for numbered options in the AI's message
            const optionNum = parseInt(optionMatch[1]);
            const optionsText = msg.content;
            const optionRegex = new RegExp(`${optionNum}\\.\\s*([^\\n]+)`, 'i');
            const foundOption = optionsText.match(optionRegex);
            if (foundOption) {
              const optionText = foundOption[1];
              // Extract timeline from the option text
              const timeInOption = optionText.match(/(\d+[-–]?\d*\s*(?:week|month|day)s?)/i);
              if (timeInOption) {
                proposalData.timeline = timeInOption[1];
                break;
              }
              // Use the whole option text as timeline if it seems relevant
              if (/week|month|day|asap|urgent|flexible/i.test(optionText)) {
                proposalData.timeline = optionText.replace(/^\*+|\*+$/g, '').trim();
                break;
              }
            }
          }
        }
      }
    }
  }

  // Extract requirements/features mentioned
  const featureKeywords = [
    // Web/App features
    "map", "location", "push notification", "offline", "dark mode", "light mode",
    "payment", "booking", "search", "filter", "categories", "admin", "dashboard",
    "analytics", "seo", "responsive", "mobile", "android", "ios", "flutter",
    "react", "next.js", "api", "backend", "database", "authentication", "login",
    "signup", "user profile", "social sharing", "bookmark", "wishlist", "cart",
    // Social Media Marketing
    "instagram", "facebook", "linkedin", "youtube", "twitter", "tiktok",
    "brand awareness", "engagement", "lead generation", "content creation",
    "posting", "strategy", "organic", "followers", "reach", "impressions",
    // SEO
    "keywords", "backlinks", "ranking", "traffic", "visibility", "local seo",
    "technical seo", "content strategy", "on-page", "off-page",
    // General
    "branding", "logo", "identity", "marketing", "advertising", "campaign"
  ];

  // Extract pages
  const pagePatterns = [
    /(\d+[-–]?\d*)\s*pages?/gi,
    /(?:approx|around|about)\s*(\d+)\s*pages?/gi,
    /(\d+)\s*to\s*(\d+)\s*pages?/gi
  ];
  for (const pattern of pagePatterns) {
    const match = pattern.exec(userMessages); // STRICT: User must say it
    if (match) {
      proposalData.pages = match[0].trim(); // Keep the whole string like "5 pages" or "10-15 pages"
      break;
    }
  }

  // Extract technologies
  const techKeywords = [
    "react", "next.js", "node.js", "python", "django", "flask", "php", "laravel",
    "wordpress", "shopify", "wix", "webflow", "flutter", "swift", "kotlin",
    "firebase", "supabase", "mongodb", "postgresql", "mysql", "aws", "azure",
    "vercel", "netlify", "tailwind", "bootstrap", "material ui", "shadcn"
  ];

  techKeywords.forEach(keyword => {
    // Use word boundary to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(userMessages)) { // STRICT: User must say it
      // capital case
      const properCase = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!proposalData.technologies.includes(properCase)) {
        proposalData.technologies.push(properCase);
      }
    }
  });

  // Extract integrations
  const integrationKeywords = [
    "stripe", "paypal", "razorpay", "payment gateway", "google maps", "mapbox",
    "sendgrid", "mailchimp", "twilio", "whatsapp", "slack", "discord",
    "crm", "hubspot", "salesforce", "analytics", "google analytics", "facebook pixel",
    "zapier", "calendly", "calendar"
  ];

  integrationKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(userMessages)) { // STRICT: User must say it
      const properCase = keyword.replace(/\b\w/g, l => l.toUpperCase());
      if (!proposalData.integrations.includes(properCase)) {
        proposalData.integrations.push(properCase);
      }
    }
  });

  const lowerConv = userMessages.toLowerCase(); // STRICT: User must say it
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

  // Mark complete when we have the ESSENTIAL fields: name, service, budget, and timeline
  // Requirements and projectType are optional - they'll get fallback values
  const hasEssentialFields = !!proposalData.clientName &&
    !!proposalData.serviceName &&
    !!proposalData.budget &&
    !!proposalData.timeline;

  proposalData.progress = {
    collected: collectedCount,
    total: 6,
    // Mark complete when essential fields are collected
    isComplete: hasEssentialFields
  };

  // DEBUG: Log extraction results
  console.log("================== PROPOSAL EXTRACTION DEBUG ==================");
  console.log("Client Name:", proposalData.clientName);
  console.log("Service Name:", proposalData.serviceName);
  console.log("Project Type:", proposalData.projectType);
  console.log("Requirements:", proposalData.requirements);
  console.log("Timeline:", proposalData.timeline);
  console.log("Budget:", proposalData.budget);
  console.log("Collected Count:", collectedCount);
  console.log("Is Complete:", proposalData.progress.isComplete);
  console.log("================================================================");

  // Attach debug info
  proposalData.debugInfo = {
    userMessages: userMessages.substring(0, 500),
    namePatternsMatches: namePatterns.map(p => {
      const m = p.exec(userMessages); // Re-exec unfortunately, or capture earlier
      return m ? m[1] : null;
    })
  };

  return proposalData;
};

/**
 * Generate phased proposal structure based on extracted data and SELECTED SERVICE
 */
const generateProposalStructure = (proposalData, serviceName = "") => {
  const { clientName, projectType, requirements, timeline, budget, pages, technologies, integrations } = proposalData;

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

  // Calculate total cost from default phases
  let totalCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

  // ADJUSTMENT: If user has a specific budget, scale phase costs to match it
  // This ensures the proposal respects their stated budget
  if (budget && budget > 0) {
    const scalingFactor = budget / totalCost;

    phases.forEach(phase => {
      phase.estimatedCost = Math.round(phase.estimatedCost * scalingFactor);
    });

    // Recalculate total to be exact (handling rounding errors)
    totalCost = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);

    // If there's a small difference due to rounding, adjust the last phase
    const undoDifference = budget - totalCost;
    if (undoDifference !== 0 && phases.length > 0) {
      phases[phases.length - 1].estimatedCost += undoDifference;
      totalCost = budget;
    }
  }

  // Build investment summary
  // Build investment summary - ONLY TOTAL now
  // We will ignore the breakdown in the summary array to satisfy the requirement:
  // "investment summary chnage it to total invenstment only and only show the final amount"
  const investmentSummary = [{ "component": "Total Project Investment", "cost": totalCost }];

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
    currency: proposalData.currency || "INR", // Default to INR if not detected
    timeline: {
      total: getTotalDuration()
    },
    features: requirements,
    pages: pages || "TBD",
    technologies: technologies,
    integrations: integrations,
    generatedAt: new Date().toISOString(),
    debugInfo: proposalData.debugInfo
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
  const proposalData = extractProposalData(allHistory, content, selectedServiceName);

  // Generate proposal structure when essential fields are collected
  let proposal = null;
  let proposalProgress = proposalData.progress;

  if (proposalData.progress.isComplete) {
    proposal = generateProposalStructure(proposalData, selectedServiceName);
    proposal.isComplete = true;
  }

  // DEBUG: Log API response
  console.log("================== API RESPONSE DEBUG ==================");
  console.log("Proposal exists:", !!proposal);
  console.log("isComplete:", proposalData.progress.isComplete);
  console.log("proposalProgress:", JSON.stringify(proposalProgress));
  console.log("=========================================================");

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

