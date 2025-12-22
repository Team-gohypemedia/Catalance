export const service = "Social Media Management";
export const openingMessage = "Hey! Let's grow your social presence. Tell me about your goals.";
export const serviceDetails = `Sub-types: Instagram, LinkedIn, Facebook, YouTube
Deliverables: Content calendar, creatives & captions, posting & engagement, monthly analytics
Pricing: Basic â‚¹15,000/month | Standard â‚¹25,000â€“â‚¹40,000/month | Premium â‚¹50,000+/month
Timelines: Monthly engagement | Partial scope: Content creation only 10â€“15 days (â‚¹10,000â€“â‚¹25,000), Posting only monthly (â‚¹5,000â€“â‚¹15,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "platforms",
    patterns: ["platforms", "instagram", "facebook", "linkedin", "tiktok"],
    templates: ["Which platforms do you want to manage?"],
    suggestions: ["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube", "Other"],
    multiSelect: true,
  },
  {
    key: "goal",
    patterns: ["goal", "growth", "leads", "branding"],
    templates: ["What is your primary goal?"],
    suggestions: ["Growth", "Leads", "Branding"],
  },
  {
    key: "posts_per_month",
    patterns: ["posts per month", "post volume"],
    templates: ["How many posts per month do you need?"],
    suggestions: null,
  },
  {
    key: "reels_needed",
    patterns: ["reels", "videos"],
    templates: ["Do you need reels or videos?"],
    suggestions: ["Yes", "No", "Maybe"],
  },
  {
    key: "scope",
    patterns: ["full management", "content creation", "management"],
    templates: ["Do you need full management or content creation only?"],
    suggestions: ["Full management", "Content creation only"],
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





