export const service = "AI Automation";
export const openingMessage =
  "Hi! Let's automate your workflows with AI. Tell me what you want to automate.";

export const serviceDetails = `Sub-types: AI Chatbots, Workflow Automation, Lead Scoring
Deliverables: Automation logic, tool integrations, testing & deployment
Pricing: Basic â‚¹30,000â€“â‚¹80,000 | Advanced â‚¹1,50,000â€“â‚¹5,00,000
Timelines: Full automation system 3â€“6 weeks | Partial scope: Single workflow automation 7â€“10 days (â‚¹25,000â€“â‚¹60,000), AI bot logic only 10â€“15 days (â‚¹40,000â€“â‚¹1,00,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "automation_process",
    patterns: ["process", "automate", "workflow"],
    templates: ["What process do you want to automate?"],
    suggestions: null,
  },
  {
    key: "integrations",
    patterns: ["tools", "platforms", "integrations"],
    templates: ["Which tools or platforms should integrate?"],
    suggestions: null,
  },
  {
    key: "automation_type",
    patterns: ["one-time", "ongoing", "workflows"],
    templates: ["Is this one-time automation or ongoing workflows?"],
    suggestions: ["One-time automation", "Ongoing workflows"],
  },
  {
    key: "complexity",
    patterns: ["complexity", "basic", "advanced"],
    templates: ["What is the complexity level?"],
    suggestions: ["Basic", "Advanced"],
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



