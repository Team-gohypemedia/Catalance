import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

export const getMarketplace = asyncHandler(async (req, res) => {
  console.log(`[Marketplace] Request: ${req.originalUrl}`, req.query);
  try {
    const { q, category, minBudget, maxBudget, sort, page = "1", limit = "20" } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;

    // Build the base Prisma where clause for 'q' and 'category'
    let where = {};
    if (category) {
      where.serviceKey = category;
    }

    // To safely handle JSON filtering without risking Prisma JSON path errors on older/different PG setups,
    // we will fetch the potential matches first and filter the JSON budget in Node, then paginate.
    // This complies with constraints: fail-safe fallback without crashing if Prisma JSON filtering fails.

    let allResults = await prisma.marketplace.findMany({
      where,
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      // base sort to keep it consistent before Node-side sort
      orderBy: { createdAt: "desc" },
    });

    // 1. Node-side parsing and filtering for Budget and Search
    const minB = minBudget ? parseInt(minBudget, 10) : null;
    const maxB = maxBudget ? parseInt(maxBudget, 10) : null;
    const lowerQ = q ? q.toLowerCase() : null;

    const extractNumericPrice = (details) => {
      if (!details) return 0;
      if (details.minBudget !== undefined) return Number(details.minBudget);
      if (details.price !== undefined) return Number(details.price);

      const rangeStr = details.averageProjectPriceRange || details.priceRange || "";
      const match = String(rangeStr).match(/inr\s*([\d\.]+)\s*(lakhs?|k|thousands?)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const multiplierStr = match[2]?.toLowerCase() || "";
        if (multiplierStr.includes("lakh")) return val * 100000;
        if (multiplierStr.includes("k") || multiplierStr.includes("thousand")) return val * 1000;
        return val;
      }
      return 0;
    };

    allResults = allResults.filter((item) => {
      // Search term filtering
      if (lowerQ) {
        const matchService = item.service && item.service.toLowerCase().includes(lowerQ);
        const matchName = item.freelancer?.fullName && item.freelancer.fullName.toLowerCase().includes(lowerQ);
        if (!matchService && !matchName) return false;
      }

      // Budget filtering
      if (minB !== null || maxB !== null) {
        const details = item.serviceDetails || {};
        const itemPrice = extractNumericPrice(details);

        if (itemPrice === 0 && (minB !== null || maxB !== null)) {
          return false; // exclude if no price but filter requested
        }

        if (minB !== null && itemPrice < minB) return false;
        if (maxB !== null && itemPrice > maxB) return false;
      }

      return true;
    });

    // 2. Node-side sorting
    if (sort === "price_asc") {
      allResults.sort((a, b) => {
        const priceA = extractNumericPrice(a.serviceDetails);
        const priceB = extractNumericPrice(b.serviceDetails);
        return priceA - priceB;
      });
    } else if (sort === "price_desc") {
      allResults.sort((a, b) => {
        const priceA = extractNumericPrice(a.serviceDetails);
        const priceB = extractNumericPrice(b.serviceDetails);
        return priceB - priceA;
      });
    }
    // "newest" is already handled by the base Prisma orderBy createdAt desc. 

    // 3. Node-side pagination
    const total = allResults.length;
    const totalPages = Math.ceil(total / limitNumber);

    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;

    const paginatedData = allResults.slice(startIndex, endIndex);

    // 4. Map extra fields (bio, techStack) from generic serviceDetails JSON
    const mappedData = paginatedData.map(item => {
      const details = item.serviceDetails || {};
      let bio = details.bio || details.about || details.description || "";
      let techStack = details.techStack || details.stack || details.technologies || [];

      // Safe fallbacks for missing tech stacks to keep cards looking premium
      if (!techStack || techStack.length === 0) {
        if (item.serviceKey === "web_development") techStack = ["React", "Node"];
        else if (item.serviceKey === "app_development") techStack = ["React Native"];
        else if (item.serviceKey === "ai_automation") techStack = ["Python", "API", "LangChain"];
      }

      return {
        ...item,
        bio,
        techStack
      };
    });

    console.log(`[Marketplace] Returning ${mappedData.length} records out of total ${total}`);
    res.json({
      data: mappedData,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages,
    });
  } catch (error) {
    console.error(`[Marketplace Error]`, error);
    throw error;
  }
});
