import { prisma } from "../lib/prisma.js";

const normalizeRequestName = (value = "") => String(value || "").trim().toLowerCase();

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const uniquePositiveIntegers = (values = []) => {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).reduce((accumulator, value) => {
    const normalizedValue = toPositiveInteger(value);
    if (!normalizedValue || seen.has(normalizedValue)) return accumulator;
    seen.add(normalizedValue);
    accumulator.push(normalizedValue);
    return accumulator;
  }, []);
};

const removeMatchingCustomSkill = (values = [], requestName = "") => {
  const normalizedRequestName = normalizeRequestName(requestName);
  let removed = false;
  const nextValues = (Array.isArray(values) ? values : []).filter((value) => {
    const shouldRemove = normalizeRequestName(value) === normalizedRequestName;
    if (shouldRemove) removed = true;
    return !shouldRemove;
  });
  return { nextValues, removed };
};

const promoteApprovedRequestInServiceDetail = ({
  serviceDetails,
  requestName,
  requestType,
  parentId,
  approvedEntityId,
}) => {
  if (!serviceDetails || typeof serviceDetails !== "object" || !Array.isArray(serviceDetails.subcategories)) {
    return { serviceDetails, modified: false };
  }

  const normalizedRequestName = normalizeRequestName(requestName);
  let modified = false;
  const nextSubcategories = serviceDetails.subcategories.map((subcategory) => {
    if (!subcategory || typeof subcategory !== "object") return subcategory;

    if (requestType === "category") {
      const isMatchingCustomCategory =
        Boolean(subcategory.isCustom) &&
        normalizeRequestName(
          subcategory.label ||
            subcategory.subCategoryLabel ||
            subcategory.name ||
            subcategory.subCategoryKey,
        ) === normalizedRequestName;

      if (!isMatchingCustomCategory) return subcategory;

      modified = true;
      return {
        ...subcategory,
        subCategoryId: approvedEntityId,
        subCategoryKey: `catalog:${approvedEntityId}`,
        label: requestName.trim(),
        isCustom: false,
        selectedToolIds: uniquePositiveIntegers(subcategory.selectedToolIds),
        customSkillNames: Array.isArray(subcategory.customSkillNames)
          ? subcategory.customSkillNames
          : [],
      };
    }

    if (requestType === "skill") {
      const subCategoryId = toPositiveInteger(subcategory.subCategoryId);
      const catalogKeyId = String(subcategory.subCategoryKey || "").match(/^catalog:(\d+)$/i)?.[1];
      const effectiveSubCategoryId = subCategoryId || toPositiveInteger(catalogKeyId);

      if (effectiveSubCategoryId !== toPositiveInteger(parentId)) return subcategory;

      const { nextValues: nextCustomSkillNames, removed } = removeMatchingCustomSkill(
        subcategory.customSkillNames,
        requestName,
      );
      if (!removed) return subcategory;

      modified = true;
      return {
        ...subcategory,
        selectedToolIds: uniquePositiveIntegers([
          ...(Array.isArray(subcategory.selectedToolIds) ? subcategory.selectedToolIds : []),
          approvedEntityId,
        ]),
        customSkillNames: nextCustomSkillNames,
      };
    }

    return subcategory;
  });

  if (!modified) {
    return { serviceDetails, modified: false };
  }

  const activeSkillCategory =
    requestType === "category" &&
    normalizeRequestName(serviceDetails.activeSkillCategory) === normalizedRequestName
      ? `catalog:${approvedEntityId}`
      : serviceDetails.activeSkillCategory;

  return {
    modified: true,
    serviceDetails: {
      ...serviceDetails,
      activeSkillCategory,
      subcategories: nextSubcategories,
    },
  };
};

const syncApprovedRequestToMarketplace = async ({
  userId,
  requestName,
  requestType,
  parentId,
  approvedEntityId,
}) => {
  const normalizedRequestName = normalizeRequestName(requestName);
  if (!userId || !normalizedRequestName || !requestType || !approvedEntityId) return;

  const marketplaces = await prisma.marketplace.findMany({
    where: { freelancerId: userId },
  });

  for (const marketplace of marketplaces) {
    const { serviceDetails, modified } = promoteApprovedRequestInServiceDetail({
      serviceDetails: marketplace.serviceDetails,
      requestName,
      requestType,
      parentId,
      approvedEntityId,
    });

    if (modified) {
      await prisma.marketplace.update({
        where: { id: marketplace.id },
        data: { serviceDetails },
      });
    }
  }

  const freelancerProfile = await prisma.freelancerProfile.findUnique({
    where: { userId },
  });

  const profileServiceDetails =
    freelancerProfile?.serviceDetails && typeof freelancerProfile.serviceDetails === "object"
      ? freelancerProfile.serviceDetails
      : null;

  if (!profileServiceDetails) return;

  let profileModified = false;
  const nextProfileServiceDetails = Object.entries(profileServiceDetails).reduce(
    (accumulator, [serviceKey, detail]) => {
      const result = promoteApprovedRequestInServiceDetail({
        serviceDetails: detail,
        requestName,
        requestType,
        parentId,
        approvedEntityId,
      });
      if (result.modified) profileModified = true;
      accumulator[serviceKey] = result.serviceDetails;
      return accumulator;
    },
    {},
  );

  if (profileModified) {
    await prisma.freelancerProfile.update({
      where: { userId },
      data: { serviceDetails: nextProfileServiceDetails },
    });
  }
};

/**
 * Freelancer-facing: Create a new pending user request (for a category or skill)
 */
export const createUserRequest = async (req, res) => {
  try {
    const { request, requestedType } = req.body;
    const userId = req.user.id;

    if (!request || typeof request !== "string") {
      return res.status(400).json({
        success: false,
        message: "Request string is required.",
      });
    }

    const normalizedName = request.trim().toLowerCase();

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Request string cannot be empty.",
      });
    }

    const normalizedRequestedType =
      requestedType && ["category", "skill", "niche"].includes(String(requestedType).toLowerCase())
        ? String(requestedType).toLowerCase()
        : null;

    // 1. Check if it already exists as the same requested type
    const existingCategory = await prisma.marketplaceFilterSubCategory.findFirst({
      where: { name: { equals: normalizedName, mode: "insensitive" } },
    });

    if ((!normalizedRequestedType || normalizedRequestedType === "category") && existingCategory) {
      return res.status(200).json({
        success: true,
        message: "This option already exists as a category.",
        data: {
          status: "EXISTS",
          existingType: "category",
          existingEntity: existingCategory,
        },
      });
    }

    // 2. Check if it already exists as the same requested type
    const existingTool = await prisma.marketplaceFilterTool.findFirst({
      where: { name: { equals: normalizedName, mode: "insensitive" } },
    });

    if ((!normalizedRequestedType || normalizedRequestedType === "skill") && existingTool) {
      return res.status(200).json({
        success: true,
        message: "This option already exists as a skill.",
        data: {
          status: "EXISTS",
          existingType: "skill",
          existingEntity: existingTool,
        },
      });
    }

    // 2.5 Check if it already exists as a niche
    const existingNiche = await prisma.marketplaceFilterNiche.findFirst({
      where: { name: { equals: normalizedName, mode: "insensitive" } },
    });

    if ((!normalizedRequestedType || normalizedRequestedType === "niche") && existingNiche) {
      return res.status(200).json({
        success: true,
        message: "This option already exists as a niche.",
        data: {
          status: "EXISTS",
          existingType: "niche",
          existingEntity: existingNiche,
        },
      });
    }

    // 3. Check for existing pending requests with the exact same normalized name
    const existingRequest = await prisma.userRequest.findFirst({
      where: {
        normalizedName,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return res.status(200).json({
        success: true,
        message: "This request is already pending review.",
        data: existingRequest,
      });
    }

    // 4. Create the new request
    const userRequest = await prisma.userRequest.create({
      data: {
        userId,
        request: request.trim(),
        normalizedName,
        status: "PENDING",
        requestedType: requestedType || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Request submitted for admin review.",
      data: userRequest,
    });
  } catch (error) {
    console.error("Error creating user request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit request. Please try again later.",
    });
  }
};

/**
 * Admin-facing: List user requests with optional filters
 */
export const listUserRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status && ["pending", "approved", "rejected"].includes(status.toLowerCase())) {
      where.status = status.toUpperCase();
    }

    const [requests, total] = await Promise.all([
      prisma.userRequest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          reviewedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.userRequest.count({ where }),
    ]);

    return res.json({
      success: true,
      data: requests,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error listing user requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user requests.",
    });
  }
};

/**
 * Admin-facing: Approve a request, turning it into an official category or skill
 */
export const approveUserRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestType, parentId } = req.body; // requestType: "category" or "skill", parentId: serviceId or subCategoryId
    const adminId = req.user.id;

    if (!requestType || !["category", "skill"].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing requestType. Must be 'category' or 'skill'.",
      });
    }

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Missing parentId. Required to associate the new entity.",
      });
    }

    // 1. Find the request
    const userRequest = await prisma.userRequest.findUnique({
      where: { id },
    });

    if (!userRequest) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (userRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request cannot be approved because its status is ${userRequest.status}.`,
      });
    }

    let approvedEntityId = null;

    // Run within a transaction so that if the entity creation fails, the status update rolls back
    await prisma.$transaction(async (tx) => {
      if (requestType === "category") {
        // Create as MarketplaceFilterSubCategory under the given Service
        // First check if the service exists
        const service = await tx.marketplaceFilterService.findUnique({
          where: { id: Number(parentId) },
        });

        if (!service) {
          throw new Error("The specified parent Service does not exist.");
        }

        // Check for duplicates within this service (though our pre-check should cover this, it's good practice)
        const existing = await tx.marketplaceFilterSubCategory.findFirst({
          where: {
            serviceId: Number(parentId),
            name: { equals: userRequest.request.trim(), mode: "insensitive" },
          },
        });

        if (existing) {
          throw new Error("This category already exists under the selected service.");
        }

        const newCategory = await tx.marketplaceFilterSubCategory.create({
          data: {
            name: userRequest.request.trim(),
            serviceId: Number(parentId),
          },
        });
        approvedEntityId = newCategory.id;

      } else if (requestType === "skill") {
        // Create as MarketplaceFilterTool under the given SubCategory
        // First check if the subcategory exists
        const subcategory = await tx.marketplaceFilterSubCategory.findUnique({
          where: { id: Number(parentId) },
        });

        if (!subcategory) {
          throw new Error("The specified parent Category does not exist.");
        }

        const existing = await tx.marketplaceFilterTool.findFirst({
          where: {
            subCategoryId: Number(parentId),
            name: { equals: userRequest.request.trim(), mode: "insensitive" },
          },
        });

        if (existing) {
          throw new Error("This skill already exists under the selected category.");
        }

        const newSkill = await tx.marketplaceFilterTool.create({
          data: {
            name: userRequest.request.trim(),
            subCategoryId: Number(parentId),
          },
        });
        approvedEntityId = newSkill.id;
      }

      // Update the request status
      await tx.userRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          approvedAsType: requestType,
          approvedEntityId: approvedEntityId,
        },
      });
    });

    await syncApprovedRequestToMarketplace({
      userId: userRequest.userId,
      requestName: userRequest.request,
      requestType,
      parentId,
      approvedEntityId,
    });

    return res.json({
      success: true,
      message: `Request approved and added as a ${requestType}.`,
      data: {
        approvedAsType: requestType,
        approvedEntityId,
      },
    });
  } catch (error) {
    console.error("Error approving user request:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve request.",
    });
  }
};

/**
 * Admin-facing: Reject a request
 */
export const rejectUserRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user.id;

    const userRequest = await prisma.userRequest.findUnique({
      where: { id },
    });

    if (!userRequest) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (userRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request cannot be rejected because its status is ${userRequest.status}.`,
      });
    }

    const updated = await prisma.userRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNote: adminNote || null,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    // Remove the rejected item from the user's services
    try {
      const requestStr = userRequest.request;
      const marketplaces = await prisma.marketplace.findMany({
        where: { freelancerId: userRequest.userId },
      });

      for (const mp of marketplaces) {
        if (mp.serviceDetails && Array.isArray(mp.serviceDetails.subcategories)) {
          let modified = false;
          
          const nextSubcategories = mp.serviceDetails.subcategories.filter(sub => {
            if (sub.isCustom && sub.subCategoryKey.toLowerCase() === requestStr.toLowerCase()) {
              modified = true;
              return false;
            }
            return true;
          });

          for (const sub of nextSubcategories) {
            if (Array.isArray(sub.customSkillNames)) {
              const originalLength = sub.customSkillNames.length;
              sub.customSkillNames = sub.customSkillNames.filter(
                skill => skill.toLowerCase() !== requestStr.toLowerCase()
              );
              if (sub.customSkillNames.length !== originalLength) {
                modified = true;
              }
            }
          }

          if (modified) {
            await prisma.marketplace.update({
              where: { id: mp.id },
              data: {
                serviceDetails: {
                  ...mp.serviceDetails,
                  subcategories: nextSubcategories,
                }
              }
            });
          }
        }
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup rejected user request from marketplace:", cleanupError);
    }

    return res.json({
      success: true,
      message: "Request rejected.",
      data: updated,
    });
  } catch (error) {
    console.error("Error rejecting user request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject request.",
    });
  }
};
