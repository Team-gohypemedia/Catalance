import { Router } from "express";
import {
  getMarketplace,
  getMarketplaceBrowse,
  getMarketplaceFilterNiches,
  getMarketplaceFilterServices,
  getMarketplaceFilterSubCategories,
  getMarketplaceFilterTools,
  getMarketplaceLiveProjects,
  getServiceById,
  getServiceReviews,
  createServiceReview
} from "../controllers/marketplace.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/filters/services", getMarketplaceFilterServices);
marketplaceRouter.get("/filters/niches", getMarketplaceFilterNiches);
marketplaceRouter.get("/filters/sub-categories", getMarketplaceFilterSubCategories);
marketplaceRouter.get("/filters/tools", getMarketplaceFilterTools);
marketplaceRouter.get("/browse", getMarketplaceBrowse);
marketplaceRouter.get("/projects/live", requireAuth, getMarketplaceLiveProjects);
marketplaceRouter.get("/", getMarketplace);
marketplaceRouter.get("/:id", getServiceById);
marketplaceRouter.get("/:id/reviews", getServiceReviews);
marketplaceRouter.post("/:id/reviews", requireAuth, createServiceReview);
