export const service = "Video Services";
export const openingMessage = "Hey! I'm here to help you create an amazing video. Let's figure out exactly what you need!";
export const serviceDetails = `Sub-types: Reels/Shorts, Explainer Videos, Ad Films, Corporate Videos
Deliverables: Script & storyboard, editing & motion graphics, multiple export formats
Pricing: Reels â‚¹1,500â€“â‚¹5,000/video | Explainer â‚¹10,000â€“â‚¹40,000 | Ad video â‚¹5,000â€“â‚¹25,000
Timelines: Full video project 7â€“14 days | Partial scope: Editing only 3â€“5 days (â‚¹1,000â€“â‚¹8,000), Script only 2â€“3 days (â‚¹2,000â€“â‚¹6,000)
Timeline policy: timelines include buffer days (10â€“20%); delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "video_type",
    patterns: ["video type", "reel", "ad", "explainer"],
    templates: ["What type of video do you need?"],
    suggestions: ["Reel", "Ad", "Explainer", "Other"],
  },
  {
    key: "goal",
    patterns: ["purpose", "goal", "branding", "ads", "education"],
    templates: ["What is the purpose of the video?"],
    suggestions: ["Branding", "Ads", "Education", "Other"],
  },
  {
    key: "footage",
    patterns: ["raw footage", "footage"],
    templates: ["Do you have raw footage?"],
    suggestions: ["Yes", "No"],
  },
  {
    key: "script_voiceover",
    patterns: ["script", "voice-over", "voiceover"],
    templates: ["Do you need script and voice-over?"],
    suggestions: ["Yes", "No"],
  },
  {
    key: "deliverables_quantity",
    patterns: ["number of videos", "quantity", "count"],
    templates: ["How many videos do you need?"],
    suggestions: null,
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "when"],
    templates: ["What is your timeline?"],
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


