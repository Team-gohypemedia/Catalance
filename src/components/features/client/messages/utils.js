import format from "date-fns/format";
import isSameDay from "date-fns/isSameDay";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";

export const SERVICE_LABEL = "Project Chat";
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const PDF_FILE_REGEX = /\.pdf(?:$|[?#])/i;
export const CHAT_EMOJIS = [
  "😀",
  "😂",
  "😊",
  "😍",
  "🔥",
  "👍",
  "👏",
  "🙏",
  "🎉",
  "✅",
  "🤝",
  "💡",
];

export const filterAssistantMessages = (list = []) =>
  list.filter((message) => message?.role !== "assistant");

export const getConversationKey = (conversation) =>
  conversation?.serviceKey || conversation?.id || null;

export const getTimestampValue = (value) => {
  if (!value) return 0;

  const timestamp =
    typeof value === "number" ? value : new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortConversations = (list = []) =>
  [...list].sort(
    (left, right) => (right.lastActivity || 0) - (left.lastActivity || 0),
  );

export const formatTime = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDayDivider = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "MMMM d, yyyy");
};

export const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

export const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

export const getUserBusinessName = (user) =>
  getFirstNonEmptyText(user?.companyName, user?.businessName, user?.brandName);

export const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const formatConversationTimestamp = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "YESTERDAY";

  return format(date, "MMM dd").toUpperCase();
};

export const getMessagePreview = (item = {}) => {
  if (typeof item?.content === "string" && item.content.trim()) {
    return item.content.trim();
  }

  if (typeof item?.previewText === "string" && item.previewText.trim()) {
    return item.previewText.trim();
  }

  if (item?.attachment?.name) {
    return `Attachment: ${item.attachment.name}`;
  }

  if (typeof item?.projectTitle === "string" && item.projectTitle.trim()) {
    return item.projectTitle.trim();
  }

  if (typeof item?.label === "string" && item.label.trim()) {
    return item.label.trim();
  }

  return "Open the conversation to continue the project discussion.";
};

export const hasConversationHistory = (conversation = {}) =>
  Boolean(
    conversation?.lastMessage || Number(conversation?.messageCount || 0) > 0,
  );

const extractLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

export const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

export const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

export const getAcceptedProjectProposal = (project = {}) =>
  Array.isArray(project?.proposals)
    ? project.proposals.find(
        (proposal) =>
          String(proposal?.status || "").toUpperCase() === "ACCEPTED",
      ) || null
    : null;

export const resolveConversationBusinessName = (item = {}) =>
  getFirstNonEmptyText(
    item?.project?.businessName,
    item?.project?.companyName,
    item?.proposalContext?.businessName,
    item?.proposalContext?.companyName,
    item?.businessName,
    item?.companyName,
    extractLabeledValue(item?.project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(
      item?.coverLetter || item?.content || item?.summary || item?.description || "",
      ["Business Name", "Company Name", "Brand Name"],
    ),
  );

export const resolveConversationServiceLabel = (item = {}) =>
  getFirstNonEmptyText(
    item?.project?.service,
    item?.project?.serviceName,
    item?.project?.serviceKey,
    item?.project?.category,
    item?.project?.serviceType,
    item?.proposalContext?.serviceName,
    item?.proposalContext?.serviceType,
    item?.serviceName,
    item?.serviceType,
    item?.category,
    extractLabeledValue(item?.project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(
      item?.coverLetter || item?.content || item?.summary || item?.description || "",
      ["Service Type", "Service", "Category"],
    ),
    item?.project?.title,
  );

export const resolveConversationAvatarSrc = (item = {}) =>
  getFirstNonEmptyText(
    item?.avatar,
    item?.project?.logo,
    item?.project?.image,
    item?.project?.imageUrl,
    item?.project?.thumbnail,
    item?.project?.coverImage,
    item?.project?.coverUrl,
    item?.project?.bannerImage,
    item?.project?.heroImage,
  );

export const getConversationDisplayTitle = (conversation = {}) => {
  if (typeof conversation?.businessName === "string" && conversation.businessName.trim()) {
    return conversation.businessName.trim();
  }

  if (typeof conversation?.projectTitle === "string" && conversation.projectTitle.trim()) {
    return conversation.projectTitle.trim();
  }

  if (typeof conversation?.label === "string" && conversation.label.trim()) {
    return conversation.label.trim();
  }

  if (typeof conversation?.name === "string" && conversation.name.trim()) {
    return conversation.name.trim();
  }

  return "Project chat";
};

export const getConversationDisplaySubtitle = (
  conversation = {},
  currentUser = null,
) => {
  const subtitleParts = [
    getFirstNonEmptyText(conversation?.clientName, getDisplayName(currentUser)),
    getFirstNonEmptyText(
      conversation?.serviceType,
      conversation?.projectServiceLabel,
      conversation?.label,
    ),
  ].filter(Boolean);

  const uniqueParts = subtitleParts.filter(
    (value, index, list) =>
      list.findIndex(
        (candidate) =>
          normalizeComparableText(candidate) ===
          normalizeComparableText(value),
      ) === index,
  );

  return uniqueParts.join(" • ") || "Project chat";
};

export const getConversationMemberLabel = (
  conversation = {},
  currentUser = null,
) => {
  const projectManagerFromLastMessage =
    String(conversation?.lastMessage?.senderRole || "").toUpperCase() ===
    "PROJECT_MANAGER"
      ? conversation?.lastMessage?.senderName
      : "";

  const orderedRoleMembers = [
    getFirstNonEmptyText(conversation?.freelancerName, conversation?.name),
    getFirstNonEmptyText(conversation?.clientName, getDisplayName(currentUser)),
    getFirstNonEmptyText(
      conversation?.projectManagerName,
      conversation?.projectManager?.fullName,
      conversation?.projectManager?.name,
      conversation?.managerName,
      conversation?.pmName,
      projectManagerFromLastMessage,
    ),
  ];

  const memberNamesLabelParts =
    typeof conversation?.memberNamesLabel === "string" &&
    conversation.memberNamesLabel.trim()
      ? conversation.memberNamesLabel
          .split(/[,\u2022]/)
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      : [];

  const memberNames = Array.isArray(conversation?.memberNames)
    ? conversation.memberNames
    : [];

  const uniqueMembers = [
    ...orderedRoleMembers,
    ...memberNames,
    ...memberNamesLabelParts,
  ]
    .map((value) => String(value || "").trim())
    .filter(
    (value, index, list) =>
      value &&
      list.findIndex(
        (candidate) =>
          normalizeComparableText(candidate) ===
          normalizeComparableText(value),
      ) === index,
    );

  if (uniqueMembers.length > 0) {
    return uniqueMembers.slice(0, 3).join(" • ");
  }

  return getFirstNonEmptyText(
    conversation?.freelancerName,
    conversation?.name,
    conversation?.clientName,
    getDisplayName(currentUser),
  );
};

export const getMessageSignature = (message = {}) =>
  [
    String(message?.content || "").trim(),
    message?.attachment?.name || "",
    message?.attachment?.url || "",
  ].join("::");

const normalizeName = (value) => String(value || "").trim().toLowerCase();

const matchesCurrentUserName = (message, currentUser) => {
  const senderName = normalizeName(message?.senderName);
  if (!senderName) {
    return false;
  }

  const candidates = [
    currentUser?.fullName,
    currentUser?.name,
    currentUser?.email,
    currentUser?.email ? currentUser.email.split("@")[0] : "",
  ]
    .map(normalizeName)
    .filter(Boolean);

  return candidates.includes(senderName);
};

export const mergePendingIdentity = (incomingMessage, pendingMessage) => {
  if (!pendingMessage) {
    return incomingMessage;
  }

  return {
    ...incomingMessage,
    senderId: pendingMessage.senderId || incomingMessage.senderId,
    senderRole: pendingMessage.senderRole || incomingMessage.senderRole,
    senderName: pendingMessage.senderName || incomingMessage.senderName,
    role: pendingMessage.role || incomingMessage.role,
  };
};

const isFreelancerMessage = (message, conversation) => {
  const senderRole = String(message?.senderRole || "").toUpperCase();

  if (
    message?.senderId &&
    conversation?.freelancerId &&
    String(message.senderId) === String(conversation.freelancerId)
  ) {
    return true;
  }

  if (senderRole === "FREELANCER") {
    return true;
  }

  const senderName = normalizeName(message?.senderName);
  const freelancerName = normalizeName(conversation?.name);

  return Boolean(senderName && freelancerName && senderName === freelancerName);
};

export const isOwnMessage = (message, currentUser, conversation) => {
  const senderRole = String(message?.senderRole || "").toUpperCase();

  if (message?.pending) {
    return true;
  }

  if (
    message?.senderId &&
    currentUser?.id &&
    String(message.senderId) === String(currentUser.id)
  ) {
    return true;
  }

  if (message?.senderId && currentUser?.id) {
    return false;
  }

  if (matchesCurrentUserName(message, currentUser)) {
    return true;
  }

  if (isFreelancerMessage(message, conversation)) {
    return false;
  }

  if (
    senderRole === "CLIENT" &&
    (message?.senderId || normalizeName(message?.senderName))
  ) {
    return true;
  }

  if (senderRole === "FREELANCER" || senderRole === "PROJECT_MANAGER") {
    return false;
  }

  return false;
};

const formatRoleLabel = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export const getMessageRoleLabel = (message, ownMessage, conversation) => {
  if (ownMessage) {
    return "Client";
  }

  const senderRole = String(message?.senderRole || "").toUpperCase();
  if (senderRole === "PROJECT_MANAGER") {
    return "Project Manager";
  }

  if (senderRole === "CLIENT") {
    return "Client";
  }

  if (senderRole === "FREELANCER" || isFreelancerMessage(message, conversation)) {
    return "Freelancer";
  }

  if (senderRole) {
    return formatRoleLabel(senderRole);
  }

  return "Project Manager";
};

const shallowEqualObject = (left = {}, right = {}) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => Object.is(left[key], right[key]));
};

export const patchConversationCollection = (list, targetKey, updater) => {
  let changed = false;

  const nextList = list.map((conversation) => {
    const conversationKey = getConversationKey(conversation);
    if (conversationKey !== targetKey) {
      return conversation;
    }

    const patch =
      typeof updater === "function" ? updater(conversation) : updater;

    if (!patch) {
      return conversation;
    }

    const nextConversation = {
      ...conversation,
      ...patch,
    };

    if (shallowEqualObject(conversation, nextConversation)) {
      return conversation;
    }

    changed = true;
    return nextConversation;
  });

  return changed ? sortConversations(nextList) : list;
};

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const buildConversationSearchText = (conversation = {}) =>
  [
    conversation.name,
    conversation.projectTitle,
    conversation.label,
    conversation.businessName,
    conversation.serviceType,
    getConversationMemberLabel(conversation),
    getMessagePreview(conversation),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const buildRequestSearchText = (request = {}) =>
  [
    request.freelancerName,
    request.serviceTitle,
    request.serviceType,
    request.requestMessage,
    request.previewText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const enrichConversationRecord = (
  conversation = {},
  currentClientName = "Client",
) => {
  const nextConversation = {
    ...conversation,
    projectId: conversation.projectId || conversation.id || null,
    conversationId: conversation.conversationId || null,
    clientName: conversation.clientName || currentClientName,
    name: getFirstNonEmptyText(
      conversation.name,
      conversation.freelancerName,
      "Freelancer",
    ),
    avatar: resolveConversationAvatarSrc(conversation) || null,
    businessName: getFirstNonEmptyText(conversation.businessName),
    label: getFirstNonEmptyText(
      conversation.label,
      conversation.serviceLabel,
      SERVICE_LABEL,
    ),
    projectTitle: getFirstNonEmptyText(
      conversation.projectTitle,
      conversation.label,
      conversation.serviceLabel,
      SERVICE_LABEL,
    ),
    projectServiceLabel: getFirstNonEmptyText(
      conversation.projectServiceLabel,
      conversation.serviceLabel,
      conversation.label,
      SERVICE_LABEL,
    ),
    serviceType: getFirstNonEmptyText(
      conversation.serviceType,
      conversation.serviceLabel,
      conversation.label,
      SERVICE_LABEL,
    ),
    previewText: getMessagePreview(conversation),
    chatUnlocked: conversation.chatUnlocked !== false,
    lastActivity: getTimestampValue(
      conversation.lastActivity ||
        conversation.updatedAt ||
        conversation.createdAt,
    ),
    unreadCount: Number(conversation.unreadCount || 0),
    messageCount: Number(conversation.messageCount || 0),
  };

  return {
    ...nextConversation,
    searchText: buildConversationSearchText(nextConversation),
  };
};

export const enrichRequestRecord = (request = {}) => ({
  ...request,
  searchText: buildRequestSearchText(request),
});

export const sortMessagesByCreatedAt = (messages = []) =>
  [...messages].sort(
    (left, right) =>
      getTimestampValue(left?.createdAt) - getTimestampValue(right?.createdAt),
  );

export const dedupeMessages = (messages = []) => {
  const byIdentity = new Map();

  for (const message of messages) {
    const key =
      message?.id ||
      `${message?.conversationId || ""}:${message?.createdAt || ""}:${getMessageSignature(message)}`;

    byIdentity.set(key, message);
  }

  return Array.from(byIdentity.values());
};

export const mergeMessageCollections = (
  previousMessages = [],
  nextMessages = [],
) => sortMessagesByCreatedAt(dedupeMessages([...previousMessages, ...nextMessages]));

export const isSameMessageDay = (left, right) =>
  Boolean(left && right && isSameDay(new Date(left), new Date(right)));
