import { API_BASE_URL } from "./api-client";

const VISITOR_ID_STORAGE_KEY = "cata_visitor_id";
const QUEUE_FLUSH_INTERVAL_MS = 1500;

let eventQueue = [];
let flushTimeout = null;

/**
 * Generate a random UUID v4 fallback if crypto.randomUUID is not available
 */
const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 11);
};

/**
 * Get or create persistent visitor ID for the current browser
 */
export const getVisitorId = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return "guest_ssr";
  }

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (!visitorId || typeof visitorId !== "string" || visitorId.length < 5) {
      visitorId = generateUUID();
      localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return "guest_anon";
  }
};

/**
 * Flush queued events to backend /guest/track
 */
const flushQueue = async () => {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];
  flushTimeout = null;

  const url = `${API_BASE_URL}/guest/track`;
  const payload = JSON.stringify({ events: batch });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch (err) {
    // Non-blocking silent catch for telemetry
    console.debug("[ActivityTracker] Telemetry push error:", err?.message || err);
  }
};

/**
 * Track an activity event non-blockingly
 * @param {string} eventType - e.g. 'PAGE_VIEW', 'SERVICE_CLICK', 'DIRECTION_CLICK', 'BRIEF_STEP', 'BRIEF_TAB_SWITCH', 'DOCUMENT_UPLOAD', 'CHAT_LAUNCH'
 * @param {object} payload - Optional payload details: { serviceId, serviceName, sessionId, metadata }
 */
export const trackClientActivity = (eventType, payload = {}) => {
  if (typeof window === "undefined") return;

  try {
    const visitorId = getVisitorId();
    const event = {
      visitorId,
      eventType: String(eventType).toUpperCase(),
      serviceId: payload.serviceId || null,
      serviceName: payload.serviceName || null,
      sessionId: payload.sessionId || null,
      pageUrl: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      metadata: payload.metadata || {},
      createdAt: new Date().toISOString(),
    };

    eventQueue.push(event);

    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }

    // Flush immediately for major navigation events, or queue for small interactions
    if (eventType === "CHAT_LAUNCH" || eventType === "PAGE_VIEW" || eventQueue.length >= 5) {
      void flushQueue();
    } else {
      flushTimeout = setTimeout(flushQueue, QUEUE_FLUSH_INTERVAL_MS);
    }
  } catch (err) {
    console.debug("[ActivityTracker] Failed to queue event:", err?.message || err);
  }
};
