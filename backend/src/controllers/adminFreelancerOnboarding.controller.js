import crypto from "crypto";
import { Prisma, prisma } from "../lib/prisma.js";
import { sendNotificationToUser } from "../lib/notification-util.js";
import {
  FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT,
} from "../modules/users/freelancer-profile.select.js";
import { buildFreelancerProfileDetailsObject } from "../modules/users/freelancer-profile-details.mapper.js";
import {
  createUser,
  updateUserProfile,
} from "../modules/users/user.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const ACCOUNT_STATUSES = new Set(["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"]);
const SUBMISSION_STATUSES = new Set([
  "ALL",
  "DRAFT",
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);
const STATUS_ACTIONS = new Set([
  "approve",
  "reject",
  "archive",
  "reopen",
  "mark_draft",
]);
const USER_SELECT = Object.freeze({
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  phone: true,
  avatar: true,
  role: true,
  roles: true,
  status: true,
  onboardingComplete: true,
  isVerified: true,
  suspendedAt: true,
  createdAt: true,
  updatedAt: true,
  freelancerProfile: {
    select: FREELANCER_PROFILE_WITH_PROFILE_DETAILS_SELECT,
  },
});
const DETAIL_SELECT = Object.freeze({
  ...USER_SELECT,
  freelancerProjects: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
  marketplace: {
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      service: true,
      serviceKey: true,
      serviceDetails: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  proposals: {
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  _count: {
    select: {
      proposals: true,
      freelancerProjects: true,
      marketplace: true,
    },
  },
});

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const normalizeText = (value = "") => String(value || "").trim();

const normalizeNullableText = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeEmail = (value = "") => normalizeText(value).toLowerCase();

const normalizeServiceKey = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return undefined;
};

const parseStringArray = (value) => {
  const entries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      entries
        .map((entry) => normalizeText(entry))
        .filter(Boolean),
    ),
  );
};

const parseServiceArray = (value) =>
  parseStringArray(value)
    .map((entry) => normalizeServiceKey(entry))
    .filter(Boolean);

const parseObject = (value) => (isPlainObject(value) ? value : {});

const parseProfileDetailsFromPayload = (body = {}) => {
  const explicitDetails = parseObject(body.profileDetails || body.profile);
  const explicitIdentity = parseObject(explicitDetails.identity);
  const explicitAvailability = parseObject(explicitDetails.availability);
  const explicitReliability = parseObject(explicitDetails.reliability);
  const services = parseServiceArray(
    body.services ||
      explicitDetails.services ||
      body.serviceKeys ||
      body.serviceKey,
  );
  const serviceDetails = parseObject(
    body.serviceDetails || explicitDetails.serviceDetails,
  );
  const professionalBio = normalizeText(
    body.professionalBio ??
      body.bio ??
      explicitDetails.professionalBio ??
      "",
  );
  const profileRole = normalizeText(
    body.profileRole ?? explicitDetails.profileRole ?? explicitDetails.role ?? "",
  ) || "individual";
  const professionalTitle = normalizeText(
    body.professionalTitle ??
      explicitIdentity.professionalTitle ??
      explicitDetails.professionalTitle ??
      "",
  );
  const username = normalizeText(
    body.username ??  
      explicitIdentity.username ??  
      explicitDetails.username ??  
      "",
  ).toLowerCase();
  const country = normalizeText(
    body.country ?? explicitIdentity.country ?? explicitDetails.country ?? "",
  );
  const city = normalizeText(
    body.city ??
      body.state ??
      explicitIdentity.city ??
      explicitDetails.city ??
      "",
  );
  const languages = parseStringArray(
    body.languages ?? explicitIdentity.languages ?? explicitDetails.languages,
  );
  const profilePhoto = normalizeNullableText(
    body.profilePhoto ??  
      explicitIdentity.profilePhoto ??  
      explicitDetails.profilePhoto ??  
      body.avatar,
  );
  const coverImage = normalizeNullableText(
    body.coverImage ?? explicitIdentity.coverImage ?? explicitDetails.coverImage,
  );
  const portfolioUrl = normalizeNullableText(
    body.portfolioUrl ?? explicitIdentity.portfolioUrl ?? explicitDetails.portfolioUrl,
  );
  const linkedinUrl = normalizeNullableText(
    body.linkedinUrl ?? explicitIdentity.linkedinUrl ?? explicitDetails.linkedinUrl,
  );
  const githubUrl = normalizeNullableText(
    body.githubUrl ?? explicitIdentity.githubUrl ?? explicitDetails.githubUrl,
  );
  const otherLanguage = normalizeNullableText(
    body.otherLanguage ?? explicitIdentity.otherLanguage ?? explicitDetails.otherLanguage,
  );
  const acceptInProgressProjects = parseBoolean(
    body.acceptInProgressProjects ??  
      explicitDetails.acceptInProgressProjects,
  );
  const deliveryPolicyAccepted = parseBoolean(
    body.deliveryPolicyAccepted ??
      explicitDetails.deliveryPolicyAccepted,
  );
  const communicationPolicyAccepted = parseBoolean(
    body.communicationPolicyAccepted ??  
      explicitDetails.communicationPolicyAccepted,
  );
  const termsAccepted = parseBoolean(body.termsAccepted ?? explicitDetails.termsAccepted);
  const availabilityHoursPerWeek = normalizeNullableText(
    body.availabilityHoursPerWeek ??
      explicitAvailability.hoursPerWeek ??
      explicitDetails.availabilityHoursPerWeek,
  );
  const availabilityStartTimeline = normalizeNullableText(
    body.availabilityStartTimeline ??
      explicitAvailability.startTimeline ??
      explicitDetails.availabilityStartTimeline,
  );
  const availabilityWorkingSchedule = normalizeNullableText(
    body.availabilityWorkingSchedule ??
      explicitAvailability.workingSchedule ??
      explicitDetails.availabilityWorkingSchedule,
  );
  const reliabilityDelayHandling = normalizeNullableText(
    body.reliabilityDelayHandling ??
      explicitReliability.delayHandling ??
      explicitDetails.reliabilityDelayHandling,
  );
  const reliabilityMissedDeadlines = normalizeNullableText(
    body.reliabilityMissedDeadlines ??
      explicitReliability.missedDeadlines ??
      explicitDetails.reliabilityMissedDeadlines,
  );

  return {
    ...explicitDetails,
    profileDetailsVersion: Number(explicitDetails.profileDetailsVersion) || 3,
    role: profileRole,
    profileRole,
    professionalTitle,
    professionalBio,
    services,
    serviceDetails,
    termsAccepted: typeof termsAccepted === "boolean" ? termsAccepted : explicitDetails.termsAccepted ?? null,
    acceptInProgressProjects:
      typeof acceptInProgressProjects === "boolean"
        ? acceptInProgressProjects
        : explicitDetails.acceptInProgressProjects ?? null,
    deliveryPolicyAccepted:
      typeof deliveryPolicyAccepted === "boolean"
        ? deliveryPolicyAccepted
        : Boolean(explicitDetails.deliveryPolicyAccepted),
    communicationPolicyAccepted:
      typeof communicationPolicyAccepted === "boolean"
        ? communicationPolicyAccepted
        : Boolean(explicitDetails.communicationPolicyAccepted),
    identity: {
      ...explicitIdentity,
      fullName: normalizeText(body.fullName ?? explicitIdentity.fullName ?? ""),
      username,
      country,
      city,
      languages,
      profilePhoto,
      coverImage,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      professionalTitle,
      otherLanguage,
    },
    availability: {
      ...explicitAvailability,
      hoursPerWeek: availabilityHoursPerWeek,
      startTimeline: availabilityStartTimeline,
      workingSchedule: availabilityWorkingSchedule,
    },
    reliability: {
      ...explicitReliability,
      delayHandling: reliabilityDelayHandling,
      missedDeadlines: reliabilityMissedDeadlines,
    },
  };
};

const resolveSubmissionStatus = (user = {}) => {
  const accountStatus = normalizeText(user.status).toUpperCase();

  if (accountStatus === "SUSPENDED") {
    return "ARCHIVED";
  }

  if (user.onboardingComplete && accountStatus === "ACTIVE") {
    return "APPROVED";
  }

  if (user.onboardingComplete && accountStatus === "PENDING_APPROVAL") {
    return "SUBMITTED";
  }

  return "DRAFT";
};

const mapOnboardingSubmission = (user = {}, { detail = false } = {}) => {
  const freelancerProfile = isPlainObject(user.freelancerProfile)
    ? user.freelancerProfile
    : {};
  const profileDetails = buildFreelancerProfileDetailsObject(freelancerProfile);
  const identity = parseObject(profileDetails.identity);
  const services = Array.isArray(profileDetails.services)
    ? profileDetails.services
    : Array.isArray(freelancerProfile.services)
      ? freelancerProfile.services
      : [];

  const base = {
    id: user.id,
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || user.phone || null,
    avatar: user.avatar || identity.profilePhoto || freelancerProfile.profilePhoto || null,
    role: user.role,
    roles: Array.isArray(user.roles) ? user.roles : [],
    accountStatus: user.status,
    submissionStatus: resolveSubmissionStatus(user),
    onboardingComplete: Boolean(user.onboardingComplete),
    kycVerified: Boolean(user.isVerified),
    profileVerified: Boolean(freelancerProfile.isVerified),
    suspendedAt: user.suspendedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profileUpdatedAt: freelancerProfile.updatedAt || null,
    profileRole:
      profileDetails.role || profileDetails.profileRole || freelancerProfile.profileRole || null,
    username: identity.username || freelancerProfile.username || null,
    location: [identity.city || freelancerProfile.city, identity.country || freelancerProfile.country]
      .filter(Boolean)
      .join(", "),
    professionalBio:
      profileDetails.professionalBio || freelancerProfile.professionalBio || "",
    services,
    serviceCount: services.length,
  };

  if (!detail) {
    return base;
  }

  return {
    ...base,
    profileDetails,
    freelancerProfile,
    marketplace: Array.isArray(user.marketplace) ? user.marketplace : [],
    freelancerProjects: Array.isArray(user.freelancerProjects)
      ? user.freelancerProjects
      : [],
    proposals: Array.isArray(user.proposals) ? user.proposals : [],
    counts: user._count || {},
  };
};

const getPagination = (query = {}) => {
  const page = Math.max(parseInteger(query.page, 1), 1);
  const limit = Math.min(Math.max(parseInteger(query.limit, 20), 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const addAndFilter = (where, condition) => {
  if (!condition) return;
  where.AND = Array.isArray(where.AND) ? where.AND : [];
  where.AND.push(condition);
};

const buildSubmissionWhere = (query = {}, { includeSubmissionStatus = true } = {}) => {
  const search = normalizeText(query.search);
  const accountStatus = normalizeText(query.accountStatus || query.status).toUpperCase();
  const submissionStatus = normalizeText(query.submissionStatus).toUpperCase();
  const service = normalizeServiceKey(query.service || query.serviceKey);
  const kycVerified = parseBoolean(query.kycVerified ?? query.isVerified);
  const onboardingComplete = parseBoolean(query.onboardingComplete);
  const fromDate = query.from ? new Date(query.from) : null;
  const toDate = query.to ? new Date(query.to) : null;
  const where = {
    role: { not: "ADMIN" },
    OR: [
      { role: "FREELANCER" },
      { roles: { has: "FREELANCER" } },
      { freelancerProfile: { isNot: null } },
    ],
  };

  if (search) {
    addAndFilter(where, {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        {
          freelancerProfile: {
            is: {
              username: { contains: search, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (ACCOUNT_STATUSES.has(accountStatus)) {
    addAndFilter(where, { status: accountStatus });
  }

  if (typeof kycVerified === "boolean") {
    addAndFilter(where, { isVerified: kycVerified });
  }

  if (typeof onboardingComplete === "boolean") {
    addAndFilter(where, { onboardingComplete });
  }

  if (service) {
    addAndFilter(where, {
      freelancerProfile: {
        is: {
          services: { has: service },
        },
      },
    });
  }

  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    addAndFilter(where, { updatedAt: { gte: fromDate } });
  }

  if (toDate && !Number.isNaN(toDate.getTime())) {
    addAndFilter(where, { updatedAt: { lte: toDate } });
  }

  if (
    includeSubmissionStatus &&
    SUBMISSION_STATUSES.has(submissionStatus) &&
    submissionStatus !== "ALL"
  ) {
    if (submissionStatus === "DRAFT") {
      addAndFilter(where, {
        onboardingComplete: false,
        status: { not: "SUSPENDED" },
      });
    } else if (submissionStatus === "SUBMITTED" || submissionStatus === "PENDING") {
      addAndFilter(where, {
        onboardingComplete: true,
        status: "PENDING_APPROVAL",
      });
    } else if (submissionStatus === "APPROVED") {
      addAndFilter(where, {
        onboardingComplete: true,
        status: "ACTIVE",
      });
    } else if (submissionStatus === "REJECTED" || submissionStatus === "ARCHIVED") {
      addAndFilter(where, { status: "SUSPENDED" });
    }
  }

  return where;
};

const getSubmissionStats = async (baseWhere) => {
  const withoutStatus = {
    ...baseWhere,
    AND: Array.isArray(baseWhere.AND) ? [...baseWhere.AND] : undefined,
  };

  const [total, drafts, submitted, approved, archived] = await Promise.all([
    prisma.user.count({ where: withoutStatus }),
    prisma.user.count({
      where: {
        ...withoutStatus,
        onboardingComplete: false,
        status: { not: "SUSPENDED" },
      },
    }),
    prisma.user.count({
      where: {
        ...withoutStatus,
        onboardingComplete: true,
        status: "PENDING_APPROVAL",
      },
    }),
    prisma.user.count({
      where: {
        ...withoutStatus,
        onboardingComplete: true,
        status: "ACTIVE",
      },
    }),
    prisma.user.count({
      where: {
        ...withoutStatus,
        status: "SUSPENDED",
      },
    }),
  ]);

  return {
    total,
    drafts,
    submitted,
    approved,
    archived,
  };
};

const buildFacets = async () => {
  const services = await prisma.freelancerProfile.findMany({
    where: {
      services: { isEmpty: false },
    },
    select: {
      services: true,
    },
    take: 500,
  });
  const serviceKeys = Array.from(
    new Set(
      services
        .flatMap((row) => (Array.isArray(row.services) ? row.services : []))
        .map((entry) => normalizeServiceKey(entry))
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    services: serviceKeys,
    submissionStatuses: ["DRAFT", "SUBMITTED", "APPROVED", "ARCHIVED"],
    accountStatuses: Array.from(ACCOUNT_STATUSES),
  };
};

const validateEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

const validateUsername = (value) => {
  const username = normalizeText(value);
  if (!username) return true;
  return /^[a-z0-9]{3,20}$/.test(username);
};

const assertCompletableSubmission = ({ fullName, email, profileDetails }) => {
  const services = parseServiceArray(profileDetails.services);

  if (normalizeText(fullName).length < 2) {
    throw new AppError("Full name is required before submission can be completed.", 400);
  }

  if (!validateEmail(email)) {
    throw new AppError("A valid email is required before submission can be completed.", 400);
  }

  if (!normalizeText(profileDetails.professionalBio)) {
    throw new AppError("Professional bio is required before submission can be completed.", 400);
  }

  if (!services.length) {
    throw new AppError("At least one service is required before submission can be completed.", 400);
  }
};

const normalizeSubmissionPayload = (body = {}, { isCreate = false } = {}) => {
  const fullName = normalizeText(body.fullName);
  const email = normalizeEmail(body.email);
  const phoneNumber = normalizeNullableText(body.phoneNumber ?? body.phone);
  const status = normalizeText(body.status || body.accountStatus).toUpperCase();
  const onboardingComplete = parseBoolean(body.onboardingComplete);
  const isVerified = parseBoolean(body.isVerified ?? body.kycVerified);
  const profileVerified = parseBoolean(body.profileVerified);
  const profileDetails = parseProfileDetailsFromPayload(body);
  const password = normalizeText(body.password);
  const avatar = normalizeNullableText(body.avatar || profileDetails.identity?.profilePhoto);
  const resume = normalizeNullableText(body.resume);

  if (isCreate) {
    if (fullName.length < 2) {
      throw new AppError("Full name must be at least 2 characters.", 400);
    }

    if (!validateEmail(email)) {
      throw new AppError("A valid email is required.", 400);
    }
  }

  if (email && !validateEmail(email)) {
    throw new AppError("A valid email is required.", 400);
  }

  if (password && password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400);
  }

  if (status && !ACCOUNT_STATUSES.has(status)) {
    throw new AppError("Invalid account status.", 400);
  }

  if (!validateUsername(profileDetails.identity?.username)) {
    throw new AppError(
      "Username must be 3-20 characters and contain only lowercase letters and numbers.",
      400,
    );
  }

  if (onboardingComplete === true || status === "ACTIVE") {
    assertCompletableSubmission({ fullName, email, profileDetails });
  }

  return {
    fullName,
    email,
    phoneNumber,
    status,
    onboardingComplete,
    isVerified,
    profileVerified,
    profileDetails,
    password,
    avatar,
    resume,
  };
};

const buildUpdateProfilePayload = (payload = {}) => {
  const updates = {
    profileDetails: payload.profileDetails,
    professionalBio: normalizeText(payload.profileDetails?.professionalBio),
    services: parseServiceArray(payload.profileDetails?.services),
  };

  if (payload.fullName) updates.fullName = payload.fullName;
  if (payload.email) updates.email = payload.email;
  if (payload.phoneNumber !== null) updates.phoneNumber = payload.phoneNumber;
  if (payload.avatar) updates.avatar = payload.avatar;
  if (payload.resume !== null) updates.resume = payload.resume;
  if (typeof payload.onboardingComplete === "boolean") {
    updates.onboardingComplete = payload.onboardingComplete;
  }
  if (typeof payload.profileDetails?.acceptInProgressProjects === "boolean") {
    updates.acceptInProgressProjects = payload.profileDetails.acceptInProgressProjects;
  }

  if (payload.profileDetails?.identity && typeof payload.profileDetails.identity === "object") {
    updates.profileDetails = {
      ...payload.profileDetails,
      identity: {
        ...payload.profileDetails.identity,
      },
    };
  }

  return updates;
};

const ensureFreelancerRole = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, roles: true },
  });

  if (!user) {
    throw new AppError("Freelancer onboarding submission not found.", 404);
  }

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const hasFreelancerRole = user.role === "FREELANCER" || roles.includes("FREELANCER");
  if (hasFreelancerRole) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      roles: Array.from(new Set([...roles, user.role, "FREELANCER"].filter(Boolean))),
    },
  });
};

const updateSubmissionState = async ({
  userId,
  status,
  onboardingComplete,
  isVerified,
  profileVerified,
}) => {
  const userUpdates = {};
  const profileUpdates = {};

  if (status) {
    userUpdates.status = status;
    if (status === "SUSPENDED") {
      userUpdates.suspendedAt = new Date();
    } else if (status === "ACTIVE") {
      userUpdates.suspendedAt = null;
    }
  }

  if (typeof onboardingComplete === "boolean") {
    userUpdates.onboardingComplete = onboardingComplete;
  }

  if (typeof isVerified === "boolean") {
    userUpdates.isVerified = isVerified;
  }

  if (typeof profileVerified === "boolean") {
    profileUpdates.isVerified = profileVerified;
  }

  if (Object.keys(userUpdates).length) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdates,
    });
  }

  if (Object.keys(profileUpdates).length) {
    await prisma.freelancerProfile.upsert({
      where: { userId },
      update: profileUpdates,
      create: { userId, ...profileUpdates },
    });
  }
};

const notifySubmissionStatus = async ({ userId, action, reason }) => {
  const messageByAction = {
    approve: "Your freelancer onboarding was approved. You can now access freelancer workspace features.",
    reject: "Your freelancer onboarding was rejected. Please contact Catalance support for next steps.",
    archive: "Your freelancer onboarding record was archived by an administrator.",
    reopen: "Your freelancer onboarding was reopened for review.",
    mark_draft: "Your freelancer onboarding was moved back to draft.",
  };
  const titleByAction = {
    approve: "Freelancer onboarding approved",
    reject: "Freelancer onboarding rejected",
    archive: "Freelancer onboarding archived",
    reopen: "Freelancer onboarding reopened",
    mark_draft: "Freelancer onboarding draft updated",
  };
  const baseMessage = messageByAction[action] || "Your freelancer onboarding status changed.";
  const reasonText = normalizeText(reason);

  try {
    await sendNotificationToUser(userId, {
      type: "system",
      title: titleByAction[action] || "Freelancer onboarding updated",
      message: reasonText ? `${baseMessage} Reason: ${reasonText}` : baseMessage,
      data: {
        module: "freelancer_onboarding",
        action,
      },
    });
  } catch (error) {
    console.error("Failed to notify freelancer onboarding status change:", error);
  }
};

const getSubmissionOrThrow = async (userId) => {
  const submission = await prisma.user.findUnique({
    where: { id: userId },
    select: DETAIL_SELECT,
  });

  if (!submission) {
    throw new AppError("Freelancer onboarding submission not found.", 404);
  }

  return submission;
};

export const listFreelancerOnboardingSubmissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = buildSubmissionWhere(req.query);
  const baseWhere = buildSubmissionWhere(req.query, {
    includeSubmissionStatus: false,
  });
  const [total, users, stats, facets] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    getSubmissionStats(baseWhere),
    buildFacets(),
  ]);

  res.json({
    data: {
      submissions: users.map((user) => mapOnboardingSubmission(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      stats,
      facets,
    },
  });
});

export const getFreelancerOnboardingSubmission = asyncHandler(async (req, res) => {
  const submission = await getSubmissionOrThrow(req.params.submissionId);

  res.json({
    data: {
      submission: mapOnboardingSubmission(submission, { detail: true }),
    },
  });
});

export const createFreelancerOnboardingSubmission = asyncHandler(async (req, res) => {
  const payload = normalizeSubmissionPayload(req.body, { isCreate: true });
  const password = payload.password || crypto.randomBytes(18).toString("base64url");

  let createdUser;
  try {
    createdUser = await createUser({
      fullName: payload.fullName,
      email: payload.email,
      password,
      role: "FREELANCER",
      roles: ["FREELANCER"],
      bio: payload.profileDetails.professionalBio,
      freelancerProfile: payload.profileDetails,
      services: parseServiceArray(payload.profileDetails.services),
      resume: payload.resume,
      avatar: payload.avatar,
      onboardingComplete: payload.onboardingComplete === true,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("A user with that email already exists.", 409);
    }
    throw error;
  }

  await updateUserProfile(createdUser.id, buildUpdateProfilePayload(payload));
  await ensureFreelancerRole(createdUser.id);
  await updateSubmissionState({
    userId: createdUser.id,
    status: payload.status || "PENDING_APPROVAL",
    onboardingComplete: payload.onboardingComplete === true,
    isVerified: payload.isVerified,
    profileVerified: payload.profileVerified,
  });

  const submission = await getSubmissionOrThrow(createdUser.id);
  res.status(201).json({
    data: {
      submission: mapOnboardingSubmission(submission, { detail: true }),
      generatedPassword: payload.password ? null : password,
    },
  });
});

export const updateFreelancerOnboardingSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const payload = normalizeSubmissionPayload(req.body);

  await getSubmissionOrThrow(submissionId);
  await updateUserProfile(submissionId, buildUpdateProfilePayload(payload));
  await ensureFreelancerRole(submissionId);
  await updateSubmissionState({
    userId: submissionId,
    status: payload.status,
    onboardingComplete: payload.onboardingComplete,
    isVerified: payload.isVerified,
    profileVerified: payload.profileVerified,
  });

  const submission = await getSubmissionOrThrow(submissionId);
  res.json({
    data: {
      submission: mapOnboardingSubmission(submission, { detail: true }),
    },
  });
});

export const updateFreelancerOnboardingStatus = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const action = normalizeText(req.body.action).toLowerCase();
  const reason = normalizeText(req.body.reason);

  if (!STATUS_ACTIONS.has(action)) {
    throw new AppError("Invalid onboarding status action.", 400);
  }

  const submission = await getSubmissionOrThrow(submissionId);
  const profileDetails = buildFreelancerProfileDetailsObject(
    submission.freelancerProfile,
  );

  if (action === "approve") {
    assertCompletableSubmission({
      fullName: submission.fullName,
      email: submission.email,
      profileDetails,
    });
  }

  const stateByAction = {
    approve: {
      status: "ACTIVE",
      onboardingComplete: true,
      isVerified: true,
      profileVerified: true,
    },
    reject: {
      status: "SUSPENDED",
      onboardingComplete: submission.onboardingComplete,
      isVerified: false,
      profileVerified: false,
    },
    archive: {
      status: "SUSPENDED",
      onboardingComplete: submission.onboardingComplete,
    },
    reopen: {
      status: "PENDING_APPROVAL",
      onboardingComplete: true,
    },
    mark_draft: {
      status: "PENDING_APPROVAL",
      onboardingComplete: false,
    },
  };

  await updateSubmissionState({
    userId: submissionId,
    ...stateByAction[action],
  });
  await notifySubmissionStatus({ userId: submissionId, action, reason });

  const updatedSubmission = await getSubmissionOrThrow(submissionId);
  res.json({
    data: {
      submission: mapOnboardingSubmission(updatedSubmission, { detail: true }),
    },
  });
});

export const archiveFreelancerOnboardingSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  await getSubmissionOrThrow(submissionId);
  await updateSubmissionState({
    userId: submissionId,
    status: "SUSPENDED",
  });
  await notifySubmissionStatus({
    userId: submissionId,
    action: "archive",
    reason: req.body?.reason,
  });

  res.status(204).send();
});
