export const service = "Customer Support";
export const openingMessage = "Hi! ðŸŽ§ Let's set up great customer support. Tell me about your needs!";
export const serviceDetails = `Sub-types: Email Support, Chat Support, Voice Support
Deliverables: Trained agents, SLA handling, daily/weekly reports
Pricing: Email/Chat â‚¹25,000â€“â‚¹60,000 per agent | Voice â‚¹40,000â€“â‚¹80,000 per agent
Timelines: Monthly engagement | Partial scope: Email only monthly (â‚¹20,000â€“â‚¹40,000), Chat only monthly (â‚¹25,000â€“â‚¹50,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "support_type",
    patterns: ["support type", "email", "chat", "voice"],
    templates: ["What type of support do you need?"],
    suggestions: ["Email", "Chat", "Voice", "Multi-channel"],
  },
  {
    key: "hours",
    patterns: ["hours", "timezone", "business hours"],
    templates: ["What are your business hours and timezone?"],
    suggestions: null,
  },
  {
    key: "daily_volume",
    patterns: ["daily volume", "requests per day", "volume"],
    templates: ["What is the expected daily volume?"],
    suggestions: null,
  },
  {
    key: "industry",
    patterns: ["industry", "business type"],
    templates: ["What is your industry or business type?"],
    suggestions: null,
  },
  {
    key: "agents",
    patterns: ["full-time", "part-time", "agents"],
    templates: ["Do you need full-time or part-time agents?"],
    suggestions: ["Full-time", "Part-time", "Both", "Not sure"],
  },
  {
    key: "budget",
    patterns: ["budget", "monthly budget"],
    templates: ["What is your monthly budget?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

