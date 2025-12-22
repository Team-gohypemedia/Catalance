export const service = "Creative & Design";
export const openingMessage = "Hey! Let's create something beautiful together. Tell me about your design needs!";
export const serviceDetails = `Sub-types: Logo Design, Branding Kit, UI/UX Design, Marketing Creatives
Deliverables: Design concepts, revisions, final source files
Pricing: Logo â‚¹8,000â€“â‚¹30,000 | Branding kit â‚¹40,000â€“â‚¹1,50,000 | UI/UX â‚¹1,500â€“â‚¹3,000/screen
Timelines: Full branding project 3â€“5 weeks | Partial scope: Logo only 7â€“10 days (â‚¹8,000â€“â‚¹30,000), Single creative set 3â€“5 days (â‚¹3,000â€“â‚¹10,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "service_type",
    patterns: ["design service", "logo", "branding", "ui", "ux", "creatives"],
    templates: ["What design service do you need?"],
    suggestions: ["Logo", "Branding", "UI/UX", "Creatives", "Other"],
  },
  {
    key: "brand_identity",
    patterns: ["brand identity", "brand assets", "guidelines"],
    templates: ["Do you have an existing brand identity?"],
    suggestions: ["Yes", "No", "In progress"],
  },
  {
    key: "references",
    patterns: ["reference", "style", "inspiration"],
    templates: ["Any reference brands or styles you like?"],
    suggestions: null,
  },
  {
    key: "concept_count",
    patterns: ["concepts", "options"],
    templates: ["How many concepts do you need?"],
    suggestions: null,
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline"],
    templates: ["What is your timeline preference?"],
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




