export const service = "SEO Optimization";
export const openingMessage = "Hi! I see you're interested in SEO Optimization. What's your name? Let's get started.";
export const serviceDetails = `Sub-types: On-page SEO, Off-page SEO, Technical SEO, Local SEO (GMB)
Deliverables: Keyword research, on-page optimization, backlink building, monthly SEO report
Pricing: Starter â‚¹15,000/month | Growth â‚¹25,000â€“â‚¹60,000/month
Timelines: Results typically start in 60â€“90 days | Partial scope: Audit only 7â€“10 days (â‚¹8,000â€“â‚¹20,000), On-page SEO only 15â€“20 days (â‚¹15,000â€“â‚¹30,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "name",
    patterns: ["name", "call you", "who are you"],
    templates: [
      "Hi! I see you're interested in SEO Optimization. What's your name? Let's get started."
    ],
    suggestions: null,
    required: true
  },
  {
    key: "business_category",
    patterns: ["category", "business type", "business category"],
    templates: ["Which category best describes your business?"],
    suggestions: [
      "Local service business",
      "E-commerce or D2C brand",
      "B2B or corporate business"
    ],
    required: true
  },
  {
    key: "target_locations",
    patterns: ["location", "geo", "target location", "market"],
    templates: ["Which geographic locations would you like to target through SEO?"],
    suggestions: [
      "A specific city - ________",
      "A state or region - ________",
      "Pan-India",
      "International markets"
    ],
    required: true
  },
  {
    key: "keyword_planning",
    patterns: ["keyword", "keywords", "planning"],
    templates: ["How would you like to approach keyword planning?"],
    suggestions: [
      "We will provide keywords - ________",
      "Open to expert recommendation"
    ],
    required: true
  },
  {
    key: "primary_goal",
    patterns: ["goal", "objective", "outcome"],
    templates: ["What is your primary goal with SEO?"],
    suggestions: [
      "Increasing website traffic",
      "Generating quality leads",
      "Improving brand visibility"
    ],
    required: true
  },
  {
    key: "content_status",
    patterns: ["content", "website content", "copy"],
    templates: ["What is the current status of your website content?"],
    suggestions: [
      "Content is already available",
      "Content needs to be created",
      "Content needs optimisation"
    ],
    required: true
  },
  {
    key: "seo_situation",
    patterns: ["seo situation", "current seo", "seo status"],
    templates: ["What best describes your current SEO situation?"],
    suggestions: [
      "New website with no SEO",
      "Some SEO work has been done",
      "Website is already ranking"
    ],
    required: true
  },
  {
    key: "competition_level",
    patterns: ["competition", "competitive", "industry"],
    templates: ["How competitive is your industry online?"],
    suggestions: [
      "Low competition",
      "Medium competition",
      "High competition"
    ],
    required: true
  },
  {
    key: "service_duration",
    patterns: ["duration", "how long", "months"],
    templates: ["How long would you like to continue SEO services?"],
    suggestions: [
      "1 month",
      "3 months",
      "6 months",
      "12 months"
    ],
    required: true
  },
  {
    key: "growth_expectation",
    patterns: ["growth", "expectation", "results"],
    templates: ["What kind of growth are you expecting from SEO?"],
    suggestions: [
      "Slow and steady growth",
      "Moderate growth",
      "Aggressive growth"
    ],
    required: true
  },
  {
    key: "budget_range",
    patterns: ["budget", "monthly budget", "range"],
    templates: ["Which monthly budget range best suits you?"],
    suggestions: [
      "Under INR 10,000 / month",
      "INR 10,000 - 25,000 / month",
      "INR 25,000 - 50,000 / month",
      "INR 50,000 and above / month"
    ],
    required: true
  }
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;



