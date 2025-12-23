export const service = "Writing & Content";
export const openingMessage = "Hey! âœï¸ Ready to create amazing content? Let's talk about what you need!";
export const serviceDetails = `Sub-types: Website Content, Blogs & Articles, Ad Copy, Scripts
Deliverables: SEO-optimized content, proofreading, plagiarism-free writing
Pricing: Blogs â‚¹1â€“â‚¹5/word | Website content â‚¹10,000â€“â‚¹50,000
Timelines: Full content package 2â€“4 weeks | Partial scope: Single blog 3â€“5 days (â‚¹1â€“â‚¹5/word), Landing page copy 5â€“7 days (â‚¹5,000â€“â‚¹15,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
export const questions = [
  {
    key: "content_type",
    patterns: ["content type", "website", "blogs", "ads", "scripts"],
    templates: ["What type of content do you need?"],
    suggestions: ["Website", "Blogs", "Ads", "Scripts", "Other"],
  },
  {
    key: "goal",
    patterns: ["purpose", "seo", "branding", "conversions"],
    templates: ["What is the purpose of the content?"],
    suggestions: ["SEO", "Branding", "Conversions", "Other"],
  },
  {
    key: "word_count",
    patterns: ["word count", "pages", "length"],
    templates: ["Approximate word count or number of pages?"],
    suggestions: null,
  },
  {
    key: "tone",
    patterns: ["tone", "seo optimized", "creative"],
    templates: ["Do you need SEO-optimized or creative tone?"],
    suggestions: ["SEO-optimized", "Creative tone", "Both", "Not sure"],
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline"],
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

