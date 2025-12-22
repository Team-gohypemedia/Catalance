export const service = "Influencer/UGC Marketing";
export const openingMessage =
  "Hi! Let's plan an influencer or UGC campaign that fits your brand and budget.";

export const serviceDetails = `Sub-types: Micro Influencers, Macro Influencers, UGC Creators
Deliverables: Influencer sourcing, content coordination, performance tracking
Pricing: Micro influencers â‚¹5,000â€“â‚¹25,000 | UGC videos â‚¹3,000â€“â‚¹15,000/video
Timelines: Full campaign 2â€“4 weeks | Partial scope: Influencer sourcing only 7â€“10 days (â‚¹5,000â€“â‚¹15,000), UGC creation only 5â€“7 days (â‚¹3,000â€“â‚¹15,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "goal",
    patterns: ["campaign goal", "awareness", "sales", "engagement"],
    templates: ["What is the campaign goal?"],
    suggestions: ["Awareness", "Sales", "Engagement", "Other"],
  },
  {
    key: "platforms",
    patterns: ["platform", "instagram", "youtube", "tiktok"],
    templates: ["Which platform do you prefer?"],
    suggestions: ["Instagram", "YouTube", "TikTok", "Other"],
  },
  {
    key: "influencer_type",
    patterns: ["influencer type", "micro", "macro", "celebrity"],
    templates: ["What influencer type do you need?"],
    suggestions: ["Micro", "Macro", "Celebrity", "Mixed"],
  },
  {
    key: "content_format",
    patterns: ["content format", "reels", "shorts", "posts"],
    templates: ["What content format is needed?"],
    suggestions: ["Reels", "Shorts", "Posts", "Stories", "Other"],
  },
  {
    key: "timeline",
    patterns: ["duration", "timeline", "campaign length"],
    templates: ["What is the campaign duration?"],
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



