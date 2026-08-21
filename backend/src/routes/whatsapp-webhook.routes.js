import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";


export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = String(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "").trim();

  if (!verifyToken) {
    return res.status(500).json({
      message: "WhatsApp webhook verify token is not configured."
    });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return res.status(200).type("text/plain").send(String(challenge));
  }

  return res.sendStatus(403);
});

whatsappWebhookRouter.post("/", async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    const contacts = value?.contacts;
    const status = value?.statuses?.[0];

    if (messages && Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages) {
        const fromPhone = String(msg.from || "").replace(/\D/g, "");
        const wamid = msg.id || null;
        const messageType = msg.type || "text";
        const senderName = contacts?.[0]?.profile?.name || null;
        
        let body = null;
        let mediaUrl = null;

        if (messageType === "text") {
          body = msg.text?.body || null;
        } else if (messageType === "image") {
          body = msg.image?.caption || "[Image]";
          mediaUrl = msg.image?.id || null;
        } else if (messageType === "button" || messageType === "interactive") {
          body = msg.button?.text || msg.interactive?.button_reply?.title || "[Interactive Button Reply]";
        } else {
          body = `[${messageType.toUpperCase()} message]`;
        }

        if (fromPhone) {
          await prisma.whatsAppMessage.upsert({
            where: { wamid: wamid || "temp_" + Date.now() },
            update: {
              body,
              senderName: senderName || undefined,
              status: "RECEIVED"
            },
            create: {
              fromPhone,
              senderName,
              toPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
              wamid,
              messageType,
              body,
              mediaUrl,
              direction: "INBOUND",
              status: "RECEIVED",
              rawPayload: req.body || {}
            }
          }).catch((err) => {
            console.error("[WhatsApp Webhook] Database save error:", err);
          });

          console.log(`[WhatsApp Webhook] Recorded incoming message from ${fromPhone} (${senderName || 'Unknown'}): ${body}`);

          // Trigger AI Chatbot processor asynchronously
          const buttonId = msg.button?.payload || msg.interactive?.button_reply?.id || null;
          import("../services/whatsapp-bot.service.js").then(({ processIncomingWhatsappBotMessage }) => {
            processIncomingWhatsappBotMessage({
              fromPhone,
              userText: body,
              buttonId
            }).catch((botErr) => console.error("[WhatsApp Webhook] Bot processing error:", botErr));
          }).catch((importErr) => console.error("[WhatsApp Webhook] Bot import error:", importErr));
        }
      }
    } else if (status) {

      console.log(`[WhatsApp Webhook] Status update: ${status.status} for ${status.recipient_id}. ID: ${status.id}`);
      if (status.id && status.status) {
        await prisma.whatsAppMessage.updateMany({
          where: { wamid: status.id },
          data: { status: status.status.toUpperCase() }
        }).catch(() => null);
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook:", error);
  }

  // Dual Webhook Forwarding to Staging / NeonDB (if configured in .env as FORWARD_WEBHOOK_URL)
  const forwardUrl = process.env.FORWARD_WEBHOOK_URL || process.env.STAGING_WEBHOOK_URL;
  if (forwardUrl) {
    fetch(forwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    }).catch((err) => console.error("[WhatsApp Webhook Forward Error]:", err.message));
  }

  return res.sendStatus(200);
});


