export const service = "Video Services";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Reels/Shorts, Explainer Videos, Ad Films, Corporate Videos
Deliverables: Script & storyboard, editing & motion graphics, multiple export formats
Pricing: Reels â‚¹1,500â€“â‚¹5,000/video | Explainer â‚¹10,000â€“â‚¹40,000 | Ad video â‚¹5,000â€“â‚¹25,000
Timelines: Full video project 7â€“14 days | Partial scope: Editing only 3â€“5 days (â‚¹1,000â€“â‚¹8,000), Script only 2â€“3 days (â‚¹2,000â€“â‚¹6,000)
Timeline policy: timelines include buffer days (10â€“20%); delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "video_type",
    patterns: ["video type", "short-form", "reels", "shorts", "advertising", "corporate", "explainer"],
    templates: ["What type of videos do you require?"],
    suggestions: [
      "Short-form videos (reels/shorts)",
      "Advertising videos",
      "Corporate or explainer videos",
    ],
  },
  {
    key: "video_objective",
    patterns: ["objective", "goal", "brand awareness", "sales", "conversions", "education", "explanation"],
    templates: ["What is the primary objective of these videos?"],
    suggestions: ["Brand awareness", "Sales or conversions", "Education or explanation"],
  },
  {
    key: "video_usage",
    patterns: ["used", "where", "platforms", "website", "paid advertising", "social media"],
    templates: ["Where will these videos be used?"],
    suggestions: ["Social media platforms", "Website", "Paid advertising"],
  },
  {
    key: "video_duration",
    patterns: ["duration", "length", "seconds", "minutes"],
    templates: ["What video duration do you prefer?"],
    suggestions: [
      "Short (15\u201330 seconds)",
      "Medium (30\u201360 seconds)",
      "Long (1\u20133 minutes)",
    ],
  },
  {
    key: "production_type",
    patterns: ["production", "live shooting", "animation", "stock-based"],
    templates: ["What type of production do you require?"],
    suggestions: ["Live shooting", "Animation", "Stock-based visuals"],
  },
  {
    key: "scripting_support",
    patterns: ["scripting", "concepts", "script", "creative"],
    templates: ["Do you need help with scripting and concepts?"],
    suggestions: ["Yes, full support is needed", "No, scripts are ready"],
  },
  {
    key: "video_volume",
    patterns: ["how many", "per month", "per project", "volume"],
    templates: ["How many videos do you require per month or project?"],
    suggestions: ["Low volume (1-10)", "Medium volume (10-30)", "High volume (above 30)"],
  },
  {
    key: "revision_rounds",
    patterns: ["revisions", "revision rounds"],
    templates: ["How many revision rounds do you expect?"],
    suggestions: ["Standard", "Multiple"],
  },
  {
    key: "delivery_timeline",
    patterns: ["delivery timeline", "timeline", "turnaround"],
    templates: ["What is your preferred delivery timeline?"],
    suggestions: ["Fast turnaround", "Standard timeline -", "Flexible"],
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "cost", "price"],
    templates: ["What budget range best fits your requirement?"],
    suggestions: [
      "Under \u20B92,000 per video",
      "\u20B92,000 \u2013 \u20B97,000 per video",
      "\u20B97,000 \u2013 \u20B915,000 per video",
      "\u20B915,000 and above per video",
    ],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;


