export const BASIC_PROFILE_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "multiselect",
  "file",
  "image",
  "media",
];

export const BASIC_PROFILE_FIELD_DATA_SOURCES = [
  { value: "manual", label: "Manual options" },
  { value: "countryOptions", label: "Country options" },
  { value: "stateOptions", label: "State options" },
  { value: "languageOptions", label: "Language options" },
];

export const DEFAULT_BASIC_PROFILE_FIELDS = [
  {
    id: "profilePhoto",
    type: "image",
    label: "Profile Photo",
    helperText: "JPG, PNG or GIF. Max 5MB.",
    menuCameraLabel: "Take a picture",
    menuUploadLabel: "Choose from device",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "fullName",
    type: "text",
    label: "Name",
    placeholder: "Enter your full name",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "username",
    type: "text",
    label: "Username",
    prefix: "@",
    placeholder: "yourname",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "professionalBio",
    type: "textarea",
    label: "Professional Bio",
    placeholder:
      "Tell us about your background, expertise, and what makes you unique...",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "resume",
    type: "file",
    label: "Upload Your CV",
    browseLabel: "Browse",
    helperText: "PDF or DOCX file, max 5MB",
    removeLabel: "Remove",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "country",
    type: "select",
    label: "Country",
    placeholder: "Select country",
    dataSource: "countryOptions",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "state",
    type: "select",
    label: "State / Province",
    selectCountryFirstLabel: "Select country first",
    loadingLabel: "Loading states...",
    selectPlaceholder: "Select state",
    inputPlaceholder: "Type your state",
    dataSource: "stateOptions",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "languages",
    type: "multiselect",
    label: "Select Language",
    placeholder: "Select language",
    dataSource: "languageOptions",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
];

export const DEFAULT_SERVICE_INFO_FIELDS = [
  {
    id: "title",
    type: "text",
    label: "Service Title",
    placeholder: "I will do something I'm really good at",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "categories",
    type: "multiselect",
    label: "Select Skill",
    placeholder: "Search here",
    searchPlaceholder: "Search here",
    options: [],
    skillSuggestionsByCategory: {},
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "experience",
    type: "select",
    label: "Experience",
    placeholder: "Select experience level",
    options: [
      { value: "entry", label: "Entry Level (0-1 years)" },
      { value: "intermediate", label: "Intermediate (1-3 years)" },
      { value: "experienced", label: "Experienced (3-5 years)" },
      { value: "expert", label: "Expert (5-10 years)" },
      { value: "veteran", label: "Veteran (10+ years)" },
    ],
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
];

export const DEFAULT_SERVICE_PRICING_FIELDS = [
  {
    id: "description",
    type: "textarea",
    label: "Service Description",
    placeholder: "Description...",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "deliveryTimeline",
    type: "select",
    label: "Delivery Timeline",
    placeholder: "Select delivery time",
    options: [
      { value: "1_week", label: "1 Week" },
      { value: "2_weeks", label: "2 Weeks" },
      { value: "3_weeks", label: "3 Weeks" },
      { value: "4_weeks", label: "4 Weeks" },
      { value: "6_weeks", label: "6 Weeks" },
      { value: "8_weeks", label: "8 Weeks" },
      { value: "12_weeks", label: "12 Weeks" },
      { value: "ongoing", label: "Ongoing / Retainer" },
    ],
    required: false,
    visible: false,
    system: true,
    canDelete: false,
  },
  {
    id: "priceRange",
    type: "text",
    label: "Starting Price",
    placeholder: "Enter starting price",
    prefix: "₹",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },
];

export const DEFAULT_SERVICE_VISUALS_FIELDS = [
  {
    id: "mediaFiles",
    type: "media",
    label: "Upload Media",
    helperText: "Add one image or video to create the primary preview.",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
];

export const DEFAULT_CASE_STUDY_FIELDS = [
  {
    id: "title",
    type: "text",
    label: "Case Study Title",
    placeholder: "e.g. E-commerce Platform Redesign",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "description",
    type: "textarea",
    label: "Description",
    placeholder: "Briefly describe the project and its goals...",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "niche",
    type: "select",
    label: "Niche",
    placeholder: "Select niche",
    searchPlaceholder: "Search niches",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "projectLink",
    type: "text",
    label: "Project Link (Optional)",
    placeholder: "https://...",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "projectFile",
    type: "file",
    label: "Project File (Optional)",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "previewImage",
    type: "image",
    label: "Banner Image (Optional)",
    required: false,
    visible: true,
    system: true,
    canDelete: false,
  },

  {
    id: "role",
    type: "select",
    label: "Your Role",
    placeholder: "Select role",
    options: [
      { value: "full_execution", label: "Full execution" },
      { value: "partial_contribution", label: "Partial contribution" },
      { value: "team_project", label: "Team project" },
    ],
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "timeline",
    type: "select",
    label: "Timeline",
    placeholder: "Select duration",
    options: [
      { value: "under_1_week", label: "Under 1 Week" },
      { value: "1_2_weeks", label: "1-2 Weeks" },
      { value: "2_4_weeks", label: "2-4 Weeks" },
      { value: "4_6_weeks", label: "4-6 Weeks" },
      { value: "6_8_weeks", label: "6-8 Weeks" },
      { value: "8_12_weeks", label: "8-12 Weeks" },
      { value: "12_plus_weeks", label: "12+ Weeks" },
    ],
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
  {
    id: "budget",
    type: "text",
    label: "Budget",
    placeholder: "e.g. 5000",
    prefix: "₹",
    required: true,
    visible: true,
    system: true,
    canDelete: false,
  },
];

export const DEFAULT_FREELANCER_ONBOARDING_CONTENT = {
  basicProfile: {
    title: "Complete Your Profile",
    description: "Let's establish your professional presence",
    fields: DEFAULT_BASIC_PROFILE_FIELDS,
  },
  stepper: {
    steps: [
      { id: "overview", label: "Overview", step: 1 },
      { id: "pricing", label: "Pricing", step: 2 },
      { id: "visuals", label: "Add Visuals", step: 3 },
      { id: "caseStudy", label: "Case Study", step: 4 },
      { id: "preview", label: "Preview", step: 5 },
    ],
  },
  serviceSetup: {
    titleTemplate: "Let's Start Your {serviceName} Setup",
    description: "Describe your services to get matched with clients.",
  },
  serviceInfo: {
    headingTitleTemplate: "Fill Your {serviceName} Service Info",
    sectionTitle: "Tell clients what you offer",
    sectionDescription:
      "Capture the title, category, and experience you want shown for this service.",
    serviceTitleTooltip:
      "Write a clear title that shows what you can build and the result you deliver.",
    fields: {
      title: {
        label: "Service Title",
        placeholder: "I will do something I'm really good at",
      },
      categories: {
        label: "Select Skill",
        placeholder: "Search here",
        searchPlaceholder: "Search here",
        options: [],
        skillSuggestionsByCategory: {},
      },
      experience: {
        label: "Experience",
        placeholder: "Select experience level",
        options: [
          { value: "entry", label: "Entry Level (0-1 years)" },
          { value: "intermediate", label: "Intermediate (1-3 years)" },
          { value: "experienced", label: "Experienced (3-5 years)" },
          { value: "expert", label: "Expert (5-10 years)" },
          { value: "veteran", label: "Veteran (10+ years)" },
        ],
      },
    },
    fieldList: DEFAULT_SERVICE_INFO_FIELDS,
  },
  servicePricing: {
    headingTitleTemplate: "Set Your {serviceName} Service Price",
    sectionTitle: "Set Your Price",
    sectionDescription: "Provide the details of the service you will offer.",
    fields: {
      description: {
        label: "Service Description",
        placeholder: "Description...",
      },
      deliveryTimeline: {
        label: "Delivery Timeline",
        placeholder: "Select delivery time",
        options: [
          { value: "1_week", label: "1 Week" },
          { value: "2_weeks", label: "2 Weeks" },
          { value: "3_weeks", label: "3 Weeks" },
          { value: "4_weeks", label: "4 Weeks" },
          { value: "6_weeks", label: "6 Weeks" },
          { value: "8_weeks", label: "8 Weeks" },
          { value: "12_weeks", label: "12 Weeks" },
          { value: "ongoing", label: "Ongoing / Retainer" },
        ],
      },
      priceRange: {
        label: "Starting Price",
        placeholder: "Enter starting price",
        currencySymbol: "₹",
      },
    },
    fieldList: DEFAULT_SERVICE_PRICING_FIELDS,
  },
  serviceVisuals: {
    headingTitle: "Add Media",
    sectionTitle: "Enhance Your Service",
    sectionDescription: "Add media for better visibility.",
    uploadRuleWithMedia:
      "Upload rule: up to 2 images and 1 video (max 5MB each).",
    uploadRuleEmpty:
      "Upload rule: add one file to start, then add up to 2 images and 1 video total.",
    fieldList: DEFAULT_SERVICE_VISUALS_FIELDS,
  },
  caseStudy: {
    headingTitle: "Tell Us About Your Previous Work",
    sectionTitle: "Case Studies",
    sectionDescription:
      "Add multiple case studies and switch between them.",
    addButtonLabel: "Add Case Study",
    limitMessage:
      "Onboarding limit reached: 5 case studies. Add more later from your profile.",
    fields: {
      title: {
        label: "Case Study Title",
        placeholder: "e.g. E-commerce Platform Redesign",
      },
      description: {
        label: "Description",
        placeholder: "Briefly describe the project and its goals...",
      },
      niche: {
        label: "Niche",
        placeholder: "Select niche",
        searchPlaceholder: "Search niches",
        options: [],
      },
      projectLink: {
        label: "Project Link (Optional)",
        placeholder: "https://...",
      },
      projectFile: {
        label: "Project File (Optional)",
      },
      role: {
        label: "Your Role",
        placeholder: "Select role",
        options: [
          { value: "full_execution", label: "Full execution" },
          { value: "partial_contribution", label: "Partial contribution" },
          { value: "team_project", label: "Team project" },
        ],
      },
      timeline: {
        label: "Timeline",
        placeholder: "Select duration",
        options: [
          { value: "under_1_week", label: "Under 1 Week" },
          { value: "1_2_weeks", label: "1-2 Weeks" },
          { value: "2_4_weeks", label: "2-4 Weeks" },
          { value: "4_6_weeks", label: "4-6 Weeks" },
          { value: "6_8_weeks", label: "6-8 Weeks" },
          { value: "8_12_weeks", label: "8-12 Weeks" },
          { value: "12_plus_weeks", label: "12+ Weeks" },
        ],
      },
      budget: {
        label: "Budget",
        placeholder: "e.g. 5000",
      },
    },
    fieldList: DEFAULT_CASE_STUDY_FIELDS,
  },
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toSafeFieldId = (value = "", fallback = "field") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;

const getDefaultSchemaField = (defaults = [], fieldId = "", index = 0) => {
  const normalizedFieldId = toSafeFieldId(fieldId || "", "");
  if (normalizedFieldId) {
    const matchedDefault = defaults.find(
      (entry) => toSafeFieldId(entry?.id || "", "") === normalizedFieldId,
    );
    if (matchedDefault) {
      return matchedDefault;
    }
  }

  return defaults[index] || {};
};

const normalizeBasicProfileField = (field = {}, index = 0) => {
  const defaultField = getDefaultSchemaField(
    DEFAULT_BASIC_PROFILE_FIELDS,
    field?.id,
    index,
  );
  const isSystemField =
    field?.system !== undefined ? Boolean(field.system) : Boolean(defaultField.system);
  const type =
    isSystemField && defaultField.type
      ? defaultField.type
      : BASIC_PROFILE_FIELD_TYPES.includes(field?.type)
        ? field.type
        : defaultField.type || "text";
  const id =
    isSystemField && defaultField.id
      ? defaultField.id
      : toSafeFieldId(field?.id || defaultField.id || `field_${index + 1}`);

  return {
    ...defaultField,
    ...field,
    id,
    type,
    label: String(field?.label ?? defaultField.label ?? "").trim(),
    placeholder: String(field?.placeholder ?? defaultField.placeholder ?? ""),
    helperText: String(field?.helperText ?? defaultField.helperText ?? ""),
    prefix: String(field?.prefix ?? defaultField.prefix ?? ""),
    browseLabel: String(field?.browseLabel ?? defaultField.browseLabel ?? ""),
    removeLabel: String(field?.removeLabel ?? defaultField.removeLabel ?? ""),
    menuCameraLabel: String(
      field?.menuCameraLabel ?? defaultField.menuCameraLabel ?? "",
    ),
    menuUploadLabel: String(
      field?.menuUploadLabel ?? defaultField.menuUploadLabel ?? "",
    ),
    selectCountryFirstLabel: String(
      field?.selectCountryFirstLabel ??
        defaultField.selectCountryFirstLabel ??
        "",
    ),
    loadingLabel: String(field?.loadingLabel ?? defaultField.loadingLabel ?? ""),
    selectPlaceholder: String(
      field?.selectPlaceholder ?? defaultField.selectPlaceholder ?? "",
    ),
    inputPlaceholder: String(
      field?.inputPlaceholder ?? defaultField.inputPlaceholder ?? "",
    ),
    dataSource: String(field?.dataSource ?? defaultField.dataSource ?? "manual"),
    required: field?.required !== undefined
      ? Boolean(field.required)
      : Boolean(defaultField.required),
    visible: field?.visible !== undefined
      ? Boolean(field.visible)
      : defaultField.visible !== false,
    system: field?.system !== undefined
      ? Boolean(field.system)
      : Boolean(defaultField.system),
    canDelete: field?.canDelete !== undefined
      ? Boolean(field.canDelete)
      : defaultField.canDelete !== false,
    options: Array.isArray(field?.options)
      ? field.options
      : Array.isArray(defaultField.options)
        ? defaultField.options
        : [],
  };
};

const normalizeSchemaField = (field = {}, defaultField = {}, index = 0) => {
  const isSystemField =
    field?.system !== undefined ? Boolean(field.system) : Boolean(defaultField.system);
  const type =
    isSystemField && defaultField.type
      ? defaultField.type
      : BASIC_PROFILE_FIELD_TYPES.includes(field?.type)
        ? field.type
        : defaultField.type || "text";
  const id =
    isSystemField && defaultField.id
      ? defaultField.id
      : toSafeFieldId(field?.id || defaultField.id || `field_${index + 1}`);

  return {
    ...defaultField,
    ...field,
    id,
    type,
    label: String(field?.label ?? defaultField.label ?? "").trim(),
    placeholder: String(field?.placeholder ?? defaultField.placeholder ?? ""),
    helperText: String(field?.helperText ?? defaultField.helperText ?? ""),
    searchPlaceholder: String(
      field?.searchPlaceholder ?? defaultField.searchPlaceholder ?? "",
    ),
    prefix: String(field?.prefix ?? defaultField.prefix ?? ""),
    browseLabel: String(field?.browseLabel ?? defaultField.browseLabel ?? ""),
    removeLabel: String(field?.removeLabel ?? defaultField.removeLabel ?? ""),
    required:
      field?.required !== undefined
        ? Boolean(field.required)
        : Boolean(defaultField.required),
    visible:
      field?.visible !== undefined
        ? Boolean(field.visible)
        : defaultField.visible !== false,
    system:
      field?.system !== undefined
        ? Boolean(field.system)
        : Boolean(defaultField.system),
    canDelete:
      field?.canDelete !== undefined
        ? Boolean(field.canDelete)
        : defaultField.canDelete !== false,
    options: Array.isArray(field?.options)
      ? field.options
      : Array.isArray(defaultField.options)
        ? defaultField.options
        : [],
  };
};

export const resolveBasicProfileFields = (content = {}) => {
  const rawFields = content?.basicProfile?.fields;

  if (Array.isArray(rawFields) && rawFields.length > 0) {
    return rawFields.map((field, index) => normalizeBasicProfileField(field, index));
  }

  const legacyFields = isPlainObject(rawFields) ? rawFields : {};
  const legacyPhoto = isPlainObject(content?.basicProfile?.profilePhoto)
    ? content.basicProfile.profilePhoto
    : {};

  return DEFAULT_BASIC_PROFILE_FIELDS.map((defaultField, index) => {
    if (defaultField.id === "profilePhoto") {
      return normalizeBasicProfileField(
        {
          ...defaultField,
          ...legacyPhoto,
        },
        index,
      );
    }

    return normalizeBasicProfileField(
      {
        ...defaultField,
        ...(isPlainObject(legacyFields[defaultField.id]) ? legacyFields[defaultField.id] : {}),
      },
      index,
    );
  });
};

const resolveSectionFields = ({
  section = {},
  fieldListKey = "fieldList",
  legacyFieldsKey = "fields",
  defaults = [],
}) => {
  const rawFields = section?.[fieldListKey];
  const legacyFields = isPlainObject(section?.[legacyFieldsKey])
    ? section[legacyFieldsKey]
    : {};

  if (Array.isArray(rawFields) && rawFields.length > 0) {
    return rawFields.map((field, index) => {
      const defaultField = getDefaultSchemaField(defaults, field?.id, index);
      const legacyOverride =
        isPlainObject(legacyFields[toSafeFieldId(field?.id || defaultField.id || "", "")]) ||
        isPlainObject(legacyFields[defaultField.id])
          ? legacyFields[toSafeFieldId(field?.id || defaultField.id || "", "")] || legacyFields[defaultField.id]
          : {};

      return normalizeSchemaField(
        {
          ...legacyOverride,
          ...field,
        },
        defaultField,
        index,
      );
    });
  }

  return defaults.map((defaultField, index) =>
    normalizeSchemaField(
      {
        ...defaultField,
        ...(isPlainObject(legacyFields[defaultField.id])
          ? legacyFields[defaultField.id]
          : {}),
      },
      defaultField,
      index,
    ),
  );
};

export const resolveServiceInfoFields = (content = {}) =>
  resolveSectionFields({
    section: content?.serviceInfo || {},
    defaults: DEFAULT_SERVICE_INFO_FIELDS,
  });

export const resolveServicePricingFields = (content = {}) =>
  resolveSectionFields({
    section: content?.servicePricing || {},
    defaults: DEFAULT_SERVICE_PRICING_FIELDS,
  });

export const resolveServiceVisualFields = (content = {}) =>
  resolveSectionFields({
    section: content?.serviceVisuals || {},
    defaults: DEFAULT_SERVICE_VISUALS_FIELDS,
  });

export const resolveCaseStudyFields = (content = {}) =>
  resolveSectionFields({
    section: content?.caseStudy || {},
    defaults: DEFAULT_CASE_STUDY_FIELDS,
  });

export const mergeOnboardingContent = (base, override) => {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }

  if (!isPlainObject(base)) {
    return override === undefined ? base : override;
  }

  const result = { ...base };
  const source = isPlainObject(override) ? override : {};

  Object.keys(source).forEach((key) => {
    const baseValue = base[key];
    const overrideValue = source[key];

    if (Array.isArray(baseValue)) {
      result[key] = Array.isArray(overrideValue) ? overrideValue : baseValue;
      return;
    }

    if (isPlainObject(baseValue)) {
      result[key] = mergeOnboardingContent(baseValue, overrideValue);
      return;
    }

    result[key] = overrideValue === undefined ? baseValue : overrideValue;
  });

  return result;
};

export const getFreelancerOnboardingContentForService = (
  config,
  serviceKey = "",
) => {
  const global = isPlainObject(config?.global) ? config.global : {};
  const services = isPlainObject(config?.services) ? config.services : {};
  const normalizedServiceKey = String(serviceKey || "").trim().toLowerCase();
  const serviceOverride = normalizedServiceKey
    ? services[normalizedServiceKey]
    : null;

  return mergeOnboardingContent(
    DEFAULT_FREELANCER_ONBOARDING_CONTENT,
    mergeOnboardingContent(global, serviceOverride || {}),
  );
};

export const applyServiceTemplate = (template, serviceName = "Service") =>
  String(template || "").replace(/\{serviceName\}/g, serviceName || "Service");
