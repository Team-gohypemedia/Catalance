import { prisma } from "./src/lib/prisma.js";

async function checkMessages() {
  const msgs = await prisma.whatsAppMessage.findMany();
  console.log("==========================================");
  console.log("Database WhatsApp messages count:", msgs.length);
  console.log("Messages:", JSON.stringify(msgs, null, 2));
  console.log("==========================================");
  await prisma.$disconnect();
}

checkMessages();
