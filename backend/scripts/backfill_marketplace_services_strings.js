import { prisma } from "../src/lib/prisma.js";

const MARKETPLACE_SERVICE_TITLE_BY_KEY = {
  branding: "Branding",
  website_ui_ux: "Web Development",
  website_uiux: "Web Development",
  seo: "SEO",
  social_media_marketing: "Social Media Management",
  paid_advertising: "Performance Marketing / Paid Ads",
  app_development: "App Development",
  software_development: "Software Development",
  lead_generation: "Lead Generation",
  video_services: "Video Services",
  writing_content: "Writing & Content",
  customer_support: "Customer Support Services",
  influencer_marketing: "Influencer Marketing",
  ugc_marketing: "UGC Marketing",
  ai_automation: "AI Automation",
  whatsapp_chatbot: "WhatsApp Chatbot",
  creative_design: "Creative & Design",
  "3d_modeling": "3D Modeling",
  cgi_videos: "CGI Video Services",
  crm_erp: "CRM & ERP Solutions",
  voice_agent: "Voice Agent / AI Calling"
};

const normalizeMarketplaceServiceIdentifier = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toTitleCaseLabel = (value = "") =>
  String(value || "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const resolveMarketplaceServiceTitle = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const canonical = normalizeMarketplaceServiceIdentifier(raw);
  if (!canonical) return "";

  if (canonical === "web_development") {
    return "Web Development";
  }

  if (MARKETPLACE_SERVICE_TITLE_BY_KEY[canonical]) {
    return MARKETPLACE_SERVICE_TITLE_BY_KEY[canonical];
  }

  for (const title of Object.values(MARKETPLACE_SERVICE_TITLE_BY_KEY)) {
    if (normalizeMarketplaceServiceIdentifier(title) === canonical) {
      return title;
    }
  }

  return toTitleCaseLabel(raw);
};

const getServiceTitleFromDetail = (serviceDetails) => {
  if (!serviceDetails || typeof serviceDetails !== "object" || Array.isArray(serviceDetails)) {
    return "";
  }
  return String(serviceDetails.title || "").trim();
};

async function runBackfill() {
  console.log("[Marketplace Backfill] Loading rows...");
  const rows = await prisma.marketplace.findMany({
    select: {
      id: true,
      freelancerId: true,
      service: true,
      serviceDetails: true
    }
  });

  if (!rows.length) {
    console.log("[Marketplace Backfill] No marketplace rows found.");
    return;
  }

  let updatedCount = 0;
  let deletedCount = 0;
  const seenByFreelancer = new Map();

  for (const row of rows) {
    const fromServiceColumn = String(row.service || "").trim();
    const fromServiceDetail = getServiceTitleFromDetail(row.serviceDetails);
    const nextService = resolveMarketplaceServiceTitle(fromServiceColumn || fromServiceDetail || "Service");

    const dedupeKey = `${row.freelancerId}::${nextService.toLowerCase()}`;
    if (seenByFreelancer.has(dedupeKey)) {
      await prisma.marketplace.delete({
        where: { id: row.id }
      });
      deletedCount += 1;
      continue;
    }
    seenByFreelancer.set(dedupeKey, row.id);

    const unchanged = nextService === fromServiceColumn;
    if (unchanged) continue;

    await prisma.marketplace.update({
      where: { id: row.id },
      data: { service: nextService }
    });

    updatedCount += 1;
    console.log(
      `[Marketplace Backfill] Updated freelancer ${row.freelancerId}: ${nextService}`
    );
  }

  console.log(
    `[Marketplace Backfill] Completed. Updated ${updatedCount}/${rows.length} rows. Removed ${deletedCount} duplicates.`
  );
}

runBackfill()
  .catch((error) => {
    console.error("[Marketplace Backfill] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
