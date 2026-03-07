import { Router } from "express";
import { getMarketplace, getServiceById, getServiceReviews, createServiceReview } from "../controllers/marketplace.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/", getMarketplace);
marketplaceRouter.get("/:id", getServiceById);
marketplaceRouter.get("/:id/reviews", getServiceReviews);
marketplaceRouter.post("/:id/reviews", requireAuth, createServiceReview);
