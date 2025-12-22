export const service = "WhatsApp Chat Bot";
export const openingMessage =
  "Hi! Let's build a WhatsApp bot for your business. Tell me what you need.";

export const serviceDetails = `Sub-types: Lead Capture Bot, Sales Bot, Support Bot
Deliverables: Bot flow design, API integration, dashboard access
Pricing: Setup â‚¹15,000â€“â‚¹50,000 | Monthly â‚¹3,000â€“â‚¹15,000 (API extra)
Timelines: Full bot setup 7â€“14 days | Partial scope: Bot flow design only 3â€“5 days (â‚¹5,000â€“â‚¹15,000), API integration only 5â€“7 days (â‚¹8,000â€“â‚¹25,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "bot_type",
    patterns: ["primary use", "leads", "support", "sales"],
    templates: ["What is the primary use of the bot?"],
    suggestions: ["Leads", "Support", "Sales"],
  },
  {
    key: "flow_count",
    patterns: ["conversation flows", "flows", "paths"],
    templates: ["How many conversation flows are needed?"],
    suggestions: null,
  },
  {
    key: "languages",
    patterns: ["languages", "language"],
    templates: ["What languages are required?"],
    suggestions: null,
  },
  {
    key: "integrations",
    patterns: ["crm", "website", "integration"],
    templates: ["Do you need CRM or website integration?"],
    suggestions: ["CRM", "Website", "Both", "No"],
  },
  {
    key: "timeline",
    patterns: ["go-live", "timeline", "deadline"],
    templates: ["What is your go-live timeline?"],
    suggestions: null,
  },
  {
    key: "budget",
    patterns: ["budget", "range", "cost"],
    templates: ["What is your budget range?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;



