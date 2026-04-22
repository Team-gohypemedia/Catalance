import { Router } from "express";
import {
  getMarketplace,
  getMarketplaceBrowse,
  getMarketplaceFilterNiches,
  getMarketplaceFilterServices,
  getMarketplaceFilterSubCategories,
  getMarketplaceFilterTools,
  getServicePositiveKeywords,
  getMarketplaceLiveProjects,
  getServiceById,
  getServiceReviews,
  getServiceReviewEligibility,
  createServiceReview,
  getFreelancerReceivedReviews,
} from "../controllers/marketplace.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/filters/services", getMarketplaceFilterServices);
marketplaceRouter.get("/filters/niches", getMarketplaceFilterNiches);
marketplaceRouter.get("/filters/sub-categories", getMarketplaceFilterSubCategories);
marketplaceRouter.get("/filters/tools", getMarketplaceFilterTools);
marketplaceRouter.get("/filters/keywords", getServicePositiveKeywords);
marketplaceRouter.get("/browse", getMarketplaceBrowse);
marketplaceRouter.get("/projects/live", requireAuth, getMarketplaceLiveProjects);
marketplaceRouter.get("/reviews/received", requireAuth, getFreelancerReceivedReviews);
marketplaceRouter.get("/", getMarketplace);
marketplaceRouter.get("/:id", getServiceById);
marketplaceRouter.get("/:id/reviews", getServiceReviews);
marketplaceRouter.get("/:id/reviews/eligibility", requireAuth, getServiceReviewEligibility);
marketplaceRouter.post("/:id/reviews", requireAuth, createServiceReview);
