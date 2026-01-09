export const service = "3D Modeling";
export const openingMessage = `Hi! I see you're interested in ${service}. What's your name? Let's get started.`;

export const serviceDetails = `Sub-types: Product visualisation, Architectural/interior, Gaming assets, Marketing visuals
Deliverables: 3D models, textures, renders
Pricing: Based on scope and volume
Timelines: Based on complexity.`;

export const questions = [
  {
    key: "model_purpose",
    patterns: ["purpose", "primary purpose", "models"],
    templates: ["What is the primary purpose of the 3D models you require?"],
    suggestions: [
      "Product visualisation",
      "Architectural or interior design",
      "Gaming or metaverse assets",
      "Marketing and advertising visuals",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "modeling_service_type",
    patterns: ["type", "service", "modeling service"],
    templates: ["What type of 3D modeling service are you looking for?"],
    suggestions: [
      "Static 3D models",
      "Animated 3D models",
      "High-detail photorealistic models",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "industry",
    patterns: ["industry", "requirement"],
    templates: ["Which industry best describes your requirement?"],
    suggestions: [
      "E-commerce / D2C",
      "Real estate / architecture",
      "Manufacturing / industrial",
      "Media / entertainment",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "reference_files",
    patterns: ["reference", "drawings", "cad", "files"],
    templates: ["Do you already have reference files or drawings for the models?"],
    suggestions: [
      "Yes, CAD or reference files are available",
      "Yes, only images or sketches are available",
      "No, modeling needs to start from scratch",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "detail_level",
    patterns: ["detail", "level of detail", "quality"],
    templates: ["What level of detail do you expect in the 3D models?"],
    suggestions: [
      "Basic visual detail",
      "Medium detail",
      "High photorealistic detail",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "model_count",
    patterns: ["how many", "model count", "models"],
    templates: ["How many 3D models do you require?"],
    suggestions: ["A single model", "2\u20135 models", "More than 5 models"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "usage",
    patterns: ["used", "usage", "platforms"],
    templates: ["Where will these 3D models be used?"],
    suggestions: [
      "Website or e-commerce platforms",
      "Marketing and advertising materials",
      "Presentations or client demos",
      "Multiple platforms",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "rendering_requirements",
    patterns: ["textures", "lighting", "rendering"],
    templates: ["Do you require textures, lighting, and rendering along with modeling?"],
    suggestions: [
      "Yes, complete modeling and rendering",
      "Modeling only",
      "Modeling with basic rendering",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "timeline",
    patterns: ["timeline", "delivery", "deadline"],
    templates: ["What is your preferred delivery timeline?"],
    suggestions: ["Urgent delivery", "Standard timeline", "Flexible timeline"],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
  {
    key: "budget_range",
    patterns: ["budget", "range", "cost"],
    templates: ["What budget range best suits your 3D modeling requirement?"],
    suggestions: [
      "Under \u20B95,000 per model",
      "\u20B95,000 \u2013 \u20B915,000 per model",
      "\u20B915,000 \u2013 \u20B940,000 per model",
      "\u20B940,000 and above per model",
    ],
    required: true,
    disableSharedContext: true,
    forceAsk: true,
  },
];

const chatbot = { service, openingMessage, questions, serviceDetails };
export default chatbot;
