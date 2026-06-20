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

const normalizeServiceKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const trimText = (value) => String(value || "").trim();

const toCatalogOptionValue = (id) => `catalog:${id}`;

const normalizeNamedItem = (value) => {
  const name = trimText(value?.name || value?.label || value?.value);
  if (!name) {
    return null;
  }

  const id = Number.isInteger(value?.id) ? value.id : Number.parseInt(value?.id, 10);
  return {
    id: Number.isInteger(id) && id > 0 ? id : null,
    name,
  };
};

const normalizeToolItems = (items) => {
  const seenNames = new Set();
  const normalized = [];

  for (const item of Array.isArray(items) ? items : []) {
    const nextItem = normalizeNamedItem(item);
    if (!nextItem) {
      continue;
    }

    const uniqueKey = nextItem.name.toLowerCase();
    if (seenNames.has(uniqueKey)) {
      throw new AppError(`Duplicate tool name "${nextItem.name}" is not allowed.`, 400);
    }
    seenNames.add(uniqueKey);
    normalized.push(nextItem);
  }

  return normalized;
};

const normalizeSubCategoryItems = (items) => {
  const seenNames = new Set();
  const normalized = [];

  for (const item of Array.isArray(items) ? items : []) {
    const nextItem = normalizeNamedItem(item);
    if (!nextItem) {
      continue;
    }

    const uniqueKey = nextItem.name.toLowerCase();
    if (seenNames.has(uniqueKey)) {
      throw new AppError(`Duplicate category name "${nextItem.name}" is not allowed.`, 400);
    }
    seenNames.add(uniqueKey);
    normalized.push({
      ...nextItem,
      tools: normalizeToolItems(item?.tools),
    });
  }

  return normalized;
};

const normalizeMarketplaceFiltersPayload = (value) => {
  const payload = isPlainObject(value) ? value : {};
  const seenServiceIds = new Set();
  const seenNicheNames = new Set();

  const services = [];
  for (const service of Array.isArray(payload.services) ? payload.services : []) {
    const serviceId = Number.isInteger(service?.id)
      ? service.id
      : Number.parseInt(service?.id, 10);

    if (!Number.isInteger(serviceId) || serviceId <= 0 || seenServiceIds.has(serviceId)) {
      continue;
    }

    seenServiceIds.add(serviceId);
    services.push({
      id: serviceId,
      key: normalizeServiceKey(service?.key || service?.name),
      name: trimText(service?.name),
      subCategories: normalizeSubCategoryItems(service?.subCategories),
    });
  }

  const niches = [];
  for (const niche of Array.isArray(payload.niches) ? payload.niches : []) {
    const nextNiche = normalizeNamedItem(niche);
    if (!nextNiche) {
      continue;
    }

    const uniqueKey = nextNiche.name.toLowerCase();
    if (seenNicheNames.has(uniqueKey)) {
      throw new AppError(`Duplicate niche name "${nextNiche.name}" is not allowed.`, 400);
    }
    seenNicheNames.add(uniqueKey);
    niches.push(nextNiche);
  }

  return { services, niches };
};

const serializeMarketplaceFilterData = ({ services, niches }) => {
  const filteredServices = services.filter(
    (service) => service.name !== "Influencer Marketing" && service.name !== "UGC Marketing" && service.name !== "AI Video Generation"
  );
  return {
    services: filteredServices.map((service) => {
      const displayName = service.name === "SEO" ? "SEO / GMB" : service.name;
      return {
        id: service.id,
        key: normalizeServiceKey(service.name),
        name: displayName,
        subCategories: (Array.isArray(service.subCategories) ? service.subCategories : []).map(
          (subCategory) => ({
            id: subCategory.id,
            name: subCategory.name,
            tools: (Array.isArray(subCategory.tools) ? subCategory.tools : []).map((tool) => ({
              id: tool.id,
              name: tool.name,
            })),
          }),
        ),
      };
    }),
    niches: niches.map((niche) => ({
      id: niche.id,
      name: niche.name,
    })),
  };
};

const loadMarketplaceFilterData = async () => {
  const [services, niches] = await Promise.all([
    prisma.marketplaceFilterService.findMany({
      select: {
        id: true,
        name: true,
        subCategories: {
          select: {
            id: true,
            name: true,
            tools: {
              select: {
                id: true,
                name: true,
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.marketplaceFilterNiche.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return serializeMarketplaceFilterData({ services, niches });
};

const applyMarketplaceFiltersToContent = (content, marketplaceFilters) => {
  const nextContent = JSON.parse(JSON.stringify(content || {}));
  const normalizedGlobal = isPlainObject(nextContent.global) ? nextContent.global : {};
  const normalizedServices = isPlainObject(nextContent.services) ? nextContent.services : {};

  const nicheOptions = (Array.isArray(marketplaceFilters?.niches) ? marketplaceFilters.niches : []).map(
    (niche) => ({
      value: niche.name,
      label: niche.name,
    }),
  );

  nextContent.global = {
    ...normalizedGlobal,
    caseStudy: {
      ...(normalizedGlobal.caseStudy || {}),
      fields: {
        ...(normalizedGlobal.caseStudy?.fields || {}),
        niche: {
          ...(normalizedGlobal.caseStudy?.fields?.niche || {}),
          options: nicheOptions,
        },
      },
    },
  };

  nextContent.services = { ...normalizedServices };

  for (const service of Array.isArray(marketplaceFilters?.services) ? marketplaceFilters.services : []) {
    const serviceKey = normalizeServiceKey(service.key || service.name);
    if (!serviceKey) {
      continue;
    }

    const categoryOptions = [];
    const skillSuggestionsByCategory = {};

    for (const subCategory of Array.isArray(service.subCategories) ? service.subCategories : []) {
      if (!subCategory?.id || !trimText(subCategory?.name)) {
        continue;
      }

      const optionValue = toCatalogOptionValue(subCategory.id);
      categoryOptions.push({
        value: optionValue,
        label: subCategory.name,
      });
      skillSuggestionsByCategory[optionValue] = (Array.isArray(subCategory.tools)
        ? subCategory.tools
        : []
      )
        .filter((tool) => trimText(tool?.name))
        .map((tool) => ({
          value: tool.name,
          label: tool.name,
        }));
    }

    const existingServiceContent = isPlainObject(nextContent.services?.[serviceKey])
      ? nextContent.services[serviceKey]
      : {};

    nextContent.services[serviceKey] = {
      ...existingServiceContent,
      serviceInfo: {
        ...(existingServiceContent.serviceInfo || {}),
        fields: {
          ...(existingServiceContent.serviceInfo?.fields || {}),
          categories: {
            ...(existingServiceContent.serviceInfo?.fields?.categories || {}),
            options: categoryOptions,
            skillSuggestionsByCategory,
          },
        },
      },
      caseStudy: {
        ...(existingServiceContent.caseStudy || {}),
        fields: {
          ...(existingServiceContent.caseStudy?.fields || {}),
          niche: {
            ...(existingServiceContent.caseStudy?.fields?.niche || {}),
            options: nicheOptions,
          },
        },
      },
    };
  }

  return nextContent;
};

const stripMarketplaceManagedContent = (content) => {
  const nextContent = JSON.parse(JSON.stringify(content || {}));

  if (isPlainObject(nextContent.global?.caseStudy?.fields?.niche)) {
    delete nextContent.global.caseStudy.fields.niche.options;
  }

  if (isPlainObject(nextContent.services)) {
    Object.keys(nextContent.services).forEach((serviceKey) => {
      const serviceContent = nextContent.services[serviceKey];
      if (!isPlainObject(serviceContent)) {
        return;
      }

      if (isPlainObject(serviceContent.serviceInfo?.fields?.categories)) {
        delete serviceContent.serviceInfo.fields.categories.options;
        delete serviceContent.serviceInfo.fields.categories.skillSuggestionsByCategory;
      }

      if (isPlainObject(serviceContent.caseStudy?.fields?.niche)) {
        delete serviceContent.caseStudy.fields.niche.options;
      }
    });
  }

  return nextContent;
};

const syncMarketplaceFilters = async (marketplaceFilters) => {
  const normalized = normalizeMarketplaceFiltersPayload(marketplaceFilters);

  await prisma.$transaction(async (tx) => {
    const existingServices = await tx.marketplaceFilterService.findMany({
      select: {
        id: true,
        subCategories: {
          select: {
            id: true,
            name: true,
            tools: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const existingServiceMap = new Map(existingServices.map((service) => [service.id, service]));

    for (const service of normalized.services) {
      const existingService = existingServiceMap.get(service.id);
      if (!existingService) {
        continue;
      }

      const existingSubCategoryMap = new Map(
        existingService.subCategories.map((subCategory) => [subCategory.id, subCategory]),
      );
      const keptSubCategoryIds = new Set();

      for (const subCategory of service.subCategories) {
        let subCategoryId = subCategory.id;

        if (subCategoryId && existingSubCategoryMap.has(subCategoryId)) {
          keptSubCategoryIds.add(subCategoryId);
          const existingSubCategory = existingSubCategoryMap.get(subCategoryId);
          if (existingSubCategory?.name !== subCategory.name) {
            await tx.marketplaceFilterSubCategory.update({
              where: { id: subCategoryId },
              data: { name: subCategory.name },
            });
          }
        } else {
          const createdSubCategory = await tx.marketplaceFilterSubCategory.create({
            data: {
              serviceId: service.id,
              name: subCategory.name,
            },
            select: { id: true },
          });
          subCategoryId = createdSubCategory.id;
          keptSubCategoryIds.add(subCategoryId);
        }

        const existingTools = existingSubCategoryMap.get(subCategory.id)?.tools || [];
        const existingToolMap = new Map(existingTools.map((tool) => [tool.id, tool]));
        const keptToolIds = new Set();

        for (const tool of subCategory.tools) {
          let toolId = tool.id;

          if (toolId && existingToolMap.has(toolId)) {
            keptToolIds.add(toolId);
            const existingTool = existingToolMap.get(toolId);
            if (existingTool?.name !== tool.name) {
              await tx.marketplaceFilterTool.update({
                where: { id: toolId },
                data: { name: tool.name },
              });
            }
          } else {
            const createdTool = await tx.marketplaceFilterTool.create({
              data: {
                subCategoryId,
                name: tool.name,
              },
              select: { id: true },
            });
            toolId = createdTool.id;
            keptToolIds.add(toolId);
          }
        }

        for (const existingTool of existingTools) {
          if (!keptToolIds.has(existingTool.id)) {
            await tx.marketplaceFilterTool.delete({
              where: { id: existingTool.id },
            });
          }
        }
      }

      for (const existingSubCategory of existingService.subCategories) {
        if (!keptSubCategoryIds.has(existingSubCategory.id)) {
          await tx.marketplaceFilterSubCategory.delete({
            where: { id: existingSubCategory.id },
          });
        }
      }
    }

    const existingNiches = await tx.marketplaceFilterNiche.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const existingNicheMap = new Map(existingNiches.map((niche) => [niche.id, niche]));
    const keptNicheIds = new Set();

    for (const niche of normalized.niches) {
      if (niche.id && existingNicheMap.has(niche.id)) {
        keptNicheIds.add(niche.id);
        const existingNiche = existingNicheMap.get(niche.id);
        if (existingNiche?.name !== niche.name) {
          await tx.marketplaceFilterNiche.update({
            where: { id: niche.id },
            data: { name: niche.name },
          });
        }
      } else {
        const createdNiche = await tx.marketplaceFilterNiche.create({
          data: { name: niche.name },
          select: { id: true },
        });
        keptNicheIds.add(createdNiche.id);
      }
    }

    for (const existingNiche of existingNiches) {
      if (!keptNicheIds.has(existingNiche.id)) {
        await tx.marketplaceFilterNiche.delete({
          where: { id: existingNiche.id },
        });
      }
    }
  });
};

const buildAdminResponse = async (content) => {
  const marketplaceFilters = await loadMarketplaceFilterData();

  return {
    ...content,
    availableServices: marketplaceFilters.services.map((service) => ({
      id: service.id,
      key: service.key,
      name: service.name,
    })),
    marketplaceFilters,
  };
};

export const getFreelancerOnboardingContent = asyncHandler(async (req, res) => {
  const serviceKey = normalizeServiceKey(req.query?.serviceKey);
  const [content, marketplaceFilters] = await Promise.all(
    serviceKey
      ? [
          getFreelancerOnboardingContentForService(serviceKey),
          loadMarketplaceFilterData(),
        ]
      : [loadFreelancerOnboardingContent(), loadMarketplaceFilterData()],
  );

  const serviceFilter = marketplaceFilters.services.find((service) => service.key === serviceKey);
  const mergedContent = serviceKey
    ? applyMarketplaceFiltersToContent(
        { global: content, services: { [serviceKey]: content } },
        { ...marketplaceFilters, services: serviceFilter ? [serviceFilter] : [] },
      ).services?.[serviceKey] || content
    : applyMarketplaceFiltersToContent(content, marketplaceFilters);

  if (serviceKey) {
    return res.json({ data: { serviceKey, content: mergedContent } });
  }

  return res.json({ data: mergedContent });
});

export const getAdminFreelancerOnboardingContent = asyncHandler(async (_req, res) => {
  const content = await loadFreelancerOnboardingContent();
  res.json({ data: await buildAdminResponse(content) });
});

export const updateAdminFreelancerOnboardingContent = asyncHandler(async (req, res) => {
  const global = isPlainObject(req.body?.global) ? req.body.global : null;
  const services = isPlainObject(req.body?.services) ? req.body.services : null;
  const marketplaceFilters = req.body?.marketplaceFilters;

  if (!global || !services) {
    throw new AppError("Both global and services objects are required.", 400);
  }

  try {
    if (marketplaceFilters !== undefined) {
      await syncMarketplaceFilters(marketplaceFilters);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === "P2003") {
      throw new AppError(
        "A category, skill, or niche cannot be deleted because it is already used by freelancer data.",
        409,
      );
    }

    throw error;
  }

  const content = await saveFreelancerOnboardingContent(
    stripMarketplaceManagedContent({ global, services }),
  );
  res.json({ data: await buildAdminResponse(content) });
});
