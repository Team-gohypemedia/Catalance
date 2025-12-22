export const service = "CRM & ERP Solutions";
export const openingMessage =
  "Hi! Let's streamline your operations with the right CRM/ERP setup. Tell me what you need.";

export const serviceDetails = `Sub-types: CRM Setup, ERP Customization, Workflow Automation
Deliverables: System configuration, training & documentation, integrations
Pricing: CRM â‚¹50,000â€“â‚¹2,00,000 | ERP â‚¹2,00,000â€“â‚¹10,00,000+
Timelines: Full setup 4â€“10 weeks | Partial scope: CRM setup only 2â€“3 weeks (â‚¹50,000â€“â‚¹1,50,000), Automation only 2â€“4 weeks (â‚¹40,000â€“â‚¹2,00,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "current_crm",
    patterns: ["crm", "erp", "current system"],
    templates: ["Do you already use a CRM or ERP?"],
    suggestions: ["Yes", "No", "Not sure"],
  },
  {
    key: "departments",
    patterns: ["departments", "sales", "support", "ops"],
    templates: ["Which departments will use it?"],
    suggestions: ["Sales", "Support", "Operations", "Marketing", "Other"],
    multiSelect: true,
  },
  {
    key: "users",
    patterns: ["number of users", "user count", "seats"],
    templates: ["How many users will need access?"],
    suggestions: null,
  },
  {
    key: "scope",
    patterns: ["full setup", "customization"],
    templates: ["Do you need full setup or customization only?"],
    suggestions: ["Full setup", "Customization only"],
  },
  {
    key: "integrations",
    patterns: ["integration", "tools", "systems"],
    templates: ["Is integration required with other tools?"],
    suggestions: ["Yes", "No", "Not sure"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline"],
    templates: ["What is your timeline?"],
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



