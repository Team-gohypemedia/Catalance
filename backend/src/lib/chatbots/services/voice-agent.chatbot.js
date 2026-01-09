export const service = "Voice Agent (AI Voice Bot / Call Automation)";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: Inbound support, Outbound follow-ups, Lead qualification, Appointment booking
Deliverables: Call flow design, AI voice setup, integrations, analytics & reporting
Pricing: Available on request
Timelines: Pilot 1-2 weeks | Full rollout 3-6 weeks (buffer included)
Timeline policy: timelines are in working days; 10-20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    key: "name",
    patterns: ["name", "full name", "call you"],
    templates: ["What's your name?"],
    suggestions: null,
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "main_purpose",
    patterns: ["main purpose", "purpose", "goal", "objective"],
    templates: ["What is the main purpose of the voice agent you want to implement?"],
    suggestions: [
      "Handling inbound customer calls",
      "Making outbound follow-up or reminder calls",
      "Qualifying leads over phone calls",
      "Providing automated customer support",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "solution_type",
    patterns: ["solution", "type", "voice solution"],
    templates: ["Which type of voice solution are you looking for?"],
    suggestions: [
      "Fully automated AI voice agent",
      "Hybrid solution with AI and human handover",
      "Voice assistant only for basic tasks",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "primary_use",
    patterns: ["primarily", "used", "use", "where"],
    templates: ["Where will the voice agent be primarily used?"],
    suggestions: [
      "Customer support helpline",
      "Sales and lead follow-ups",
      "Appointment booking and reminders",
      "Internal communication support",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "conversation_capability",
    patterns: ["conversation", "capability", "natural", "human-like"],
    templates: ["What level of conversation capability do you expect from the voice agent?"],
    suggestions: [
      "Basic scripted conversations",
      "Moderately intelligent conversations",
      "Highly natural, human-like conversations",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "languages",
    patterns: ["language", "languages"],
    templates: ["Which languages should the voice agent support?"],
    suggestions: [
      "English only",
      "English and one regional language",
      "Multiple languages",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "crm_integration",
    patterns: ["crm", "database", "integration", "integrate"],
    templates: ["Do you need the voice agent to integrate with your CRM or database?"],
    suggestions: [
      "Yes, CRM integration is required",
      "Yes, basic data sync is required",
      "No, standalone system is fine",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "call_volume",
    patterns: ["call volume", "volume", "calls"],
    templates: ["What is the expected call volume for the voice agent?"],
    suggestions: ["Low call volume", "Medium call volume", "High call volume"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "recording_analytics",
    patterns: ["recording", "analytics", "reports"],
    templates: ["Do you require call recording and analytics?"],
    suggestions: [
      "Yes, full call recording and reports",
      "Yes, basic call logs only",
      "No, analytics are not required",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "launch_timeline",
    patterns: ["timeline", "launch", "go live"],
    templates: ["What is your preferred timeline for launching the voice agent?"],
    suggestions: ["Immediate launch", "Within 1 month", "Flexible timeline"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "budget_level",
    patterns: ["budget", "level", "cost", "price"],
    templates: ["What budget level best matches your voice agent requirement?"],
    suggestions: ["Entry level", "Growth level", "Premium level"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
