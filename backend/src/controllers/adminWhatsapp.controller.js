import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";


// Fetch list of all active chat conversations grouped by customer phone number
export const getWhatsappConversations = async (req, res, next) => {
  try {
    // Fetch latest message per fromPhone
    const allMessages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: "desc" }
    });

    const conversationMap = new Map();

    for (const msg of allMessages) {
      const phone = msg.fromPhone;
      if (!conversationMap.has(phone)) {
        conversationMap.set(phone, {
          phone,
          senderName: msg.senderName || "WhatsApp User",
          lastMessage: msg.body,
          lastMessageType: msg.messageType,
          direction: msg.direction,
          status: msg.status,
          updatedAt: msg.createdAt,
          unreadCount: 0
        });
      }

      if (msg.direction === "INBOUND" && msg.status === "RECEIVED") {
        const conv = conversationMap.get(phone);
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values());
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

    const messages = await prisma.whatsAppMessage.findMany({
      where: { fromPhone: cleanPhone },
      orderBy: { createdAt: "asc" }
    });

    // Mark messages as READ
    await prisma.whatsAppMessage.updateMany({
      where: { fromPhone: cleanPhone, direction: "INBOUND", status: "RECEIVED" },
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
        status: "SENT",
        rawPayload: resData || {}
      }
    });

    return res.json({ success: true, message: savedMessage });
  } catch (error) {
    next(error);
  }
};
