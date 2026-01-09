export const service = "AI Automation";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: Workflow automation, AI agents, document processing, data extraction, customer support automation
Deliverables: Process mapping, automation design, integrations, agent prompts, testing & monitoring
Pricing: Automation workflow INR 60,000-300,000 | Custom AI agent INR 150,000-800,000
Timelines: Discovery 1-2 weeks | Implementation 2-6 weeks (buffer included)
Timeline policy: timelines are in working days; 10-20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "full name", "call you"],
    templates: ["What's your name?"],
    suggestions: null,
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "automation_purpose",
    patterns: ["purpose", "automation", "primary purpose"],
    templates: ["What is the primary purpose of automation in your business?"],
    suggestions: [
      "Sales automation",
      "Operations automation",
      "Customer support automation",
      "Marketing automation",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "automation_complexity",
    patterns: ["complexity", "complex", "advanced", "simple"],
    templates: ["How complex do you want the automation to be?"],
    suggestions: ["Simple workflows", "Moderate automation", "Advanced automation"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "current_tools",
    patterns: ["tools", "systems", "current"],
    templates: ["Which tools or systems are currently in use?"],
    suggestions: [
      "CRM systems",
      "Manual tools (Sheets, email, etc.)",
      "Multiple connected systems",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "integration_level",
    patterns: ["integration", "integrations", "connect"],
    templates: ["What level of integration do you require?"],
    suggestions: [
      "Basic integrations",
      "Multiple tool integrations",
      "Custom integrations",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "data_organization",
    patterns: ["data", "organized", "organised", "organization"],
    templates: ["How organised is your data currently?"],
    suggestions: ["Well-structured", "Partially structured", "Not organised"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "go_live_timeline",
    patterns: ["go live", "timeline", "launch"],
    templates: ["When would you like the automation to go live?"],
    suggestions: ["Immediately", "Short-term", "Flexible timeline"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "maintenance_required",
    patterns: ["maintenance", "updates", "ongoing"],
    templates: ["Do you require ongoing maintenance and updates?"],
    suggestions: ["Yes", "No"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "cost"],
    templates: ["What budget range do you have in mind?"],
    suggestions: [
      "Under \u20B925,000",
      "\u20B925,000 \u2013 \u20B975,000",
      "\u20B975,000 \u2013 \u20B92,00,000",
      "\u20B92,00,000 and above",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
