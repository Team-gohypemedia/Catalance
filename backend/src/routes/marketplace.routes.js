import { Router } from "express";
import { getMarketplace } from "../controllers/marketplace.controller.js";

export const marketplaceRouter = Router();

marketplaceRouter.get("/", getMarketplace);
