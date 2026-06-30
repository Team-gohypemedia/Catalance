import { Router } from "express";
import {
  chatWithAI,
  getServiceInfo,
  getAllServices,
  generateProposalMarkdown,
  generateProjectSopJson
} from "../services/ai.service.js";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      serviceName
    } = req.body || {};

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
    const payload = {
      success: false,
      error: "Failed to process AI request",
      message: error.message
    };
    if (error?.details) {
      payload.details = error.details;
    }
    res.status(statusCode).json(payload);
  }
});

aiRouter.post("/proposal", async (req, res) => {
  try {
    const { proposalContext = {}, chatHistory = [], serviceName } = req.body || {};
    const hasContext =
      proposalContext && typeof proposalContext === "object" && Object.keys(proposalContext).length > 0;
    const hasHistory = Array.isArray(chatHistory) && chatHistory.length > 0;

    if (!hasContext && !hasHistory) {
      res.status(400).json({ error: "proposalContext or chatHistory is required" });
      return;
    }

    const proposal = await generateProposalMarkdown(
      proposalContext,
      chatHistory,
      serviceName
    );

    res.json({ success: true, proposal });
  } catch (error) {
    console.error("AI Proposal Error:", error);
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 500;
    const payload = {
      success: false,
      error: "Failed to generate proposal",
      message: error.message
    };
    if (error?.details) {
      payload.details = error.details;
    }
    res.status(statusCode).json(payload);
  }
});

aiRouter.post("/sop", async (req, res) => {
  try {
    const { projectContext = {}, currentSop = null, instructions = "" } = req.body || {};
    const sop = await generateProjectSopJson(projectContext, currentSop, instructions);
    res.json({ success: true, sop });
  } catch (error) {
    console.error("AI SOP Error:", error);
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 500;
    res.status(statusCode).json({
      success: false,
      error: "Failed to generate/edit SOP",
      message: error.message
    });
  }
});

aiRouter.get("/services", async (req, res) => {
  try {
    const includeInactive = ["1", "true", "yes", "on"].includes(
      String(req?.query?.includeInactive || "").trim().toLowerCase()
    );
    const services = await getAllServices({ includeInactive });
    res.json({ success: true, services });
  } catch (error) {
    console.error("AI Services Error:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

aiRouter.get("/services/:serviceId", async (req, res) => {
  try {
    const service = await getServiceInfo(req.params.serviceId);
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
