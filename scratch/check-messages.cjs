const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessages() {
  const msgs = await prisma.whatsAppMessage.findMany();
  console.log("Database WhatsApp messages count:", msgs.length);
  console.log("Messages:", JSON.stringify(msgs, null, 2));
  await prisma.$disconnect();
}

checkMessages();
