import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.marketplaceFilterService.findMany({
    select: { id: true, name: true },
  });

  const find = (name) => services.find((s) => s.name === name);

  const leadGen = find("Lead Generation");
  const writingContent = find("Writing & Content");
  const customerSupport = find("Customer Support");
  const influencerMarketing = find("Influencer Marketing");
  const ugcMarketing = find("UGC Marketing");
  const whatsappChatbot = find("WhatsApp Chatbot");
  const modeling3d = find("3D Modeling");
  const cgiVfx = find("CGI / VFX");
  const crmErp = find("CRM & ERP");
  const voiceAi = find("Voice AI / AI Calling");

  const keywordMap = {};

  if (leadGen) {
    keywordMap[leadGen.id] = [
      "B2B Leads", "B2C Leads", "Cold Email", "Cold Calling",
      "LinkedIn Outreach", "Lead Scraping", "Email Marketing",
      "Sales Funnel", "CRM Integration", "Appointment Setting",
      "Data Enrichment", "Lead Nurturing", "Outbound Marketing",
      "Demand Generation", "Contact List Building",
    ];
  }

  if (writingContent) {
    keywordMap[writingContent.id] = [
      "Blog Writing", "Copywriting", "Content Writing", "SEO Writing",
      "Article Writing", "Ghostwriting", "Technical Writing",
      "Product Description", "Email Copy", "Website Content",
      "Social Media Copy", "Press Release", "White Paper",
      "Case Study Writing", "Newsletter Writing",
    ];
  }

  if (customerSupport) {
    keywordMap[customerSupport.id] = [
      "Live Chat Support", "Email Support", "Phone Support",
      "Help Desk", "Ticketing System", "Customer Onboarding",
      "Knowledge Base", "SLA Management", "Zendesk", "Freshdesk",
      "Intercom", "Customer Retention", "Complaint Resolution",
      "24/7 Support", "Multilingual Support",
    ];
  }

  if (influencerMarketing) {
    keywordMap[influencerMarketing.id] = [
      "Instagram Influencer", "YouTube Influencer", "Micro Influencer",
      "Macro Influencer", "Influencer Outreach", "Campaign Management",
      "Brand Collaboration", "Influencer Database", "ROI Tracking",
      "Content Creator", "Sponsored Posts", "Affiliate Marketing",
      "Influencer Contracts", "Performance Metrics", "KOL Marketing",
    ];
  }

  if (ugcMarketing) {
    keywordMap[ugcMarketing.id] = [
      "User Generated Content", "UGC Video", "UGC Photos",
      "Product Reviews", "Testimonial Content", "Unboxing Videos",
      "Social Proof", "Customer Stories", "Brand Advocacy",
      "Content Repurposing", "TikTok UGC", "Instagram Reels",
      "Authentic Content", "Community Content", "UGC Strategy",
    ];
  }

  if (whatsappChatbot) {
    keywordMap[whatsappChatbot.id] = [
      "WhatsApp Business API", "Chatbot Development", "Automated Replies",
      "Broadcast Messages", "Customer Engagement", "Order Tracking",
      "Payment Integration", "Catalog Integration", "Multi-Agent Support",
      "WhatsApp Commerce", "Template Messages", "Interactive Messages",
      "Webhook Integration", "CRM Sync", "Lead Capture Bot",
    ];
  }

  if (modeling3d) {
    keywordMap[modeling3d.id] = [
      "3D Rendering", "3D Animation", "Product Visualization",
      "Architectural Rendering", "Character Modeling", "Environment Design",
      "Blender", "Maya", "3ds Max", "ZBrush", "Texturing",
      "Rigging", "Low Poly", "High Poly", "3D Printing Ready",
    ];
  }

  if (cgiVfx) {
    keywordMap[cgiVfx.id] = [
      "Visual Effects", "Compositing", "Green Screen",
      "Motion Tracking", "Particle Effects", "Matte Painting",
      "After Effects", "Nuke", "Houdini", "Cinema 4D",
      "CGI Animation", "Film VFX", "Commercial VFX",
      "Rotoscoping", "Color Correction",
    ];
  }

  if (crmErp) {
    keywordMap[crmErp.id] = [
      "Salesforce", "HubSpot", "Zoho CRM", "SAP", "Oracle ERP",
      "Microsoft Dynamics", "CRM Customization", "ERP Implementation",
      "Data Migration", "Workflow Automation", "Pipeline Management",
      "Inventory Management", "Supply Chain", "Business Intelligence",
      "Custom CRM Development",
    ];
  }

  if (voiceAi) {
    keywordMap[voiceAi.id] = [
      "AI Voice Agent", "Voice Bot", "IVR System", "Speech-to-Text",
      "Text-to-Speech", "Conversational AI", "Call Center Automation",
      "Voice Analytics", "Natural Language Understanding", "Voiceflow",
      "Dialogflow", "Twilio", "Asterisk", "Auto Dialer",
      "Voice Cloning",
    ];
  }

  let count = 0;
  for (const [serviceId, keywords] of Object.entries(keywordMap)) {
    for (const name of keywords) {
      await prisma.servicePositiveKeyword.upsert({
        where: {
          serviceId_name: { serviceId: Number(serviceId), name },
        },
        update: {},
        create: { serviceId: Number(serviceId), name },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} keywords across ${Object.keys(keywordMap).length} services.`);

  // Print summary of all services
  const allServices = await prisma.marketplaceFilterService.findMany({
    select: { id: true, name: true, _count: { select: { positiveKeywords: true } } },
    orderBy: { id: "asc" },
  });
  console.log("\nKeywords per service:");
  allServices.forEach((s) => {
    console.log(`  ${s.name}: ${s._count.positiveKeywords} keywords`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
