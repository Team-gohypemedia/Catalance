export const service = "Social Media Management";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Instagram, LinkedIn, Facebook, YouTube
Deliverables: Content calendar, creatives & captions, posting & engagement, monthly analytics
Pricing: Basic ƒ,115,000/month | Standard ƒ,125,000ƒ?"ƒ,140,000/month | Premium ƒ,150,000+/month
Timelines: Monthly engagement | Partial scope: Content creation only 10ƒ?"15 days (ƒ,110,000ƒ?"ƒ,125,000), Posting only monthly (ƒ,15,000ƒ?"ƒ,115,000)
Timeline policy: timelines are in working days; 10ƒ?"20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "platforms",
    patterns: ["platforms", "instagram", "facebook", "linkedin", "youtube", "x", "twitter"],
    templates: [
      "Which social media platforms would you like us to manage? (Multiple options)",
    ],
    suggestions: ["Instagram", "Facebook", "LinkedIn", "YouTube", "X"],
    multiSelect: true,
    start: true,
  },
  {
    key: "primary_goal",
    patterns: ["objective", "goal", "purpose", "awareness", "engagement", "leads"],
    templates: ["What is the main objective of your social media presence?"],
    suggestions: ["Brand awareness", "Audience engagement", "Lead generation"],
  },
  {
    key: "target_audience",
    patterns: ["audience", "target audience", "consumers", "professionals", "business owners"],
    templates: ["Who is your primary target audience on social media?"],
    suggestions: ["Consumers", "Professionals", "Business owners"],
  },
  {
    key: "content_preferences",
    patterns: ["content", "content type", "educational", "promotional", "lifestyle"],
    templates: ["What type of content do you prefer? (multiple options)"],
    suggestions: ["Educational content", "Promotional content", "Lifestyle content"],
    multiSelect: true,
  },
  {
    key: "service_level",
    patterns: ["service level", "strategy", "content creation", "account management"],
    templates: ["What level of service are you looking for?"],
    suggestions: [
      "Strategy only",
      "Content creation and posting",
      "Complete account management",
    ],
  },
  {
    key: "tone_of_voice",
    patterns: ["tone", "voice", "brand tone"],
    templates: ["How would you describe your brand's tone of voice?"],
    suggestions: [
      "Professional and trustworthy",
      "Modern and bold",
      "Premium and minimal",
      "Youthful and energetic",
    ],
  },
  {
    key: "posting_frequency",
    patterns: ["frequency", "posting", "posts"],
    templates: ["How frequently would you like to post content?"],
    suggestions: ["Low frequency", "Medium frequency", "High frequency"],
  },
  {
    key: "community_management",
    patterns: ["comments", "direct messages", "community management", "engagement"],
    templates: ["Do you require management of comments and direct messages?"],
    suggestions: ["Yes, community management is required", "No, it is not required"],
  },
  {
    key: "service_duration",
    patterns: ["duration", "how long", "months"],
    templates: ["For how long would you like to continue this service?"],
    suggestions: ["1 month", "3 months", "6 months"],
  },
  {
    key: "monthly_budget",
    patterns: ["budget", "monthly investment", "investment"],
    templates: ["What is your expected monthly investment?"],
    suggestions: [
      "Under \u20B910,000 / month",
      "\u20B910,000 \u2013 \u20B925,000 / month",
      "\u20B925,000 \u2013 \u20B950,000 / month",
      "\u20B950,000 and above / month",
    ],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
