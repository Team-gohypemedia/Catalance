export const service = "App Development";
export const openingMessage = `Hi! I see you're interested in ${service}. Let's get started.`;

export const serviceDetails = `Sub-types: Android App, iOS App, Cross-platform (Flutter / React Native), App Maintenance
Deliverables: UI screens & user flow, frontend + backend development, API integration, testing & deployment, App Store / Play Store submission
Pricing: MVP App â‚¹2,00,000â€“â‚¹4,00,000 | Advanced App â‚¹5,00,000â€“â‚¹12,00,000 | Maintenance â‚¹15,000â€“â‚¹40,000/month
Timelines: Full project 8â€“14 weeks (buffer included) | Partial scope: UI Design 2â€“3 weeks (â‚¹40,000â€“â‚¹1,00,000), Backend 4â€“6 weeks (â‚¹1,00,000â€“â‚¹3,00,000), Feature enhancement 1â€“3 weeks (â‚¹30,000â€“â‚¹1,50,000)
Timeline policy: timelines are in working days; 10â€“20% buffer included; delays due to missing client inputs pause the timeline.`;

export const questions = [
  {
    id: "Q1",
    nextId: "Q2",
    key: "app_type",
    answerType: "single_select",
    required: true,
    patterns: ["application type", "app type", "business app", "consumer app", "marketplace"],
    templates: ["What type of application are you planning to build?"],
    suggestions: [
      "A business or internal app",
      "A consumer-facing app",
      "A marketplace or multi-user app",
    ],
  },
  {
    id: "Q2",
    nextId: "Q3",
    key: "platform",
    answerType: "single_select",
    required: true,
    patterns: ["platform", "android", "ios", "both"],
    templates: ["Which platforms do you want the app to be available on?"],
    suggestions: ["Android only", "iOS only", "Both Android and iOS"],
  },
  {
    id: "Q3",
    nextId: "Q4",
    key: "project_stage",
    answerType: "single_select",
    required: true,
    patterns: ["stage", "idea", "mvp", "full-feature"],
    templates: ["What stage is your app currently at?"],
    suggestions: ["Idea stage", "MVP (basic version)", "Full-feature product"],
  },
  {
    id: "Q4",
    nextId: "Q5",
    key: "design_assets",
    answerType: "single_select",
    required: true,
    patterns: ["design", "ui", "ux", "wireframe", "figma"],
    templates: ["Do you already have the app design ready?"],
    suggestions: ["Yes, UI/UX is ready", "No, design needs to be created"],
  },
  {
    id: "Q5",
    nextId: "Q6",
    key: "user_roles",
    answerType: "single_select",
    required: true,
    patterns: ["user roles", "roles", "admin", "vendor"],
    templates: ["What type of user roles will the app require?"],
    suggestions: [
      "Single user type",
      "Multiple user roles (admin, user, vendor, etc.)",
    ],
  },
  {
    id: "Q6",
    nextId: "Q7",
    key: "integrations",
    answerType: "single_select",
    required: true,
    patterns: ["integrations", "payment", "api", "gateway"],
    templates: ["Do you require any integrations within the app?"],
    suggestions: [
      "Payment gateway",
      "Third-party APIs -",
      "No integrations required",
    ],
  },
  {
    id: "Q7",
    nextId: "Q8",
    key: "expected_users",
    answerType: "single_select",
    required: true,
    patterns: ["users", "user base", "scale"],
    templates: ["How many users do you expect in the first phase?"],
    suggestions: [
      "Less than 10,000 users",
      "10,000–100,000 users",
      "More than 100,000 users",
    ],
  },
  {
    id: "Q8",
    nextId: "Q9",
    key: "timeline",
    answerType: "single_select",
    required: true,
    patterns: ["timeline", "deadline", "delivery", "timeframe"],
    templates: ["What is your preferred development timeline?"],
    suggestions: ["1–2 months", "3–4 months", "Flexible timeline"],
  },
  {
    id: "Q9",
    nextId: "Q10",
    key: "post_launch_support",
    answerType: "single_select",
    required: true,
    patterns: ["maintenance", "support", "post-launch"],
    templates: ["Do you require post-launch maintenance and support?"],
    suggestions: [
      "Yes, ongoing support is required",
      "No, only development is required",
    ],
  },
  {
    id: "Q10",
    nextId: null,
    key: "budget",
    answerType: "single_select",
    required: true,
    patterns: ["budget", "range", "cost", "price"],
    templates: ["What budget level best suits this project?"],
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



