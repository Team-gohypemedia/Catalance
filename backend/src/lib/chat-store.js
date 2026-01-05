import { randomUUID } from "crypto";

const conversations = new Map(); // id -> { id, service, createdAt, updatedAt, createdById, messages: [] }
const SERVICE_INDEX = new Map(); // service -> conversationId (latest)
const SHARED_CONTEXTS = new Map(); // key -> { context, updatedAt }
const SHARED_CONTEXT_TTL_MS = 1000 * 60 * 60 * 6;

const generateId = () => {
  try {
    return randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

export const createConversation = ({ service = null, createdById = null } = {}) => {
  const id = generateId();
  const now = new Date();
  const conversation = {
    id,
    service,
    createdById,
    createdAt: now,
    updatedAt: now,
    messages: [],
    assistantState: null
  };
  conversations.set(id, conversation);
  if (service) {
    SERVICE_INDEX.set(service, id);
  }
  return conversation;
};

export const findConversationByService = (service) => {
  if (!service) return null;
  const id = SERVICE_INDEX.get(service);
  return id ? conversations.get(id) || null : null;
};

export const getConversation = (id) => {
  if (!id) return null;
  return conversations.get(id) || null;
};

export const ensureConversation = ({ id, service, createdById }) => {
  if (id) {
    const existing = getConversation(id);
    if (existing) return existing;
  }

  // Never reuse a conversation just because the service matches; it can cause
  // context leakage and repeated questions if the client has a stale/missing id.
  return createConversation({ service, createdById });
};

export const listMessages = (conversationId, limit = 100) => {
  const conversation = getConversation(conversationId);
  if (!conversation) return [];
  const messages = conversation.messages || [];
  if (!limit || limit >= messages.length) {
    return [...messages];
  }
  return messages.slice(-limit);
};

export const addMessage = ({
  conversationId,
  role,
  content,
  senderId = null,
  senderName = null,
  senderRole = null
}) => {
  const conversation = getConversation(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  const now = new Date();
  const message = {
    id: generateId(),
    conversationId,
    role,
    content,
    senderId,
    senderName,
    senderRole,
    createdAt: now,
    updatedAt: now
  };
  conversation.messages.push(message);
  conversation.updatedAt = now;
  // Keep only last 100 messages to avoid unbounded growth
  if (conversation.messages.length > 100) {
    conversation.messages = conversation.messages.slice(-100);
  }
  return message;
};

export const deleteConversation = (id) => {
  const conversation = getConversation(id);
  if (conversation?.service) {
    SERVICE_INDEX.delete(conversation.service);
  }
  return conversations.delete(id);
};

const cloneSharedContext = (context) => {
  if (!context || typeof context !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(context));
  } catch {
    return null;
  }
};

const isSharedContextExpired = (entry) => {
  if (!entry?.updatedAt) return false;
  return Date.now() - entry.updatedAt > SHARED_CONTEXT_TTL_MS;
};

export const getSharedContextKey = ({
  sharedContextId = null,
  senderId = null,
  conversationId = null
} = {}) => {
  const sessionKey = sharedContextId ? String(sharedContextId).trim() : "";
  if (sessionKey) return `session:${sessionKey}`;
  const userKey = senderId ? String(senderId).trim() : "";
  if (userKey) return `user:${userKey}`;
  const convoKey = conversationId ? String(conversationId).trim() : "";
  if (convoKey) return `conversation:${convoKey}`;
  return null;
};

export const getSharedContext = (key) => {
  if (!key) return null;
  const entry = SHARED_CONTEXTS.get(key);
  if (!entry) return null;
  if (isSharedContextExpired(entry)) {
    SHARED_CONTEXTS.delete(key);
    return null;
  }
  return cloneSharedContext(entry.context);
};

export const setSharedContext = (key, context) => {
  if (!key || !context) return;
  SHARED_CONTEXTS.set(key, { context: cloneSharedContext(context), updatedAt: Date.now() });
};
