export const service = "Creative & Design";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Logo Design, Branding Kit, UI/UX Design, Marketing Creatives
Deliverables: Design concepts, revisions, final source files
Pricing: Logo â‚¹8,000â€“â‚¹30,000 | Branding kit â‚¹40,000â€“â‚¹1,50,000 | UI/UX â‚¹1,500â€“â‚¹3,000/screen
Timelines: Full branding project 3â€“5 weeks | Partial scope: Logo only 7â€“10 days (â‚¹8,000â€“â‚¹30,000), Single creative set 3â€“5 days (â‚¹3,000â€“â‚¹10,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "creative_work_type",
    patterns: ["creative work", "type", "social", "advertising", "collaterals"],
    templates: ["What type of creative work do you require?"],
    suggestions: [
      "Social media creatives",
      "Advertising creatives",
      "Marketing collaterals",
      "A mix of all",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "design_objective",
    patterns: ["objective", "goal", "branding", "sales", "engagement"],
    templates: ["What is the main objective of the design work?"],
    suggestions: ["Branding", "Sales and conversions", "Engagement"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "design_style",
    patterns: ["style", "look", "feel"],
    templates: ["Which design style do you prefer?"],
    suggestions: [
      "Professional and trustworthy",
      "Modern and bold",
      "Premium and minimal",
      "Youthful and energetic",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "brand_guidelines",
    patterns: ["brand guidelines", "brand guide", "identity"],
    templates: ["Do you already have brand guidelines?"],
    suggestions: ["Yes", "No"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "monthly_volume",
    patterns: ["volume", "per month", "monthly"],
    templates: ["How much design work do you need each month?"],
    suggestions: ["Low volume", "Medium volume", "High volume"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "formats_required",
    patterns: ["formats", "static", "motion"],
    templates: ["Which formats are required?"],
    suggestions: ["Static designs", "Motion designs", "Both"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "turnaround_time",
    patterns: ["turnaround", "timeline", "delivery"],
    templates: ["What turnaround time do you prefer?"],
    suggestions: ["Fast", "Standard"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "engagement_model",
    patterns: ["engage", "engagement", "retainer", "project"],
    templates: ["How would you like to engage for this service?"],
    suggestions: ["Project-based", "Monthly retainer"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "cost"],
    templates: ["What budget range works best for you?"],
    suggestions: [
      "Under \u20B910,000",
      "\u20B910,000 \u2013 \u20B925,000",
      "\u20B925,000 \u2013 \u20B950,000",
      "\u20B950,000 and above",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails, skipIntro: true };
export default chatbot;




