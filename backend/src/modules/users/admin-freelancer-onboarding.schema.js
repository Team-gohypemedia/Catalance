import { z } from "zod";

const submissionStatusValues = ["ALL", "DRAFT", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"];
const accountStatusValues = ["ALL", "ACTIVE", "PENDING_APPROVAL", "SUSPENDED"];
const statusActionValues = ["approve", "reject", "archive", "reopen", "mark_draft"];

export const listFreelancerOnboardingSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().max(255).optional(),
    submissionStatus: z.enum(submissionStatusValues).optional(),
    accountStatus: z.enum(accountStatusValues).optional(),
    service: z.string().trim().max(100).optional(),
    kycVerified: z.union([z.boolean(), z.enum(["true", "false", "ALL"])]).optional(),
    onboardingComplete: z.union([z.boolean(), z.enum(["true", "false"]) ]).optional(),
    from: z.string().trim().optional(),
    to: z.string().trim().optional(),
  }).passthrough(),
});

export const onboardingSubmissionIdParamsSchema = z.object({
  params: z.object({
    submissionId: z.string().trim().min(1),
  }),
});

export const onboardingStatusActionSchema = z.object({
  params: z.object({
    submissionId: z.string().trim().min(1),
  }),
  body: z.object({
    action: z.enum(statusActionValues),
    reason: z.string().trim().max(500).optional(),
  }).passthrough(),
});

const optionalString = z.string().trim().max(1000).optional().nullable();
const optionalBoolean = z.union([z.boolean(), z.enum(["true", "false"])]).optional();

export const onboardingSubmissionWriteSchema = z.object({
  params: z.object({
    submissionId: z.string().trim().min(1).optional(),
  }).optional(),
  body: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().optional(),
    phoneNumber: z.string().trim().max(32).optional().nullable(),
    password: z.string().min(8).max(72).optional(),
    status: z.enum(["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"]).optional(),
    onboardingComplete: optionalBoolean,
    isVerified: optionalBoolean,
    profileVerified: optionalBoolean,
    profileRole: z.string().trim().max(50).optional(),
    professionalTitle: z.string().trim().max(120).optional(),
    username: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    languages: z.array(z.string().trim().max(50)).optional(),
    otherLanguage: z.string().trim().max(50).optional(),
    professionalBio: z.string().trim().max(20000).optional(),
    services: z.array(z.string().trim().max(100)).optional(),
    avatar: optionalString,
    coverImage: optionalString,
    resume: optionalString,
    portfolioUrl: optionalString,
    linkedinUrl: optionalString,
    githubUrl: optionalString,
    acceptInProgressProjects: optionalBoolean,
    deliveryPolicyAccepted: optionalBoolean,
    communicationPolicyAccepted: optionalBoolean,
    termsAccepted: optionalBoolean,
    availabilityHoursPerWeek: z.string().trim().max(50).optional(),
    availabilityStartTimeline: z.string().trim().max(80).optional(),
    availabilityWorkingSchedule: z.string().trim().max(100).optional(),
    reliabilityDelayHandling: z.string().trim().max(200).optional(),
    reliabilityMissedDeadlines: z.string().trim().max(200).optional(),
    serviceDetails: z.record(z.any()).optional(),
    profileDetails: z.record(z.any()).optional(),
  }).passthrough(),
});
