
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { listUsers } from "../modules/users/user.service.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import {
  resolveUserProfileDetails,
  extractWorkExperienceFromProfileDetails,
  extractPortfolioProjectsFromProfileDetails,
  buildFreelancerUnsplashAvatarUrl,
} from "./profile.controller.js";
import { getSopFromTitle } from "../../../src/shared/data/sopTemplates.js";

const PM_ROLE = "PROJECT_MANAGER";
const MAX_ACTIVE_PROJECTS = 10;
const NON_ACTIVE_PROJECT_STATUSES = ["COMPLETED", "PAUSED"];
const MEETING_SCOPES = ["CLIENT", "FREELANCER", "BOTH"];
const MEETING_PLATFORMS = ["ZOOM", "GOOGLE_MEET", "INTERNAL"];
const REPORT_CATEGORIES = [
  "Freelancer misconduct",
  "Client disputes",
  "Project delays",
  "Communication problems",
];
const REPORT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const MAX_PM_DIRECT_REASSIGNMENTS = 2;
const PM_REASSIGNMENT_APPROVAL_SOURCE = "PM_FREELANCER_REASSIGNMENT_APPROVAL";

const normalizeText = (value) => String(value || "").trim();
const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asArray = (value) => (Array.isArray(value) ? value : []);
const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const safeJsonParse = (value, fallback = {}) => {
  if (!value || typeof value !== "string") return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = normalizeText(value);
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (
    /less|under|over|year|years|yrs|experience|beginner|intermediate|advanced|not\s*set|n\/a/.test(
      lower
    )
  ) {
    return null;
  }

  if (/^\d+_\d+$/.test(lower) || /^\d+\+(_\w+)?$/.test(lower)) {
    return null;
  }

  const compactNumeric = raw.replace(/[, ]+/g, "");
  if (/^\d+(\.\d+)?$/.test(compactNumeric)) {
    const parsed = Number(compactNumeric);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const hasHourlyContext = /\/\s*hr|per\s*hour|hourly/.test(lower);
  const hasCurrencyContext = /inr|usd|eur|gbp|₹|\$|€|£/.test(lower);
  if (!hasHourlyContext && !hasCurrencyContext) return null;

  if (!hasHourlyContext && /-| to /.test(lower)) {
    return null;
  }

  const firstNumber = raw.match(/\d[\d,]*(?:\.\d+)?/);
  if (!firstNumber) return null;
  const parsed = Number(firstNumber[0].replace(/,/g, ""));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  return null;
};

const resolveHourlyRateFromProfileDetails = (profileDetails = {}) => {
  const pricing = profileDetails?.pricing && typeof profileDetails.pricing === "object"
    ? profileDetails.pricing
    : {};

  const directCandidates = [
    pricing.hourlyRate,
    pricing.ratePerHour,
    profileDetails?.hourlyRate,
    profileDetails?.ratePerHour,
    pricing?.baseHourlyRate,
  ];

  for (const candidate of directCandidates) {
    const parsed = toFiniteNumberOrNull(candidate);
    if (parsed) return parsed;
  }

  const serviceDetails =
    profileDetails?.serviceDetails && typeof profileDetails.serviceDetails === "object"
      ? Object.values(profileDetails.serviceDetails)
      : [];

  for (const detail of serviceDetails) {
    const candidates = [
      detail?.hourlyRate,
      detail?.ratePerHour,
      detail?.baseRate,
      detail?.baseHourlyRate,
    ];
    for (const candidate of candidates) {
      const parsed = toFiniteNumberOrNull(candidate);
      if (parsed) return parsed;
    }
  }

  return null;
};

const resolveLocationFromProfile = (user = {}, profileDetails = {}) => {
  const directLocation = normalizeText(user?.location || user?.freelancerProfile?.location || "");
  if (directLocation) return directLocation;

  const city = normalizeText(profileDetails?.identity?.city || "");
  const country = normalizeText(profileDetails?.identity?.country || "");
  const parts = [city, country].filter(Boolean);
  return parts.join(", ");
};

const resolveLanguagesFromProfileDetails = (profileDetails = {}, fallback = []) => {
  const primary = Array.isArray(profileDetails?.identity?.languages)
    ? profileDetails.identity.languages
    : [];
  const secondary = Array.isArray(fallback) ? fallback : [];

  return Array.from(
    new Set(
      [...primary, ...secondary]
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  );
};

const resolveTimeCommitmentFromProfileDetails = (profileDetails = {}) => {
  const availability =
    profileDetails?.availability && typeof profileDetails.availability === "object"
      ? profileDetails.availability
      : {};

  return normalizeText(
    availability.hoursPerWeek ||
      availability.workingSchedule ||
      availability.startTimeline ||
      ""
  );
};

const resolveAvailabilityLabel = ({ available, profileDetails = {} }) => {
  if (!available) return "Busy";

  const timeline = normalizeText(profileDetails?.availability?.startTimeline || "");
  if (timeline) return `Available - ${timeline}`;

  return "Available";
};

const normalizePortfolioEntry = (entry, index = 0) => {
  if (typeof entry === "string") {
    const link = normalizeText(entry);
    if (!link) return null;
    return {
      title: `Project ${index + 1}`,
      link,
      image: "",
      summary: "",
    };
  }

  if (!entry || typeof entry !== "object") return null;

  const title = normalizeText(
    entry.title || entry.name || entry.serviceName || entry.professionalTitle
  );
  const link = normalizeText(
    entry.link || entry.url || entry.fileUrl || entry.website || entry.portfolio
  );
  const image = normalizeText(entry.image || entry.thumbnail || entry.coverImage);
  const summary = normalizeText(entry.summary || entry.description || entry.readme);

  if (!title && !link && !summary) return null;

  return {
    title: title || `Project ${index + 1}`,
    link,
    image,
    summary,
  };
};

const mergePortfolioEntries = (...sources) => {
  const dedupe = new Map();

  sources.forEach((source) => {
    asArray(source).forEach((entry, index) => {
      const normalized = normalizePortfolioEntry(entry, index);
      if (!normalized) return;
      const dedupeKey = `${normalized.link.toLowerCase()}::${normalized.title.toLowerCase()}`;
      if (!dedupe.has(dedupeKey)) dedupe.set(dedupeKey, normalized);
    });
  });

  return Array.from(dedupe.values());
};

const isMarketplaceReadyFreelancer = (user = {}) => {
  const skills = asArray(user?.skills);
  const services = asArray(user?.services);
  const portfolioProjects = asArray(user?.portfolioProjects);
  const freelancerProjects = asArray(user?.freelancerProjects);
  const profileDetails = asObject(user?.profileDetails);

  const hasEssentialIdentity = Boolean(
    normalizeText(user?.id) &&
      normalizeText(user?.fullName || user?.name) &&
      normalizeText(user?.email)
  );
  const hasFreelancerContent = Boolean(
    normalizeText(user?.bio) ||
      normalizeText(user?.jobTitle) ||
      normalizeText(user?.portfolio) ||
      skills.length ||
      services.length ||
      portfolioProjects.length ||
      freelancerProjects.length ||
      Object.keys(profileDetails).length
  );

  return hasEssentialIdentity && hasFreelancerContent;
};

const hasFreelancerRole = (user = {}) => {
  const primaryRole = normalizeText(user?.role).toUpperCase();
  if (primaryRole === "FREELANCER") return true;

  const additionalRoles = Array.isArray(user?.roles)
    ? user.roles.map((role) => normalizeText(role).toUpperCase()).filter(Boolean)
    : [];
  return additionalRoles.includes("FREELANCER");
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

const getRequestUserId = (req) => req.user?.id || req.user?.sub || null;

const parseDescriptionMeta = (description = "") => {
  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object") {
      return {
        participantScope: String(parsed.participantScope || "BOTH").toUpperCase(),
        platform: String(parsed.platform || "INTERNAL").toUpperCase(),
        notes: normalizeText(parsed.notes || ""),
        meetingType: normalizeText(parsed.meetingType || "PM_MEETING"),
      };
    }
  } catch {
    // Ignore and fallback.
  }

  return {
    participantScope: "BOTH",
    platform: "INTERNAL",
    notes: normalizeText(description),
    meetingType: "PM_MEETING",
  };
};

const getMeetingWindow = (meeting) => {
  const date = new Date(meeting.date);
  const startsAt = new Date(date);
  startsAt.setHours(Number(meeting.startHour || 0), 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(Number(meeting.endHour || 0), 0, 0, 0);
  return { startsAt, endsAt };
};

const getRelativeMeetingFlags = (startsAt) => {
  const now = new Date();
  const diffMinutes = Math.round((startsAt.getTime() - now.getTime()) / 60000);

  const today =
    startsAt.getFullYear() === now.getFullYear() &&
    startsAt.getMonth() === now.getMonth() &&
    startsAt.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    startsAt.getFullYear() === tomorrow.getFullYear() &&
    startsAt.getMonth() === tomorrow.getMonth() &&
    startsAt.getDate() === tomorrow.getDate();

  return {
    isToday: today,
    isTomorrow,
    isInThirtyMinutes: diffMinutes >= 0 && diffMinutes <= 30,
  };
};

const getAcceptedProposal = (project) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];
  return (
    proposals.find((proposal) => proposal?.status === "ACCEPTED") ||
    proposals.find((proposal) => proposal?.status === "REPLACED") ||
    proposals[0] ||
    null
  );
};

const getFreelancerChangeRequests = (project = {}) =>
  Array.isArray(project?.freelancerChangeRequests)
    ? project.freelancerChangeRequests
    : [];

const getLatestPendingFreelancerChangeRequest = (project = {}) =>
  [...getFreelancerChangeRequests(project)]
    .reverse()
    .find(
      (request) => String(request?.status || "").toUpperCase() === "PENDING"
    ) || null;

const resolveFreelancerChangeRequestsAfterAssignment = ({
  requests = [],
  resolverId,
  replacementFreelancer,
}) => {
  let resolved = false;

  return requests.map((request) => {
    if (
      resolved ||
      String(request?.status || "").toUpperCase() !== "PENDING"
    ) {
      return request;
    }

    resolved = true;

    return {
      ...request,
      status: "RESOLVED",
      resolvedAt: new Date().toISOString(),
      resolvedById: resolverId,
      replacementFreelancerId: replacementFreelancer?.id || null,
      replacementFreelancerName: replacementFreelancer?.fullName || null,
    };
  });
};

const buildFreelancerAssignmentHistory = (project = {}) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];

  return proposals
    .filter((proposal) => {
      const status = String(proposal?.status || "").toUpperCase();
      return (
        (status === "ACCEPTED" || status === "REPLACED") &&
        proposal?.freelancer
      );
    })
    .map((proposal) => {
      const status = String(proposal?.status || "").toUpperCase();
      const startedAt = toIsoOrNull(proposal.createdAt);
      const replacedAt =
        status === "REPLACED" ? toIsoOrNull(proposal.updatedAt) : null;

      return {
        proposalId: proposal.id,
        freelancerId: proposal.freelancer.id,
        freelancerName: proposal.freelancer.fullName || "Freelancer",
        freelancerAvatar: proposal.freelancer.avatar || null,
        status: status === "ACCEPTED" ? "CURRENT" : "REPLACED",
        startedAt,
        endedAt: replacedAt,
      };
    })
    .filter((entry) => entry.startedAt)
    .sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt));
};

const toTaskKeySet = (value) => {
  if (Array.isArray(value)) {
    return new Set(value.map((item) => String(item || "").trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((item) => String(item || "").trim()).filter(Boolean));
      }
    } catch {
      return new Set();
    }
  }

  return new Set();
};

const hasFirstTaskCompletion = (project) => {
  const sop = getSopFromTitle(project?.title || "");
  const firstTask = Array.isArray(sop?.tasks) ? sop.tasks[0] : null;
  if (!firstTask) return false;

  const taskKey = `${firstTask.phase}-${firstTask.id}`;
  return toTaskKeySet(project?.completedTasks).has(taskKey);
};

const getApprovedPhaseSet = (project = {}) =>
  new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : [])
      .map((item) => Number(item?.phase))
      .filter(Number.isFinite)
  );

const countCompletedLifecyclePhases = (project = {}) => {
  const approved = getApprovedPhaseSet(project);
  const phase1Done =
    hasFirstTaskCompletion(project) ||
    approved.has(2) ||
    approved.has(3) ||
    approved.has(4);

  return [phase1Done, approved.has(2), approved.has(3), approved.has(4)].filter(Boolean).length;
};

const isProjectOperationallyCompleted = (project = {}) =>
  countCompletedLifecyclePhases(project) >= 4;

const countPmFreelancerReassignments = (project = {}) => {
  const proposals = Array.isArray(project?.proposals) ? project.proposals : [];

  return proposals.filter((proposal) => {
    if (String(proposal?.status || "").toUpperCase() !== "REPLACED") return false;

    const reasonKey = String(proposal?.rejectionReasonKey || "").toLowerCase();
    return (
      reasonKey === "project_manager_reassignment" ||
      reasonKey === "project_manager_reassignment_admin_approved"
    );
  }).length;
};

const findOpenPmReassignmentApprovalRequest = async (projectId) =>
  prisma.adminEscalation.findFirst({
    where: {
      projectId,
      status: "OPEN",
      notes: {
        contains: `"source":"${PM_REASSIGNMENT_APPROVAL_SOURCE}"`,
      },
    },
    orderBy: { createdAt: "desc" },
  });

const notifyAdminsAboutPmReassignmentApproval = async ({
  projectId,
  projectTitle,
  requestedByName,
  freelancerName,
}) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      sendNotificationToUser(admin.id, {
        type: "admin_approval_required",
        title: "Freelancer reassignment approval required",
        message: `${requestedByName} requested Admin approval to assign ${freelancerName} on "${projectTitle}".`,
        data: { projectId },
      }).catch(() => null)
    )
  );
};

const mapProjectStatusForPm = (project) => {
  const hasIssue = Array.isArray(project?.disputes)
    ? project.disputes.some((entry) => String(entry.status || "").toUpperCase() !== "RESOLVED")
    : false;

  if (hasIssue) return { label: "Issue Raised", color: "red" };

  const status = String(project?.status || "").toUpperCase();
  if (status === "DRAFT") return { label: "Proposal", color: "gray" };
  if (isProjectOperationallyCompleted(project)) {
    return { label: "Completed", color: "green" };
  }
  if (status === "IN_PROGRESS" || countCompletedLifecyclePhases(project) > 0) {
    return { label: "In Progress", color: "indigo" };
  }
  if (status === "OPEN" || status === "AWAITING_PAYMENT" || status === "COMPLETED") {
    return { label: "Started", color: "blue" };
  }

  return { label: "Started", color: "blue" };
};

const buildMilestonesForProject = (project) => {
  const approved = new Set(
    (Array.isArray(project?.milestoneApprovals) ? project.milestoneApprovals : []).map((item) => Number(item.phase))
  );
  const firstTaskCompleted = hasFirstTaskCompletion(project);
  const phase1Done = firstTaskCompleted || approved.has(2) || approved.has(3) || approved.has(4);

  const phaseRows = [
    { phase: 1, title: "Kickoff & UI Design", percent: 0 },
    { phase: 2, title: "Core Development", percent: 25 },
    { phase: 3, title: "Integration & Testing", percent: 25 },
    { phase: 4, title: "Launch & Documentation", percent: 50 },
  ];

  return phaseRows.map((entry) => {
    const amount = Math.round((Number(project?.budget || 0) * entry.percent) / 100);
    const isApproved = entry.phase === 1 ? phase1Done : approved.has(entry.phase);

    let status = "Locked";
    let eligibleForApproval = false;

    if (entry.phase === 1) {
      status = phase1Done ? "Completed" : "Pending";
    } else if (isApproved) {
      status = "Approved";
    } else if (
      (entry.phase === 2 && phase1Done) ||
      (entry.phase === 3 && approved.has(2)) ||
      (entry.phase === 4 && approved.has(3))
    ) {
      status = "Pending Approval";
      eligibleForApproval = true;
    }

    return {
      phase: entry.phase,
      title: entry.title,
      percentage: entry.percent,
      amount,
      status,
      eligibleForApproval,
      validationNotes:
        entry.phase === 1
          ? firstTaskCompleted
            ? "First task completed by freelancer. Phase 2 can move to PM approval."
            : "Waiting for freelancer to complete first task."
          : eligibleForApproval
            ? "Ready for Project Manager approval."
            : "Waiting for previous phase completion.",
    };
  });
};

const countCompletedMilestones = (milestones = []) =>
  milestones.filter((entry) => ["Completed", "Approved", "Paid"].includes(entry.status)).length;

const ensureAssignedPm = async ({ projectId, pmId }) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, ownerId: true, title: true },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (String(project.managerId || "") !== String(pmId)) {
    throw new AppError("Only assigned Project Manager can access this project.", 403);
  }

  return project;
};

const serializeMeeting = (meeting) => {
  const { startsAt, endsAt } = getMeetingWindow(meeting);
  const meta = parseDescriptionMeta(meeting.description || "");
  const relative = getRelativeMeetingFlags(startsAt);

  const freelancer = getAcceptedProposal(meeting?.project)?.freelancer;
  const participants = [
    { name: "You", role: "PM", avatar: null, initials: "PM" }
  ];
  
  if (meta.participantScope === "CLIENT" || meta.participantScope === "BOTH") {
    if (meeting?.project?.owner) {
        participants.push({
            name: meeting.project.owner.fullName,
            role: "Client",
            avatar: null,
            initials: meeting.project.owner.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        });
    }
  }
  
  if (meta.participantScope === "FREELANCER" || meta.participantScope === "BOTH") {
    if (freelancer) {
        participants.push({
            name: freelancer.fullName,
            role: "Freelancer",
            avatar: freelancer.avatar,
            initials: freelancer.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        });
    }
  }

  return {
    id: meeting.id,
    title: meeting.title,
    projectId: meeting.projectId,
    projectName: meeting?.project?.title || "General",
    participants,
    participantScope: meta.participantScope,
    platform: meta.platform,
    notes: meta.notes,
    meetingType: meta.meetingType,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    meetingLink: meeting.meetingLink || null,
    status: meeting.status,
    ...relative,
  };
};

export const getPmDashboardSummary = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const projects = await prisma.project.findMany({
    where: {
      managerId: userId,
      status: { notIn: NON_ACTIVE_PROJECT_STATUSES },
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        include: {
          freelancer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              freelancerProfile: {
                select: {
                  rating: true,
                  reviewCount: true,
                  skills: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      disputes: { select: { id: true, status: true } },
      milestoneApprovals: { select: { phase: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_ACTIVE_PROJECTS,
  });

  const meetings = await prisma.appointment.findMany({
    where: {
      managerId: userId,
      date: { gte: startOfDay(new Date()) },
      status: { in: ["PENDING", "APPROVED"] },
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, role: true } },
      project: {
        select: {
          id: true,
          title: true,
          owner: { select: { fullName: true } },
          proposals: {
            where: { status: { in: ["ACCEPTED", "REPLACED"] } },
            include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
    take: 12,
  });

  const cards = [];
  let totalUnread = 0;

  for (const project of projects) {
    const activeProposal = getAcceptedProposal(project);
    const activeServiceKey =
      project?.ownerId && activeProposal?.freelancerId
        ? `CHAT:${project.id}:${project.ownerId}:${activeProposal.freelancerId}`
        : null;

    const conversation = (activeServiceKey
      ? await prisma.chatConversation.findFirst({
          where: { service: activeServiceKey },
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : null) ||
      (await prisma.chatConversation.findFirst({
        where: {
          OR: [{ service: { startsWith: `CHAT:${project.id}:` } }, { service: { contains: project.id } }],
        },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
      }));

    const unreadMessages = conversation?.id
      ? await prisma.chatMessage.count({
          where: {
            conversationId: conversation.id,
            readAt: null,
            NOT: [{ senderId: userId }, { senderRole: PM_ROLE }],
          },
        })
      : 0;

    totalUnread += unreadMessages;

    const freelancer = activeProposal?.freelancer;
    const mappedStatus = mapProjectStatusForPm(project);
    const milestones = buildMilestonesForProject(project);
    const completedMilestones = countCompletedMilestones(milestones);

    const nextMeeting = meetings.find((meeting) => String(meeting.projectId || "") === String(project.id));
    const nextMeetingWindow = nextMeeting ? getMeetingWindow(nextMeeting) : null;

    cards.push({
      id: project.id,
      projectName: project.title,
      clientName: project?.owner?.fullName || "Unknown Client",
      assignedFreelancer: freelancer?.fullName || "Unassigned",
      freelancerAvatar: freelancer?.avatar || null,
      status: mappedStatus.label,
      statusColor: mappedStatus.color,
      totalMessages: conversation?._count?.messages || 0,
      unreadMessages,
      lastMessageSender:
        conversation?.messages?.[0]?.senderRole === PM_ROLE
          ? "Project Manager"
          : conversation?.messages?.[0]?.senderName || conversation?.messages?.[0]?.senderRole || null,
      lastActivityTime: toIsoOrNull(conversation?.messages?.[0]?.createdAt || project.updatedAt),
      milestoneProgress: Math.round((completedMilestones / 4) * 100),
      upcomingMeeting: nextMeetingWindow ? nextMeetingWindow.startsAt.toISOString() : null,
      urgentMeeting: nextMeetingWindow ? getRelativeMeetingFlags(nextMeetingWindow.startsAt).isInThirtyMinutes : false,
      hasIssue: mappedStatus.label === "Issue Raised",
    });
  }

  const activeCount = await prisma.project.count({
    where: {
      managerId: userId,
      status: { notIn: NON_ACTIVE_PROJECT_STATUSES },
    },
  });

  const openIssues = cards.filter((card) => card.hasIssue).length;

  res.json({
    data: {
      stats: {
        activeProjects: activeCount,
        openIssues,
        unreadMessages: totalUnread,
        upcomingMeetings: meetings.length,
      },
      projectCapacity: {
        used: activeCount,
        limit: MAX_ACTIVE_PROJECTS,
        canTakeMore: activeCount < MAX_ACTIVE_PROJECTS,
      },
      projects: cards,
      upcomingMeetings: meetings.map((meeting) => serializeMeeting(meeting)),
    },
  });
});
export const getPmProjectDetails = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const projectId = req.params?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  await ensureAssignedPm({ projectId, pmId: userId });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          clientProfile: {
            select: { profileDetails: true },
          },
        },
      },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        include: {
          freelancer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              createdAt: true,
              status: true,
              freelancerProfile: {
                select: {
                  rating: true,
                  reviewCount: true,
                  skills: true,
                  experienceYears: true,
                  portfolio: true,
                  profileDetails: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      disputes: {
        include: { raisedBy: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      appointments: {
        include: { bookedBy: { select: { id: true, fullName: true, role: true } } },
        orderBy: [{ date: "desc" }, { startHour: "desc" }],
      },
      milestoneApprovals: {
        include: { manager: { select: { fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        where: { status: { in: ["PENDING", "PROCESSING", "COMPLETED"] } },
        orderBy: { createdAt: "desc" },
      },
      tasks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) throw new AppError("Project not found.", 404);

  const activeProposal = getAcceptedProposal(project);
  const activeServiceKey =
    project?.ownerId && activeProposal?.freelancerId
      ? `CHAT:${project.id}:${project.ownerId}:${activeProposal.freelancerId}`
      : null;

  const conversation = (activeServiceKey
    ? await prisma.chatConversation.findFirst({
        where: { service: activeServiceKey },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : null) ||
    (await prisma.chatConversation.findFirst({
      where: {
        OR: [{ service: { startsWith: `CHAT:${project.id}:` } }, { service: { contains: project.id } }],
      },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }));

  const unreadMessages = conversation?.id
    ? await prisma.chatMessage.count({
        where: {
          conversationId: conversation.id,
          readAt: null,
          NOT: [{ senderId: userId }, { senderRole: PM_ROLE }],
        },
      })
    : 0;

  const mappedStatus = mapProjectStatusForPm(project);
  const milestones = buildMilestonesForProject(project);
  const freelancer = activeProposal?.freelancer || null;
  const freelancerAssignmentHistory = buildFreelancerAssignmentHistory(project);
  const portfolioProjects = freelancer
    ? extractPortfolioProjectsFromProfileDetails(freelancer.freelancerProfile?.profileDetails || {})
    : [];

  const logs = [
    ...project.disputes.map((item) => ({
      id: `dispute-${item.id}`,
      type: "Issue Raised",
      content: item.description,
      actor: item?.raisedBy?.fullName || "Unknown",
      createdAt: toIsoOrNull(item.createdAt),
    })),
    ...project.milestoneApprovals.map((item) => ({
      id: `milestone-${item.id}`,
      type: "Milestone Approval",
      content: `Phase ${item.phase} approved`,
      actor: item?.manager?.fullName || "Project Manager",
      createdAt: toIsoOrNull(item.createdAt),
    })),
    ...project.payments.map((item) => ({
      id: `payment-${item.id}`,
      type: "Payment",
      content: `INR ${Number(item.amount || 0).toLocaleString("en-IN")} (${item.status})`,
      actor: "System",
      createdAt: toIsoOrNull(item.createdAt),
    })),
  ]
    .filter((entry) => entry.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

  res.json({
    data: {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: mappedStatus,
        budget: Number(project.budget || 0),
        progress: Number(project.progress || 0),
        completedTasks: Array.isArray(project.completedTasks) ? project.completedTasks : [],
        verifiedTasks: Array.isArray(project.verifiedTasks) ? project.verifiedTasks : [],
        createdAt: toIsoOrNull(project.createdAt),
        updatedAt: toIsoOrNull(project.updatedAt),
      },
      clientProfile: {
        id: project?.owner?.id,
        clientName: project?.owner?.fullName || "Unknown",
        email: project?.owner?.email || null,
        company: "Not specified", // companyName not on client user
        projectBrief: project.title,
        requirements: project.description,
        avatar: project?.owner?.avatar || null,
        budget: Number(project.budget || 0),
        communicationHistorySummary: {
          totalMessages: conversation?._count?.messages || 0,
          unreadMessages,
          lastMessageSender:
            conversation?.messages?.[0]?.senderRole === PM_ROLE
              ? "Project Manager"
              : conversation?.messages?.[0]?.senderName || conversation?.messages?.[0]?.senderRole || null,
          lastInteractionTime: toIsoOrNull(conversation?.messages?.[0]?.createdAt || project.updatedAt),
        },
        meetingHistorySummary: {
          totalMeetings: project.appointments.length,
          upcomingMeetings: project.appointments.filter((entry) => getMeetingWindow(entry).startsAt > new Date()).length,
        },
      },
      freelancerProfile: freelancer
        ? {
            id: freelancer.id,
            freelancerName: freelancer.fullName,
            avatar: freelancer.avatar,
            skills: Array.isArray(freelancer.freelancerProfile?.skills) ? freelancer.freelancerProfile.skills : [],
            rating: Number(freelancer.freelancerProfile?.rating || 0),
            reviewsCount: Number(freelancer.freelancerProfile?.reviewCount || 0),
            portfolio: freelancer.freelancerProfile?.portfolio || portfolioProjects[0]?.link || null,
            portfolioProjects,
            pastProjectsSummary: "History available in freelancer profile.",
            platformActivity: freelancer.status || "ACTIVE",
            experienceYears: Number(freelancer.freelancerProfile?.experienceYears || 0),
          }
        : null,
      freelancerAssignmentHistory,
      milestones,
      handoverChecklist: {
        sourceCodeTransferred: Boolean(project.closureHandoverConfirmed),
        documentationFinalized: Boolean(project.closureDeliverablesConfirmed),
        credentialsShared: Boolean(project.closureReceiptConfirmed),
        finalFilesDelivered: Boolean(project.closureDeliverablesConfirmed),
        noPendingIssues: Boolean(project.closureNoIssuesConfirmed),
      },
      logs,
    },
  });
});

export const getPmUpcomingMeetings = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const meetings = await prisma.appointment.findMany({
    where: {
      managerId: userId,
      date: { gte: startOfDay(new Date()) },
      status: { in: ["PENDING", "APPROVED"] },
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, role: true } },
      project: {
        select: {
          id: true,
          title: true,
          owner: { select: { fullName: true } },
          proposals: {
            where: { status: { in: ["ACCEPTED", "REPLACED"] } },
            include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
    take: 20,
  });

  res.json({
    data: meetings.map((meeting) => serializeMeeting(meeting)),
  });
});

export const getPmProjectMessages = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const projectId = req.params?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  await ensureAssignedPm({ projectId, pmId: userId });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        select: { freelancerId: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) throw new AppError("Project not found.", 404);

  const activeFreelancerId = project?.proposals?.[0]?.freelancerId || null;
  const activeServiceKey =
    project.ownerId && activeFreelancerId
      ? `CHAT:${projectId}:${project.ownerId}:${activeFreelancerId}`
      : null;

  const conversation = (activeServiceKey
    ? await prisma.chatConversation.findFirst({
        where: { service: activeServiceKey },
        orderBy: { updatedAt: "desc" },
      })
    : null) ||
    (await prisma.chatConversation.findFirst({
      where: {
        OR: [{ service: { startsWith: `CHAT:${projectId}:` } }, { service: { contains: projectId } }],
      },
      orderBy: { updatedAt: "desc" },
    }));

  if (!conversation) {
    res.json({ data: { conversation: null, messages: [] } });
    return;
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  res.json({
    data: {
      conversation: {
        id: conversation.id,
        service: conversation.service,
        projectTitle: conversation.projectTitle,
      },
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        senderRole: message.senderRole,
        senderLabel:
          String(message.senderRole || "").toUpperCase() === PM_ROLE
            ? "Project Manager"
            : message.senderName || message.senderRole || "User",
        createdAt: toIsoOrNull(message.createdAt),
      })),
    },
  });
});

export const sendPmProjectMessage = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const projectId = req.params?.id;
  const content = normalizeText(req.body?.content || req.body?.message);

  if (!userId) throw new AppError("Authentication required", 401);
  if (!content) throw new AppError("Message content is required.", 400);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true } },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        select: { freelancerId: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) throw new AppError("Project not found.", 404);
  if (String(project.managerId || "") !== String(userId)) {
    throw new AppError("Only assigned Project Manager can send project messages.", 403);
  }

  const freelancerId = project?.proposals?.[0]?.freelancerId || "unknown";
  const serviceKey = `CHAT:${projectId}:${project.ownerId}:${freelancerId}`;

  let conversation = await prisma.chatConversation.findFirst({
    where: { service: serviceKey },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        service: serviceKey,
        projectTitle: project.title,
        createdById: userId,
      },
    });
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      senderRole: PM_ROLE,
      senderName: "Project Manager",
      role: "user",
      content,
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const recipients = [project.ownerId, freelancerId].filter(
    (entry) => entry && entry !== "unknown" && String(entry) !== String(userId)
  );

  await Promise.all(
    recipients.map((recipientId) =>
      sendNotificationToUser(recipientId, {
        type: "chat",
        title: "Project Manager message",
        message: `Project Manager: ${content.slice(0, 120)}`,
        data: { projectId, conversationId: conversation.id },
      }).catch(() => null)
    )
  );

  res.status(201).json({
    data: {
      id: message.id,
      content: message.content,
      senderRole: message.senderRole,
      senderLabel: "Project Manager",
      createdAt: toIsoOrNull(message.createdAt),
      conversationId: conversation.id,
    },
  });
});

export const getPmProjectMilestones = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const projectId = req.params?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  await ensureAssignedPm({ projectId, pmId: userId });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestoneApprovals: { select: { phase: true } },
      proposals: { where: { status: "ACCEPTED" }, select: { id: true } },
    },
  });

  if (!project) throw new AppError("Project not found.", 404);

  res.json({
    data: {
      milestones: buildMilestonesForProject(project),
    },
  });
});
const detectMeetingConflictsCore = async ({ managerId, startsAt, endsAt, excludeMeetingId = null }) => {
  const day = startOfDay(startsAt);
  const startHour = startsAt.getHours();
  const endHour = Math.max(startHour + 1, endsAt.getHours() + (endsAt.getMinutes() > 0 ? 1 : 0));

  const appointmentConflicts = await prisma.appointment.findMany({
    where: {
      managerId,
      date: day,
      status: { notIn: ["REJECTED", "CANCELLED"] },
      ...(excludeMeetingId ? { id: { not: excludeMeetingId } } : {}),
      NOT: [{ endHour: { lte: startHour } }, { startHour: { gte: endHour } }],
    },
    include: {
      project: { select: { id: true, title: true } },
      bookedBy: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { startHour: "asc" },
  });

  const disputeConflicts = await prisma.dispute.findMany({
    where: {
      managerId,
      status: { not: "RESOLVED" },
      meetingDate: {
        gte: startsAt,
        lt: endsAt,
      },
    },
    include: {
      project: { select: { id: true, title: true } },
    },
  });

  const availability = await prisma.managerAvailability.findMany({
    where: {
      managerId,
      date: day,
      isEnabled: true,
      isBooked: false,
    },
    orderBy: { startHour: "asc" },
    take: 12,
  });

  const ranges = appointmentConflicts.map((item) => ({ startHour: item.startHour, endHour: item.endHour }));
  const suggestedSlots = availability
    .filter((slot) => {
      const overlaps = ranges.some(
        (range) => !(Number(slot.endHour) <= Number(range.startHour) || Number(slot.startHour) >= Number(range.endHour))
      );
      return !overlaps;
    })
    .slice(0, 5)
    .map((slot) => {
      const slotStarts = new Date(day);
      slotStarts.setHours(slot.startHour, 0, 0, 0);
      const slotEnds = new Date(day);
      slotEnds.setHours(slot.endHour, 0, 0, 0);
      return {
        startsAt: slotStarts.toISOString(),
        endsAt: slotEnds.toISOString(),
      };
    });

  return {
    hasConflict: appointmentConflicts.length > 0 || disputeConflicts.length > 0,
    appointmentConflicts,
    disputeConflicts,
    suggestedSlots,
  };
};

export const detectPmMeetingConflicts = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const startsAt = new Date(req.body?.startsAt);
  const endsAt = new Date(req.body?.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new AppError("Provide valid startsAt and endsAt values.", 400);
  }

  const conflict = await detectMeetingConflictsCore({
    managerId: userId,
    startsAt,
    endsAt,
  });

  res.json({
    data: {
      hasConflict: conflict.hasConflict,
      conflicts: [
        ...conflict.appointmentConflicts.map((item) => ({
          type: "MEETING",
          id: item.id,
          title: item.title,
          projectName: item?.project?.title || null,
          startHour: item.startHour,
          endHour: item.endHour,
        })),
        ...conflict.disputeConflicts.map((item) => ({
          type: "DISPUTE",
          id: item.id,
          title: "Dispute Session",
          projectName: item?.project?.title || null,
          meetingDate: toIsoOrNull(item.meetingDate),
        })),
      ],
      suggestedSlots: conflict.suggestedSlots,
    },
  });
});

export const listPmMeetings = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const view = String(req.query?.view || "week").toLowerCase();
  const from = req.query?.from ? new Date(req.query.from) : new Date();

  let rangeStart = startOfDay(from);
  let rangeEnd = endOfDay(from);
  let dateFilter = { gte: rangeStart, lte: rangeEnd };

  if (view === "week") {
    rangeEnd = endOfDay(new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000));
  } else if (view === "month") {
    rangeEnd = endOfDay(new Date(from.getFullYear(), from.getMonth() + 1, 0));
  } else if (view === "all") {
    dateFilter = null;
  }

  if (dateFilter) {
    dateFilter = { gte: rangeStart, lte: rangeEnd };
  }

  const meetings = await prisma.appointment.findMany({
    where: {
      managerId: userId,
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, role: true } },
      project: {
        select: {
          id: true,
          title: true,
          owner: { select: { fullName: true } },
          proposals: {
            where: { status: { in: ["ACCEPTED", "REPLACED"] } },
            include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  const serialized = meetings.map((meeting) => serializeMeeting(meeting));
  const blockedTimes = serialized
    .filter((meeting) => !["REJECTED", "CANCELLED"].includes(String(meeting.status || "")))
    .map((meeting) => ({
      meetingId: meeting.id,
      startsAt: meeting.startsAt,
      endsAt: meeting.endsAt,
    }));

  res.json({
    data: {
      view,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      meetings: serialized,
      blockedTimes,
      upcoming: serialized.filter((item) => new Date(item.startsAt) >= new Date()).slice(0, 8),
    },
  });
});

export const createPmMeeting = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const projectId = normalizeText(req.body?.projectId);
  const title = normalizeText(req.body?.title || "Project Sync");
  const participantScope = String(req.body?.participantScope || "BOTH").toUpperCase();
  const platform = String(req.body?.platform || "INTERNAL").toUpperCase();
  const notes = normalizeText(req.body?.notes);
  const startsAt = new Date(req.body?.startsAt);
  const endsAt = new Date(req.body?.endsAt);

  if (!projectId) throw new AppError("projectId is required.", 400);
  if (!MEETING_SCOPES.includes(participantScope)) {
    throw new AppError("participantScope must be CLIENT, FREELANCER, or BOTH.", 400);
  }
  if (!MEETING_PLATFORMS.includes(platform)) {
    throw new AppError("platform must be ZOOM, GOOGLE_MEET, or INTERNAL.", 400);
  }
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new AppError("Invalid startsAt or endsAt values.", 400);
  }

  await ensureAssignedPm({ projectId, pmId: userId });

  const conflicts = await detectMeetingConflictsCore({ managerId: userId, startsAt, endsAt });
  if (conflicts.hasConflict) {
    throw new AppError(
      `Meeting conflict detected. Suggested slots: ${conflicts.suggestedSlots.map((slot) => new Date(slot.startsAt).toLocaleString()).join(", ") || "No alternatives available"}`,
      409
    );
  }

  const date = startOfDay(startsAt);
  const startHour = startsAt.getHours();
  const endHour = Math.max(startHour + 1, endsAt.getHours() + (endsAt.getMinutes() > 0 ? 1 : 0));

  const meetingLink =
    platform === "ZOOM"
      ? `https://zoom.us/j/${Date.now()}`
      : platform === "GOOGLE_MEET"
        ? "https://meet.google.com/new"
        : `internal://meeting/${Date.now()}`;

  const metadata = JSON.stringify({ participantScope, platform, notes, meetingType: "PM_MEETING" });

  const meeting = await prisma.appointment.create({
    data: {
      title,
      description: metadata,
      date,
      startHour,
      endHour,
      status: "APPROVED",
      meetingLink,
      bookedById: userId,
      managerId: userId,
      projectId,
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, role: true } },
      project: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          owner: { select: { fullName: true } },
          proposals: {
            where: { status: { in: ["ACCEPTED", "REPLACED"] } },
            include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const freelancerId = getAcceptedProposal(meeting.project)?.freelancer?.id;
  const notify = [];
  if ((participantScope === "CLIENT" || participantScope === "BOTH") && meeting?.project?.ownerId) {
    notify.push(meeting.project.ownerId);
  }
  if ((participantScope === "FREELANCER" || participantScope === "BOTH") && freelancerId) {
    notify.push(freelancerId);
  }

  await Promise.all(
    notify
      .filter((targetId) => String(targetId) !== String(userId))
      .map((targetId) =>
        sendNotificationToUser(targetId, {
          type: "meeting_scheduled",
          title: "Meeting scheduled",
          message: `${title} on ${startsAt.toLocaleString()}`,
          data: { projectId, meetingId: meeting.id, startsAt: startsAt.toISOString() },
        }).catch(() => null)
      )
  );

  res.status(201).json({
    data: serializeMeeting(meeting),
    message: "Meeting scheduled successfully.",
  });
});

export const reschedulePmMeeting = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const meetingId = req.params?.id;
  if (!userId) throw new AppError("Authentication required", 401);

  const meeting = await prisma.appointment.findUnique({
    where: { id: meetingId },
    select: { id: true, managerId: true },
  });
  if (!meeting) throw new AppError("Meeting not found.", 404);
  if (String(meeting.managerId || "") !== String(userId)) {
    throw new AppError("Only assigned PM can reschedule this meeting.", 403);
  }

  const startsAt = new Date(req.body?.startsAt);
  const endsAt = new Date(req.body?.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new AppError("Invalid startsAt or endsAt values.", 400);
  }

  const conflicts = await detectMeetingConflictsCore({
    managerId: userId,
    startsAt,
    endsAt,
    excludeMeetingId: meetingId,
  });
  if (conflicts.hasConflict) {
    throw new AppError("New time conflicts with existing schedule.", 409);
  }

  const date = startOfDay(startsAt);
  const startHour = startsAt.getHours();
  const endHour = Math.max(startHour + 1, endsAt.getHours() + (endsAt.getMinutes() > 0 ? 1 : 0));

  const updated = await prisma.appointment.update({
    where: { id: meetingId },
    data: {
      date,
      startHour,
      endHour,
      updatedAt: new Date(),
    },
    include: {
      bookedBy: { select: { id: true, fullName: true, role: true } },
      project: {
        select: {
          id: true,
          title: true,
          owner: { select: { fullName: true } },
          proposals: {
            where: { status: { in: ["ACCEPTED", "REPLACED"] } },
            include: { freelancer: { select: { id: true, fullName: true, avatar: true } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  res.json({
    data: serializeMeeting(updated),
    message: "Meeting rescheduled successfully.",
  });
});
export const getPmFreelancerDetails = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const targetId = req.params?.id;
  if (!userId) throw new AppError("Authentication required", 401);
  if (!targetId) throw new AppError("Freelancer ID is required.", 400);

  const freelancer = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      freelancerProfile: true,
      marketplace: true,
      freelancerProjects: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      },
      subjectInternalReviews: {
        include: { manager: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!freelancer || !hasFreelancerRole(freelancer)) {
    throw new AppError("Freelancer not found.", 404);
  }

  const details = await resolveUserProfileDetails(freelancer);
  const hourlyRate = resolveHourlyRateFromProfileDetails(details);
  const location = resolveLocationFromProfile(freelancer, details);
  const languages = resolveLanguagesFromProfileDetails(
    details,
    freelancer?.freelancerProfile?.languages
  );
  const timeCommitment = resolveTimeCommitmentFromProfileDetails(details);
  const profilePortfolio = asArray(freelancer?.freelancerProfile?.portfolioProjects);
  const detailsPortfolio = extractPortfolioProjectsFromProfileDetails(details);
  const profileServiceDetails = asObject(details?.serviceDetails);
  const serviceRows = Array.from(
    new Set(
      [
        ...asArray(freelancer?.freelancerProfile?.services),
        ...Object.keys(profileServiceDetails),
      ]
        .map((entry) => normalizeText(entry))
        .filter(Boolean),
    ),
  );
  const freelancerProjectRows = asArray(freelancer?.freelancerProjects).map((project, index) => ({
    title: normalizeText(project?.title || project?.serviceName || project?.professionalTitle) || `Project ${index + 1}`,
    link: normalizeText(project?.link || project?.fileUrl),
    image: "",
    summary: normalizeText(project?.description || project?.readme),
    serviceKey: normalizeText(project?.serviceKey),
    serviceName: normalizeText(project?.serviceName),
    activeTechnologies: asArray(project?.activeTechnologies),
  }));
  const portfolioRows = mergePortfolioEntries(
    detailsPortfolio,
    profilePortfolio,
    freelancerProjectRows
  );
  const profileDetails = asObject(details);

  res.json({
    data: {
      id: freelancer.id,
      name: freelancer.fullName,
      title:
        freelancer.freelancerProfile?.jobTitle ||
        normalizeText(details?.identity?.professionalTitle || "") ||
        "Freelancer",
      location: location || null,
      avatar: freelancer.avatar || buildFreelancerUnsplashAvatarUrl(freelancer),
      rating: Number(freelancer.freelancerProfile?.rating || 0),
      reviewCount: Number(freelancer.freelancerProfile?.reviewCount || 0),
      bio:
        freelancer.freelancerProfile?.bio ||
        normalizeText(details?.professionalBio || "") ||
        "",
      skills: Array.isArray(freelancer.freelancerProfile?.skills) ? freelancer.freelancerProfile.skills : [],
      services: serviceRows,
      experienceYears: Number(freelancer.freelancerProfile?.experienceYears || 0),
      experience: extractWorkExperienceFromProfileDetails(details),
      portfolio: portfolioRows,
      profileDetails,
      freelancerProjects: freelancerProjectRows,
      testimonials: (Array.isArray(freelancer.subjectInternalReviews) ? freelancer.subjectInternalReviews : []).map(r => ({
        name: r.manager?.fullName || "PM",
        role: "Project Manager",
        text: r.notes,
        rating: r.rating,
        avatar: null
      })),
      hourlyRate,
      languages,
      timeCommitment: timeCommitment || null,
      availability: resolveAvailabilityLabel({
        available: Boolean(freelancer.freelancerProfile?.available),
        profileDetails: details,
      }),
    }
  });
});

export const searchPmFreelancers = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const search = normalizeText(req.query?.search).toLowerCase();
  const skills = parseCsv(req.query?.skills);
  const availability = normalizeText(req.query?.availability).toLowerCase();
  const minRating = Number(req.query?.rating || 0);
  const minExperience = Number(req.query?.projectExperience || 0);
  const sort = normalizeText(req.query?.sort).toLowerCase();

  const users = await listUsers({
    role: "FREELANCER",
    status: "ACTIVE",
    onboardingComplete: true,
    requiredSkills: skills.join(","),
  });
  const marketplaceUsers = users.filter(isMarketplaceReadyFreelancer);

  const freelancerIds = marketplaceUsers.map((item) => item.id);
  const reviews = freelancerIds.length
    ? await prisma.internalFreelancerReview.findMany({
        where: { freelancerId: { in: freelancerIds } },
        include: { manager: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const latestReviewByFreelancer = new Map();
  for (const review of reviews) {
    if (!latestReviewByFreelancer.has(review.freelancerId)) {
      latestReviewByFreelancer.set(review.freelancerId, review);
    }
  }

  const freelancers = marketplaceUsers
    .filter((user) => {
      if (availability === "available" && !user.available) return false;
      if (availability === "unavailable" && user.available) return false;
      if (minRating > 0 && Number(user.rating || 0) < minRating) return false;
      if (minExperience > 0 && Number(user.experienceYears || 0) < minExperience) return false;

      if (search) {
        const pool = [
          user.fullName,
          user.jobTitle,
          user.bio,
          ...(Array.isArray(user.skills) ? user.skills : []),
        ]
          .join(" ")
          .toLowerCase();

        if (!pool.includes(search)) return false;
      }

      return true;
    })
    .map((user) => {
      const userSkills = Array.isArray(user.skills) ? user.skills : [];
      const profileDetails =
        user?.profileDetails && typeof user.profileDetails === "object"
          ? user.profileDetails
          : {};
      const profilePortfolio = asArray(user?.portfolioProjects);
      const freelancerProjectRows = asArray(user?.freelancerProjects);
      const hourlyRate = resolveHourlyRateFromProfileDetails(profileDetails);
      const languages = resolveLanguagesFromProfileDetails(
        profileDetails,
        user?.freelancerProfile?.languages
      );
      const matchedSkills = skills.filter((skill) =>
        userSkills.some((userSkill) => userSkill.toLowerCase().includes(skill.toLowerCase()))
      );
      const bestMatch =
        matchedSkills.length * 25 +
        Number(user.rating || 0) * 10 +
        Math.min(Number(user.reviewCount || 0), 40) +
        Math.min(Number(user.experienceYears || 0), 20) +
        (user.available ? 10 : 0);

      const review = latestReviewByFreelancer.get(user.id);

      return {
        id: user.id,
        name: user.fullName,
        avatar: user.avatar || null,
        title: user.jobTitle || "Freelancer",
        location: resolveLocationFromProfile(user, profileDetails) || null,
        hourlyRate,
        baseRate: hourlyRate,
        rating: Number(user.rating || 0),
        reviewsCount: Number(user.reviewCount || 0),
        skills: userSkills,
        bio: user.bio || "",
        languages,
        timeCommitment: resolveTimeCommitmentFromProfileDetails(profileDetails) || null,
        availability: resolveAvailabilityLabel({
          available: Boolean(user.available),
          profileDetails,
        }),
        projectExperience: Number(user.experienceYears || 0),
        portfolio: user.portfolio || null,
        profileDetails,
        portfolioProjects: profilePortfolio,
        freelancerProjects: freelancerProjectRows,
        bestMatch,
        internalReviewSnippet: review
          ? {
              rating: review.rating,
              notes: review.notes,
              by: review?.manager?.fullName || "PM",
              createdAt: toIsoOrNull(review.createdAt),
            }
          : null,
      };
    });

  freelancers.sort((left, right) => {
    if (sort === "best_match") return Number(right.bestMatch || 0) - Number(left.bestMatch || 0);
    return Number(right.rating || 0) - Number(left.rating || 0);
  });

  const pipeline = {
    activeInvites: await prisma.proposal.count({ where: { status: "PENDING", project: { managerId: userId } } }),
    unreadChats: await prisma.notification.count({ where: { userId, read: false, type: "chat" } }),
    activeInterviews: await prisma.appointment.count({
      where: {
        managerId: userId,
        status: { in: ["PENDING", "APPROVED"] },
        date: { gte: startOfDay(new Date()) },
      },
    }),
  };

  res.json({ data: { freelancers, pipeline } });
});

export const invitePmFreelancer = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const freelancerId = normalizeText(req.params?.freelancerId);
  const projectId = normalizeText(req.body?.projectId);
  const message = normalizeText(req.body?.message || "Invitation from Project Manager.");

  if (!freelancerId || !projectId) {
    throw new AppError("freelancerId and projectId are required.", 400);
  }

  await ensureAssignedPm({ projectId, pmId: userId });

  const freelancer = await prisma.user.findUnique({
    where: { id: freelancerId },
    select: { id: true, role: true, fullName: true },
  });
  if (!freelancer || !hasFreelancerRole(freelancer)) {
    throw new AppError("Freelancer not found.", 404);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, budget: true },
  });

  const existing = await prisma.proposal.findFirst({
    where: {
      projectId,
      freelancerId,
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  if (existing) {
    throw new AppError("This freelancer already has an active invite for this project.", 409);
  }

  const proposal = await prisma.proposal.create({
    data: {
      projectId,
      freelancerId,
      amount: Number(project?.budget || 0),
      coverLetter: message,
      status: "PENDING",
    },
  });

  await sendNotificationToUser(freelancerId, {
    type: "proposal",
    title: "Project invitation",
    message: `You have a new invite for "${project?.title || "project"}".`,
    data: { projectId, proposalId: proposal.id },
  }).catch(() => null);

  res.status(201).json({ data: proposal, message: "Freelancer invited." });
});

export const replacePmProjectFreelancer = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const projectId = normalizeText(req.params?.id);
  const freelancerId = normalizeText(req.body?.freelancerId || req.body?.newFreelancerId);

  if (!projectId || !freelancerId) {
    throw new AppError("projectId and freelancerId are required.", 400);
  }

  await ensureAssignedPm({ projectId, pmId: userId });

  const freelancer = await prisma.user.findUnique({
    where: { id: freelancerId },
    select: { id: true, role: true, fullName: true },
  });
  if (!freelancer || !hasFreelancerRole(freelancer)) {
    throw new AppError("Freelancer not found.", 404);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, fullName: true },
      },
      proposals: {
        where: { status: { in: ["ACCEPTED", "REPLACED"] } },
        include: {
          freelancer: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const currentAssignment = getAcceptedProposal(project);
  if (currentAssignment && String(currentAssignment.freelancerId || "") === String(freelancerId)) {
    throw new AppError("This freelancer is already assigned.", 400);
  }

  const directReassignmentCount = countPmFreelancerReassignments(project);
  const pendingApprovalRequest = await findOpenPmReassignmentApprovalRequest(projectId);
  if (directReassignmentCount >= MAX_PM_DIRECT_REASSIGNMENTS) {
    if (pendingApprovalRequest) {
      const pendingMeta = safeJsonParse(pendingApprovalRequest.notes, {});

      res.status(202).json({
        data: {
          approvalRequired: true,
          pendingApprovalId: pendingApprovalRequest.id,
          reassignmentCount: directReassignmentCount,
          maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
          requestedFreelancerId: pendingMeta.requestedFreelancerId || freelancer.id,
          requestedFreelancerName: pendingMeta.requestedFreelancerName || freelancer.fullName,
        },
        message: "Admin approval is already pending for an additional freelancer reassignment.",
      });
      return;
    }

    const approvalRequest = await prisma.adminEscalation.create({
      data: {
        projectId,
        raisedById: userId,
        reason: "Freelancer reassignment approval required",
        description: `Direct PM reassignment limit reached for "${project.title}". Approval requested to assign ${freelancer.fullName}.`,
        status: "OPEN",
        notes: JSON.stringify({
          source: PM_REASSIGNMENT_APPROVAL_SOURCE,
          requestedFreelancerId: freelancer.id,
          requestedFreelancerName: freelancer.fullName,
          previousFreelancerId: currentAssignment?.freelancerId || null,
          previousFreelancerName: currentAssignment?.freelancer?.fullName || null,
          directReassignmentCount,
          maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
          requestedAt: new Date().toISOString(),
        }),
      },
    });

    await notifyAdminsAboutPmReassignmentApproval({
      projectId,
      projectTitle: project.title,
      requestedByName: "Project Manager",
      freelancerName: freelancer.fullName,
    }).catch(() => null);

    res.status(202).json({
      data: {
        approvalRequired: true,
        pendingApprovalId: approvalRequest.id,
        reassignmentCount: directReassignmentCount,
        maxDirectReassignments: MAX_PM_DIRECT_REASSIGNMENTS,
        requestedFreelancerId: freelancer.id,
        requestedFreelancerName: freelancer.fullName,
      },
      message: "Direct reassignment limit reached. Approval request sent to Admin.",
    });
    return;
  }

  const currentRequests = getFreelancerChangeRequests(project);
  const hasPendingRequest = Boolean(getLatestPendingFreelancerChangeRequest(project));
  const replacementAmount = Number(currentAssignment?.amount || project?.budget || 0);
  const nextProjectStatus =
    project.status === "PAUSED"
      ? Number(project.spent || 0) > 0
        ? "IN_PROGRESS"
        : "OPEN"
      : project.status;

  await prisma.$transaction(async (tx) => {
    await tx.proposal.updateMany({
      where: { projectId, status: "ACCEPTED" },
      data: {
        status: "REPLACED",
        rejectionReason: "Reassigned by Project Manager to another freelancer.",
        rejectionReasonKey: "project_manager_reassignment",
      },
    });

    await tx.proposal.create({
      data: {
        projectId,
        freelancerId,
        amount: replacementAmount,
        coverLetter: hasPendingRequest
          ? "Reassigned by Project Manager after a client freelancer change request."
          : "Reassigned by Project Manager.",
        status: "ACCEPTED",
      },
    });

    await tx.project.update({
      where: { id: projectId },
      data: {
        status: nextProjectStatus,
        freelancerChangeRequests: resolveFreelancerChangeRequestsAfterAssignment({
          requests: currentRequests,
          resolverId: userId,
          replacementFreelancer: freelancer,
        }),
      },
    });
  });

  if (project.ownerId) {
    await sendNotificationToUser(project.ownerId, {
      type: "freelancer_change_resolved",
      title: "Freelancer updated",
      message: `${freelancer.fullName} has been assigned to "${project.title}".`,
      data: {
        projectId,
        freelancerId: freelancer.id,
      },
    }).catch(() => null);
  }

  await sendNotificationToUser(freelancer.id, {
    type: "proposal",
    title: "You were assigned to a project",
    message: `You have been assigned to "${project.title}".`,
    data: {
      projectId,
      status: "ACCEPTED",
    },
  }).catch(() => null);

  if (
    currentAssignment?.freelancerId &&
    String(currentAssignment.freelancerId) !== String(freelancer.id)
  ) {
    await sendNotificationToUser(currentAssignment.freelancerId, {
      type: "proposal",
      title: "Project assignment updated",
      message: `You have been removed from "${project.title}".`,
      data: {
        projectId,
        status: "REPLACED",
      },
    }).catch(() => null);
  }

  res.json({
    data: {
      projectId,
      freelancerId,
      previousFreelancerId: currentAssignment?.freelancerId || null,
    },
    message: `${freelancer.fullName} is now assigned to this project.`,
  });
});

export const getPmProfileSummary = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const [profile, pendingRequest] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { managerProfile: true },
    }),
    prisma.profileUpdateRequest.findFirst({
      where: { userId, userRole: PM_ROLE, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!profile) throw new AppError("Profile not found.", 404);

  res.json({
    data: {
      profile,
      pendingRequest,
    },
  });
});

export const createPmReport = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const category = normalizeText(req.body?.category);
  const projectId = normalizeText(req.body?.projectId);
  const description = normalizeText(req.body?.description);
  const severity = normalizeText(req.body?.severity || "MEDIUM").toUpperCase();
  const title = normalizeText(req.body?.title || category || "Incident report");
  const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

  if (!REPORT_CATEGORIES.includes(category)) throw new AppError("Invalid report category.", 400);
  if (!REPORT_SEVERITIES.includes(severity)) throw new AppError("Invalid report severity.", 400);
  if (!projectId || !description) throw new AppError("projectId and description are required.", 400);

  await ensureAssignedPm({ projectId, pmId: userId });

  const report = await prisma.adminEscalation.create({
    data: {
      projectId,
      raisedById: userId,
      reason: title,
      description,
      status: "OPEN",
      notes: JSON.stringify({
        source: "PM_REPORT",
        category,
        severity,
        title,
        attachments,
      }),
    },
    include: { project: { select: { id: true, title: true } } },
  });

  res.status(201).json({ data: report, message: "Report submitted." });
});

export const listPmReports = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const reports = await prisma.adminEscalation.findMany({
    where: {
      raisedById: userId,
      notes: { contains: '"source":"PM_REPORT"' },
    },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: reports });
});

export const getPmReportDetails = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  const reportId = normalizeText(req.params?.id);
  if (!userId) throw new AppError("Authentication required", 401);

  const report = await prisma.adminEscalation.findUnique({
    where: { id: reportId },
    include: { project: { select: { id: true, title: true } } },
  });

  if (!report || String(report.raisedById || "") !== String(userId)) {
    throw new AppError("Report not found.", 404);
  }

  res.json({ data: report });
});
export const createPmProjectSetup = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const step1 = req.body?.step1 || {};
  const step2 = req.body?.step2 || {};
  const step3 = req.body?.step3 || {};

  const projectName = normalizeText(step1.projectName || step1.title);
  const clientId = normalizeText(step1.clientId);
  const category = normalizeText(step1.category || "General");
  const description = normalizeText(step1.description || step1.brief);
  const visibility = normalizeText(step1.visibility || "private");

  const totalBudget = Number(step2.totalBudget || step2.budget || 0);
  const timeline = normalizeText(step2.timeline || step2.estimatedTimeline);
  const milestones = Array.isArray(step2.milestones) ? step2.milestones : [];

  const assignPmId = normalizeText(step3.assignPmId || userId) || userId;
  const freelancerId = normalizeText(step3.freelancerId);
  const shortlist = Array.isArray(step3.shortlistTalentIds)
    ? step3.shortlistTalentIds.map((entry) => normalizeText(entry)).filter(Boolean)
    : [];

  if (!projectName || !description || !clientId) {
    throw new AppError("projectName, description, and clientId are required.", 400);
  }
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    throw new AppError("Valid total budget is required.", 400);
  }

  const milestoneTotal = milestones.reduce((sum, row) => sum + Number(row?.percentage || 0), 0);
  if (milestones.length && Math.round(milestoneTotal) !== 100) {
    throw new AppError("Milestone breakdown must total 100%.", 400);
  }

  const client = await prisma.user.findUnique({ where: { id: clientId }, select: { id: true, role: true } });
  if (!client || client.role !== "CLIENT") {
    throw new AppError("Client not found or invalid role.", 400);
  }

  const assignedPm = await prisma.user.findUnique({
    where: { id: assignPmId },
    select: { id: true, role: true, status: true },
  });
  if (!assignedPm || assignedPm.role !== PM_ROLE || assignedPm.status !== "ACTIVE") {
    throw new AppError("Assigned PM must be an active Project Manager.", 400);
  }

  const activeCount = await prisma.project.count({
    where: {
      managerId: assignPmId,
      status: { notIn: NON_ACTIVE_PROJECT_STATUSES },
    },
  });

  if (activeCount >= MAX_ACTIVE_PROJECTS) {
    throw new AppError("Assigned PM already has maximum active projects (10).", 403);
  }

  const setupMeta = {
    source: "PM_PROJECT_SETUP",
    category,
    visibility,
    timeline,
    milestones,
    teamAlignment: {
      meetingPreferences: step3.meetingPreferences || null,
      communicationSetup: step3.communicationSetup || null,
      shortlist,
    },
  };

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        title: projectName,
        description,
        budget: Math.round(totalBudget),
        status: "OPEN",
        ownerId: clientId,
        managerId: assignPmId,
        notes: JSON.stringify(setupMeta),
      },
      select: {
        id: true,
        title: true,
        budget: true,
        createdAt: true,
      },
    });

    if (freelancerId) {
      const freelancer = await tx.user.findUnique({
        where: { id: freelancerId },
        select: { id: true, role: true },
      });

      if (!freelancer || freelancer.role !== "FREELANCER") {
        throw new AppError("Assigned freelancer is invalid.", 400);
      }

      await tx.proposal.create({
        data: {
          projectId: createdProject.id,
          freelancerId,
          amount: Math.round(totalBudget),
          coverLetter: "Assigned via PM project setup flow.",
          status: "ACCEPTED",
        },
      });
    }

    for (const shortlistedFreelancerId of Array.from(new Set(shortlist))) {
      if (!shortlistedFreelancerId || shortlistedFreelancerId === freelancerId) continue;

      const freelancer = await tx.user.findUnique({
        where: { id: shortlistedFreelancerId },
        select: { id: true, role: true },
      });
      if (!freelancer || freelancer.role !== "FREELANCER") continue;

      await tx.proposal.create({
        data: {
          projectId: createdProject.id,
          freelancerId: shortlistedFreelancerId,
          amount: Math.round(totalBudget),
          coverLetter: "Shortlisted via PM project setup flow.",
          status: "PENDING",
        },
      });
    }

    return createdProject;
  });

  res.status(201).json({
    data: {
      projectId: project.id,
      projectName: project.title,
      budgetRange: project.budget,
      timeline,
      createdAt: toIsoOrNull(project.createdAt),
    },
    message: "Project published successfully.",
  });
});

export const getPmNotificationSnapshot = asyncHandler(async (req, res) => {
  const userId = getRequestUserId(req);
  if (!userId) throw new AppError("Authentication required", 401);

  const [alerts, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  res.json({
    data: {
      unreadCount,
      recentAlerts: alerts,
    },
  });
});
