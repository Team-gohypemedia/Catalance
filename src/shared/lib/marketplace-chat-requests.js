import { buildNamespacedStorageKey } from "@/shared/lib/storage-keys";

const REQUESTS_STORAGE_KEY = buildNamespacedStorageKey("marketplaceChatRequests:v1");
const REQUEST_MESSAGES_STORAGE_KEY = buildNamespacedStorageKey(
  "marketplaceChatMessages:v1",
);
const MARKETPLACE_CHAT_UPDATED_EVENT = "catalance:marketplace-chat-updated";

const isBrowser = () => typeof window !== "undefined";

const safeParse = (rawValue, fallbackValue) => {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
};

const getComparableText = (value = "") => String(value || "").trim().toLowerCase();

const getTimeValue = (value) => {
  if (!value) return 0;

  const timestamp = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }

  return "";
};

const buildId = (prefix = "marketplace") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const normalizeRequestRecord = (request = {}) => {
  const requestId = getFirstNonEmptyText(request.id, buildId("request"));
  const createdAt = getFirstNonEmptyText(request.createdAt, new Date().toISOString());
  const updatedAt = getFirstNonEmptyText(request.updatedAt, createdAt);
  const clientName = getFirstNonEmptyText(
    request.clientName,
    request.requestedByName,
    "Client",
  );
  const freelancerName = getFirstNonEmptyText(
    request.freelancerName,
    request.requestedFreelancerName,
    "Freelancer",
  );
  const memberNames = [
    clientName,
    freelancerName,
    ...(Array.isArray(request.memberNames) ? request.memberNames : []),
  ].filter(
    (value, index, list) =>
      value &&
      list.findIndex(
        (candidate) => getComparableText(candidate) === getComparableText(value),
      ) === index,
  );
  const serviceTitle = getFirstNonEmptyText(
    request.serviceTitle,
    request.title,
    request.projectTitle,
    "Marketplace Request",
  );
  const serviceType = getFirstNonEmptyText(
    request.serviceType,
    request.label,
    serviceTitle,
  );
  const requestMessage = getFirstNonEmptyText(
    request.requestMessage,
    request.previewText,
    "New marketplace request",
  );

  return {
    id: requestId,
    status: getFirstNonEmptyText(request.status, "pending"),
    createdAt,
    updatedAt,
    conversationKey: getFirstNonEmptyText(
      request.conversationKey,
      `MARKETPLACE_REQUEST:${requestId}`,
    ),
    previewText: getFirstNonEmptyText(request.previewText, requestMessage),
    requestMessage,
    requestSource: getFirstNonEmptyText(request.requestSource, "marketplace"),
    requestCategory: getFirstNonEmptyText(request.requestCategory, "incoming"),
    serviceId: request.serviceId ?? null,
    serviceTitle,
    serviceType,
    title: serviceTitle,
    label: getFirstNonEmptyText(request.label, "Marketplace Request"),
    clientId: request.clientId ?? null,
    clientName,
    clientAvatar: getFirstNonEmptyText(request.clientAvatar),
    clientBusinessName: getFirstNonEmptyText(
      request.clientBusinessName,
      request.clientCompanyName,
    ),
    freelancerId: request.freelancerId ?? null,
    freelancerName,
    freelancerAvatar: getFirstNonEmptyText(request.freelancerAvatar),
    memberNames,
  };
};

const sortRequestRecords = (requests = []) =>
  [...requests]
    .map((request) => normalizeRequestRecord(request))
    .sort(
      (left, right) =>
        getTimeValue(right.updatedAt || right.createdAt) -
        getTimeValue(left.updatedAt || left.createdAt),
    );

const dispatchMarketplaceChatUpdated = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(MARKETPLACE_CHAT_UPDATED_EVENT));
};

const readMarketplaceChatRequests = () => {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(REQUESTS_STORAGE_KEY);
  const parsed = safeParse(rawValue, []);

  return Array.isArray(parsed) ? sortRequestRecords(parsed) : [];
};

const writeMarketplaceChatRequests = (requests = []) => {
  if (!isBrowser()) {
    return [];
  }

  const normalizedRequests = sortRequestRecords(requests);
  window.localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(normalizedRequests));
  dispatchMarketplaceChatUpdated();
  return normalizedRequests;
};

const readMarketplaceChatMessagesMap = () => {
  if (!isBrowser()) {
    return {};
  }

  const rawValue = window.localStorage.getItem(REQUEST_MESSAGES_STORAGE_KEY);
  const parsed = safeParse(rawValue, {});

  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeMarketplaceChatMessagesMap = (messagesMap = {}) => {
  if (!isBrowser()) {
    return {};
  }

  window.localStorage.setItem(
    REQUEST_MESSAGES_STORAGE_KEY,
    JSON.stringify(messagesMap),
  );
  dispatchMarketplaceChatUpdated();
  return messagesMap;
};

const getMarketplaceConversationMessages = (conversationKey = "") => {
  if (!conversationKey) {
    return [];
  }

  const messagesMap = readMarketplaceChatMessagesMap();
  const messages = messagesMap[conversationKey];

  return Array.isArray(messages) ? messages : [];
};

const upsertMarketplaceRequest = (request = {}) => {
  const normalizedRequest = normalizeRequestRecord(request);
  const requests = readMarketplaceChatRequests();
  const nextRequests = [
    normalizedRequest,
    ...requests.filter((item) => String(item.id) !== String(normalizedRequest.id)),
  ];

  writeMarketplaceChatRequests(nextRequests);
  return normalizedRequest;
};

const createMarketplaceChatRequest = (request = {}) => {
  const requests = readMarketplaceChatRequests();
  const serviceSignature = getComparableText(request.serviceId || request.serviceTitle);
  const existingRequest = requests.find(
    (item) =>
      item.status === "pending" &&
      String(item.clientId || "") === String(request.clientId || "") &&
      String(item.freelancerId || "") === String(request.freelancerId || "") &&
      getComparableText(item.serviceId || item.serviceTitle) === serviceSignature,
  );

  if (existingRequest) {
    return upsertMarketplaceRequest({
      ...existingRequest,
      ...request,
      updatedAt: new Date().toISOString(),
      previewText: getFirstNonEmptyText(request.requestMessage, request.previewText),
      requestMessage: getFirstNonEmptyText(request.requestMessage, request.previewText),
    });
  }

  return upsertMarketplaceRequest({
    ...request,
    id: request.id || buildId("request"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

const removeMarketplaceChatRequest = (requestId) => {
  const requests = readMarketplaceChatRequests();
  const targetRequest = requests.find((request) => String(request.id) === String(requestId));

  if (!targetRequest) {
    return false;
  }

  writeMarketplaceChatRequests(
    requests.filter((request) => String(request.id) !== String(requestId)),
  );

  const messagesMap = readMarketplaceChatMessagesMap();
  if (targetRequest.conversationKey && messagesMap[targetRequest.conversationKey]) {
    delete messagesMap[targetRequest.conversationKey];
    writeMarketplaceChatMessagesMap(messagesMap);
  }

  return true;
};

const seedMarketplaceConversation = (request = {}) => {
  const normalizedRequest = normalizeRequestRecord(request);
  const messagesMap = readMarketplaceChatMessagesMap();
  const existingMessages = messagesMap[normalizedRequest.conversationKey];

  if (Array.isArray(existingMessages) && existingMessages.length > 0) {
    return existingMessages;
  }

  const seededMessages = [
    {
      id: `${normalizedRequest.id}:request`,
      conversationId: normalizedRequest.conversationKey,
      content: normalizedRequest.requestMessage,
      senderId: normalizedRequest.clientId,
      senderRole: "CLIENT",
      senderName: normalizedRequest.clientName,
      requestId: normalizedRequest.id,
      createdAt: normalizedRequest.createdAt,
    },
  ];

  writeMarketplaceChatMessagesMap({
    ...messagesMap,
    [normalizedRequest.conversationKey]: seededMessages,
  });

  return seededMessages;
};

const acceptMarketplaceChatRequest = (requestId) => {
  const requests = readMarketplaceChatRequests();
  const targetRequest = requests.find((request) => String(request.id) === String(requestId));

  if (!targetRequest) {
    return null;
  }

  const acceptedRequest = normalizeRequestRecord({
    ...targetRequest,
    status: "accepted",
    updatedAt: new Date().toISOString(),
  });

  seedMarketplaceConversation(acceptedRequest);
  writeMarketplaceChatRequests(
    requests.map((request) =>
      String(request.id) === String(requestId) ? acceptedRequest : request,
    ),
  );

  return acceptedRequest;
};

const appendMarketplaceConversationMessage = ({
  conversationKey,
  content = "",
  attachment = null,
  senderId = null,
  senderName = "",
  senderRole = "CLIENT",
  createdAt = new Date().toISOString(),
} = {}) => {
  if (!conversationKey) {
    return null;
  }

  const trimmedContent = String(content || "").trim();
  if (!trimmedContent && !attachment) {
    return null;
  }

  const nextMessage = {
    id: buildId("message"),
    conversationId: conversationKey,
    content: trimmedContent,
    attachment: attachment || undefined,
    senderId,
    senderName: getFirstNonEmptyText(senderName, "Member"),
    senderRole: getFirstNonEmptyText(senderRole, "CLIENT"),
    createdAt,
  };

  const messagesMap = readMarketplaceChatMessagesMap();
  const existingMessages = Array.isArray(messagesMap[conversationKey])
    ? messagesMap[conversationKey]
    : [];

  writeMarketplaceChatMessagesMap({
    ...messagesMap,
    [conversationKey]: [...existingMessages, nextMessage],
  });

  const requests = readMarketplaceChatRequests();
  const updatedRequests = requests.map((request) =>
    request.conversationKey === conversationKey
      ? normalizeRequestRecord({
          ...request,
          status: request.status === "pending" ? "accepted" : request.status,
          previewText: getFirstNonEmptyText(trimmedContent, attachment?.name, request.previewText),
          updatedAt: createdAt,
        })
      : request,
  );

  writeMarketplaceChatRequests(updatedRequests);
  return nextMessage;
};

const buildMarketplaceConversationFromRequest = (
  request = {},
  perspective = "freelancer",
) => {
  const normalizedRequest = normalizeRequestRecord(request);
  const memberNames = Array.isArray(normalizedRequest.memberNames)
    ? normalizedRequest.memberNames
    : [];
  const otherPartyName =
    perspective === "client"
      ? normalizedRequest.freelancerName
      : normalizedRequest.clientName;
  const avatar =
    perspective === "client"
      ? normalizedRequest.freelancerAvatar
      : normalizedRequest.clientAvatar;

  return {
    id: normalizedRequest.id,
    requestId: normalizedRequest.id,
    serviceKey: normalizedRequest.conversationKey,
    conversationId: null,
    clientId: normalizedRequest.clientId,
    freelancerId: normalizedRequest.freelancerId,
    name: otherPartyName,
    clientName: normalizedRequest.clientName,
    freelancerName: normalizedRequest.freelancerName,
    avatar,
    businessName: normalizedRequest.serviceTitle,
    label: normalizedRequest.label,
    projectTitle: normalizedRequest.serviceTitle,
    projectServiceLabel: normalizedRequest.serviceType,
    serviceType: normalizedRequest.serviceType,
    previewText: normalizedRequest.previewText,
    chatUnlocked: true,
    lastActivity: getTimeValue(normalizedRequest.updatedAt || normalizedRequest.createdAt),
    unreadCount: 0,
    messageCount: getMarketplaceConversationMessages(
      normalizedRequest.conversationKey,
    ).length,
    memberNames,
    memberNamesLabel: memberNames.join(", "),
    isMarketplaceRequestChat: true,
    requestStatus: normalizedRequest.status,
    requestSource: normalizedRequest.requestSource,
  };
};

export {
  MARKETPLACE_CHAT_UPDATED_EVENT,
  acceptMarketplaceChatRequest,
  appendMarketplaceConversationMessage,
  buildMarketplaceConversationFromRequest,
  createMarketplaceChatRequest,
  getMarketplaceConversationMessages,
  readMarketplaceChatRequests,
  removeMarketplaceChatRequest,
  writeMarketplaceChatRequests,
};
