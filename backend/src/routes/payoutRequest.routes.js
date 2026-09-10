import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import {
  getFreelancerPaymentDetails,
  updateFreelancerPaymentDetails,
  createPayoutRequest,
  getMyPayoutRequests,
  getAdminPayoutRequests,
  updateAdminPayoutRequestStatus
} from "../controllers/payoutRequest.controller.js";

const router = Router();

// Freelancer routes
router.get("/details", requireAuth, getFreelancerPaymentDetails);
router.put("/details", requireAuth, updateFreelancerPaymentDetails);
router.post("/request", requireAuth, createPayoutRequest);
router.get("/request/my", requireAuth, getMyPayoutRequests);

// Admin routes
router.get("/admin/payout-requests", requireAuth, getAdminPayoutRequests);
router.patch("/admin/payout-requests/:id/status", requireAuth, updateAdminPayoutRequestStatus);

export const payoutRequestRouter = router;
