import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import {
  getFreelancerOnboardingContentForService,
  loadFreelancerOnboardingContent,
  saveFreelancerOnboardingContent,
} from "../services/freelancerOnboardingContent.service.js";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const getFreelancerOnboardingContent = asyncHandler(async (req, res) => {
  const serviceKey = String(req.query?.serviceKey || "").trim().toLowerCase();

  if (serviceKey) {
    const content = await getFreelancerOnboardingContentForService(serviceKey);
    return res.json({ data: { serviceKey, content } });
  }

  const content = await loadFreelancerOnboardingContent();
  return res.json({ data: content });
});

export const getAdminFreelancerOnboardingContent = asyncHandler(async (_req, res) => {
  const [content, services] = await Promise.all([
    loadFreelancerOnboardingContent(),
    prisma.marketplaceFilterService.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  res.json({
    data: {
      ...content,
      availableServices: services.map((service) => ({
        id: service.id,
        key: String(service.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
        name: service.name,
      })),
    },
  });
});

export const updateAdminFreelancerOnboardingContent = asyncHandler(async (req, res) => {
  const global = isPlainObject(req.body?.global) ? req.body.global : null;
  const services = isPlainObject(req.body?.services) ? req.body.services : null;

  if (!global || !services) {
    throw new AppError("Both global and services objects are required.", 400);
  }

  const content = await saveFreelancerOnboardingContent({ global, services });
  res.json({ data: content });
});
