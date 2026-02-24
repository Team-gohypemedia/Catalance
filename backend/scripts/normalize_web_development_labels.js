import { prisma } from "../src/lib/prisma.js";

const WEB_DEVELOPMENT_LABEL = "Web Development";

const normalizeServiceIdentifier = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const WEB_DEVELOPMENT_IDENTIFIERS = new Set([
  "website_ui_ux",
  "website_uiux",
  "websiteuiux",
  "website_ui_ux_design",
  "website_ui_ux_design_2d_3d",
  "web_development"
]);

const isWebDevelopmentValue = (value = "") =>
  WEB_DEVELOPMENT_IDENTIFIERS.has(normalizeServiceIdentifier(value));

const normalizeServiceTitle = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isWebDevelopmentValue(raw)) return WEB_DEVELOPMENT_LABEL;
  return raw;
};

const normalizeWorkExperienceTitle = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const onboardingMatch = raw.match(/^(.*?)(\s*-\s*onboarding)$/i);
  if (!onboardingMatch) {
    return normalizeServiceTitle(raw);
  }

  const base = normalizeServiceTitle(onboardingMatch[1]);
  return base ? `${base} - Onboarding` : raw;
};

const normalizeWorkExperienceEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return { changed: false, next: entries };
  }

  let changed = false;
  const next = entries.map((entry) => {
    if (typeof entry === "string") {
      const normalized = normalizeWorkExperienceTitle(entry);
      if (normalized !== entry) changed = true;
      return normalized;
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const currentTitle = String(entry.title || "");
    const normalizedTitle = normalizeWorkExperienceTitle(currentTitle);
    if (normalizedTitle !== currentTitle) changed = true;
    return {
      ...entry,
      title: normalizedTitle
    };
  });

  return { changed, next };
};

const detailScore = (detail) =>
  detail && typeof detail === "object" && !Array.isArray(detail)
    ? Object.keys(detail).length
    : 0;

const normalizeMarketplaceDetail = (detail, normalizedService) => {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return {};
  }

  const next = { ...detail };
  if (normalizedService) {
    next.title = normalizedService;
  }
  return next;
};

async function normalizeMarketplaceRows() {
  const rows = await prisma.marketplace.findMany({
    select: {
      id: true,
      freelancerId: true,
      service: true,
      serviceDetails: true
    },
    orderBy: [{ freelancerId: "asc" }, { createdAt: "asc" }]
  });

  let updated = 0;
  let deleted = 0;

  const grouped = new Map();
  rows.forEach((row) => {
    const list = grouped.get(row.freelancerId) || [];
    list.push(row);
    grouped.set(row.freelancerId, list);
  });

  for (const [freelancerId, freelancerRows] of grouped.entries()) {
    const normalizedRows = freelancerRows.map((row) => {
      const currentService = String(row.service || "").trim();
      const detailTitle =
        row.serviceDetails &&
        typeof row.serviceDetails === "object" &&
        !Array.isArray(row.serviceDetails)
          ? String(row.serviceDetails.title || "").trim()
          : "";
      const normalizedService = normalizeServiceTitle(currentService || detailTitle || "Service");
      const normalizedDetails = normalizeMarketplaceDetail(
        row.serviceDetails,
        normalizedService
      );

      return {
        ...row,
        normalizedService,
        normalizedDetails
      };
    });

    const byService = new Map();
    normalizedRows.forEach((row) => {
      const key = row.normalizedService.toLowerCase();
      const existing = byService.get(key);
      if (!existing) {
        byService.set(key, row);
        return;
      }

      const existingScore = detailScore(existing.normalizedDetails);
      const rowScore = detailScore(row.normalizedDetails);
      if (rowScore > existingScore) {
        byService.set(key, row);
      }
    });

    await prisma.$transaction(async (tx) => {
      for (const row of normalizedRows) {
        const key = row.normalizedService.toLowerCase();
        const keeper = byService.get(key);
        const shouldDelete = keeper && keeper.id !== row.id;

        if (shouldDelete) {
          await tx.marketplace.delete({ where: { id: row.id } });
          deleted += 1;
          continue;
        }

        const currentService = String(row.service || "").trim();
        const currentDetails =
          row.serviceDetails &&
          typeof row.serviceDetails === "object" &&
          !Array.isArray(row.serviceDetails)
            ? row.serviceDetails
            : {};
        const shouldUpdateService = row.normalizedService !== currentService;
        const shouldUpdateDetails =
          JSON.stringify(row.normalizedDetails) !== JSON.stringify(currentDetails);

        if (!shouldUpdateService && !shouldUpdateDetails) {
          continue;
        }

        await tx.marketplace.update({
          where: { id: row.id },
          data: {
            service: row.normalizedService,
            serviceDetails: row.normalizedDetails
          }
        });
        updated += 1;
      }
    });

    console.log(
      `[Label Normalize] Processed marketplace rows for freelancer ${freelancerId}.`
    );
  }

  return { updated, deleted };
}

async function normalizeFreelancerProjectRows() {
  const rows = await prisma.freelancerProject.findMany({
    select: { id: true, serviceName: true }
  });

  let updated = 0;
  for (const row of rows) {
    const current = String(row.serviceName || "").trim();
    if (!current) continue;
    const normalized = normalizeServiceTitle(current);
    if (!normalized || normalized === current) continue;

    await prisma.freelancerProject.update({
      where: { id: row.id },
      data: { serviceName: normalized }
    });
    updated += 1;
  }

  return { updated };
}

async function normalizeUserWorkExperience() {
  const users = await prisma.user.findMany({
    select: { id: true, workExperience: true }
  });

  let updated = 0;
  for (const user of users) {
    const { changed, next } = normalizeWorkExperienceEntries(user.workExperience);
    if (!changed) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { workExperience: next }
    });
    updated += 1;
  }

  return { updated };
}

async function normalizeProfileWorkExperience() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, workExperience: true }
  });

  let updated = 0;
  for (const profile of profiles) {
    const { changed, next } = normalizeWorkExperienceEntries(profile.workExperience);
    if (!changed) continue;

    await prisma.profile.update({
      where: { id: profile.id },
      data: { workExperience: next }
    });
    updated += 1;
  }

  return { updated };
}

async function run() {
  console.log("[Label Normalize] Starting Web Development normalization...");

  const marketplace = await normalizeMarketplaceRows();
  const freelancerProjects = await normalizeFreelancerProjectRows();
  const users = await normalizeUserWorkExperience();
  const profiles = await normalizeProfileWorkExperience();

  console.log(
    `[Label Normalize] Done. Marketplace updated: ${marketplace.updated}, duplicates removed: ${marketplace.deleted}, ` +
      `Freelancer projects updated: ${freelancerProjects.updated}, users updated: ${users.updated}, profiles updated: ${profiles.updated}.`
  );
}

run()
  .catch((error) => {
    console.error("[Label Normalize] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
