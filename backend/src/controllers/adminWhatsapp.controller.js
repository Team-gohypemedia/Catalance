import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";


export const getWhatsappConversations = async (req, res, next) => {
  try {
    const allMessages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: "desc" }
    });

    const businessPhone = String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, "");
    const conversationMap = new Map();

    for (const msg of allMessages) {
      let phone = msg.fromPhone ? String(msg.fromPhone).replace(/\D/g, "") : "";
      const toPhoneClean = msg.toPhone ? String(msg.toPhone).replace(/\D/g, "") : "";

      if (msg.direction === "OUTBOUND" && (phone === businessPhone || !phone || toPhoneClean !== businessPhone)) {
        if (toPhoneClean && toPhoneClean !== businessPhone) {
          phone = toPhoneClean;
        }
      }

      if (!phone) continue;

      if (!conversationMap.has(phone)) {
        conversationMap.set(phone, {
          phone,
          senderName: null,
          lastMessage: msg.body,
          lastMessageType: msg.messageType,
          direction: msg.direction,
          status: msg.status,
          updatedAt: msg.createdAt,
          unreadCount: 0
        });
      }

      const conv = conversationMap.get(phone);

      if (!conv.senderName && msg.senderName) {
        conv.senderName = msg.senderName;
      }

      if (msg.direction === "INBOUND" && (msg.status === "RECEIVED" || msg.status === "UNREAD")) {
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values());
    for (const conv of conversations) {
      if (!conv.senderName) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: { contains: conv.phone.slice(-10) } },
              { phone: { contains: conv.phone.slice(-10) } }
            ]
          },
          select: { fullName: true }
        }).catch(() => null);

        conv.senderName = user?.fullName || `Contact +${conv.phone}`;
      }
    }

    return res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};


// Fetch full chat thread for a given phone number
export const getWhatsappMessagesByPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (!cleanPhone) {
      throw new AppError("Invalid phone number", 400);
    }

    const last10 = cleanPhone.slice(-10);

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        OR: [
          { fromPhone: { contains: last10 } },
          { toPhone: { contains: last10 } }
        ]
      },
      orderBy: { createdAt: "asc" }
    });

    await prisma.whatsAppMessage.updateMany({
      where: {
        fromPhone: { contains: last10 },
        direction: "INBOUND",
        status: "RECEIVED"
      },
      data: { status: "READ" }
    }).catch(() => null);

    return res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};


// Send direct WhatsApp text message reply to customer
export const sendWhatsappReply = async (req, res, next) => {
  try {
    const { toPhone, message } = req.body;
    const cleanPhone = String(toPhone || "").replace(/\D/g, "");
    const messageText = String(message || "").trim();

    if (!cleanPhone || !messageText) {
      throw new AppError("Recipient phone number and message body are required", 400);
    }

    const graphVersion = String(env.WHATSAPP_GRAPH_VERSION || "v25.0").trim().replace(/^\/+|\/+$/g, "");
    const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
    const accessToken = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();

    if (!phoneNumberId || !accessToken) {
      throw new AppError("WhatsApp Cloud API credentials are missing in backend configuration", 500);
    }

    const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: messageText
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("[WhatsApp Admin Send] Meta API error:", JSON.stringify(resData, null, 2));
      throw new AppError(resData?.error?.message || "Failed to send WhatsApp message via Meta Cloud API", 400);
    }

    const wamid = resData?.messages?.[0]?.id || null;

    // Save outbound message into database
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        fromPhone: cleanPhone,
        toPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
        wamid,
        messageType: "text",
        body: messageText,
        direction: "OUTBOUND",
        status: "ADMIN_SENT",
        rawPayload: resData || {}
      }
    });

    return res.json({ success: true, message: savedMessage });
  } catch (error) {
    next(error);
  }
};

export const getWhatsappAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "7d" } = req.query;

    let dateFilter = undefined;
    const now = new Date();

    if (timeframe === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (timeframe === "7d") {
      const date7 = new Date(now);
      date7.setDate(now.getDate() - 6);
      date7.setHours(0, 0, 0, 0);
      dateFilter = { gte: date7 };
    } else if (timeframe === "30d") {
      const date30 = new Date(now);
      date30.setDate(now.getDate() - 29);
      date30.setHours(0, 0, 0, 0);
      dateFilter = { gte: date30 };
    }

    const allMessages = await prisma.whatsAppMessage.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      orderBy: { createdAt: "desc" }
    });

    const RATES_INR = {
      otp: 0.15,
      notification: 0.30,
      marketing: 0.75,
      text: 0.15,
      default: 0.25
    };
    const USD_EXCHANGE_RATE = 83.5;

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        phoneNumber: true,
        role: true,
        avatar: true
      }
    }).catch(() => []);

    const userPhoneMap = new Map();
    allUsers.forEach((u) => {
      const p1 = u.phone ? String(u.phone).replace(/\D/g, "") : null;
      const p2 = u.phoneNumber ? String(u.phoneNumber).replace(/\D/g, "") : null;
      if (p1 && p1.length >= 10) userPhoneMap.set(p1.slice(-10), u);
      if (p2 && p2.length >= 10) userPhoneMap.set(p2.slice(-10), u);
    });

    let totalOutbound = 0;
    let totalInbound = 0;
    let totalDelivered = 0;
    let totalFailed = 0;
    let totalCostInr = 0;

    const categoryStats = {
      otp: { count: 0, costInr: 0, rateInr: 0.15, label: "Authentication (OTP)" },
      notification: { count: 0, costInr: 0, rateInr: 0.30, label: "Utility & System Alerts" },
      marketing: { count: 0, costInr: 0, rateInr: 0.75, label: "Marketing & Reminders" },
      text: { count: 0, costInr: 0, rateInr: 0.15, label: "Support & Direct Replies" },
    };

    const dailyTrendsMap = new Map();

    if (timeframe === "7d" || timeframe === "30d") {
      const daysCount = timeframe === "7d" ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        dailyTrendsMap.set(dateKey, {
          date: dateKey,
          label: d.toLocaleDateString([], { month: "short", day: "numeric" }),
          totalCount: 0,
          outboundCount: 0,
          inboundCount: 0,
          costInr: 0,
          otpCount: 0,
          notificationCount: 0,
          marketingCount: 0,
          textCount: 0,
        });
      }
    }

    const enrichedLogs = [];

    for (const msg of allMessages) {
      const isOutbound = msg.direction === "OUTBOUND";
      if (isOutbound) totalOutbound++;
      else totalInbound++;

      if (msg.status === "DELIVERED" || msg.status === "READ" || msg.status === "ADMIN_SENT" || msg.status === "RECEIVED" || msg.status === "SENT") {
        totalDelivered++;
      } else if (msg.status === "FAILED") {
        totalFailed++;
      }

      const msgCategory = msg.messageType === "otp"
        ? "otp"
        : msg.messageType === "notification"
          ? "notification"
          : msg.body?.toLowerCase().includes("reminder") || msg.body?.toLowerCase().includes("offer")
            ? "marketing"
            : "text";

      const costForMsg = isOutbound ? (RATES_INR[msgCategory] || 0.25) : 0;
      if (isOutbound) {
        totalCostInr += costForMsg;
        if (categoryStats[msgCategory]) {
          categoryStats[msgCategory].count++;
          categoryStats[msgCategory].costInr += costForMsg;
        }
      }

      const dateKey = new Date(msg.createdAt).toISOString().slice(0, 10);
      if (!dailyTrendsMap.has(dateKey)) {
        dailyTrendsMap.set(dateKey, {
          date: dateKey,
          label: new Date(msg.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
          totalCount: 0,
          outboundCount: 0,
          inboundCount: 0,
          costInr: 0,
          otpCount: 0,
          notificationCount: 0,
          marketingCount: 0,
          textCount: 0,
        });
      }
      const dayData = dailyTrendsMap.get(dateKey);

      dayData.totalCount++;
      if (isOutbound) {
        dayData.outboundCount++;
        dayData.costInr += costForMsg;
        if (msgCategory === "otp") dayData.otpCount++;
        else if (msgCategory === "notification") dayData.notificationCount++;
        else if (msgCategory === "marketing") dayData.marketingCount++;
        else dayData.textCount++;
      } else {
        dayData.inboundCount++;
      }

      const phoneDigits = String(msg.fromPhone || msg.toPhone || "").replace(/\D/g, "");
      const matchedUser = userPhoneMap.get(phoneDigits.slice(-10));

      const recipientName = matchedUser?.fullName || msg.senderName || `Contact +${phoneDigits}`;
      const recipientEmail = matchedUser?.email || null;
      const recipientRole = matchedUser?.role || "USER";
      const recipientAvatar = matchedUser?.avatar || null;

      enrichedLogs.push({
        id: msg.id,
        phone: phoneDigits,
        recipientName,
        recipientEmail,
        recipientRole,
        recipientAvatar,
        direction: msg.direction,
        category: msgCategory,
        categoryLabel: categoryStats[msgCategory]?.label || "General",
        messageType: msg.messageType,
        bodySnippet: msg.body || "No text payload",
        status: msg.status,
        costInr: Number(costForMsg.toFixed(2)),
        costUsd: Number((costForMsg / USD_EXCHANGE_RATE).toFixed(4)),
        createdAt: msg.createdAt,
      });
    }

    const dailyTrends = Array.from(dailyTrendsMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        costInr: Number(d.costInr.toFixed(2))
      }));

    return res.json({
      success: true,
      data: {
        timeframe,
        summary: {
          totalSent: totalOutbound,
          totalReceived: totalInbound,
          totalDelivered,
          totalFailed,
          totalCostInr: Number(totalCostInr.toFixed(2)),
          totalCostUsd: Number((totalCostInr / USD_EXCHANGE_RATE).toFixed(2)),
        },
        categoryStats,
        dailyTrends,
        ratesInr: RATES_INR,
        logs: enrichedLogs
      }
    });
  } catch (error) {
    next(error);
  }
};


