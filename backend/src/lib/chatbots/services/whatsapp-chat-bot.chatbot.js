export const service = "WhatsApp Chat Bot";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: Lead Capture Bot, Sales Bot, Support Bot
Deliverables: Bot flow design, API integration, dashboard access
Pricing: Setup â‚¹15,000â€“â‚¹50,000 | Monthly â‚¹3,000â€“â‚¹15,000 (API extra)
Timelines: Full bot setup 7â€“14 days | Partial scope: Bot flow design only 3â€“5 days (â‚¹5,000â€“â‚¹15,000), API integration only 5â€“7 days (â‚¹8,000â€“â‚¹25,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "primary_purpose",
    patterns: ["primary purpose", "purpose", "lead generation", "support", "order"],
    templates: ["What is the primary purpose of the WhatsApp chatbot?"],
    suggestions: [
      "Lead generation",
      "Customer support",
      "Order booking or enquiries",
      "A combination of these",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "whatsapp_api_approved",
    patterns: ["whatsapp business api", "api approved", "approval"],
    templates: ["Is your WhatsApp Business API already approved?"],
    suggestions: ["Yes, it is ready", "No, setup is required"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "chatbot_actions",
    patterns: ["actions", "faq", "leads", "payments", "bookings"],
    templates: ["What actions should the chatbot be able to perform?"],
    suggestions: ["Answer FAQs", "Qualify leads", "Accept payments or bookings"],
    multiSelect: true,
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "languages",
    patterns: ["languages", "language"],
    templates: ["Which languages should the chatbot support?"],
    suggestions: ["English", "Regional language", "Multiple languages"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "human_handover",
    patterns: ["human handover", "agent handover", "live agent"],
    templates: ["Do you need a human handover option in the chatbot?"],
    suggestions: ["Yes", "No"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "crm_integration",
    patterns: ["crm", "database", "integration"],
    templates: ["Should the chatbot integrate with a CRM or database?"],
    suggestions: ["Yes", "No"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "daily_chat_volume",
    patterns: ["daily chat volume", "volume", "chats per day"],
    templates: ["What is the expected daily chat volume?"],
    suggestions: ["Low", "Medium", "High"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "go_live_timeline",
    patterns: ["go live", "timeline", "launch"],
    templates: ["When would you like the chatbot to go live?"],
    suggestions: ["Immediately", "Short-term", "Flexible timeline"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "pricing_model",
    patterns: ["pricing model", "pricing", "subscription"],
    templates: ["Which pricing model do you prefer?"],
    suggestions: ["One-time setup", "Monthly subscription"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "budget_level",
    patterns: ["budget", "range", "cost"],
    templates: ["What budget level suits you best?"],
    suggestions: [
      "Under \u20B915,000",
      "\u20B915,000 \u2013 \u20B940,000",
      "\u20B940,000 \u2013 \u20B91,00,000",
      "\u20B91,00,000 and above",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails, skipIntro: true };
export default chatbot;



