import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CATEGORY_ALIAS_MAP = new Map([
  ["web_dev", "web_development"],
  ["web-development", "web_development"],
  ["webdevelopment", "web_development"],
  ["app_dev", "app_development"],
  ["app-development", "app_development"],
  ["appdevelopment", "app_development"],
  ["ai", "ai_automation"],
  ["ai-automation", "ai_automation"],
  ["aiautomation", "ai_automation"],
  ["video-editing", "video_editing"],
  ["videoediting", "video_editing"],
  ["lead-generation", "lead_generation"],
  ["leadgeneration", "lead_generation"],
  ["performance-marketing", "performance_marketing"],
  ["performancemarketing", "performance_marketing"],
  ["email-marketing", "email_marketing"],
  ["emailmarketing", "email_marketing"],
  ["ugc-marketing", "ugc_marketing"],
  ["ugcmarketing", "ugc_marketing"],
  ["crm-erp", "crm_erp"],
  ["crmerp", "crm_erp"],
  ["voice-agent", "voice_agent"],
  ["voiceagent", "voice_agent"],
  ["customer-support", "customer_support"],
  ["customersupport", "customer_support"],
  ["public-relations", "public_relations"],
  ["publicrelations", "public_relations"],
]);

const normalizeSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeCategory = (value) => {
  const slug = normalizeSlug(value);
  if (!slug || slug === "all") return null;
  const compact = slug.replace(/[^a-z0-9]+/g, "");
  return CATEGORY_ALIAS_MAP.get(slug) || CATEGORY_ALIAS_MAP.get(compact) || slug;
};

const buildTier1BrowseWhere = (query) => {
  const andConditions = [
    {
      freelancer: {
        role: "FREELANCER",
        status: "ACTIVE",
        OR: [
          { freelancerProfile: { is: null } },
          { freelancerProfile: { is: { openToWork: true } } },
        ],
      },
    },
  ];
  return { AND: andConditions };
};

async function main() {
  const where = buildTier1BrowseWhere({});
  console.log("Where clause:", JSON.stringify(where, null, 2));

  const marketplaceRows = await prisma.marketplace.findMany({
    where,
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          status: true,
          freelancerProfile: {
            select: {
              openToWork: true,
            }
          }
        }
      }
    }
  });

  console.log(`Total marketplace rows matched: ${marketplaceRows.length}`);
  if (marketplaceRows.length > 0) {
    console.log("Sample matched row freelancer:", marketplaceRows[0].freelancer);
  }
}

main().finally(() => prisma.$disconnect());
