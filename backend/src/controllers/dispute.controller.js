import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

export const createDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const { description, projectId, meetingDate } = req.body;

  if (!description || !projectId) {
    throw new AppError("Description and Project ID are required", 400);
  }

  // Transaction to handle availability booking and dispute creation atomically
  const dispute = await prisma.$transaction(async (tx) => {
    let managerId = undefined;
    let availabilityId = undefined;

    // Automatic PM Assignment Logic
    if (meetingDate) {
      const dateObj = new Date(meetingDate);
      if (isNaN(dateObj.getTime())) {
        throw new AppError("Invalid meeting date format", 400);
      }

      // We need to match the date and hour logic used in getAvailability
      // Start of day for the date query
      const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
      const startHour = dateObj.getHours();

      // Find available PMs for this specific slot
      const availableSlots = await tx.managerAvailability.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          startHour: startHour,
          isBooked: false
        }
      });

      if (availableSlots.length === 0) {
        throw new AppError("The selected time slot is no longer available. Please choose another time.", 409);
      }

      // Randomly select one available PM
      const randomIndex = Math.floor(Math.random() * availableSlots.length);
      const selectedSlot = availableSlots[randomIndex];
      
      managerId = selectedSlot.managerId;
      availabilityId = selectedSlot.id;

      // Mark the slot as booked
      await tx.managerAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true }
      });
    }

    // Create the dispute
    return await tx.dispute.create({
      data: {
        description,
        projectId,
        raisedById: userId,
        status: "OPEN",
        meetingDate: meetingDate ? new Date(meetingDate) : undefined,
        managerId: managerId // Assign the selected PM
      }
    });
  });

  res.status(201).json({ data: dispute });
});

export const listDisputes = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 401);
  }

  let where = {};
  if (user.role === "PROJECT_MANAGER" || user.role === "ADMIN") {
    // PM sees all
  } else {
    // User sees only their raised disputes
    where = { raisedById: userId };
  }

  const disputes = await prisma.dispute.findMany({
    where,
    include: {
      project: {
        include: {
          owner: true,
          proposals: {
            where: { status: 'ACCEPTED' },
            include: {
              freelancer: true
            }
          }
        }
      },
      raisedBy: true,
      manager: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: disputes });
});

export const getDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      project: true,
      raisedBy: true,
      manager: true
    }
  });

  if (!dispute) throw new AppError("Dispute not found", 404);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 401);

  if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN' && dispute.raisedById !== userId) {
    throw new AppError("Access denied", 403);
  }

  res.json({ data: dispute });
});

export const updateDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params;
  const { status, resolutionNotes, meetingLink, meetingDate } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 401);

  if (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN') {
    throw new AppError("Only Project Managers can update disputes", 403);
  }

  // Sanitize updates
  const data = {};
  if (status !== undefined) data.status = status;
  if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;
  if (meetingLink !== undefined) data.meetingLink = meetingLink;
  if (meetingDate !== undefined) data.meetingDate = meetingDate;

  // Optionally auto-assign if manager touches it
  // Check if already has manager
  const currentDispute = await prisma.dispute.findUnique({ where: { id } });
  if (!currentDispute) throw new AppError("Dispute not found", 404);

  if (!currentDispute.managerId) {
    data.managerId = userId;
  }

  const dispute = await prisma.dispute.update({
    where: { id },
    data
  });

  // Notify the manager if they were just assigned (and didn't assign themselves)
  if (data.managerId && data.managerId !== userId) {
    try {
      await sendNotificationToUser(data.managerId, {
        type: "project_assigned",
        title: "New Project Assignment",
        message: `You have been assigned to manage a dispute for project ID: ${currentDispute.projectId}`,
        data: {
          disputeId: dispute.id,
          projectId: currentDispute.projectId
        }
      });
    } catch (error) {
      console.error("Failed to send assignment notification:", error);
    }
  }

  res.json({ data: dispute });
});

export const reassignFreelancer = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { id } = req.params; // disputeId
  const { newFreelancerId } = req.body;

  if (!newFreelancerId) throw new AppError("New freelancer ID is required", 400);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN')) {
    throw new AppError("Access denied", 403);
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          proposals: { where: { status: 'ACCEPTED' } }
        }
      }
    }
  });

  if (!dispute) throw new AppError("Dispute not found", 404);

  const newFreelancer = await prisma.user.findUnique({ where: { id: newFreelancerId } });
  if (!newFreelancer) throw new AppError("Freelancer not found", 404);

  // Transaction to atomic update
  await prisma.$transaction(async (tx) => {
    // 1. Terminate/Reject existing accepted proposals
    if (dispute.project.proposals.length > 0) {
      await tx.proposal.updateMany({
        where: {
          projectId: dispute.projectId,
          status: 'ACCEPTED'
        },
        data: {
          status: 'REJECTED' // Or a specific status if available
        }
      });
    }

    // 2. Create new accepted proposal for new freelancer
    const originalProposal = dispute.project.proposals[0];
    await tx.proposal.create({
      data: {
        projectId: dispute.projectId,
        freelancerId: newFreelancerId,
        amount: originalProposal ? originalProposal.amount : (dispute.project.budget || 0),
        coverLetter: "Reassigned by Project Manager via Dispute Resolution",
        status: 'ACCEPTED'
      }
    });

    // 3. Update dispute resolution notes if needed
    await tx.dispute.update({
      where: { id },
      data: {
        resolutionNotes: (dispute.resolutionNotes || "") + `\n[System]: Reassigned to ${newFreelancer.fullName} (${newFreelancer.email}).`,
        status: 'RESOLVED' // Auto-resolve? Maybe optional, but user implied "after meeting done... assign"
      }
    });
  });

  res.json({ message: "Project reassigned successfully" });
});

export const getAvailability = asyncHandler(async (req, res) => {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.error("Prisma client is not initialized!");
      return res.status(500).json({ error: "Database not available" });
    }

    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    console.log("=== getAvailability called ===");
    console.log("Input date:", date);

    // Parse the incoming date - client sends UTC timestamp
    const queryDate = new Date(date);
    console.log("Parsed queryDate:", queryDate.toISOString());
    
    // For IST (+5:30), when user picks Dec 27th, it becomes Dec 26 18:30 UTC
    // So if UTC hour >= 18, add a day to get the intended date
    let targetDate = new Date(queryDate);
    if (queryDate.getUTCHours() >= 18) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }
    const targetDateStr = targetDate.toISOString().split('T')[0]; // "2025-12-27"
    console.log("Target date string:", targetDateStr);

    // Get ALL unbooked availability slots from DB
    console.log("About to query managerAvailability...");
    const allSlots = await prisma.managerAvailability.findMany({
      where: { isBooked: false }
    });
    console.log("Total unbooked slots from DB:", allSlots.length);

    // Filter by date in JavaScript (to avoid Prisma @db.Date issues)
    const matchingSlots = allSlots.filter(slot => {
      const slotDateStr = slot.date.toISOString().split('T')[0];
      return slotDateStr === targetDateStr;
    });
    console.log("Matching slots for target date:", matchingSlots.length);

    if (matchingSlots.length === 0) {
      console.log("No matching slots found, returning empty array");
      return res.json({ data: [] });
    }

    // Get booked hours from disputes
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);
    
    const disputes = await prisma.dispute.findMany({
      where: {
        meetingDate: { gte: startOfDay, lte: endOfDay },
        status: { not: "RESOLVED" }
      }
    });
    console.log("Disputes on that day:", disputes.length);
    
    const bookedHours = new Set(disputes.map(d => d.meetingDate?.getUTCHours()));

    // Format to 12-hour time strings
    const seen = new Set();
    const result = [];
    
    matchingSlots
      .filter(s => !bookedHours.has(s.startHour))
      .sort((a, b) => a.startHour - b.startHour)
      .forEach(slot => {
        if (!seen.has(slot.startHour)) {
          seen.add(slot.startHour);
          const h = slot.startHour;
          const period = h >= 12 ? 'PM' : 'AM';
          const hour12 = h % 12 || 12;
          result.push(`${hour12.toString().padStart(2, '0')}:00 ${period}`);
        }
      });

    console.log("Final result:", result);
    res.json({ data: result });
  } catch (error) {
    console.error("=== getAvailability ERROR ===");
    console.error(error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

