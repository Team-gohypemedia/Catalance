import { generateAiChatbotResponse } from "./src/services/whatsapp-bot.service.js";

async function testAi() {
  console.log("Testing OpenRouter AI call for WhatsApp Chatbot...");
  const reply = await generateAiChatbotResponse("What services do you offer for web development?", []);
  console.log("==========================================");
  console.log("AI Response Output:");
  console.log(reply);
  console.log("==========================================");
}

testAi();
