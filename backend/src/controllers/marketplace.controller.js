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

export const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await prisma.marketplace.findUnique({
    where: { id },
    include: {
      freelancer: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          isVerified: true,
          freelancerProfile: true
        }
      }
    }
  });

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const reviewStats = await prisma.review.aggregate({
    where: { serviceId: id },
    _avg: { rating: true },
    _count: { id: true }
  });

  const averageRating = reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0;
  const reviewCount = reviewStats._count.id;

  res.json({
    data: {
      ...service,
      averageRating,
      reviewCount
    }
  });
});

export const getServiceReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limitNumber = parseInt(req.query.limit, 10) || 10;
  const pageNumber = parseInt(req.query.page, 10) || 1;
  const skip = (pageNumber - 1) * limitNumber;

  const reviews = await prisma.review.findMany({
    where: { serviceId: id },
    orderBy: { createdAt: "desc" },
    take: limitNumber,
    skip
  });

  const total = await prisma.review.count({ where: { serviceId: id } });

  res.json({
    data: reviews,
    total,
    page: pageNumber,
    limit: limitNumber,
    totalPages: Math.ceil(total / limitNumber)
  });
});

export const createServiceReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { clientName, rating, comment } = req.body;

  clientName = clientName?.trim();
  comment = comment?.trim();

  if (!clientName) throw new AppError("Client Name is required", 400);
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5", 400);
  }
  if (!comment || comment.length < 5) {
    throw new AppError("Comment must be at least 5 characters long", 400);
  }

  const service = await prisma.marketplace.findUnique({ where: { id } });
  if (!service) throw new AppError("Service not found", 404);

  const newReview = await prisma.review.create({
    data: {
      serviceId: id,
      clientName,
      rating,
      comment
    }
  });

  res.status(201).json({ data: newReview });
});
