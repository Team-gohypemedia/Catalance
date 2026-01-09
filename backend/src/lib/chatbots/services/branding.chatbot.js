export const service = "Branding (Naming, Logo & Brand Identity)";
export const openingMessage =
  "Hi! I see you're interested in Branding (Naming, Logo & Brand Identity). What's your name? Let's get started.";
export const questions = [
  {
    key: "name",
    patterns: ["name", "call you", "who are you"],
    templates: [
      "Hi! I see you're interested in Branding (Naming, Logo & Brand Identity). What's your name? Let's get started.",
    ],
    suggestions: null,
    required: true,
  },
  {
    key: "brand_stage",
    patterns: ["brand stage", "stage", "new brand", "rebrand", "rebranding"],
    templates: ["At what stage is your brand currently?"],
    suggestions: ["New brand", "Existing brand", "Rebranding"],
    required: true,
  },
  {
    key: "naming_support",
    patterns: ["name", "naming", "brand name"],
    templates: ["Do you require assistance with finalising or creating your brand name?"],
    suggestions: [
      "No, the brand name is already finalised",
      "Yes, Few name suggestions",
      "Yes, Complete naming strategy",
    ],
    required: true,
  },
  {
    key: "brand_perception",
    patterns: ["perception", "feel", "tone", "style"],
    templates: ["How would you like your brand to be perceived by your audience?"],
    suggestions: [
      "Professional and trustworthy",
      "Modern and bold",
      "Premium and minimal",
      "Youthful and energetic",
    ],
    required: true,
  },
  {
    key: "target_audience",
    patterns: ["audience", "target audience", "b2b", "b2c", "d2c"],
    templates: ["Who is your primary target audience?"],
    suggestions: [
      "Businesses (B2B)",
      "Consumers (B2C)",
      "Direct-to-consumer (D2C)",
      "A mix of different audiences",
    ],
    required: true,
  },
  {
    key: "branding_usage",
    patterns: ["usage", "platforms", "where used"],
    templates: ["Where will this branding be used most frequently?"],
    suggestions: [
      "Website and digital platforms",
      "Social media channels",
      "Packaging and print materials",
      "Across all platforms",
    ],
    required: true,
  },
  {
    key: "reference_brands",
    patterns: ["references", "reference brands", "inspiration"],
    templates: ["Do you have any reference brands whose style you admire?"],
    suggestions: ["Yes -", "No"],
    required: true,
  },
  {
    key: "deliverables",
    patterns: ["deliverables", "assets", "outputs"],
    templates: ["Which branding deliverables are you looking for? (multiple options)"],
    suggestions: [
      "Brand strategy & positioning",
      "Brand vision, mission & values",
      "Target audience & buyer persona",
      "Competitor & market analysis",
      "Brand tone of voice",
      "Logo design (primary, secondary, icon)",
      "Color palette",
      "Typography system",
      "Visual identity elements & patterns",
      "Iconography style",
      "Image / illustration style",
      "Brand guidelines / brand book",
      "Business card design",
      "Letterhead & stationery",
      "Email signature",
      "Pitch deck / presentation template",
      "Brochure / flyer design",
      "Social media profile & cover designs",
      "Social media post templates",
      "Website UI brand direction",
      "Brand messaging & brand story",
      "Complete brand identity kit",
    ],
    multiSelect: true,
    required: true,
  },
  {
    key: "timeline",
    patterns: ["timeline", "deadline", "when"],
    templates: ["What is your preferred timeline for completing the branding work?"],
    suggestions: ["Within 2 weeks", "Within 3-4 weeks", "Within 1-2 months"],
    required: true,
  },
  {
    key: "creative_freedom",
    patterns: ["creative freedom", "guidelines", "brand guidelines"],
    templates: ["How much creative freedom would you like to give the design team?"],
    suggestions: [
      "Full creative freedom",
      "Some guidelines -",
      "Strict brand guidelines -",
    ],
    required: true,
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "price"],
    templates: ["Which budget level best represents your expectation for this project?"],
    suggestions: [
      "Under INR 25,000",
      "INR 25,000 - 50,000",
      "INR 50,000 - 1,00,000",
      "INR 1,00,000 and above",
    ],
    required: true,
  },
];

const chatbot = { service, openingMessage, questions };
export default chatbot;
