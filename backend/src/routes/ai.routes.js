import { Router } from "express";
import {
  chatWithAI,
  getServiceInfo,
  getAllServices
} from "../services/ai.service.js";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], serviceName } = req.body || {};

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const result = await chatWithAI(
      [{ role: "user", content: message }],
      conversationHistory,
      serviceName
    );

    res.json(result);
  } catch (error) {
    console.error("AI Chat Error:", error);
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 500;
    res.status(statusCode).json({
      success: false,
      error: "Failed to process AI request",
      message: error.message
    });
  }
});

aiRouter.get("/services", (_req, res) => {
  try {
    const services = getAllServices();
    res.json({ success: true, services });
  } catch (error) {
    console.error("AI Services Error:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

aiRouter.get("/services/:serviceId", (req, res) => {
  try {
    const service = getServiceInfo(req.params.serviceId);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json({ success: true, service });
  } catch (error) {
    console.error("AI Service Error:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});
