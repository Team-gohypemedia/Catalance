import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL =
  env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.6";
const DEFAULT_REFERER =
  env.FRONTEND_URL || env.CORS_ORIGIN || "http://localhost:5173";
const MAX_RESUME_TEXT_CHARS = 24000;
const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME_TYPE = "application/msword";

let pdfJsModulePromise = null;
let mammothModulePromise = null;

const normalizeText = (value = "") => String(value || "").trim();

const clipText = (value = "", maxChars = MAX_RESUME_TEXT_CHARS) =>
  normalizeText(value).slice(0, maxChars);

const loadPdfJs = async () => {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }

  return pdfJsModulePromise;
};

const loadMammoth = async () => {
  if (!mammothModulePromise) {
    mammothModulePromise = import("mammoth");
  }

  return mammothModulePromise;
};

const extractPdfTextFromBuffer = async (buffer) => {
  const pdfJs = await loadPdfJs();
  const loadingTask = pdfJs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let extracted = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || [])
      .map((item) => normalizeText(item?.str))
      .filter(Boolean)
      .join(" ");

    if (!pageText) {
      continue;
    }

    extracted = `${extracted}\n${pageText}`.trim();
    if (extracted.length >= MAX_RESUME_TEXT_CHARS) {
      break;
    }
  }

  return clipText(extracted);
};

const extractDocxTextFromBuffer = async (buffer) => {
  const mammoth = await loadMammoth();
  const result = await mammoth.extractRawText({ buffer });
  return clipText(result?.value || "");
};

const extractResumeTextFromFile = async (file) => {
  const mimeType = normalizeText(file?.mimetype).toLowerCase();
  const fileName = normalizeText(file?.originalname).toLowerCase();
  const buffer = file?.buffer;

  if (!buffer || buffer.length === 0) {
    throw new AppError("Uploaded resume file is empty.", 400);
  }

  if (mimeType === PDF_MIME_TYPE || fileName.endsWith(".pdf")) {
    return extractPdfTextFromBuffer(buffer);
  }

  if (
    mimeType === DOCX_MIME_TYPE ||
    fileName.endsWith(".docx")
  ) {
    return extractDocxTextFromBuffer(buffer);
  }

  if (mimeType === DOC_MIME_TYPE || fileName.endsWith(".doc")) {
    throw new AppError(
      "AI autofill supports PDF and DOCX resumes. Please upload a PDF or DOCX file.",
      400,
    );
  }

  throw new AppError("Unsupported resume file format.", 400);
};

const safeJsonParse = (value = "") => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const extractJsonObject = (value = "") => {
  const direct = safeJsonParse(value);
  if (direct) {
    return direct;
  }

  const fencedMatch = String(value || "").match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fenced = safeJsonParse(fencedMatch[1]);
    if (fenced) {
      return fenced;
    }
  }

  const objectStart = String(value || "").indexOf("{");
  const objectEnd = String(value || "").lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return safeJsonParse(String(value).slice(objectStart, objectEnd + 1));
  }

  return null;
};

const readMessageContent = (messageContent) => {
  if (typeof messageContent === "string") {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((entry) => (typeof entry?.text === "string" ? entry.text : ""))
      .join("\n")
      .trim();
  }

  return "";
};

const normalizeAutofillField = (field = {}) => {
  const normalizedField = field && typeof field === "object" ? field : {};
  const type = normalizeText(normalizedField.type);
  const normalized = {
    id: normalizeText(normalizedField.id),
    label: normalizeText(normalizedField.label),
    type,
    required: Boolean(normalizedField.required),
    options: [],
  };

  if (Array.isArray(normalizedField.options)) {
    normalized.options = normalizedField.options
      .map((option) => {
        if (option && typeof option === "object") {
          return {
            value: normalizeText(option.value),
            label: normalizeText(option.label || option.value),
          };
        }

        const text = normalizeText(option);
        return text ? { value: text, label: text } : null;
      })
      .filter((option) => option?.value);
  }

  return normalized;
};

const normalizeAutofillSchema = (schema = {}) => {
  const normalizedSchema = schema && typeof schema === "object" ? schema : {};
  const normalizeList = (value) =>
    (Array.isArray(value) ? value : []).map((field) => normalizeAutofillField(field)).filter(
      (field) => field.id,
    );

  return {
    basicProfile: normalizeList(normalizedSchema.basicProfile),
    serviceInfo: normalizeList(normalizedSchema.serviceInfo),
    servicePricing: normalizeList(normalizedSchema.servicePricing),
    caseStudy: normalizeList(normalizedSchema.caseStudy),
  };
};

const normalizeAutofillValue = (type, value) => {
  if (type === "multiselect") {
    return Array.from(
      new Set(
        (Array.isArray(value) ? value : [value])
          .map((entry) => normalizeText(entry))
          .filter(Boolean),
      ),
    );
  }

  return normalizeText(value);
};

const sanitizeMoneyLikeValue = (value) =>
  normalizeText(value)
    .replace(/[$€£¥₹]/g, "")
    .replace(/\s*[–—]\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const collapseMoneyRangeToSingleValue = (value) => {
  const sanitized = sanitizeMoneyLikeValue(value);
  if (!sanitized) {
    return "";
  }

  const numericMatches = sanitized.match(/\d+(?:\.\d+)?/g) || [];
  if (!numericMatches.length) {
    return sanitized;
  }

  return numericMatches[0];
};

const normalizeAutofillResponse = (payload, fieldMap) => {
  const rawFields = Array.isArray(payload?.fields) ? payload.fields : [];

  return rawFields
    .map((entry) => {
      const fieldId = normalizeText(entry?.fieldId);
      const field = fieldMap.get(fieldId);
      const confidence = Number(entry?.confidence);

      if (!field || !Number.isFinite(confidence)) {
        return null;
      }

      return {
        fieldId,
        value: normalizeAutofillValue(field.type, entry?.value),
        confidence: Math.min(Math.max(confidence, 0), 1),
        reason: normalizeText(entry?.reason),
      };
    })
    .filter((entry) => {
      if (!entry) {
        return false;
      }

      return Array.isArray(entry.value) ? entry.value.length > 0 : Boolean(entry.value);
    });
};

const normalizeServiceFieldSuggestion = (field = {}, value, options = {}) => ({
  value: options.singleMoneyValue
    ? collapseMoneyRangeToSingleValue(value)
    : options.sanitizeMoney
      ? sanitizeMoneyLikeValue(value)
      : normalizeAutofillValue(field.type, value),
  confidence: Number(field?.confidence),
  reason: normalizeText(field?.reason),
});

const normalizeServiceCategorySuggestion = (entry = {}, subCategoryMap) => {
  const resolvedId = Number(entry?.subCategoryId);
  const directCatalogEntry = Number.isInteger(resolvedId) && resolvedId > 0
    ? subCategoryMap.get(resolvedId)
    : null;
  const label = normalizeText(entry?.label || directCatalogEntry?.name);
  const customSkillNames = Array.from(
    new Set(
      (Array.isArray(entry?.customSkillNames) ? entry.customSkillNames : [])
        .map((skill) => normalizeText(skill))
        .filter(Boolean),
    ),
  );

  if (!directCatalogEntry && !label) {
    return null;
  }

  return {
    subCategoryId: directCatalogEntry?.id || null,
    subCategoryName: directCatalogEntry?.name || label,
    customSkillNames,
  };
};

const normalizeSuggestedServiceResponse = (payload = {}, serviceCatalog = {}) => {
  const serviceNameMap = new Map(
    (Array.isArray(serviceCatalog.services) ? serviceCatalog.services : []).flatMap((service) => {
      const entries = [];
      const name = normalizeText(service?.name);
      const key = normalizeText(service?.key);
      if (name) {
        entries.push([name.toLowerCase(), service]);
      }
      if (key) {
        entries.push([key.toLowerCase(), service]);
      }
      return entries;
    }),
  );
  const subCategoryMap = new Map(
    (Array.isArray(serviceCatalog.services) ? serviceCatalog.services : []).flatMap((service) =>
      (Array.isArray(service?.subCategories) ? service.subCategories : []).map((subCategory) => [
        subCategory.id,
        subCategory,
      ]),
    ),
  );
  const nicheNames = new Set(
    (Array.isArray(serviceCatalog.niches) ? serviceCatalog.niches : [])
      .map((niche) => normalizeText(niche))
      .filter(Boolean)
      .map((niche) => niche.toLowerCase()),
  );

  return (Array.isArray(payload?.suggestedServices) ? payload.suggestedServices : [])
    .map((serviceEntry) => {
      const requestedServiceName = normalizeText(
        serviceEntry?.serviceName || serviceEntry?.serviceKey,
      );
      const catalogService = serviceNameMap.get(requestedServiceName.toLowerCase()) || null;
      const confidence = Number(serviceEntry?.confidence);

      if (!catalogService || !Number.isFinite(confidence)) {
        return null;
      }

      const caseStudy = serviceEntry?.caseStudy && typeof serviceEntry.caseStudy === "object"
        ? serviceEntry.caseStudy
        : {};
      const rawNiche = normalizeText(caseStudy?.niche?.value || caseStudy?.niche);
      const normalizedNiche = nicheNames.has(rawNiche.toLowerCase()) ? rawNiche : "";

      return {
        serviceKey: catalogService.key,
        serviceName: catalogService.name,
        serviceId: catalogService.id,
        confidence: Math.min(Math.max(confidence, 0), 1),
        reason: normalizeText(serviceEntry?.reason),
        serviceInfo: {
          title: normalizeServiceFieldSuggestion(serviceEntry?.serviceInfo?.title || {}, serviceEntry?.serviceInfo?.title?.value),
          experience: normalizeServiceFieldSuggestion(
            serviceEntry?.serviceInfo?.experience || {},
            serviceEntry?.serviceInfo?.experience?.value,
          ),
          categories: (Array.isArray(serviceEntry?.serviceInfo?.categories)
            ? serviceEntry.serviceInfo.categories
            : [])
            .map((entry) => normalizeServiceCategorySuggestion(entry, subCategoryMap))
            .filter(Boolean),
        },
        servicePricing: {
          description: normalizeServiceFieldSuggestion(
            serviceEntry?.servicePricing?.description || {},
            serviceEntry?.servicePricing?.description?.value,
          ),
          deliveryTimeline: normalizeServiceFieldSuggestion(
            serviceEntry?.servicePricing?.deliveryTimeline || {},
            serviceEntry?.servicePricing?.deliveryTimeline?.value,
          ),
          priceRange: normalizeServiceFieldSuggestion(
            serviceEntry?.servicePricing?.priceRange || {},
            serviceEntry?.servicePricing?.priceRange?.value,
            { singleMoneyValue: true },
          ),
        },
        visuals: {
          keywords: {
            value: Array.from(
              new Set(
                (Array.isArray(serviceEntry?.visuals?.keywords?.value)
                  ? serviceEntry.visuals.keywords.value
                  : Array.isArray(serviceEntry?.visuals?.keywords)
                    ? serviceEntry.visuals.keywords
                    : [])
                  .map((value) => normalizeText(value))
                  .filter(Boolean),
              ),
            ),
            confidence: Number(serviceEntry?.visuals?.keywords?.confidence),
            reason: normalizeText(serviceEntry?.visuals?.keywords?.reason),
          },
        },
        caseStudy: {
          title: normalizeServiceFieldSuggestion(caseStudy?.title || {}, caseStudy?.title?.value),
          description: normalizeServiceFieldSuggestion(
            caseStudy?.description || {},
            caseStudy?.description?.value,
          ),
          niche: {
            value: normalizedNiche,
            confidence: Number(caseStudy?.niche?.confidence),
            reason: normalizeText(caseStudy?.niche?.reason),
          },
          projectLink: normalizeServiceFieldSuggestion(
            caseStudy?.projectLink || {},
            caseStudy?.projectLink?.value,
          ),
          role: normalizeServiceFieldSuggestion(caseStudy?.role || {}, caseStudy?.role?.value),
          timeline: normalizeServiceFieldSuggestion(
            caseStudy?.timeline || {},
            caseStudy?.timeline?.value,
          ),
          budget: normalizeServiceFieldSuggestion(
            caseStudy?.budget || {},
            caseStudy?.budget?.value,
            { singleMoneyValue: true },
          ),
        },
      };
    })
    .filter(Boolean);
};

const mapSuggestedServicesFromDiscovery = (payload = {}, serviceCatalog = {}) => {
  const serviceNameMap = new Map(
    (Array.isArray(serviceCatalog.services) ? serviceCatalog.services : []).flatMap((service) => {
      const pairs = [];
      const name = normalizeText(service?.name);
      const key = normalizeText(service?.key);
      if (name) {
        pairs.push([name.toLowerCase(), service]);
      }
      if (key) {
        pairs.push([key.toLowerCase(), service]);
      }
      return pairs;
    }),
  );

  return (Array.isArray(payload?.suggestedServices) ? payload.suggestedServices : [])
    .map((entry) => {
      const confidence = Number(entry?.confidence);
      const requestedServiceName = normalizeText(entry?.serviceName);
      const catalogService = serviceNameMap.get(requestedServiceName.toLowerCase()) || null;

      if (!catalogService || !Number.isFinite(confidence)) {
        return null;
      }

      return {
        serviceName: catalogService.name,
        serviceKey: catalogService.key,
        serviceId: catalogService.id,
        confidence: Math.min(Math.max(confidence, 0), 1),
        reason: normalizeText(entry?.reason),
      };
    })
    .filter(Boolean);
};

const getResumeAutofillCatalog = async () => {
  const [services, subCategories, niches] = await Promise.all([
    prisma.marketplaceFilterService.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.marketplaceFilterSubCategory.findMany({
      select: {
        id: true,
        serviceId: true,
        name: true,
      },
      orderBy: [{ serviceId: "asc" }, { name: "asc" }],
    }),
    prisma.$queryRaw`SELECT name FROM "Niches" ORDER BY name ASC`,
  ]);

  const subCategoriesByServiceId = subCategories.reduce((accumulator, subCategory) => {
    const serviceId = Number(subCategory.serviceId);
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return accumulator;
    }

    if (!accumulator.has(serviceId)) {
      accumulator.set(serviceId, []);
    }

    accumulator.get(serviceId).push({
      id: Number(subCategory.id),
      name: normalizeText(subCategory.name),
    });
    return accumulator;
  }, new Map());

  return {
    services: services.map((service) => ({
      id: Number(service.id),
      name: normalizeText(service.name),
      key: normalizeText(service.name),
      subCategories: subCategoriesByServiceId.get(Number(service.id)) || [],
    })),
    niches: (Array.isArray(niches) ? niches : [])
      .map((entry) => normalizeText(entry?.name))
      .filter(Boolean),
  };
};

const requestResumeAutofillCompletion = async ({
  resumeText,
  payload,
  systemInstructions,
  title = "Catalance Resume Autofill",
  maxTokens = 1400,
}) => {
  const apiKey = normalizeText(env.OPENROUTER_API_KEY);
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured.", 500);
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": DEFAULT_REFERER,
      "X-Title": title,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.1,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: systemInstructions.join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Extract high-confidence onboarding values from this resume.",
            payload,
            resumeText,
          }),
        },
      ],
    }),
  }).catch((error) => {
    throw new AppError("OpenRouter network error during resume autofill.", 502, {
      cause: error?.message || "Network request failed",
    });
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(
      "[ResumeAutofill][AI Error Response]",
      JSON.stringify(
        {
          title,
          providerStatus: response.status,
          data,
        },
        null,
        2,
      ),
    );
    throw new AppError(
      normalizeText(data?.error?.message || data?.message) || "OpenRouter request failed.",
      502,
    );
  }

  const content = readMessageContent(data?.choices?.[0]?.message?.content);
  const parsed = extractJsonObject(content);
  if (!parsed) {
    console.error(
      "[ResumeAutofill][AI Invalid JSON]",
      JSON.stringify(
        {
          title,
          model: DEFAULT_MODEL,
          content,
        },
        null,
        2,
      ),
    );
    throw new AppError("Resume autofill returned an invalid AI response.", 502);
  }

  console.log(
    "[ResumeAutofill][AI Raw Response]",
    JSON.stringify(
      {
        model: DEFAULT_MODEL,
        content,
        parsed,
      },
      null,
      2,
    ),
  );

  return parsed;
};

const requestResumeBasicProfileAndServices = async ({
  resumeText,
  basicProfileFields,
  serviceCatalog,
}) =>
  requestResumeAutofillCompletion({
    resumeText,
    title: "Catalance Resume Autofill Discovery",
    maxTokens: 1200,
    systemInstructions: [
      "You extract onboarding values and likely freelancer services from a resume.",
      "Return strict JSON only.",
      "Never include profilePhoto, resume, or username.",
      "Only return values that are clearly supported by the resume.",
      "Only use confidence >= 0.90 when evidence is strong.",
      "Use exact option values for select and multiselect fields.",
      "Use exact serviceName values from the provided service catalog.",
      "Never use currency symbols in any returned value.",
      'Return this exact JSON shape: {"basicProfileFields":[{"fieldId":"string","value":"string|array","confidence":0.0,"reason":"string"}],"suggestedServices":[{"serviceName":"string","confidence":0.0,"reason":"string"}]}.',
    ],
    payload: {
      basicProfileFields,
      serviceCatalog: (Array.isArray(serviceCatalog?.services) ? serviceCatalog.services : []).map(
        (service) => ({
          name: service.name,
          key: service.key,
        }),
      ),
    },
  });

const requestResumeServiceDetails = async ({
  resumeText,
  schema,
  selectedService,
  nicheCatalog,
}) =>
  requestResumeAutofillCompletion({
    resumeText,
    title: `Catalance Resume Autofill Service Details: ${selectedService?.name || "Service"}`,
    maxTokens: 1600,
    systemInstructions: [
      "You extract detailed freelancer onboarding values from a resume.",
      "Return strict JSON only.",
      "Return exactly one suggested service for the provided service.",
      "Only use confidence >= 0.90 when the resume clearly supports the value.",
      "Use the exact serviceName value from the payload.",
      "Use exact select option values from the schema.",
      "Use exact subCategoryId values from the service catalog when a category clearly matches.",
      "Limit categories to at most 4 of the strongest matches.",
      "Limit customSkillNames to at most 5 concise items per category.",
      "Keep description and case study text concise but specific.",
      "If evidence is weak, omit the field instead of guessing.",
      "Never use currency symbols in priceRange or budget.",
      "Always return one single numeric amount for priceRange and budget, never a range.",
      "Good examples: 500, 1200, 2500. Bad examples: 500-1500, 500 to 1500, starting at 500.",
      'Return this exact JSON shape: {"suggestedServices":[{"serviceName":"string","confidence":0.0,"reason":"string","serviceInfo":{"title":{"value":"string","confidence":0.0,"reason":"string"},"experience":{"value":"string","confidence":0.0,"reason":"string"},"categories":[{"subCategoryId":123,"label":"string","customSkillNames":["skill"]}]},"servicePricing":{"description":{"value":"string","confidence":0.0,"reason":"string"},"deliveryTimeline":{"value":"string","confidence":0.0,"reason":"string"},"priceRange":{"value":"string","confidence":0.0,"reason":"string"}},"visuals":{"keywords":{"value":["string"],"confidence":0.0,"reason":"string"}},"caseStudy":{"title":{"value":"string","confidence":0.0,"reason":"string"},"description":{"value":"string","confidence":0.0,"reason":"string"},"niche":{"value":"string","confidence":0.0,"reason":"string"},"projectLink":{"value":"string","confidence":0.0,"reason":"string"},"role":{"value":"string","confidence":0.0,"reason":"string"},"timeline":{"value":"string","confidence":0.0,"reason":"string"},"budget":{"value":"string","confidence":0.0,"reason":"string"}}}]}.',
    ],
    payload: {
      schema,
      nicheCatalog,
      selectedService,
    },
  });

export const generateResumeAutofill = async ({
  file,
  schema = {},
}) => {
  const normalizedSchema = Array.isArray(schema)
    ? {
        basicProfile: schema
          .map((field) => normalizeAutofillField(field))
          .filter((field) => field.id),
        serviceInfo: [],
        servicePricing: [],
        caseStudy: [],
      }
    : normalizeAutofillSchema(schema);
  const supportedBasicProfileFields = normalizedSchema.basicProfile.filter(
    (field) => !["profilePhoto", "resume", "username"].includes(field.id),
  );
  const fieldMap = new Map(supportedBasicProfileFields.map((field) => [field.id, field]));

  if (
    !supportedBasicProfileFields.length &&
    !normalizedSchema.serviceInfo.length &&
    !normalizedSchema.servicePricing.length &&
    !normalizedSchema.caseStudy.length
  ) {
    throw new AppError("No valid onboarding schema was provided for resume autofill.", 400);
  }

  const resumeText = await extractResumeTextFromFile(file);
  if (!resumeText) {
    throw new AppError("Could not extract readable text from the uploaded resume.", 400);
  }

  const serviceCatalog = await getResumeAutofillCatalog();
  const discoveryPayload = await requestResumeBasicProfileAndServices({
    resumeText,
    basicProfileFields: supportedBasicProfileFields,
    serviceCatalog,
  });
  const discoveredServices = mapSuggestedServicesFromDiscovery(
    discoveryPayload,
    serviceCatalog,
  );
  const selectedServiceCatalogEntries = discoveredServices
    .filter((entry) => entry.confidence >= 0.9)
    .slice(0, 3)
    .map((entry) => {
      const matchingService = (serviceCatalog.services || []).find(
        (service) => service.key === entry.serviceKey,
      );
      return matchingService
        ? {
            id: matchingService.id,
            name: matchingService.name,
            key: matchingService.key,
            subCategories: matchingService.subCategories || [],
            reason: entry.reason,
            confidence: entry.confidence,
          }
        : null;
    })
    .filter(Boolean);

  const detailPayloads = selectedServiceCatalogEntries.length
    ? await Promise.all(
        selectedServiceCatalogEntries.map(async (selectedService) =>
          requestResumeServiceDetails({
            resumeText,
            schema: {
              serviceInfo: normalizedSchema.serviceInfo,
              servicePricing: normalizedSchema.servicePricing,
              caseStudy: normalizedSchema.caseStudy,
            },
            selectedService,
            nicheCatalog: serviceCatalog.niches || [],
          }),
        ),
      )
    : [];
  const detailPayload = {
    suggestedServices: detailPayloads.flatMap((payload) =>
      Array.isArray(payload?.suggestedServices) ? payload.suggestedServices : [],
    ),
  };
  const normalizedResult = {
    extractedTextPreview: resumeText.slice(0, 500),
    basicProfileFields: normalizeAutofillResponse(
      { fields: discoveryPayload?.basicProfileFields },
      fieldMap,
    ),
    suggestedServices: normalizeSuggestedServiceResponse(detailPayload, serviceCatalog),
  };

  console.log(
    "[ResumeAutofill][Normalized Fields]",
    JSON.stringify(
      {
        basicProfileFields: normalizedResult.basicProfileFields.map((entry) => ({
          fieldId: entry.fieldId,
          value: entry.value,
          confidence: entry.confidence,
          reason: entry.reason,
        })),
        discoveredServices,
        suggestedServices: normalizedResult.suggestedServices,
      },
      null,
      2,
    ),
  );

  return normalizedResult;
};
