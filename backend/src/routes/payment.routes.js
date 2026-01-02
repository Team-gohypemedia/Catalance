import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import {
  getPaymentsByProject,
  getPaymentsByFreelancer,
  getMyPayments,
  createPayment,
  updatePaymentStatus,
  getProjectPaymentSummary
} from "../controllers/payment.controller.js";

const router = Router();

// Get payments for a project
router.get("/project/:projectId", requireAuth, getPaymentsByProject);

// Get payment summary for a project (for freelancer dashboard)
router.get("/project/:projectId/summary", requireAuth, getProjectPaymentSummary);

// Get payments for a specific freelancer (admin view)
router.get("/freelancer/:freelancerId", requireAuth, getPaymentsByFreelancer);

// Get current user's payments (freelancer)
router.get("/my", requireAuth, getMyPayments);

// Create a new payment (admin only)
router.post("/", requireAuth, createPayment);

// Update payment status (admin only)
router.patch("/:id/status", requireAuth, updatePaymentStatus);

export const paymentRouter = router;
