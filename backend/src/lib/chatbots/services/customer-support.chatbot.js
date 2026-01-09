export const service = "Customer Support";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Email Support, Chat Support, Voice Support
Deliverables: Trained agents, SLA handling, daily/weekly reports
Pricing: Email/Chat â‚¹25,000â€“â‚¹60,000 per agent | Voice â‚¹40,000â€“â‚¹80,000 per agent
Timelines: Monthly engagement | Partial scope: Email only monthly (â‚¹20,000â€“â‚¹40,000), Chat only monthly (â‚¹25,000â€“â‚¹50,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "support_channels",
    patterns: ["support channels", "chat", "email", "voice", "multi-channel"],
    templates: ["Which customer support channels do you require?"],
    suggestions: ["Chat support", "Email support", "Voice support", "Multi-channel support"],
  },
  {
    key: "support_hours",
    patterns: ["hours", "business hours", "extended hours", "24/7"],
    templates: ["What support hours do you need?"],
    suggestions: ["Business hours", "Extended hours", "24/7 support"],
  },
  {
    key: "query_volume",
    patterns: ["volume", "queries", "customer queries"],
    templates: ["What volume of customer queries do you expect?"],
    suggestions: ["Low", "Medium", "High"],
  },
  {
    key: "customer_type",
    patterns: ["customers", "client type", "consumer", "business"],
    templates: ["Who are your customers primarily?"],
    suggestions: ["Individual consumers", "Business clients", "Both"],
  },
  {
    key: "support_languages",
    patterns: ["languages", "language support", "regional"],
    templates: ["Which languages should support be provided in?"],
    suggestions: ["English", "Regional language", "Multiple languages"],
  },
  {
    key: "escalation_handling",
    patterns: ["escalations", "escalation handling"],
    templates: ["How should escalations be handled?"],
    suggestions: ["Forwarded to your internal team", "Fully managed by the support team"],
  },
  {
    key: "helpdesk_tools",
    patterns: ["helpdesk", "crm", "tools"],
    templates: ["Do you currently use any helpdesk or CRM tools?"],
    suggestions: ["Yes, tools are already in place", "No, setup is required"],
  },
  {
    key: "performance_metric",
    patterns: ["performance metric", "response time", "resolution", "satisfaction"],
    templates: ["Which performance metric is most important to you?"],
    suggestions: ["Response time", "Resolution quality", "Customer satisfaction"],
  },
  {
    key: "agent_training",
    patterns: ["training", "agents"],
    templates: ["Do you require training for support agents?"],
    suggestions: ["Yes", "No"],
  },
  {
    key: "monthly_budget",
    patterns: ["budget", "monthly budget"],
    templates: ["What is your monthly budget for customer support?"],
    suggestions: [
      "Under \u20B915,000 / month",
      "\u20B915,000 \u2013 \u20B930,000 / month",
      "\u20B930,000 \u2013 \u20B960,000 / month",
      "\u20B960,000 and above / month",
    ],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

