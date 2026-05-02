import { Router } from "express";
import { env } from "../config/env.js";

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

whatsappWebhookRouter.post("/", (req, res) => {
  if (env.NODE_ENV !== "production") {
    console.log("[WhatsApp Webhook] Body:", JSON.stringify(req.body, null, 2));
  } else {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const status = value?.statuses?.[0];

    if (status) {
      console.log(`[WhatsApp Webhook] Status update: ${status.status} for ${status.recipient_id}. ID: ${status.id}`);
      if (status.errors) {
        console.error(`[WhatsApp Webhook] Status errors:`, JSON.stringify(status.errors, null, 2));
      }
    } else {
      console.log(`[WhatsApp Webhook] Received event: ${value?.messaging_product || "unknown"}`);
    }
  }

  return res.sendStatus(200);
});
