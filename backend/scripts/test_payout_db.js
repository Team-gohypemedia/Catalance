import { prisma } from "../src/lib/prisma.js";

async function test() {
  try {
    const profile = await prisma.freelancerProfile.findFirst({
      select: { userId: true, paymentDetails: true }
    });
    console.log("FreelancerProfile paymentDetails query success! Sample:", profile);

    const requests = await prisma.payoutRequest.findMany({ take: 5 });
    console.log("PayoutRequest findMany query success! Sample count:", requests.length);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
