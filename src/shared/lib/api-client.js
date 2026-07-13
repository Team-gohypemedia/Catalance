import { getSession } from "@/shared/lib/auth-storage";

const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const isLocalApiUrl = (url) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?($|\/)/i.test(
    String(url || "").trim(),
  );

// Prefer explicit env, then same-origin (for deployed frontends), then local dev fallback.
const safeWindow = typeof window === "undefined" ? null : window;
const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const envSocketUrl = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
const envSocketPath = import.meta.env.VITE_SOCKET_PATH;
const envUseRemoteApiInDev = String(import.meta.env.VITE_USE_REMOTE_API_IN_DEV || "")
  .trim()
  .toLowerCase();

const isLocal5173 = safeWindow && safeWindow.location.origin === "http://localhost:5173";
const isLocal5174 = safeWindow && safeWindow.location.origin === "http://localhost:5174";

const sameOriginBaseUrl =
  safeWindow && safeWindow.location.origin && !isLocal5173 && !isLocal5174
    ? `${safeWindow.location.origin}/api`
    : null;

const localDevBaseUrl =
  safeWindow && (isLocal5173 || isLocal5174)
    ? "http://localhost:5000/api"
    : null;

const shouldPreferLocalApiInDev =
  Boolean(localDevBaseUrl) &&
  !["1", "true", "yes"].includes(envUseRemoteApiInDev) &&
  (!envBaseUrl || !isLocalApiUrl(envBaseUrl));

const effectiveEnvBaseUrl =
  shouldPreferLocalApiInDev && envBaseUrl && !isLocalApiUrl(envBaseUrl)
    ? null
    : envBaseUrl;

export const API_BASE_URL =
  (shouldPreferLocalApiInDev ? localDevBaseUrl : null) ||
  effectiveEnvBaseUrl ||
  normalizeBaseUrl(sameOriginBaseUrl) ||
  normalizeBaseUrl(localDevBaseUrl) ||
  "http://localhost:5000/api";

// Enable sockets when explicitly configured, otherwise only for local APIs.
const isLocalApi =
  Boolean(API_BASE_URL) &&
  (API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1"));
const allowSockets = Boolean(envSocketUrl) || isLocalApi;

const inferredSocketUrl = allowSockets
  ? envSocketUrl || API_BASE_URL.replace(/\/api$/, "")
  : null;

const inferredSocketPath = allowSockets ? envSocketPath || "/socket.io" : null;

export const SOCKET_IO_URL = inferredSocketUrl || null;
export const SOCKET_ENABLED = Boolean(inferredSocketUrl);
export const SOCKET_OPTIONS = {
  transports: ["polling"], // prevent websocket upgrade on hosts that do not support it (e.g., Vercel serverless)
  upgrade: false, // keep the transport stable so it works globally
  withCredentials: true,
  path: inferredSocketPath,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000
};

const defaultHeaders = {
  "Content-Type": "application/json"
};

const MAX_CATA_AI_CANDIDATES = 10;
const MAX_CATA_AI_PROPOSAL_TEXT_LENGTH = 1600;
const MAX_CATA_AI_CANDIDATE_TEXT_LENGTH = 480;
const MAX_CATA_AI_LIST_ITEMS = 6;
const MAX_CATA_AI_LIST_ITEM_LENGTH = 80;

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const truncateText = (value, maxLength = 200) => {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  const safeMaxLength = Math.max(16, Math.round(Number(maxLength) || 0));
  if (normalized.length <= safeMaxLength) {
    return normalized;
  }

  return `${normalized.slice(0, safeMaxLength - 3).trimEnd()}...`;
};

const roundNumericValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : null;
};

const toCompactTextList = (
  sources = [],
  {
    maxItems = MAX_CATA_AI_LIST_ITEMS,
    maxLength = MAX_CATA_AI_LIST_ITEM_LENGTH,
  } = {},
) => {
  const result = [];
  const seen = new Set();

  const pushValue = (value) => {
    if (result.length >= maxItems || value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => pushValue(entry));
      return;
    }

    if (isPlainObject(value)) {
      [
        value.label,
        value.name,
        value.title,
        value.serviceName,
        value.slug,
        value.id,
      ].forEach((entry) => pushValue(entry));
      return;
    }

    String(value)
      .split(/\r?\n|;|,(?=\s*[A-Za-z0-9])/)
      .forEach((entry) => {
        if (result.length >= maxItems) return;

        const normalized = truncateText(entry, maxLength);
        const key = String(normalized || "").toLowerCase();
        if (!normalized || seen.has(key)) return;

        seen.add(key);
        result.push(normalized);
      });
  };

  pushValue(sources);
  return result;
};

const getProposalContextSnapshot = (proposal = {}) => {
  if (isPlainObject(proposal?.proposalContext)) {
    return proposal.proposalContext;
  }

  if (isPlainObject(proposal?.project?.proposalJson?.contextSnapshot)) {
    return proposal.project.proposalJson.contextSnapshot;
  }

  return {};
};

const buildCompactProjectForCataAi = (proposal = {}) => {
  const project = isPlainObject(proposal?.project) ? proposal.project : {};
  const title = truncateText(project?.title || proposal?.projectTitle, 160);
  const description = truncateText(
    project?.description || proposal?.summary || proposal?.content,
    MAX_CATA_AI_PROPOSAL_TEXT_LENGTH,
  );
  const serviceKey = truncateText(
    project?.serviceKey || proposal?.serviceKey || proposal?.service,
    80,
  );
  const serviceType = truncateText(
    project?.serviceType || proposal?.serviceType || proposal?.serviceName,
    80,
  );
  const timeline = truncateText(project?.timeline || proposal?.timeline || proposal?.duration, 120);
  const budget = proposal?.amount ?? proposal?.budget ?? project?.budget ?? null;

  return {
    id: project?.id || proposal?.projectId || proposal?.syncedProjectId || null,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(serviceKey ? { serviceKey } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(budget !== null && budget !== undefined && budget !== ""
      ? { budget }
      : {}),
    ...(project?.budgetSummary || proposal?.budgetSummary
      ? {
          budgetSummary: truncateText(
            project?.budgetSummary || proposal?.budgetSummary,
            80,
          ),
        }
      : {}),
    ...(timeline ? { timeline } : {}),
  };
};

const buildCompactProposalForCataAi = (proposal = {}) => {
  const project = buildCompactProjectForCataAi(proposal);
  const context = getProposalContextSnapshot(proposal);
  const title = truncateText(
    proposal?.title || proposal?.projectTitle || project?.title,
    160,
  );
  const summary = truncateText(
    proposal?.summary ||
      proposal?.content ||
      proposal?.coverLetter ||
      proposal?.proposalContent ||
      project?.description,
    MAX_CATA_AI_PROPOSAL_TEXT_LENGTH,
  );
  const budget = proposal?.amount ?? proposal?.budget ?? project?.budget ?? null;
  const serviceKey = truncateText(
    proposal?.serviceKey || proposal?.service || project?.serviceKey,
    80,
  );
  const serviceType = truncateText(
    proposal?.serviceType || proposal?.serviceName || proposal?.service || project?.serviceType,
    80,
  );
  const services = toCompactTextList(
    [
      proposal?.services,
      proposal?.serviceKeys,
      context?.selectedServiceNames,
      context?.serviceNames,
      Array.isArray(context?.selectedServices)
        ? context.selectedServices.map((service) =>
            isPlainObject(service)
              ? service?.serviceName || service?.name || service?.slug || service?.id
              : service,
          )
        : [],
    ],
    { maxItems: 4 },
  );
  const compactProposalContext = {
    ...(truncateText(context?.flowMode, 24) ? { flowMode: truncateText(context.flowMode, 24) } : {}),
    ...(toCompactTextList([context?.selectedServiceIds, context?.serviceIds], {
      maxItems: 4,
    }).length > 0
      ? {
          selectedServiceIds: toCompactTextList([context?.selectedServiceIds, context?.serviceIds], {
            maxItems: 4,
          }),
        }
      : {}),
    ...(toCompactTextList([context?.selectedServiceNames, context?.serviceNames], {
      maxItems: 4,
    }).length > 0
      ? {
          selectedServiceNames: toCompactTextList(
            [context?.selectedServiceNames, context?.serviceNames],
            { maxItems: 4 },
          ),
        }
      : {}),
    ...(Array.isArray(context?.selectedServices) && context.selectedServices.length > 0
      ? {
          selectedServices: context.selectedServices
            .slice(0, 4)
            .map((service) => {
              if (!isPlainObject(service)) {
                return truncateText(service, 80);
              }

              return {
                ...(truncateText(service?.id || service?.slug, 80)
                  ? { id: truncateText(service.id || service.slug, 80) }
                  : {}),
                ...(truncateText(service?.serviceName || service?.name, 80)
                  ? { name: truncateText(service.serviceName || service.name, 80) }
                  : {}),
              };
            })
            .filter(Boolean),
        }
      : {}),
    ...(toCompactTextList(
      [context?.techStack, context?.serviceTools, context?.mentionedTools, context?.tools],
      { maxItems: 8 },
    ).length > 0
      ? {
          techStack: toCompactTextList(
            [context?.techStack, context?.serviceTools, context?.mentionedTools, context?.tools],
            { maxItems: 8 },
          ),
        }
      : {}),
  };

  const compactProposal = {
    id: proposal?.id || proposal?.projectId || proposal?.syncedProjectId || null,
    ...(proposal?.projectId ? { projectId: proposal.projectId } : {}),
    ...(proposal?.syncedProjectId ? { syncedProjectId: proposal.syncedProjectId } : {}),
    ...(typeof proposal?.isAgencyProposal === "boolean"
      ? { isAgencyProposal: proposal.isAgencyProposal }
      : {}),
    ...(title ? { title, projectTitle: title } : {}),
    ...(serviceKey ? { serviceKey } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(serviceKey || serviceType ? { service: serviceKey || serviceType } : {}),
    ...(summary ? { summary, content: summary, proposalContent: summary } : {}),
    ...(budget !== null && budget !== undefined && budget !== ""
      ? { amount: budget, budget }
      : {}),
    ...(truncateText(proposal?.budgetSummary || project?.budgetSummary, 80)
      ? {
          budgetSummary: truncateText(
            proposal?.budgetSummary || project?.budgetSummary,
            80,
          ),
        }
      : {}),
    ...(truncateText(proposal?.timeline || proposal?.duration || project?.timeline, 120)
      ? {
          timeline: truncateText(
            proposal?.timeline || proposal?.duration || project?.timeline,
            120,
          ),
        }
      : {}),
    ...(services.length > 0 ? { services } : {}),
    techStack: toCompactTextList([
      proposal?.techStack,
      proposal?.projectStack,
      proposal?.frontendFramework,
      proposal?.backendTechnology,
      proposal?.databaseType,
      context?.techStack,
      context?.serviceTools,
      context?.mentionedTools,
      context?.tools,
    ]),
    projectStack: toCompactTextList([
      proposal?.projectStack,
      proposal?.techStack,
      proposal?.frontendFramework,
      proposal?.backendTechnology,
      proposal?.databaseType,
      context?.techStack,
      context?.serviceTools,
      context?.mentionedTools,
      context?.tools,
    ]),
    frontendFramework: toCompactTextList([proposal?.frontendFramework, context?.frontendFramework], {
      maxItems: 4,
    }),
    backendTechnology: toCompactTextList([proposal?.backendTechnology, context?.backendTechnology], {
      maxItems: 4,
    }),
    databaseType: toCompactTextList([proposal?.databaseType, context?.databaseType], {
      maxItems: 4,
    }),
    featuresDeliverables: toCompactTextList([
      proposal?.featuresDeliverables,
      context?.featuresDeliverables,
    ]),
    brandDeliverables: toCompactTextList([
      proposal?.brandDeliverables,
      context?.brandDeliverables,
    ]),
    appFeatures: toCompactTextList([proposal?.appFeatures, context?.appFeatures]),
    platformRequirements: toCompactTextList([
      proposal?.platformRequirements,
      context?.platformRequirements,
    ]),
    primaryObjectives: toCompactTextList([
      proposal?.primaryObjectives,
      context?.primaryObjectives,
    ]),
    targetLocations: toCompactTextList([
      proposal?.targetLocations,
      context?.targetLocations,
    ]),
    seoGoals: toCompactTextList([proposal?.seoGoals, context?.seoGoals]),
    ...(truncateText(proposal?.websiteType || context?.websiteType, 80)
      ? { websiteType: truncateText(proposal?.websiteType || context?.websiteType, 80) }
      : {}),
    ...(truncateText(proposal?.websiteBuildType || context?.websiteBuildType, 80)
      ? {
          websiteBuildType: truncateText(
            proposal?.websiteBuildType || context?.websiteBuildType,
            80,
          ),
        }
      : {}),
    ...(truncateText(proposal?.creativeType || context?.creativeType, 80)
      ? { creativeType: truncateText(proposal?.creativeType || context?.creativeType, 80) }
      : {}),
    ...(truncateText(proposal?.appType || context?.appType, 80)
      ? { appType: truncateText(proposal?.appType || context?.appType, 80) }
      : {}),
    ...(truncateText(proposal?.businessCategory || context?.businessCategory, 80)
      ? {
          businessCategory: truncateText(
            proposal?.businessCategory || context?.businessCategory,
            80,
          ),
        }
      : {}),
    ...(truncateText(proposal?.targetAudience || context?.targetAudience, 120)
      ? {
          targetAudience: truncateText(
            proposal?.targetAudience || context?.targetAudience,
            120,
          ),
        }
      : {}),
    ...(Object.keys(compactProposalContext).length > 0
      ? { proposalContext: compactProposalContext }
      : {}),
    ...(Object.keys(project).length > 1 ? { project } : {}),
  };

  return compactProposal;
};

const buildCompactCandidateForCataAi = (candidate = {}) => {
  const freelancerId = candidate?.id || candidate?.freelancerId || null;
  const matchedService =
    isPlainObject(candidate?.matchedService) &&
    (candidate.matchedService?.serviceKey || candidate.matchedService?.serviceName)
      ? {
          ...(truncateText(candidate.matchedService.serviceKey, 80)
            ? { serviceKey: truncateText(candidate.matchedService.serviceKey, 80) }
            : {}),
          ...(truncateText(candidate.matchedService.serviceName, 80)
            ? { serviceName: truncateText(candidate.matchedService.serviceName, 80) }
            : {}),
        }
      : (truncateText(candidate?.serviceKey, 80) || truncateText(candidate?.serviceType, 80))
        ? {
            ...(truncateText(candidate?.serviceKey, 80)
              ? { serviceKey: truncateText(candidate.serviceKey, 80) }
              : {}),
            ...(truncateText(candidate?.serviceType || candidate?.service, 80)
              ? {
                  serviceName: truncateText(
                    candidate?.serviceType || candidate?.service,
                    80,
                  ),
                }
              : {}),
          }
        : null;

  return {
    ...(freelancerId ? { id: freelancerId, freelancerId } : {}),
    ...(truncateText(candidate?.fullName || candidate?.name, 120)
      ? {
          fullName: truncateText(candidate?.fullName || candidate?.name, 120),
          name: truncateText(candidate?.name || candidate?.fullName, 120),
        }
      : {}),
    ...(truncateText(candidate?.profileRole || candidate?.role, 40)
      ? { profileRole: truncateText(candidate?.profileRole || candidate?.role, 40) }
      : {}),
    ...(truncateText(
      candidate?.title || candidate?.jobTitle || candidate?.professionalTitle,
      120,
    )
      ? {
          title: truncateText(
            candidate?.title || candidate?.jobTitle || candidate?.professionalTitle,
            120,
          ),
        }
      : {}),
    ...(roundNumericValue(candidate?.sourceLevel) !== null
      ? { sourceLevel: roundNumericValue(candidate.sourceLevel) }
      : {}),
    ...(roundNumericValue(candidate?.matchPercent ?? candidate?.matchScore) !== null
      ? {
          matchPercent: roundNumericValue(candidate?.matchPercent ?? candidate?.matchScore),
        }
      : {}),
    ...(roundNumericValue(
      candidate?.rawMatchScore ?? candidate?.scoreMetadata?.rawMatchScore,
    ) !== null
      ? {
          rawMatchScore: roundNumericValue(
            candidate?.rawMatchScore ?? candidate?.scoreMetadata?.rawMatchScore,
          ),
        }
      : {}),
    serviceMatch: Boolean(candidate?.serviceMatch),
    ...(matchedService ? { matchedService } : {}),
    matchedSkills: toCompactTextList([
      candidate?.matchedSkills,
      candidate?.matchedTechnologies,
    ]),
    matchedNiches: toCompactTextList([candidate?.matchedNiches]),
    matchedProjectTypes: toCompactTextList([candidate?.matchedProjectTypes]),
    matchedCaseStudyTitles: toCompactTextList([candidate?.matchedCaseStudyTitles], {
      maxItems: 4,
      maxLength: 120,
    }),
    matchReasons: toCompactTextList([
      candidate?.matchReasons,
      candidate?.matchHighlights,
    ], {
      maxItems: 4,
      maxLength: 140,
    }),
    ...(roundNumericValue(
      candidate?.budgetFitPercent ??
        candidate?.budgetCompatibility?.budgetMatchPercentage,
    ) !== null
      ? {
          budgetFitPercent: roundNumericValue(
            candidate?.budgetFitPercent ??
              candidate?.budgetCompatibility?.budgetMatchPercentage,
          ),
        }
      : {}),
    ...(roundNumericValue(candidate?.skillsMatchPercent) !== null
      ? { skillsMatchPercent: roundNumericValue(candidate.skillsMatchPercent) }
      : {}),
    ...(roundNumericValue(candidate?.activeProjectCount) !== null
      ? { activeProjectCount: roundNumericValue(candidate.activeProjectCount) }
      : {}),
    ...(truncateText(
      candidate?.bio || candidate?.cleanBio || candidate?.about,
      MAX_CATA_AI_CANDIDATE_TEXT_LENGTH,
    )
      ? {
          bio: truncateText(
            candidate?.bio || candidate?.cleanBio || candidate?.about,
            MAX_CATA_AI_CANDIDATE_TEXT_LENGTH,
          ),
        }
      : {}),
  };
};

const extractFreelancersFromPayload = (payload = {}) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.freelancers)) {
    return payload.freelancers;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const resolveFreelancerIdentity = (candidate = {}) =>
  String(candidate?.id || candidate?.freelancerId || "").trim();

const mergeCataAiPayloadWithCandidates = (candidates = [], payload = {}) => {
  const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
  const aiFreelancers = extractFreelancersFromPayload(payload);

  if (aiFreelancers.length === 0) {
    return {
      ...payload,
      data: normalizedCandidates,
      freelancers: normalizedCandidates,
      results: normalizedCandidates,
      total: normalizedCandidates.length,
    };
  }

  const aiFreelancerById = new Map(
    aiFreelancers
      .map((candidate, index) => {
        const freelancerId = resolveFreelancerIdentity(candidate);
        if (!freelancerId) return null;

        return [
          freelancerId,
          {
            candidate,
            aiOrder: index,
          },
        ];
      })
      .filter(Boolean),
  );

  const mergedFreelancers = normalizedCandidates.map((candidate, index) => {
    const freelancerId = resolveFreelancerIdentity(candidate);
    const aiEntry = freelancerId ? aiFreelancerById.get(freelancerId) : null;

    if (!aiEntry) {
      return {
        ...candidate,
        __originalOrder: index,
      };
    }

    return {
      ...candidate,
      ...(aiEntry.candidate?.aiMatch && typeof aiEntry.candidate.aiMatch === "object"
        ? { aiMatch: aiEntry.candidate.aiMatch }
        : {}),
      __aiOrder: aiEntry.aiOrder,
      __originalOrder: index,
    };
  });

  const sortedFreelancers = mergedFreelancers
    .sort((left, right) => {
      const leftHasAiOrder = Number.isFinite(left?.__aiOrder);
      const rightHasAiOrder = Number.isFinite(right?.__aiOrder);

      if (leftHasAiOrder && rightHasAiOrder && left.__aiOrder !== right.__aiOrder) {
        return left.__aiOrder - right.__aiOrder;
      }

      if (leftHasAiOrder !== rightHasAiOrder) {
        return leftHasAiOrder ? -1 : 1;
      }

      return (left?.__originalOrder || 0) - (right?.__originalOrder || 0);
    })
    .map(({ __aiOrder, __originalOrder, ...candidate }) => candidate);

  return {
    ...payload,
    data: sortedFreelancers,
    freelancers: sortedFreelancers,
    results: sortedFreelancers,
    total: sortedFreelancers.length,
  };
};

export const request = async (path, options = {}) => {
  const {
    returnFullPayload = false,
    timeout = 15000,
    ...fetchOptions
  } = options;
  const session = getSession();
  const authHeaders = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};


  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...authHeaders,
        ...(fetchOptions.headers || {})
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(id);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");
  const payload = isJsonResponse ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const flattenedFieldErrors =
      payload?.issues?.fieldErrors && typeof payload.issues.fieldErrors === "object"
        ? Object.values(payload.issues.fieldErrors)
            .flat()
            .filter(Boolean)
        : [];
    const message =
      flattenedFieldErrors[0] ||
      payload?.error?.message ||
      payload?.message ||
      payload?.data ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!isJsonResponse) {
    throw new Error(
      `Unexpected response from API (status ${response.status}). Verify VITE_API_BASE_URL points to the backend.`
    );
  }

  if (payload === null) {
    throw new Error("Received an empty response from the API. Please try again.");
  }

  if (returnFullPayload) {
    return payload;
  }

  return payload?.data ?? payload ?? {};
};

export const signup = ({
  fullName,
  email,
  password,
  role = "FREELANCER",
  freelancerProfile = null,
  avatar,
  bio = "",
  onboardingComplete = false
}) => {
  const payload = {
    fullName,
    email,
    password,
    role,
    bio
  };

  if (role === "FREELANCER") {
    const normalizedProfile = freelancerProfile ?? {};
    payload.freelancerProfile = normalizedProfile;
    if (avatar) {
      payload.avatar = avatar;
    }
    if (onboardingComplete) {
      payload.onboardingComplete = true;
    }
  }

  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const login = ({ email, identifier, password, role }) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, identifier, password, role })
  });
};

export const requestEmailOtp = ({ email, role }) => {
  return request("/auth/email/request-otp", {
    method: "POST",
    body: JSON.stringify({ email, role })
  });
};

export const verifyEmailOtp = ({ email, otp, role }) => {
  return request("/auth/email/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, role })
  });
};

export const forgotPassword = (email) => {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
};

export const verifyResetToken = (token) => {
  return request(`/auth/verify-reset-token/${token}`, {
    method: "GET"
  });
};

export const resetPassword = ({ token, password }) => {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
};

export const loginWithGoogle = (token, role, mode = "login") => {
  return request("/auth/google-login", {
    method: "POST",
    body: JSON.stringify({ token, role, mode })
  });
};

export const verifyOtp = ({ email, otp }) => {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
};

export const resendOtp = (email) => {
  return request("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email })
  });
};

export const requestWhatsappOtp = ({ countryCode, phoneNumber, role }) => {
  return request("/auth/whatsapp/request-otp", {
    method: "POST",
    body: JSON.stringify({ countryCode, phoneNumber, role })
  });
};

export const verifyWhatsappOtp = ({ countryCode, phoneNumber, otp, role }) => {
  return request("/auth/whatsapp/verify-otp", {
    method: "POST",
    body: JSON.stringify({ countryCode, phoneNumber, otp, role })
  });
};

export const submitContactInquiry = ({ name, email, phone, subject, message }) => {
  return request("/contact/inquiry", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, subject, message })
  });
};

export const subscribeNewsletter = (email) => {
  return request("/contact/newsletter", {
    method: "POST",
    body: JSON.stringify({ email })
  });
};

export const updateProfile = (updates) => {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(updates)
  });
};

export const createChatConversation = ({ service, ...rest }) => {
  return request("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ service, ...rest })
  });
};

export const fetchChatConversations = () => {
  return request("/chat/conversations", {
    method: "GET"
  });
};

export const fetchChatMessages = (conversationId) => {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "GET"
  });
};

export const sendChatMessage = (payload = {}) => {
  const {
    conversationId,
    content,
    service,
    senderId,
    senderRole,
    senderName,
    skipAssistant = true,
    ...rest
  } = payload || {};

  if (!conversationId) {
    return Promise.reject(new Error("conversationId is required"));
  }

  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      service,
      senderId,
      senderRole,
      senderName,
      skipAssistant,
      ...rest
    })
  });
};

export const listFreelancers = (params = {}) => {
  const query = new URLSearchParams({ role: "FREELANCER", ...params }).toString();
  return request(`/users?${query}`, {
    method: "GET"
  });
};

const isLikelyPersistedProposalIdentifier = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return false;

  // Ignore local draft/session keys and temporary identifiers.
  if (/^(saved|local|draft|tmp|temp)[-_]/i.test(normalized)) {
    return false;
  }

  return normalized.length >= 10;
};

export const fetchMatchedFreelancersForProposal = (
  proposal = {},
  {
    includeAiInsights = false,
    useAiShortlist = false,
    timeout = 45000,
  } = {},
) => {
  const proposalIdCandidates = [
    !proposal?.isLocalDraft ? proposal?.id : "",
    proposal?.syncedProjectId,
    proposal?.projectId,
  ];

  const proposalId = proposalIdCandidates
    .map((value) => String(value || "").trim())
    .find((value) => isLikelyPersistedProposalIdentifier(value));

  return request("/proposals/match-freelancers", {
    method: "POST",
    returnFullPayload: true,
    timeout,
    body: JSON.stringify({
      proposal,
      ...(proposalId ? { proposalId } : {}),
      ...(includeAiInsights ? { includeAiInsights: true } : {}),
      ...(useAiShortlist ? { useAiShortlist: true } : {}),
    })
  });
};

export const fetchMatchedFreelancerCataAi = (
  proposal = {},
  candidates = [],
  {
    useAiShortlist = true,
  } = {},
) => {
  const proposalIdCandidates = [
    !proposal?.isLocalDraft ? proposal?.id : "",
    proposal?.syncedProjectId,
    proposal?.projectId,
  ];

  const proposalId = proposalIdCandidates
    .map((value) => String(value || "").trim())
    .find((value) => isLikelyPersistedProposalIdentifier(value));

  const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
  const compactCandidates = normalizedCandidates
    .slice(0, MAX_CATA_AI_CANDIDATES)
    .map((candidate) => buildCompactCandidateForCataAi(candidate))
    .filter((candidate) => Boolean(candidate?.id || candidate?.freelancerId));

  return request("/proposals/match-freelancers/cata-ai", {
    method: "POST",
    returnFullPayload: true,
    timeout: 30000,
    body: JSON.stringify({
      proposal: buildCompactProposalForCataAi(proposal),
      candidates: compactCandidates,
      ...(proposalId ? { proposalId } : {}),
      ...(useAiShortlist ? { useAiShortlist: true } : {}),
    }),
  }).then((payload) => mergeCataAiPayloadWithCandidates(normalizedCandidates, payload));
};

export const fetchStatesByCountry = (country) => {
  const normalizedCountry = String(country || "").trim();
  if (!normalizedCountry) {
    return Promise.resolve({ country: "", states: [] });
  }

  const query = new URLSearchParams({ country: normalizedCountry }).toString();
  return request(`/utils/states?${query}`, {
    method: "GET"
  });
};

export const apiClient = {
  signup,
  login,
  requestEmailOtp,
  verifyEmailOtp,
  createChatConversation,
  fetchChatConversations,
  fetchChatMessages,
  sendChatMessage,
  verifyOtp,
  requestWhatsappOtp,
  verifyWhatsappOtp,
  submitContactInquiry,
  subscribeNewsletter
};
