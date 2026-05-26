import { Router } from "express";

import { getFreelancerOnboardingContent } from "../controllers/freelancerOnboardingContent.controller.js";

export const onboardingRouter = Router();

onboardingRouter.get("/freelancer-content", getFreelancerOnboardingContent);
