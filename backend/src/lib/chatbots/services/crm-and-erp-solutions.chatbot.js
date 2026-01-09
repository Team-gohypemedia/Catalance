export const service = "CRM & ERP Solutions";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: CRM Setup, ERP Customization, Workflow Automation
Deliverables: System configuration, training & documentation, integrations
Pricing: CRM â‚¹50,000â€“â‚¹2,00,000 | ERP â‚¹2,00,000â€“â‚¹10,00,000+
Timelines: Full setup 4â€“10 weeks | Partial scope: CRM setup only 2â€“3 weeks (â‚¹50,000â€“â‚¹1,50,000), Automation only 2â€“4 weeks (â‚¹40,000â€“â‚¹2,00,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "call you"],
    templates: ["What's your name?"],
    suggestions: null,
  },
  {
    key: "main_goal",
    patterns: ["goal", "objective", "achieve", "main goal"],
    templates: ["What is the main goal you want to achieve by implementing a combined CRM and ERP system?"],
    suggestions: [
      "To manage customers, sales, and operations in one system",
      "To improve efficiency across departments",
      "To replace multiple tools with a single platform",
      "To support long-term business growth",
    ],
  },
  {
    key: "primary_teams",
    patterns: ["team", "teams", "department", "departments", "users"],
    templates: ["Which teams will primarily use this CRM & ERP solution?"],
    suggestions: [
      "Sales and customer support teams",
      "Finance and operations teams",
      "Management and leadership team",
      "All departments across the organisation",
    ],
  },
  {
    key: "current_processes",
    patterns: ["current", "process", "managing", "today", "workflow"],
    templates: ["How are you currently managing your business processes?"],
    suggestions: [
      "Using spreadsheets and manual methods",
      "Using multiple disconnected software tools",
      "Using a basic CRM or ERP system",
      "We do not have any formal system yet",
    ],
  },
  {
    key: "business_areas",
    patterns: ["business areas", "areas", "scope", "modules", "features"],
    templates: ["Which business areas should be included in this integrated system?"],
    suggestions: [
      "Sales, leads, and customer management",
      "Finance, billing, and accounting",
      "Inventory, operations, and supply chain",
      "All of the above",
    ],
  },
  {
    key: "customization_level",
    patterns: ["customisation", "customization", "workflow", "workflows"],
    templates: ["What level of customisation do you expect in the CRM & ERP workflows?"],
    suggestions: [
      "Standard setup with minimal changes",
      "Moderate customisation to match our processes",
      "Fully customised workflows across departments",
    ],
  },
  {
    key: "integrations_need",
    patterns: ["integrations", "integrate", "tools", "apps", "third-party"],
    templates: ["Do you need this system to integrate with other tools you already use?"],
    suggestions: [
      "Yes, with email, WhatsApp, and calendars",
      "Yes, with accounting or HR systems",
      "Yes, with multiple third-party tools",
      "No, we want this to be a standalone system",
    ],
  },
  {
    key: "reporting_needs",
    patterns: ["reporting", "reports", "dashboard", "dashboards", "analytics", "forecast"],
    templates: ["What type of reporting and dashboards do you need from the system?"],
    suggestions: [
      "Basic operational and sales reports",
      "Performance dashboards for managers",
      "Advanced analytics and forecasting",
    ],
  },
  {
    key: "data_migration",
    patterns: ["migration", "migrate", "data", "import", "transfer"],
    templates: ["Do you require migration of data from your current systems?"],
    suggestions: [
      "Yes, full data migration is required",
      "Yes, partial data migration is required",
      "No, we prefer to start fresh",
    ],
  },
  {
    key: "training_support",
    patterns: ["training", "support", "onboarding", "enablement"],
    templates: ["What level of training and support do you need for your team?"],
    suggestions: [
      "Full training and onboarding support",
      "Basic training is sufficient",
      "No training is required",
    ],
  },
  {
    key: "budget_level",
    patterns: ["budget", "cost", "price", "spend"],
    templates: ["What budget level best matches your expectation for this integrated solution?"],
    suggestions: ["Entry level", "Growth level", "Enterprise level"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;





