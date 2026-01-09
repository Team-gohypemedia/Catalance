export const service = "CGI Video Services";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: Product CGI, Cinematic CGI, Mixed live-action + CGI
Deliverables: Script/concept, CGI production, sound design, final renders
Pricing: Based on duration and complexity
Timelines: Based on scope and approvals.`;

export const questions = [
  {
    key: "cgi_video_purpose",
    patterns: ["purpose", "main purpose", "goal"],
    templates: ["What is the main purpose of the CGI video you want to create?"],
    suggestions: [
      "Product promotion",
      "Brand storytelling",
      "Launch or announcement video",
      "Educational or explainer content",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_type",
    patterns: ["type", "cgi type", "video type"],
    templates: ["What type of CGI video are you looking for?"],
    suggestions: [
      "Product-focused CGI video",
      "Concept or cinematic CGI video",
      "Mixed live-action and CGI video",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_usage",
    patterns: ["usage", "where", "platforms"],
    templates: ["Where will this CGI video be used?"],
    suggestions: [
      "Social media platforms",
      "Website or landing pages",
      "Paid advertising campaigns",
      "Presentations or events",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_duration",
    patterns: ["duration", "length", "seconds", "minutes"],
    templates: ["What duration do you prefer for the CGI video?"],
    suggestions: [
      "Short (15\u201330 seconds)",
      "Medium (30\u201360 seconds)",
      "Long (1\u20132 minutes)",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_script",
    patterns: ["script", "concept", "idea"],
    templates: ["Do you already have a script or concept for the CGI video?"],
    suggestions: [
      "Yes, script and concept are ready",
      "Partial idea, need creative support",
      "No, full concept development is required",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_style",
    patterns: ["style", "visual", "look"],
    templates: ["What visual style do you prefer for the CGI video?"],
    suggestions: [
      "Highly realistic and cinematic",
      "Stylised and creative",
      "Minimal and clean",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_audio",
    patterns: ["audio", "voice", "music", "sound"],
    templates: ["Do you require voice-over, sound design, or background music?"],
    suggestions: [
      "Yes, full audio support is required",
      "Partial audio support",
      "No, visuals only",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_timeline",
    patterns: ["timeline", "delivery", "turnaround"],
    templates: ["What is your preferred delivery timeline for the CGI video?"],
    suggestions: ["Fast turnaround", "Standard timeline", "Flexible timeline"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "cgi_video_budget",
    patterns: ["budget", "price", "cost"],
    templates: ["What budget level best matches your CGI video requirement?"],
    suggestions: [
      "Under \u20B915,000",
      "\u20B915,000 \u2013 \u20B940,000",
      "\u20B940,000 \u2013 \u20B980,000",
      "\u20B980,000 and above",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails, skipIntro: true };
export default chatbot;
