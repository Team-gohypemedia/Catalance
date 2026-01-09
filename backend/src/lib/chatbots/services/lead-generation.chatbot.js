export const service = "Lead Generation";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: B2B Lead Generation, B2C Lead Generation, Real Estate Leads, Appointment Booking
Deliverables: Ad account setup, targeting & creatives, lead tracking sheet/CRM, weekly performance reports
Pricing: Setup â‚¹15,000â€“â‚¹30,000 | Monthly â‚¹20,000â€“â‚¹60,000
Timelines: Full campaign is ongoing (minimum 30 days) | Partial scope: Ad setup only 5â€“7 days (â‚¹10,000â€“â‚¹20,000), Lead data delivery only 10â€“15 days (custom pricing)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
const normalizeText = (value = "") => (value || "").toString().trim();

const shouldAskTargetCity = (data = {}) => {
  const target = normalizeText(data.target_location).toLowerCase();
  return target.includes("specific city");
};

const shouldAskTargetRegion = (data = {}) => {
  const target = normalizeText(data.target_location).toLowerCase();
  return (
    target.includes("state or region") ||
    target.includes("state") ||
    target.includes("region")
  );
};

export const questions = [
  {
    id: "Q1",
    nextId: "Q2",
    key: "name",
    answerType: "text",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["name", "call you", "full name"],
    templates: ["What's your name?"],
    suggestions: null,
    tags: ["name"],
  },
  {
    id: "Q2",
    nextId: "Q3",
    key: "lead_type",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["lead type", "phone call", "form submissions", "whatsapp", "chat"],
    templates: ["What type of leads are you primarily looking for?"],
    suggestions: ["Phone call leads", "Form submissions", "WhatsApp or chat leads"],
  },
  {
    id: "Q3",
    nextId: "Q4",
    key: "target_audience",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["target audience", "b2b", "b2c", "businesses", "consumers"],
    templates: ["Who is your target audience?"],
    suggestions: ["Businesses (B2B)", "Consumers (B2C)", "A mix of both"],
  },
  {
    id: "Q4",
    nextId: "Q5",
    key: "target_location",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["location", "city", "region", "pan-india"],
    templates: ["Which locations do you want to target for lead generation?"],
    suggestions: ["A specific city", "A state or region", "Pan-India"],
  },
  {
    id: "Q5",
    nextId: "Q6",
    key: "target_city",
    answerType: "text",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["specific city", "city name", "which city"],
    templates: ["Please share the specific city name."],
    suggestions: null,
    tags: ["location"],
    when: shouldAskTargetCity,
  },
  {
    id: "Q6",
    nextId: "Q7",
    key: "target_region",
    answerType: "text",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["state", "region", "state or region"],
    templates: ["Please share the state or region."],
    suggestions: null,
    tags: ["location"],
    when: shouldAskTargetRegion,
  },
  {
    id: "Q7",
    nextId: "Q8",
    key: "lead_volume",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["leads per month", "lead volume", "volume"],
    templates: ["How many leads do you expect per month?"],
    suggestions: ["Low volume", "Medium volume", "High volume"],
  },
  {
    id: "Q8",
    nextId: "Q9",
    key: "channels",
    answerType: "multi_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["channels", "google", "meta", "linkedin", "email", "tools"],
    templates: ["Which channels should be used for lead generation? (Multiple)"],
    suggestions: ["Google", "Meta", "LinkedIn", "Email", "Third party tools"],
    multiSelect: true,
  },
  {
    id: "Q9",
    nextId: "Q10",
    key: "lead_quality",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["lead quality", "raw leads", "pre-qualified"],
    templates: ["What level of lead quality do you require?"],
    suggestions: ["Raw leads", "Pre-qualified leads"],
  },
  {
    id: "Q10",
    nextId: "Q11",
    key: "crm_usage",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["crm", "lead tracking", "tracking system"],
    templates: ["Do you currently use a CRM or lead tracking system?"],
    suggestions: ["Yes, a CRM is already in place", "No"],
  },
  {
    id: "Q11",
    nextId: "Q12",
    key: "campaign_duration",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["campaign duration", "how long", "short-term", "long-term"],
    templates: ["How long do you want to run the lead generation campaigns?"],
    suggestions: ["Short-term", "Medium-term", "Long-term"],
  },
  {
    id: "Q12",
    nextId: null,
    key: "monthly_budget",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["budget", "monthly budget", "spend"],
    templates: ["What is your monthly budget for lead generation?"],
    suggestions: [
      "Under ₹15,000 / month",
      "₹15,000 – ₹30,000 / month",
      "₹30,000 – ₹60,000 / month",
      "₹60,000 – ₹1,00,000 / month",
      "₹1,00,000 and above / month",
    ],
  },
];

const chatbot = {
  service,
  openingMessage,
  questions,
  serviceDetails,
  skipIntro: true,
};
export default chatbot;

