import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

const GRAPH_VERSION = String(env.WHATSAPP_GRAPH_VERSION || "v25.0").trim().replace(/^\/+|\/+$/g, "");
const PHONE_NUMBER_ID = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
const ACCESS_TOKEN = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();

// Send direct interactive button menu or text via Meta Cloud API
export const sendWhatsappInteractiveMenu = async ({ to, bodyText, buttons }) => {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return null;

  const cleanPhone = String(to || "").replace(/\D/g, "");
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.messages?.[0]?.id) {
      // Save bot outbound message in DB
      await prisma.whatsAppMessage.create({
        data: {
          fromPhone: cleanPhone,
          toPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
          wamid: data.messages[0].id,
          messageType: "interactive",
          body: bodyText,
          direction: "OUTBOUND",
          status: "SENT"
        }
      }).catch(() => null);
    }
    return data;
  } catch (err) {
    console.error("[WhatsApp Bot] Error sending interactive menu:", err);
    return null;
  }
};

// Send direct AI text response on WhatsApp
export const sendWhatsappTextMessage = async ({ to, text }) => {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return null;

  const cleanPhone = String(to || "").replace(/\D/g, "");
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: { body: text }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.messages?.[0]?.id) {
      await prisma.whatsAppMessage.create({
        data: {
          fromPhone: cleanPhone,
          toPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
          wamid: data.messages[0].id,
          messageType: "text",
          body: text,
          direction: "OUTBOUND",
          status: "SENT"
        }
      }).catch(() => null);
    }
    return data;
  } catch (err) {
    console.error("[WhatsApp Bot] Error sending text message:", err);
    return null;
  }
};

// AI Response Generator for Catalance Assistant
export const generateAiChatbotResponse = async (userMessage, conversationHistory = []) => {
  const prompt = `You are the friendly, helpful AI Assistant for Catalance (catalance.in).
Catalance connects clients with top vetted freelancers for Website Development, Mobile App Development, AI Agents, UI/UX Design, SEO, and Digital Marketing.

Your Goal:
- Have an easy, natural, polite, and clear conversation with the user.
- Do NOT use any emojis in your responses.
- Keep responses short, concise, and engaging (2 to 4 sentences maximum).
- Help the user with project questions, hiring freelancers, pricing, or getting started.
- If they ask for human support or contacting team, reassure them that an admin has been notified.

User Message: "${userMessage}"
Recent Conversation History: ${JSON.stringify(conversationHistory)}
`;

  try {
    const openRouterApiKey = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
    const modelToUse = env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    if (!openRouterApiKey) {
      return "Thank you for contacting Catalance. How can we assist you with your project today?";
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: "You are the AI support assistant for Catalance. Do not use any emojis in your output." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await res.json().catch(() => null);
    const aiText = data?.choices?.[0]?.message?.content?.trim();
    return aiText || "Thank you for reaching out to Catalance. How can we help with your project today?";
  } catch (err) {
    console.error("[WhatsApp Bot] AI generation error:", err);
    return "Thank you for reaching out to Catalance. How can we help with your project today?";
  }
};


// Main Bot Processor Logic
export const processIncomingWhatsappBotMessage = async ({ fromPhone, userText, buttonId }) => {
  // Check if admin recently sent a message (if admin replied in last 10 minutes, pause AI)
  const lastAdminMsg = await prisma.whatsAppMessage.findFirst({
    where: { fromPhone, direction: "OUTBOUND" },
    orderBy: { createdAt: "desc" }
  }).catch(() => null);

  if (lastAdminMsg && (Date.now() - new Date(lastAdminMsg.createdAt).getTime()) < 10 * 60 * 1000) {
    console.log(`[WhatsApp Bot] Bot paused for ${fromPhone} due to recent admin interaction.`);
    return;
  }

  const cleanText = (userText || "").trim().toLowerCase();

  // 1. First Greeting / Menu trigger
  if (buttonId === "btn_menu" || ["hi", "hello", "hey", "start", "menu", "help"].includes(cleanText)) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Welcome to Catalance. How can we help you today? Please choose an option below:",
      buttons: [
        { id: "btn_project_help", title: "Project Help" },
        { id: "btn_new_services", title: "New Services" },
        { id: "btn_contact_team", title: "Contact Team" }
      ]
    });
  }

  // 2. Button Action: Project Help
  if (buttonId === "btn_project_help" || cleanText.includes("project help")) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Project Help: We can help you track project progress, milestone payments, or freelancer updates. Please choose what you need help with:",
      buttons: [
        { id: "btn_track_status", title: "Track Progress" },
        { id: "btn_hire_freelancer", title: "Hire Freelancer" },
        { id: "btn_contact_team", title: "Contact Team" }
      ]
    });
  }

  // 3. Button Action: New Services
  if (buttonId === "btn_new_services" || cleanText.includes("new services")) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Catalance Services: We offer top vetted freelancers for Web & Mobile Apps, AI Agents, UI/UX Design, and Marketing. What would you like to build?",
      buttons: [
        { id: "btn_web_app", title: "Web or App Dev" },
        { id: "btn_ai_agents", title: "AI & Automation" },
        { id: "btn_design_seo", title: "Design & SEO" }
      ]
    });
  }

  // 4. Button Action: Contact Team / Hire / Details
  if (
    buttonId === "btn_contact_team" ||
    buttonId === "btn_track_status" ||
    buttonId === "btn_hire_freelancer" ||
    buttonId === "btn_web_app" ||
    buttonId === "btn_ai_agents" ||
    buttonId === "btn_design_seo"
  ) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Thank you for selecting. Our Admin Team has been notified of your request. An admin will review your message and reply directly to this chat shortly.",
      buttons: [
        { id: "btn_menu", title: "Main Menu" }
      ]
    });
  }

  // 5. General AI Conversation Engine
  const recentMsgs = await prisma.whatsAppMessage.findMany({
    where: { fromPhone },
    orderBy: { createdAt: "desc" },
    take: 6
  }).catch(() => []);

  const history = recentMsgs.reverse().map((m) => ({
    role: m.direction === "INBOUND" ? "user" : "assistant",
    text: m.body
  }));

  const aiReply = await generateAiChatbotResponse(userText || buttonId || "Hi", history);
  
  // Deliver AI reply with interactive Main Menu button
  return sendWhatsappInteractiveMenu({
    to: fromPhone,
    bodyText: aiReply,
    buttons: [
      { id: "btn_menu", title: "Main Menu" }
    ]
  });
};

