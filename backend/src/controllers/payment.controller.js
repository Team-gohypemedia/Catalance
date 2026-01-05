import { prisma } from "../lib/prisma.js";

/**
 * Get all payments for a specific project
 */
export const getPaymentsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const payments = await prisma.payment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        freelancer: {
          select: { id: true, fullName: true, email: true, avatar: true }
        }
      }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching project payments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

/**
 * Get all payments for a specific freelancer
 */
export const getPaymentsByFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    
    const payments = await prisma.payment.findMany({
      where: { freelancerId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true, status: true }
        }
      }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching freelancer payments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

/**
 * Get current user's payments (for freelancers)
 */
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payments = await prisma.payment.findMany({
      where: { freelancerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true, status: true }
        }
      }
    });

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.freelancerAmount, 0);

    const totalPending = payments
      .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + p.freelancerAmount, 0);

    res.json({ 
      success: true, 
      data: {
        payments,
        totals: {
          paid: totalPaid,
          pending: totalPending
        }
      }
    });
  } catch (error) {
    console.error("Error fetching my payments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

/**
 * Create a new payment (Admin only)
 */
export const createPayment = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (currentUser?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can create payments" });
    }

    const { projectId, freelancerId, amount, description } = req.body;

    if (!projectId || !freelancerId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "projectId, freelancerId, and amount are required" 
      });
    }

    // Calculate platform fee (30%) and freelancer amount (70%)
    const platformFee = Math.round(amount * 0.3);
    const freelancerAmount = amount - platformFee;

    const payment = await prisma.payment.create({
      data: {
        projectId,
        freelancerId,
        amount,
        platformFee,
        freelancerAmount,
        description: description || null,
        status: "PENDING"
      },
      include: {
        project: { select: { id: true, title: true } },
        freelancer: { select: { id: true, fullName: true, email: true } }
      }
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ success: false, message: "Failed to create payment" });
  }
};

/**
 * Update payment status (Admin only)
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (currentUser?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can update payment status" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    const updateData = { status };
    
    // Set paidAt timestamp when marking as COMPLETED
    if (status === "COMPLETED") {
      updateData.paidAt = new Date();
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, title: true } },
        freelancer: { select: { id: true, fullName: true, email: true } }
      }
    });

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error("Error updating payment status:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    res.status(500).json({ success: false, message: "Failed to update payment" });
  }
};

/**
 * Get payment summary for a project (total paid to freelancer)
 */
export const getProjectPaymentSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { projectId },
      select: { status: true, freelancerAmount: true }
    });

    const totalPaid = payments
      .filter(p => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.freelancerAmount, 0);

    const totalPending = payments
      .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
      .reduce((sum, p) => sum + p.freelancerAmount, 0);

    res.json({ 
      success: true, 
      data: {
        totalPaid,
        totalPending,
        paymentCount: payments.length
      }
    });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment summary" });
  }
};
