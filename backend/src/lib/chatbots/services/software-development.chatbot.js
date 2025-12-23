export const service = "Software Development";
export const openingMessage = "Hi! ðŸ’» Let's build some amazing software together. Tell me about your project!";
export const serviceDetails = `Sub-types: Custom Web Software, SaaS Platforms, Internal Tools, CRM/ERP Systems
Deliverables: Requirement documentation, custom modules, admin panel, deployment & handover
Pricing: Small software â‚¹1,50,000â€“â‚¹3,00,000 | SaaS/Enterprise â‚¹5,00,000â€“â‚¹20,00,000+
Timelines: Full project 6â€“12 weeks (buffer included) | Partial scope: Module development 2â€“4 weeks (â‚¹50,000â€“â‚¹2,00,000), Admin panel only 2â€“3 weeks (â‚¹40,000â€“â‚¹1,20,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "software_type",
    patterns: ["software type", "web", "saas", "internal tool"],
    templates: ["What type of software do you need?"],
    suggestions: ["Web", "SaaS", "Internal Tool"],
  },
  {
    key: "target_users",
    patterns: ["who will use", "users", "internal team", "customers"],
    templates: ["Who will use this software?"],
    suggestions: ["Internal team", "Customers", "Both"],
  },
  {
    key: "problem",
    patterns: ["problem", "solve", "pain"],
    templates: ["What problem should this software solve?"],
    suggestions: null,
  },
  {
    key: "feature_list",
    patterns: ["feature list", "reference product", "examples"],
    templates: ["Do you have a feature list or reference product?"],
    suggestions: ["Yes, feature list ready", "I have a reference product", "Not yet"],
  },
  {
    key: "scope",
    patterns: ["full software", "module", "specific module"],
    templates: ["Do you need full software or a specific module only?"],
    suggestions: ["Full software", "Specific module"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "expectation"],
    templates: ["What is your timeline expectation?"],
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

