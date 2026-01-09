export const service = "Performance Marketing";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Meta Ads, Google Ads, LinkedIn Ads, Retargeting
Deliverables: Campaign strategy, ad creatives & copies, optimization & reports
Pricing: Setup ₹20,000–₹40,000 | Management 10–20% of ad spend
Timelines: Ongoing (30-day cycles) | Partial scope: Ad setup only 5–7 days (₹10,000–₹25,000), Optimization only monthly (₹15,000–₹30,000)
Timeline policy: timelines are in working days; 10–20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "ad_platforms",
    patterns: ["platforms", "google", "meta", "facebook", "instagram", "linkedin", "taboola"],
    templates: [
      "Which advertising platforms would you like to run campaigns on? (Multiple)",
    ],
    suggestions: [
      "Google Ads",
      "Meta (Facebook & Instagram)",
      "LinkedIn Ads",
      "Taboola Ads",
    ],
    multiSelect: true,
    start: true,
  },
  {
    key: "primary_goal",
    patterns: ["goal", "objective", "lead", "sales", "conversion", "traffic"],
    templates: ["What is the primary goal of your advertising campaigns?"],
    suggestions: ["Lead generation", "Sales or conversions", "Website traffic"],
  },
  {
    key: "pricing_tier",
    patterns: ["pricing", "price", "ticket"],
    templates: ["How would you classify your product or service pricing?"],
    suggestions: ["Low-ticket", "Mid-ticket", "High-ticket"],
  },
  {
    key: "geo_target",
    patterns: ["geo", "location", "area", "region", "nationwide", "international"],
    templates: ["Which geographic areas should your ads target?"],
    suggestions: ["Local area", "Nationwide", "International"],
  },
  {
    key: "creative_assets",
    patterns: ["creative", "creatives", "copies", "copy"],
    templates: ["Are ad creatives and copies already available?"],
    suggestions: ["Yes, everything is ready", "No, they need to be created"],
  },
  {
    key: "landing_page",
    patterns: ["landing page", "landing", "lp"],
    templates: ["Is a landing page already in place?"],
    suggestions: ["Yes, we already have one", "No, we need help setting it up"],
  },
  {
    key: "monthly_ad_spend",
    patterns: ["ad spend", "ad budget", "monthly spend", "monthly budget"],
    templates: ["What monthly ad spend are you planning?"],
    suggestions: [
      "Under INR 25,000 / month",
      "INR 25,000 - 50,000 / month",
      "INR 50,000 - 1,00,000 / month",
      "INR 1,00,000 and above / month",
    ],
  },
  {
    key: "primary_metric",
    patterns: ["metric", "performance", "cpl", "roas"],
    templates: ["What performance metric matters most to you?"],
    suggestions: ["Cost per lead (CPL)", "Return on ad spend (ROAS)"],
  },
  {
    key: "campaign_duration",
    patterns: ["duration", "timeline", "how long"],
    templates: ["How long do you plan to run the campaigns?"],
    suggestions: ["Short-term", "Medium-term", "Ongoing"],
  },
  {
    key: "fee_structure",
    patterns: ["fee", "management fee", "percentage", "fixed"],
    templates: ["How would you prefer the management fee to be structured?"],
    suggestions: ["Fixed monthly fee", "Percentage of ad spend"],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;



