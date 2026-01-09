export const service = "Software Development";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;
export const serviceDetails = `Sub-types: Custom Web Software, SaaS Platforms, Internal Tools, CRM/ERP Systems
Deliverables: Requirement documentation, custom modules, admin panel, deployment & handover
Pricing: Small software â‚¹1,50,000â€“â‚¹3,00,000 | SaaS/Enterprise â‚¹5,00,000â€“â‚¹20,00,000+
Timelines: Full project 6â€“12 weeks (buffer included) | Partial scope: Module development 2â€“4 weeks (â‚¹50,000â€“â‚¹2,00,000), Admin panel only 2â€“3 weeks (â‚¹40,000â€“â‚¹1,20,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;
const normalizeText = (value = "") => (value || "").toString().trim();

const shouldAskSpecificTechnologies = (data = {}) => {
  const preference = normalizeText(data.tech_stack_preference).toLowerCase();
  if (!preference) return false;
  if (/\bno\b/.test(preference)) return false;
  return /\byes\b/.test(preference) || preference.includes("specific");
};

export const questions = [
  {
    id: "Q1",
    nextId: "Q2",
    key: "primary_purpose",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["primary purpose", "purpose", "internal", "customer-facing", "saas"],
    templates: ["What is the primary purpose of the software you want to build?"],
    suggestions: [
      "Internal business operations",
      "Customer-facing product",
      "SaaS platform",
    ],
  },
  {
    id: "Q2",
    nextId: "Q3",
    key: "primary_users",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["who will use", "users", "internal team", "external customers", "both"],
    templates: ["Who will primarily use this software?"],
    suggestions: ["Internal team", "External customers", "Both"],
  },
  {
    id: "Q3",
    nextId: "Q4",
    key: "complexity",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["complexity", "basic", "moderately complex", "highly complex"],
    templates: ["How complex do you expect the software to be?"],
    suggestions: [
      "Basic system",
      "Moderately complex system",
      "Highly complex system",
    ],
  },
  {
    id: "Q4",
    nextId: "Q5",
    key: "tech_stack_preference",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["technology stack", "tech stack", "preferred tech", "stack"],
    templates: ["Do you have a preferred technology stack?"],
    suggestions: ["Yes, specific technologies -", "No, open to recommendations"],
  },
  {
    id: "Q5",
    nextId: "Q6",
    key: "preferred_technologies",
    answerType: "text",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["specific technologies", "preferred technologies", "tech stack", "stack", "technologies"],
    templates: ["Please list the specific technologies you prefer."],
    suggestions: null,
    when: shouldAskSpecificTechnologies,
  },
  {
    id: "Q6",
    nextId: "Q7",
    key: "scalability",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["scalability", "scale", "growth", "users"],
    templates: ["How important is scalability for your software?"],
    suggestions: ["Limited users", "Moderate growth", "High scalability required"],
  },
  {
    id: "Q7",
    nextId: "Q8",
    key: "security_compliance",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["security", "compliance", "data protection"],
    templates: ["Are there any security or compliance requirements?"],
    suggestions: ["Standard security", "High security or compliance needs"],
  },
  {
    id: "Q8",
    nextId: "Q9",
    key: "integrations",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["integrations", "crm", "erp", "api", "systems"],
    templates: ["Do you need integrations with existing tools or systems?"],
    suggestions: ["CRM or ERP systems", "Third-party APIs -", "No integrations"],
  },
  {
    id: "Q9",
    nextId: "Q10",
    key: "delivery_approach",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["delivery approach", "mvp", "complete solution", "approach"],
    templates: ["What is your preferred delivery approach?"],
    suggestions: ["MVP first", "Complete solution"],
  },
  {
    id: "Q10",
    nextId: "Q11",
    key: "timeline",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["timeline", "deadline", "delivery"],
    templates: ["What is your expected delivery timeline?"],
    suggestions: ["1–2 months", "3–4 months", "Flexible timeline"],
  },
  {
    id: "Q11",
    nextId: null,
    key: "budget",
    answerType: "single_select",
    required: true,
    disableSharedContext: true,
    forceAsk: true,
    patterns: ["budget", "range", "cost", "price"],
    templates: ["What budget range do you have in mind?"],
    suggestions: [
      "Under ₹1,00,000 (Basic app / MVP)",
      "₹1,00,000 – ₹3,00,000",
      "₹3,00,000 – ₹7,00,000",
      "₹7,00,000 – ₹15,00,000",
      "₹15,00,000 and above",
    ],
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;


