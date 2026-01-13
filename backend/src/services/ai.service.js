import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const servicesData = JSON.parse(
  readFileSync(join(__dirname, "../data/servicesComplete.json"), "utf-8")
);

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_REFERER = process.env.FRONTEND_URL || "http://localhost:5173";

const stripMarkdownHeadings = (text = "") =>
  text.replace(/^\s*#{1,6}\s+/gm, "");

const buildSystemPrompt = () => {
  const servicesWithQuestions = servicesData.services
    .map((service) => {
      const minAmount = service?.budget?.min_required_amount;
      const minBudget = minAmount
        ? `INR ${Number(minAmount).toLocaleString()}`
        : "Varies";
      const unit = service?.budget?.unit || "project";
      const questions = Array.isArray(service.questions)
        ? service.questions
          .map((q, idx) => {
            let questionText = `Q${idx + 1}: ${q.question}`;
            if (Array.isArray(q.options) && q.options.length > 0) {
              const options = q.options.map((o) => o.label).join(" | ");
              questionText += `\n   Options: ${options}`;
            }
            return questionText;
          })
          .join("\n")
        : "No specific questions";

      return [
        `SERVICE ${service.number}: ${service.name}`,
        `ID: ${service.id}`,
        `Min Budget: ${minBudget} ${unit}`,
        "QUESTIONS TO ASK:",
        questions,
        "---"
      ].join("\n");
    })
    .join("\n");

  return `You are an expert business consultant AI for a premium digital services agency. Your role is to understand client needs through a structured consultation process and generate detailed proposals.

YOUR CONSULTATION PROCESS

PHASE 1: SERVICE IDENTIFICATION
When a user first interacts, identify which service(s) they need based on their initial message. If unclear, ask clarifying questions.

PHASE 2: REQUIREMENTS GATHERING
Once a service is identified, guide the client through the relevant questions for that service.
Rules:
1. Ask questions one at a time for better conversation flow.
2. Present options clearly when available.
3. Remember and acknowledge their previous answers.
4. If they provide unclear answers, ask for clarification.
5. Track which questions have been answered.
6. Be conversational, not robotic. Weave questions naturally into the discussion.

PHASE 3: PROPOSAL GENERATION
After gathering all required information, generate a detailed proposal using this structure:

PROJECT PROPOSAL
================
Client Requirements Summary:
[Summarize what they need based on conversation]

Recommended Service: [Service Name]

Scope of Work:
[Detailed list of deliverables based on their answers]

Timeline: [Based on their preference]

Investment:
- Service Cost: INR [amount] (based on their budget and requirements)
- Payment Terms: [suggest terms]

What's Included:
[List specific deliverables based on their selections]

Next Steps:
1. Confirm this proposal meets your requirements.
2. Schedule a discovery call with our team.
3. Begin project kick-off.
================

BUDGET VALIDATION RULE:
${servicesData.global_rules.budget_validation.when_user_budget_below_minimum.message}

AVAILABLE SERVICES AND QUESTIONS:
${servicesWithQuestions}

CONVERSATION GUIDELINES:
- Be warm, professional, and consultative.
- Use INR for all pricing.
- Keep responses focused and actionable.
- When asking questions, explain why the information matters.
- If the user seems overwhelmed, offer to simplify.
- Do not use Markdown headings or bold. Avoid lines that start with # (including ##).
- Track conversation progress internally.
- When enough information is gathered (at least 5 to 7 key questions answered), offer to generate the proposal.
- Always confirm before generating the final proposal.`;
};

export const chatWithAI = async (messages, conversationHistory = []) => {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError("OpenRouter API key not configured", 500);
  }

  const systemMessage = {
    role: "system",
    content: buildSystemPrompt()
  };

  const formattedHistory = Array.isArray(conversationHistory)
    ? conversationHistory
      .filter((msg) => msg && msg.content)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }))
    : [];

  const formattedMessages = Array.isArray(messages)
    ? messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }))
    : [];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": DEFAULT_REFERER,
      "X-Title": "Catalance AI Assistant"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [systemMessage, ...formattedHistory, ...formattedMessages],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error?.message || "AI API request failed";
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      /user not found|invalid api key|unauthorized/i.test(errorMessage);

    if (isAuthError) {
      throw new AppError(
        "OpenRouter authentication failed. Verify OPENROUTER_API_KEY in your .env.",
        502
      );
    }

    throw new AppError(errorMessage, 502);
  }

  if (!data) {
    throw new AppError("AI API returned an invalid response", 502);
  }
  const content = data.choices?.[0]?.message?.content || "";
  return {
    success: true,
    message: stripMarkdownHeadings(content),
    usage: data.usage || null
  };
};

export const getServiceInfo = (serviceId) =>
  servicesData.services.find((service) => service.id === serviceId);

export const getAllServices = () => servicesData.services;
