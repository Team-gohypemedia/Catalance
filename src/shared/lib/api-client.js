import { getSession } from "@/shared/lib/auth-storage";

const normalizeBaseUrl = (url) => {
  if (!url) return null;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

// Prefer explicit env, then same-origin (for deployed frontends), then local dev fallback.
const safeWindow = typeof window === "undefined" ? null : window;
const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
const envSocketUrl = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
const envSocketPath = import.meta.env.VITE_SOCKET_PATH;

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

export const API_BASE_URL =
  envBaseUrl ||
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

export const request = async (path, options = {}) => {
  const session = getSession();
  const authHeaders = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};


  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout || 15000);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultHeaders,
        ...authHeaders,
        ...(options.headers || {})
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
    const message =
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

  return payload?.data ?? payload ?? {};
};

export const signup = ({
  fullName,
  email,
  password,
  role = "FREELANCER",
  freelancerProfile = null
}) => {
  const payload = {
    fullName,
    email,
    password,
    role,
    skills: []
  };

  if (role === "FREELANCER") {
    const normalizedProfile = freelancerProfile ?? {};
    const portfolio = normalizedProfile?.portfolio ?? {};
    const skills = Array.isArray(normalizedProfile?.skills)
      ? normalizedProfile.skills
      : [];

    payload.skills = skills;
    payload.freelancerProfile = {
      category: normalizedProfile?.category ?? "",
      specialty: normalizedProfile?.specialty ?? "",
      experience: normalizedProfile?.experience ?? "",
      portfolio: {
        portfolioUrl: portfolio?.portfolioUrl ?? "",
        linkedinUrl: portfolio?.linkedinUrl ?? ""
      },
      acceptedTerms: Boolean(normalizedProfile?.acceptedTerms)
    };
  }

  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

export const login = ({ email, password }) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
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

export const loginWithGoogle = (token) => {
  return request("/auth/google-login", {
    method: "POST",
    body: JSON.stringify({ token }) // Backend expects { token }
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

export const apiClient = {
  signup,
  login,
  createChatConversation,
  fetchChatConversations,
  fetchChatMessages,
  sendChatMessage,
  verifyOtp
};
