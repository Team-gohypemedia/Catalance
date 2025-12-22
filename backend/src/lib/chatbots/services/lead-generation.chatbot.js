export const service = "Lead Generation";
export const openingMessage = "Hello! ðŸ“ˆ Looking to grow your leads? I'll help you put together the perfect campaign!";
export const serviceDetails = `Sub-types: B2B Lead Generation, B2C Lead Generation, Real Estate Leads, Appointment Booking
Deliverables: Ad account setup, targeting & creatives, lead tracking sheet/CRM, weekly performance reports
Pricing: Setup â‚¹15,000â€“â‚¹30,000 | Monthly â‚¹20,000â€“â‚¹60,000
Timelines: Full campaign is ongoing (minimum 30 days) | Partial scope: Ad setup only 5â€“7 days (â‚¹10,000â€“â‚¹20,000), Lead data delivery only 10â€“15 days (custom pricing)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "industry",
    patterns: ["industry", "business"],
    templates: ["Which industry is your business in?"],
    suggestions: null,
  },
  {
    key: "target_market",
    patterns: ["b2b", "b2c", "targeting"],
    templates: ["Are you targeting B2B or B2C customers?"],
    suggestions: ["B2B", "B2C", "Both"],
  },
  {
    key: "geo",
    patterns: ["geography", "location", "region"],
    templates: ["Which geography do you want leads from?"],
    suggestions: null,
  },
  {
    key: "volume",
    patterns: ["lead target", "monthly leads", "volume"],
    templates: ["What is your monthly lead target?"],
    suggestions: null,
  },
  {
    key: "platforms",
    patterns: ["platforms", "google", "meta", "linkedin"],
    templates: ["Which platforms do you prefer?"],
    suggestions: ["Google", "Meta", "LinkedIn", "Multiple", "Not sure"],
    multiSelect: true,
  },
  {
    key: "scope",
    patterns: ["full campaign", "setup only", "management"],
    templates: ["Do you need full campaign management or setup only?"],
    suggestions: ["Full campaign management", "Setup only"],
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

