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

const normalizeIdentifier = (...values) => {
  const rawValue = getFirstNonEmptyText(values);
  return rawValue ? String(rawValue).trim() : null;
};

const getMarketplaceConversationKeyAliases = (request = {}) => {
  const aliases = [
    request.conversationKey,
    request.serviceKey,
    request.requestId,
    request.id,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return Array.from(new Set(aliases));
};

const normalizeMarketplaceMessageList = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const dedupedMessages = [];
  const seenMessageKeys = new Set();

  for (const message of messages) {
    if (!message) {
      continue;
    }

    const messageKey = String(
      message.id ||
        `${message.conversationId || ""}:${message.createdAt || ""}:${message.content || ""}:${message.senderId || ""}`,
    );

    if (seenMessageKeys.has(messageKey)) {
      continue;
    }

    seenMessageKeys.add(messageKey);
    dedupedMessages.push(message);
  }

  return dedupedMessages;
};

const buildId = (prefix = "marketplace") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const normalizeRequestRecord = (request = {}) => {
  const requestId = getFirstNonEmptyText(request.requestId, request.id, buildId("request"));
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
  const clientId = normalizeIdentifier(
    request.clientId,
    request.requestedById,
    request.ownerId,
    request.userId,
    request.client?.id,
  );
  const freelancerId = normalizeIdentifier(
    request.freelancerId,
    request.requestedFreelancerId,
    request.freelancerUserId,
    request.freelancer?.id,
  );

  return {
    id: requestId,
    requestId,
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
    clientId,
    clientName,
    clientAvatar: getFirstNonEmptyText(request.clientAvatar),
    clientBusinessName: getFirstNonEmptyText(
      request.clientBusinessName,
      request.clientCompanyName,
    ),
    freelancerId,
    freelancerUserId: normalizeIdentifier(
      request.freelancerUserId,
      request.freelancerId,
    ),
    requestedFreelancerId: normalizeIdentifier(
      request.requestedFreelancerId,
      request.freelancerId,
    ),
    freelancerName,
    requestedFreelancerName: getFirstNonEmptyText(
      request.requestedFreelancerName,
      request.freelancerName,
    ),
    freelancerAvatar: getFirstNonEmptyText(request.freelancerAvatar),
    requestedFreelancerUserId: normalizeIdentifier(
      request.requestedFreelancerUserId,
      request.freelancerUserId,
    ),
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

  const normalizedMessagesMap = Object.fromEntries(
    Object.entries(messagesMap || {}).map(([key, value]) => [
      key,
      normalizeMarketplaceMessageList(Array.isArray(value) ? value : []),
    ]),
  );

  window.localStorage.setItem(
    REQUEST_MESSAGES_STORAGE_KEY,
    JSON.stringify(normalizedMessagesMap),
  );
  dispatchMarketplaceChatUpdated();
  return normalizedMessagesMap;
};

const getMarketplaceConversationMessages = (conversationKey = "") => {
  if (!conversationKey) {
    return [];
  }

  const canonicalKey = String(conversationKey).trim();
  const messagesMap = readMarketplaceChatMessagesMap();
  const messages = normalizeMarketplaceMessageList(messagesMap[canonicalKey]);

  if (Array.isArray(messages) && messages.length > 0) {
    return messages;
  }

  const fallbackRequest = readMarketplaceChatRequests().find((request) =>
    getMarketplaceConversationKeyAliases(request).includes(canonicalKey),
  );

  if (!fallbackRequest) {
    return [];
  }

  return [
    {
      id: `${fallbackRequest.id}:request`,
      conversationId: fallbackRequest.conversationKey,
      content: fallbackRequest.requestMessage || fallbackRequest.previewText || "",
      senderId: fallbackRequest.clientId,
      senderRole: "CLIENT",
      senderName: fallbackRequest.clientName,
      requestId: fallbackRequest.requestId,
      createdAt: fallbackRequest.createdAt,
    },
  ].filter((message) => String(message.content || "").trim());
};

const resolveMarketplaceConversationMessages = (request = {}) => {
  const messagesMap = readMarketplaceChatMessagesMap();
  const aliases = getMarketplaceConversationKeyAliases(request);

  for (const alias of aliases) {
    const messages = messagesMap[alias];
    if (Array.isArray(messages) && messages.length > 0) {
      return {
        messages,
        primaryKey: alias,
      };
    }
  }

  return {
    messages: [],
    primaryKey: aliases[0] || null,
  };
};
const upsertMarketplaceRequest = (request = {}) => {
  const normalizedRequest = normalizeRequestRecord(request);
  const requests = readMarketplaceChatRequests();
  const nextRequests = [
    normalizedRequest,
    ...requests.filter((item) => String(item.requestId || item.id) !== String(normalizedRequest.requestId || normalizedRequest.id)),
  ];

  writeMarketplaceChatRequests(nextRequests);
  return normalizedRequest;
};

const createMarketplaceChatRequest = (request = {}) => {
  const requests = readMarketplaceChatRequests();
  const serviceSignature = getComparableText(request.serviceId || request.serviceTitle);
  const normalizedClientId = normalizeIdentifier(request.clientId, request.requestedById);
  const normalizedFreelancerId = normalizeIdentifier(
    request.freelancerId,
    request.requestedFreelancerId,
    request.freelancerUserId,
  );
  const existingRequest = requests.find(
    (item) =>
      item.status === "pending" &&
      normalizeIdentifier(item.clientId, item.requestedById) === normalizedClientId &&
      normalizeIdentifier(item.freelancerId, item.requestedFreelancerId) === normalizedFreelancerId &&
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
    id: request.requestId || request.id || buildId("request"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

const removeMarketplaceChatRequest = (requestId) => {
  const requests = readMarketplaceChatRequests();
  const targetRequest = requests.find((request) => String(request.requestId || request.id) === String(requestId));

  if (!targetRequest) {
    return false;
  }

  writeMarketplaceChatRequests(
    requests.filter((request) => String(request.requestId || request.id) !== String(requestId)),
  );

  const messagesMap = readMarketplaceChatMessagesMap();
  const nextMessagesMap = { ...messagesMap };
  for (const key of getMarketplaceConversationKeyAliases(targetRequest)) {
    if (nextMessagesMap[key]) {
      delete nextMessagesMap[key];
    }
  }
  writeMarketplaceChatMessagesMap(nextMessagesMap);

  return true;
};

const setMarketplaceChatRequestStatus = (requestId, status) => {
  const requests = readMarketplaceChatRequests();
  const targetRequest = requests.find((request) => String(request.requestId || request.id) === String(requestId));

  if (!targetRequest) {
    return null;
  }

  const normalizedStatus = getComparableText(status) || "pending";
  const updatedRequest = normalizeRequestRecord({
    ...targetRequest,
    status: normalizedStatus,
    updatedAt: new Date().toISOString(),
  });

  if (normalizedStatus === "accepted") {
    seedMarketplaceConversation(updatedRequest);
  }

  writeMarketplaceChatRequests(
    requests.map((request) =>
      String(request.requestId || request.id) === String(requestId) ? updatedRequest : request,
    ),
  );

  return updatedRequest;
};

const seedMarketplaceConversation = (request = {}) => {
  const normalizedRequest = normalizeRequestRecord(request);
  const messagesMap = readMarketplaceChatMessagesMap();
  const { messages: existingMessages, primaryKey } =
    resolveMarketplaceConversationMessages(normalizedRequest);

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
      requestId: normalizedRequest.requestId,
      createdAt: normalizedRequest.createdAt,
    },
  ];
  const normalizedSeededMessages = normalizeMarketplaceMessageList(seededMessages);

  const nextMessagesMap = { ...messagesMap };
  for (const key of getMarketplaceConversationKeyAliases(normalizedRequest)) {
    nextMessagesMap[key] = normalizedSeededMessages;
  }
  if (primaryKey && !nextMessagesMap[primaryKey]) {
    nextMessagesMap[primaryKey] = normalizedSeededMessages;
  }

  writeMarketplaceChatMessagesMap(nextMessagesMap);

  return normalizedSeededMessages;
};

const acceptMarketplaceChatRequest = (requestId) => {
  return setMarketplaceChatRequestStatus(requestId, "accepted");
};

const declineMarketplaceChatRequest = (requestId) => {
  return setMarketplaceChatRequestStatus(requestId, "declined");
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
  const relatedKeys = Array.from(
    new Set([
      String(conversationKey).trim(),
      ...readMarketplaceChatRequests()
        .filter((request) =>
          getMarketplaceConversationKeyAliases(request).includes(
            String(conversationKey).trim(),
          ),
        )
        .flatMap((request) => getMarketplaceConversationKeyAliases(request)),
    ]),
  );

  const existingMessages =
    relatedKeys
      .map((key) =>
        Array.isArray(messagesMap[key]) && messagesMap[key].length > 0
          ? messagesMap[key]
          : null,
      )
      .find(Boolean) || [];

  const nextMessages = normalizeMarketplaceMessageList([
    ...existingMessages,
    nextMessage,
  ]);
  const nextMessagesMap = { ...messagesMap };
  for (const key of relatedKeys) {
    if (key) {
      nextMessagesMap[key] = nextMessages;
    }
  }

  writeMarketplaceChatMessagesMap(nextMessagesMap);

  const requests = readMarketplaceChatRequests();
  const updatedRequests = requests.map((request) =>
    getMarketplaceConversationKeyAliases(request).includes(
      String(conversationKey).trim(),
    )
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
    requestId: normalizedRequest.requestId,
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
  declineMarketplaceChatRequest,
  readMarketplaceChatRequests,
  removeMarketplaceChatRequest,
  setMarketplaceChatRequestStatus,
  writeMarketplaceChatRequests,
};


