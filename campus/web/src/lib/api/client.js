/**
 * Campus API client.
 * - With VITE_CAMPUS_API_URL set → real HTTP calls to the Campus API.
 * - Without it → demo mode: requests are served by the in-browser engine in src/mocks.
 * Usage: api.get("/api/courses?track=web-dev"), api.post("/api/auth/login", { email, password })
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_URL = (import.meta.env.VITE_CAMPUS_API_URL || "").replace(/\/$/, "");
export const IS_DEMO = !API_URL;

const TOKEN_KEY = "campus_token";
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

async function request(method, path, body) {
  const token = tokenStore.get();

  if (IS_DEMO) {
    const { handleMock } = await import("@/mocks/router");
    return handleMock(method, path, body, token);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach Campus right now. Check your connection.", 0);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    // only drop the token this request used; a newer one (e.g. just handed over by Catalance) stays
    if (res.status === 401 && token && tokenStore.get() === token) tokenStore.clear();
    throw new ApiError(data?.error?.message || res.statusText || "Request failed", res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body = {}) => request("POST", path, body),
  put: (path, body = {}) => request("PUT", path, body),
  patch: (path, body = {}) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

/** Build "?a=1&b=2" from an object, skipping empty values. */
export function qs(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== false) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
