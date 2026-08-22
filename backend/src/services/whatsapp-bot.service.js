import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

const GRAPH_VERSION = String(env.WHATSAPP_GRAPH_VERSION || "v25.0").trim().replace(/^\/+|\/+$/g, "");
const PHONE_NUMBER_ID = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
const ACCESS_TOKEN = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();

// Send direct interactive button menu or text via Meta Cloud API
export const sendWhatsappInteractiveMenu = async ({ to, bodyText, buttons }) => {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[WhatsApp Bot] Failed to send interactive menu: PHONE_NUMBER_ID or ACCESS_TOKEN is missing in env.");
    return null;
  }

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

    if (!res.ok) {
      console.error(`[WhatsApp Bot] Meta API HTTP Error ${res.status} when sending interactive menu to ${cleanPhone}:`, JSON.stringify(data || {}, null, 2));
      return null;
    }

    if (data?.messages?.[0]?.id) {
      console.log(`[WhatsApp Bot] Successfully sent interactive menu to ${cleanPhone}. Message ID: ${data.messages[0].id}`);
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
      }).catch((dbErr) => console.error("[WhatsApp Bot] DB Save error for outbound message:", dbErr));
    }
    return data;
  } catch (err) {
    console.error("[WhatsApp Bot] Network/Fetch error sending interactive menu:", err);
    return null;
  }
};

// Send direct AI text response on WhatsApp
export const sendWhatsappTextMessage = async ({ to, text }) => {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[WhatsApp Bot] Failed to send text message: PHONE_NUMBER_ID or ACCESS_TOKEN is missing in env.");
    return null;
  }

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

    if (!res.ok) {
      console.error(`[WhatsApp Bot] Meta API HTTP Error ${res.status} when sending text to ${cleanPhone}:`, JSON.stringify(data || {}, null, 2));
      return null;
    }

    if (data?.messages?.[0]?.id) {
      console.log(`[WhatsApp Bot] Successfully sent text message to ${cleanPhone}. Message ID: ${data.messages[0].id}`);
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
      }).catch((dbErr) => console.error("[WhatsApp Bot] DB Save error for outbound text message:", dbErr));
    }
    return data;
  } catch (err) {
    console.error("[WhatsApp Bot] Network/Fetch error sending text message:", err);
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
    // Fallback to valid models if model in env is invalid (e.g. gpt-5.1)
    let modelToUse = env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    if (modelToUse.includes("5.1")) {
      modelToUse = "openai/gpt-4o-mini";
    }

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
    if (aiText) return aiText;
    
    console.warn("[WhatsApp Bot] OpenRouter API warning payload:", data);
    return "Thank you for reaching out to Catalance. How can we help with your project today?";
  } catch (err) {
    console.error("[WhatsApp Bot] AI generation error:", err);
    return "Thank you for reaching out to Catalance. How can we help with your project today?";
  }
};



// Main Bot Processor Logic
export const processIncomingWhatsappBotMessage = async ({ fromPhone, userText, buttonId }) => {
  // Check if admin manually sent a message from dashboard recently (pause AI for 10 min only if admin replied)
  const lastAdminMsg = await prisma.whatsAppMessage.findFirst({
    where: { fromPhone, direction: "OUTBOUND", status: "ADMIN_SENT" },
    orderBy: { createdAt: "desc" }
  }).catch(() => null);

  if (lastAdminMsg && (Date.now() - new Date(lastAdminMsg.createdAt).getTime()) < 10 * 60 * 1000) {
    console.log(`[WhatsApp Bot] Bot paused for ${fromPhone} due to recent admin interaction.`);
    return;
  }

  const cleanText = (userText || "").trim().toLowerCase();

  // ----------------------------------------------------
  // 1. FIRST GREETING / MAIN MENU
  // ----------------------------------------------------
  const isGreetingWord = ["hi", "hello", "hey", "start", "menu", "help"].some((g) => cleanText === g || cleanText.startsWith(g + " "));
  const isSpecificQuery = cleanText.length > 15;

  if (buttonId === "btn_menu" || (isGreetingWord && !isSpecificQuery)) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Welcome to Catalance. How can we help you today? Please select an option below:",
      buttons: [
        { id: "btn_project_help", title: "Project Help" },
        { id: "btn_new_services", title: "New Services" },
        { id: "btn_contact_team", title: "Contact Team" }
      ]
    });
  }

  // ----------------------------------------------------
  // 2. LEVEL 1: MAIN CATEGORIES
  // ----------------------------------------------------
  // Choice 1: Project Help
  if (buttonId === "btn_project_help" || cleanText === "project help") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Project Help: Please select what you need assistance with:",
      buttons: [
        { id: "step2_ongoing_project", title: "Ongoing Project" },
        { id: "step2_milestone_payment", title: "Milestone Payment" },
        { id: "step2_freelancer_issue", title: "Freelancer Issue" }
      ]
    });
  }

  // Choice 2: New Services
  if (buttonId === "btn_new_services" || cleanText === "new services") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "New Services: What kind of project would you like to build with Catalance?",
      buttons: [
        { id: "step2_web_app", title: "Web or App Dev" },
        { id: "step2_ai_automation", title: "AI & Automation" },
        { id: "step2_design_seo", title: "Design & Marketing" }
      ]
    });
  }

  // Choice 3: Contact Team
  if (buttonId === "btn_contact_team" || cleanText === "contact team") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Contact Team: How can our support team assist you today?",
      buttons: [
        { id: "step2_urgent_support", title: "Urgent Support" },
        { id: "step2_general_inquiry", title: "General Inquiry" },
        { id: "step2_book_call", title: "Book a Call" }
      ]
    });
  }

  // ----------------------------------------------------
  // 3. LEVEL 2: SUB-CATEGORY QUESTIONS
  // ----------------------------------------------------
  // Sub-questions for Project Help
  if (buttonId === "step2_ongoing_project") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Ongoing Project: What specific assistance do you require?",
      buttons: [
        { id: "final_track_status", title: "Track Progress" },
        { id: "final_scope_update", title: "Scope Update" },
        { id: "final_speak_manager", title: "Speak to Manager" }
      ]
    });
  }

  if (buttonId === "step2_milestone_payment") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Milestone Payment: What payment assistance do you need?",
      buttons: [
        { id: "final_release_payment", title: "Release Payment" },
        { id: "final_payment_error", title: "Payment Issue" },
        { id: "final_invoice_req", title: "Invoice Request" }
      ]
    });
  }

  if (buttonId === "step2_freelancer_issue") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Freelancer Issue: What freelancer assistance do you need?",
      buttons: [
        { id: "final_reassign_freelancer", title: "Reassign Developer" },
        { id: "final_quality_review", title: "Quality Review" },
        { id: "final_communication_issue", title: "Communication" }
      ]
    });
  }

  // Sub-questions for New Services
  if (buttonId === "step2_web_app") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Web or App Development: Select your project requirements:",
      buttons: [
        { id: "final_custom_website", title: "Custom Website" },
        { id: "final_mobile_app", title: "Mobile App" },
        { id: "final_fullstack_dev", title: "Full Stack System" }
      ]
    });
  }

  if (buttonId === "step2_ai_automation") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "AI & Automation: Select your AI requirements:",
      buttons: [
        { id: "final_ai_chatbot", title: "AI Chatbot" },
        { id: "final_ai_agents", title: "AI Agents / RAG" },
        { id: "final_workflow_auto", title: "Workflow Auto" }
      ]
    });
  }

  if (buttonId === "step2_design_seo") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Design & Marketing: Select your creative service requirement:",
      buttons: [
        { id: "final_ui_ux", title: "UI/UX Design" },
        { id: "final_branding", title: "Brand Identity" },
        { id: "final_seo_growth", title: "SEO & Growth" }
      ]
    });
  }

  // Sub-questions for Contact Team
  if (buttonId === "step2_urgent_support" || buttonId === "step2_general_inquiry" || buttonId === "step2_book_call") {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Thank you for reaching out. Our team has received your priority notification and will reach out to you quickly.",
      buttons: [
        { id: "btn_menu", title: "Main Menu" }
      ]
    });
  }

  // ----------------------------------------------------
  // 4. LEVEL 3: FINAL THANK YOU & TEAM REACH OUT CONFIRMATION
  // ----------------------------------------------------
  if (buttonId && buttonId.startsWith("final_")) {
    return sendWhatsappInteractiveMenu({
      to: fromPhone,
      bodyText: "Thank you for providing details. Your request has been recorded and our team will reach out to you quickly.",
      buttons: [
        { id: "btn_menu", title: "Main Menu" }
      ]
    });
  }

  // ----------------------------------------------------
  // 5. DYNAMIC AI CONVERSATION (FOR ANY OTHER FREEFORM TEXT)
  // ----------------------------------------------------
  const recentMsgs = await prisma.whatsAppMessage.findMany({
    where: { fromPhone },
    orderBy: { createdAt: "desc" },
    take: 6
  }).catch(() => []);

  const history = recentMsgs.reverse().map((m) => ({
    role: m.direction === "INBOUND" ? "user" : "assistant",
    text: m.body
  }));

  // Try AI model response first
  let aiReply = await generateAiChatbotResponse(userText || buttonId || "Hi", history);

  // If AI is empty or failed, fallback to team reach out message
  if (!aiReply || aiReply.includes("Thank you for contacting Catalance")) {
    aiReply = "Thank you for reaching out to Catalance. Your message has been received and our team will reach out to you quickly.";
  }

  return sendWhatsappInteractiveMenu({
    to: fromPhone,
    bodyText: aiReply,
    buttons: [
      { id: "btn_menu", title: "Main Menu" }
    ]
  });
};



