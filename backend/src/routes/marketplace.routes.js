import { Router } from "express";
import { getMarketplace, getServiceById, getServiceReviews, createServiceReview } from "../controllers/marketplace.controller.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/", getMarketplace);
marketplaceRouter.get("/:id", getServiceById);
marketplaceRouter.get("/:id/reviews", getServiceReviews);
marketplaceRouter.post("/:id/reviews", createServiceReview);
