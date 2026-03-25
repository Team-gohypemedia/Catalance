import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { sendNotificationToUser } from "../lib/notification-util.js";

const PROJECT_MANAGER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  avatar: true,
  status: true,
  role: true
};

const findLeastLoadedActiveProjectManager = (dbClient) =>
  dbClient.user.findFirst({
    where: {
      role: "PROJECT_MANAGER",
      status: "ACTIVE"
    },
    orderBy: { managedProjects: { _count: "asc" } },
    select: PROJECT_MANAGER_SELECT
  });

export const createDispute = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401);

  const { description, projectId, meetingDate, meetingDateLocal, meetingHour } = req.body;

  if (!description || !projectId) {
    throw new AppError("Description and Project ID are required", 400);
  }

  // Transaction to handle availability booking and dispute creation atomically
  const dispute = await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
      include: {
        manager: {
          select: PROJECT_MANAGER_SELECT,
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const assignedActiveManagerId =
      project.manager?.role === "PROJECT_MANAGER" &&
        project.manager?.status === "ACTIVE"
        ? project.manager.id
        : undefined;

    let managerId = assignedActiveManagerId;
    let availabilityId = undefined;

    if (!assignedActiveManagerId && !meetingDate) {
      const fallbackManager = await findLeastLoadedActiveProjectManager(tx);
      managerId = fallbackManager?.id;
    }

    // Automatic PM Assignment Logic
    if (meetingDate) {
      const dateObj = new Date(meetingDate);
      if (isNaN(dateObj.getTime())) {
        throw new AppError("Invalid meeting date format", 400);
      }

      const dateKey =
        typeof meetingDateLocal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meetingDateLocal)
          ? meetingDateLocal
          : meetingDate.slice(0, 10);

      const [year, month, day] = dateKey.split("-").map(Number);
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      const parsedMeetingHour = Number(meetingHour);
      let startHour = Number.isInteger(parsedMeetingHour)
        ? parsedMeetingHour
        : dateObj.getHours();
      if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
        throw new AppError("Invalid meeting hour", 400);
      }

      // Find available PMs for this specific slot
      const availableSlots = await tx.managerAvailability.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          startHour: startHour,
          isBooked: false,
          isEnabled: true,
          ...(assignedActiveManagerId ? { managerId: assignedActiveManagerId } : {}),
          manager: {
            role: "PROJECT_MANAGER",
            status: "ACTIVE",
          },
        },
      });

      if (availableSlots.length === 0) {
        throw new AppError("The selected time slot is no longer available. Please choose another time.", 409);
      }

      // If project already has an active assigned PM, use their slot.
      // Otherwise choose among active managers with free slots.
      const selectedSlot = assignedActiveManagerId
        ? availableSlots[0]
        : availableSlots[Math.floor(Math.random() * availableSlots.length)];

      managerId = selectedSlot.managerId;
      availabilityId = selectedSlot.id;

      // Mark the slot as booked
      await tx.managerAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true }
      });
    }

    if (managerId && project.managerId !== managerId) {
      await tx.project.update({
        where: { id: projectId },
        data: { managerId }
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
  if (user.role === "PROJECT_MANAGER") {
    // Project Managers should only see disputes assigned to them
    where = { managerId: userId };
  } else if (user.role === "ADMIN") {
    // Admin sees all disputes
    // no where clause
  } else {
    // Regular users see only their raised disputes
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
  const currentDispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          owner: true,
          proposals: {
            where: { status: 'ACCEPTED' },
            include: { freelancer: true }
          }
        }
      }
    }
  });
  if (!currentDispute) throw new AppError("Dispute not found", 404);

  if (!currentDispute.managerId) {
    data.managerId = userId;
  }

  const activeManagerId = data.managerId || currentDispute.managerId;

  // Conflict prevention for meeting reschedules
  if (data.meetingDate) {
    const newMeetingDate = new Date(data.meetingDate);
    if (isNaN(newMeetingDate.getTime())) throw new AppError("Invalid meeting date", 400);

    const startWindow = new Date(newMeetingDate.getTime() - 45 * 60 * 1000); // 45 min buffer
    const endWindow = new Date(newMeetingDate.getTime() + 45 * 60 * 1000);

    // Check for conflicting disputes
    const conflictingDispute = await prisma.dispute.findFirst({
      where: {
        managerId: activeManagerId,
        id: { not: id },
        status: { notIn: ["RESOLVED"] },
        meetingDate: {
          gte: startWindow,
          lte: endWindow
        }
      }
    });

    if (conflictingDispute) {
      throw new AppError("Conflict: You already have another dispute meeting scheduled too close to this time.", 409);
    }

    // Also check for conflicting Appointments
    const startHour = newMeetingDate.getUTCHours();
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        managerId: activeManagerId,
        date: newMeetingDate, // Note: Prisma date comparison might need normalization depending on DB driver
        startHour,
        status: { notIn: ["CANCELLED", "REJECTED"] }
      }
    });

    if (conflictingAppointment) {
      throw new AppError("Conflict: You already have a fixed appointment scheduled at this time.", 409);
    }
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

  // Send meeting notification to freelancer and client if meeting is being set/updated
  if ((meetingDate || meetingLink) && (data.meetingDate !== undefined || data.meetingLink !== undefined)) {
    try {
      const project = currentDispute.project;
      const freelancer = project?.proposals?.[0]?.freelancer;
      const client = project?.owner;
      const finalMeetingDate = meetingDate || currentDispute.meetingDate;
      const finalMeetingLink = meetingLink || currentDispute.meetingLink;
      const meetingDateStr = finalMeetingDate ? new Date(finalMeetingDate).toLocaleString() : "TBA";

      console.log(`[updateDispute] 📧 Sending meeting notifications for dispute ${id}`);
      console.log(`[updateDispute] Freelancer: ${freelancer?.id} (${freelancer?.email})`);
      console.log(`[updateDispute] Client: ${client?.id} (${client?.email})`);
      console.log(`[updateDispute] Meeting Date: ${meetingDateStr}, Link: ${finalMeetingLink}`);

      // Notify freelancer
      if (freelancer?.id) {
        await sendNotificationToUser(freelancer.id, {
          audience: "freelancer",
          type: "meeting_scheduled",
          title: "Meeting Scheduled",
          message: `A meeting has been scheduled for project "${project.title}" on ${meetingDateStr}. Join: ${finalMeetingLink}`,
          data: {
            disputeId: dispute.id,
            projectId: project.id,
            meetingLink: finalMeetingLink,
            meetingDate: meetingDateStr
          }
        }, true);
      }

      // Notify client
      if (client?.id) {
        await sendNotificationToUser(client.id, {
          audience: "client",
          type: "meeting_scheduled",
          title: "Meeting Scheduled",
          message: `A meeting has been scheduled for project "${project.title}" on ${meetingDateStr}. Join: ${finalMeetingLink}`,
          data: {
            disputeId: dispute.id,
            projectId: project.id,
            meetingLink: finalMeetingLink,
            meetingDate: meetingDateStr
          }
        }, true);
      }

      console.log(`[updateDispute] ✅ Meeting notifications sent for dispute ${id}`);
    } catch (error) {
      console.error("Failed to send meeting notification:", error);
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

    const { date, projectId } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    const targetDateStr =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : String(date).split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const [year, month, day] = targetDateStr.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    let assignedManager = null;
    let assignedManagerId = null;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: String(projectId) },
        include: {
          manager: {
            select: PROJECT_MANAGER_SELECT,
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (
        project.manager?.role === "PROJECT_MANAGER" &&
        project.manager?.status === "ACTIVE"
      ) {
        assignedManager = project.manager;
        assignedManagerId = project.manager.id;
      } else {
        const slotBackfill = await prisma.managerAvailability.findFirst({
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            },
            isBooked: false,
            isEnabled: true,
            manager: {
              role: "PROJECT_MANAGER",
              status: "ACTIVE"
            }
          },
          include: {
            manager: { select: PROJECT_MANAGER_SELECT }
          },
          orderBy: { startHour: "asc" }
        });

        if (slotBackfill?.manager) {
          assignedManager = slotBackfill.manager;
          assignedManagerId = slotBackfill.managerId;
        } else {
          const fallbackManager = await findLeastLoadedActiveProjectManager(prisma);
          assignedManager = fallbackManager || null;
          assignedManagerId = fallbackManager?.id || null;
        }

        if (assignedManagerId && project.managerId !== assignedManagerId) {
          await prisma.project.update({
            where: { id: project.id },
            data: { managerId: assignedManagerId }
          });
        }
      }
    }

    // Get ALL unbooked availability slots from DB
    const allSlots = await prisma.managerAvailability.findMany({
      where: {
        isBooked: false,
        isEnabled: true,
        ...(assignedManagerId ? { managerId: assignedManagerId } : {}),
        manager: {
          role: "PROJECT_MANAGER",
          status: "ACTIVE",
        },
      },
    });

    // Filter by date in JavaScript (to avoid Prisma @db.Date issues)
    const matchingSlots = allSlots.filter(slot => {
      const slotDateStr = slot.date.toISOString().split('T')[0];
      return slotDateStr === targetDateStr;
    });

    if (matchingSlots.length === 0) {
      return res.json({ data: [], manager: assignedManager });
    }

    // Format to 12-hour time strings (slots are already filtered by isBooked=false)
    const seen = new Set();
    const result = [];

    matchingSlots
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

    res.json({ data: result, manager: assignedManager });
  } catch (error) {
    console.error("=== getAvailability ERROR ===");
    console.error(error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

