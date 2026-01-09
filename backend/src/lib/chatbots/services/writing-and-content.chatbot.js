export const service = "Writing & Content";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Website Content, Blogs & Articles, Ad Copy, Scripts
Deliverables: SEO-optimized content, proofreading, plagiarism-free writing
Pricing: Blogs â‚¹1â€“â‚¹5/word | Website content â‚¹10,000â€“â‚¹50,000
Timelines: Full content package 2â€“4 weeks | Partial scope: Single blog 3â€“5 days (â‚¹1â€“â‚¹5/word), Landing page copy 5â€“7 days (â‚¹5,000â€“â‚¹15,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "content_type",
    patterns: ["content type", "blog", "website", "social media", "advertising"],
    templates: ["What type of content do you need?"],
    suggestions: [
      "Blog articles",
      "Website content",
      "Social media content",
      "Advertising copy",
    ],
  },
  {
    key: "content_purpose",
    patterns: ["purpose", "seo", "sales", "conversions", "brand positioning"],
    templates: ["What is the main purpose of this content?"],
    suggestions: ["SEO and organic growth", "Sales and conversions", "Brand positioning"],
  },
  {
    key: "industry_familiarity",
    patterns: ["industry", "familiar", "expertise", "knowledge"],
    templates: ["How familiar should the writer be with your industry?"],
    suggestions: ["Basic understanding", "Moderate expertise", "Deep subject knowledge"],
  },
  {
    key: "tone",
    patterns: ["tone", "voice", "professional", "conversational", "persuasive"],
    templates: ["What tone of voice do you prefer for your content?"],
    suggestions: ["Professional", "Conversational", "Persuasive"],
  },
  {
    key: "monthly_volume",
    patterns: ["how much", "volume", "each month", "monthly"],
    templates: ["How much content do you require each month?"],
    suggestions: ["Low volume", "Medium volume", "High volume"],
  },
  {
    key: "seo_optimisation",
    patterns: ["seo", "optimisation", "optimization"],
    templates: ["Do you require SEO optimisation for the content?"],
    suggestions: ["Yes", "No"],
  },
  {
    key: "research_level",
    patterns: ["research", "depth"],
    templates: ["What level of research is required?"],
    suggestions: ["Light research", "Moderate research", "In-depth research"],
  },
  {
    key: "word_count",
    patterns: ["word count", "words", "length"],
    templates: ["What is the preferred word count per content piece?"],
    suggestions: [
      "Up to 500 words",
      "500 \u2013 1,000 words",
      "1,000 \u2013 2,000 words",
      "Above 2,000 words",
    ],
  },
  {
    key: "delivery_frequency",
    patterns: ["how often", "delivered", "frequency"],
    templates: ["How often should content be delivered?"],
    suggestions: ["Weekly", "Bi-weekly", "Monthly"],
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "cost", "price"],
    templates: ["What budget level are you comfortable with?"],
    suggestions: [
      "Under \u20B91,000 per piece",
      "\u20B91,000 \u2013 \u20B92,500 per piece",
      "\u20B92,500 \u2013 \u20B95,000 per piece",
      "\u20B95,000 and above per piece",
    ],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;

