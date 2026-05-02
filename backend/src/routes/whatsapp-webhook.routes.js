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
  const entryCount = Array.isArray(req.body?.entry) ? req.body.entry.length : 0;

  if (entryCount > 0) {
    console.log(`[WhatsApp Webhook] Received ${entryCount} entr${entryCount === 1 ? "y" : "ies"}.`);
  }

  return res.sendStatus(200);
});
