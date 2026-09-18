import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
 * Controller to record granular visitor/client activity events.
 * Accepts single event or batch of events for maximum performance.
 * POST /api/guest/track
 */
export const recordClientActivity = asyncHandler(async (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null;
  const userAgent = req.headers["user-agent"] || null;
  const authUserId = req.user?.id || null;

  const body = req.body || {};
  const rawEvents = Array.isArray(body.events) ? body.events : [body];

  const validEvents = [];

  for (const item of rawEvents) {
    const visitorId = String(item.visitorId || "").trim();
    const eventType = String(item.eventType || "").trim().toUpperCase();

    if (!visitorId || !eventType) continue;

    const serviceId = item.serviceId ? String(item.serviceId).trim() : null;
    const serviceName = item.serviceName ? String(item.serviceName).trim() : null;
    const sessionId = item.sessionId ? String(item.sessionId).trim() : null;
    const pageUrl = item.pageUrl ? String(item.pageUrl).trim() : null;
    const referrer = item.referrer ? String(item.referrer).trim() : null;
    const metadata =
      item.metadata && typeof item.metadata === "object" ? item.metadata : {};

    validEvents.push({
      visitorId,
      userId: authUserId || item.userId || null,
      sessionId,
      eventType,
      serviceId,
      serviceName,
      pageUrl,
      referrer,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  if (validEvents.length === 0) {
    return res.status(200).json({ success: true, count: 0 });
  }

  try {
    if (validEvents.length === 1) {
      const single = validEvents[0];
      await prisma.clientActivityEvent.create({
        data: single,
      });

      if (single.sessionId && single.visitorId) {
        prisma.aiGuestSession
          .updateMany({
            where: { id: single.sessionId, visitorId: null },
            data: { visitorId: single.visitorId },
          })
          .catch(() => {});
      }
    } else {
      await prisma.clientActivityEvent.createMany({
        data: validEvents,
        skipDuplicates: true,
      });

      // If any events have sessionId and visitorId, update session
      for (const ev of validEvents) {
        if (ev.sessionId && ev.visitorId) {
          prisma.aiGuestSession
            .updateMany({
              where: { id: ev.sessionId, visitorId: null },
              data: { visitorId: ev.visitorId },
            })
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("[ClientActivityTracker] Failed to persist activity events:", err?.message || err);
  }

  return res.status(200).json({
    success: true,
    count: validEvents.length,
  });
});
