import { prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

/**
 * Get saved payment details for current freelancer
 */
export const getFreelancerPaymentDetails = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { paymentDetails: true }
    });

    res.json({
      success: true,
      data: profile?.paymentDetails || {}
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment details" });
  }
};

/**
 * Save or update payment details for current freelancer
 */
export const updateFreelancerPaymentDetails = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      upiId,
      upiQrCode,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      bankBranch
    } = req.body;

    const paymentDetails = {
      upiId: (upiId || "").trim(),
      upiQrCode: (upiQrCode || "").trim(),
      bankName: (bankName || "").trim(),
      accountNumber: (accountNumber || "").trim(),
      ifscCode: (ifscCode || "").trim().toUpperCase(),
      accountHolderName: (accountHolderName || "").trim(),
      bankBranch: (bankBranch || "").trim(),
      updatedAt: new Date().toISOString()
    };

    const updatedProfile = await prisma.freelancerProfile.upsert({
      where: { userId },
      update: { paymentDetails },
      create: {
        userId,
        paymentDetails
      },
      select: { paymentDetails: true }
    });

    res.json({
      success: true,
      data: updatedProfile.paymentDetails,
      message: "Payment details saved successfully"
    });
  } catch (error) {
    console.error("Error updating payment details:", error);
    res.status(500).json({ success: false, message: "Failed to save payment details" });
  }
};

/**
 * Submit a new payout / money request
 */
export const createPayoutRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { projectId, amount, notes } = req.body;
    const numericAmount = Math.round(Number(amount) || 0);

    if (numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid requested amount greater than zero"
      });
    }

    // Get current saved payment details
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { paymentDetails: true }
    });

    const paymentInfo = profile?.paymentDetails || {};

    if (!paymentInfo.upiId && !paymentInfo.accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Please fill in your payment details (UPI ID or Bank Account) before requesting money."
      });
    }

    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        freelancerId: userId,
        projectId: projectId || null,
        amount: numericAmount,
        notes: notes ? String(notes).trim() : null,
        upiId: paymentInfo.upiId || null,
        upiQrCode: paymentInfo.upiQrCode || null,
        bankName: paymentInfo.bankName || null,
        accountNumber: paymentInfo.accountNumber || null,
        ifscCode: paymentInfo.ifscCode || null,
        accountHolderName: paymentInfo.accountHolderName || null,
        bankBranch: paymentInfo.bankBranch || null,
        status: "PENDING"
      },
      include: {
        project: {
          select: { id: true, title: true }
        }
      }
    });

    // Notify admins about new payout request
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      });
      const freelancer = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true }
      });
      for (const admin of admins) {
        void sendNotificationToUser(admin.id, {
          type: "payout_request",
          title: "New Freelancer Payout Request",
          message: `${freelancer?.fullName || "A freelancer"} submitted a money request for Rs.${numericAmount.toLocaleString("en-IN")}.`,
          data: { requestId: payoutRequest.id }
        });
      }
    } catch (notifErr) {
      console.warn("Could not dispatch admin payout notification:", notifErr);
    }

    res.status(201).json({
      success: true,
      data: payoutRequest,
      message: "Money request submitted successfully. Admin will review and process your payout."
    });
  } catch (error) {
    console.error("Error creating payout request:", error);
    res.status(500).json({ success: false, message: "Failed to submit money request" });
  }
};

/**
 * Get current freelancer's payout requests
 */
export const getMyPayoutRequests = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const requests = await prisma.payoutRequest.findMany({
      where: { freelancerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching my payout requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch money requests" });
  }
};

/**
 * Get all payout requests for Admin Dashboard
 */
export const getAdminPayoutRequests = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (currentUser?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can view payout requests" });
    }

    const { status } = req.query;
    const where = {};
    if (status && ["PENDING", "APPROVED", "REJECTED", "PAID"].includes(String(status).toUpperCase())) {
      where.status = String(status).toUpperCase();
    }

    const requests = await prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        project: {
          select: { id: true, title: true }
        }
      }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching admin payout requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payout requests" });
  }
};

/**
 * Update payout request status (Admin only)
 */
export const updateAdminPayoutRequestStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (currentUser?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can update request status" });
    }

    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "PAID"];
    const upperStatus = String(status || "").toUpperCase();

    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const updateData = {
      status: upperStatus,
      adminNote: adminNote ? String(adminNote).trim() : null,
      processedAt: new Date()
    };

    const updatedRequest = await prisma.payoutRequest.update({
      where: { id },
      data: updateData,
      include: {
        freelancer: {
          select: { id: true, fullName: true, email: true }
        },
        project: {
          select: { id: true, title: true }
        }
      }
    });

    // If marked as PAID, sync with Payment model if applicable
    if (upperStatus === "PAID" && updatedRequest.projectId) {
      try {
        await prisma.payment.create({
          data: {
            projectId: updatedRequest.projectId,
            freelancerId: updatedRequest.freelancerId,
            amount: updatedRequest.amount,
            platformFee: 0,
            freelancerAmount: updatedRequest.amount,
            status: "COMPLETED",
            description: `Payout request ${updatedRequest.id} marked as PAID by Admin`,
            paidAt: new Date()
          }
        });
      } catch (paymentErr) {
        console.warn("Could not create linked Payment record:", paymentErr.message);
      }
    }

    // Notify freelancer about payout request status update
    try {
      const statusMessage = upperStatus === "PAID"
        ? `Your payout request for Rs.${updatedRequest.amount.toLocaleString("en-IN")} has been marked as PAID by Admin.`
        : upperStatus === "APPROVED"
          ? `Your payout request for Rs.${updatedRequest.amount.toLocaleString("en-IN")} has been APPROVED.`
          : upperStatus === "REJECTED"
            ? `Your payout request for Rs.${updatedRequest.amount.toLocaleString("en-IN")} was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`
            : `Your payout request status changed to ${upperStatus}.`;

      void sendNotificationToUser(updatedRequest.freelancerId, {
        type: "payout_request",
        title: `Payout Request ${upperStatus}`,
        message: statusMessage,
        data: { requestId: updatedRequest.id, status: upperStatus }
      });
    } catch (notifErr) {
      console.warn("Could not dispatch freelancer payout notification:", notifErr);
    }

    res.json({
      success: true,
      data: updatedRequest,
      message: `Payout request updated to ${upperStatus}`
    });
  } catch (error) {
    console.error("Error updating payout request status:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Payout request not found" });
    }
    res.status(500).json({ success: false, message: "Failed to update payout request" });
  }
};
