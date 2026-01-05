export const service = "SEO Optimization";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: On-page SEO, Off-page SEO, Technical SEO, Local SEO (GMB)
Deliverables: Keyword research, on-page optimization, backlink building, monthly SEO report
Pricing: Starter â‚¹15,000/month | Growth â‚¹25,000â€“â‚¹60,000/month
Timelines: Results typically start in 60â€“90 days | Partial scope: Audit only 7â€“10 days (â‚¹8,000â€“â‚¹20,000), On-page SEO only 15â€“20 days (â‚¹15,000â€“â‚¹30,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "website_live",
    patterns: ["website live", "live site"],
    templates: ["Is your website live?"],
    suggestions: ["Yes", "No", "In progress"],
  },
  {
    key: "business_niche",
    patterns: ["business niche", "industry", "niche"],
    templates: ["What is your business niche?"],
    suggestions: null,
  },
  {
    key: "target_location",
    patterns: ["target location", "global", "local"],
    templates: ["What is your target location?"],
    suggestions: ["Global", "Local", "Both", "Specific location (please specify)"],
  },
  {
    key: "seo_scope",
    patterns: ["full seo", "specific services", "audit"],
    templates: ["Do you want full SEO or specific services only?"],
    suggestions: ["Full SEO", "Specific services"],
  },
  {
    key: "keywords",
    patterns: ["keywords", "rank for"],
    templates: ["Any keywords you want to rank for?"],
    suggestions: null,
  },
  {
    key: "budget",
    patterns: ["monthly budget", "budget"],
    templates: ["What is your monthly SEO budget?"],
    suggestions: null,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;



