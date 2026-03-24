import { z } from "zod";

const projectStatusEnum = z.enum(["DRAFT", "OPEN", "IN_PROGRESS", "AWAITING_PAYMENT", "COMPLETED", "PAUSED"]);
const proposalStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
const optionalTextField = z.string().trim().max(50000).optional();
const optionalTextListField = z.array(z.string().trim().min(1).max(500)).optional();

const proposalPayload = z
  .object({
    coverLetter: z.string().min(1),
    amount: z.coerce.number().int().nonnegative().default(0),
    status: proposalStatusEnum.optional(),
    freelancerId: z.string().cuid().optional()
  })
  .partial({ status: true, freelancerId: true });

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    description: z.string().min(4),
    budget: z.coerce.number().int().nonnegative().optional(),
    proposalContent: optionalTextField,
    serviceKey: z.string().trim().max(160).optional(),
    clientName: optionalTextField,
    businessName: optionalTextField,
    serviceType: optionalTextField,
    projectOverview: optionalTextField,
    primaryObjectives: optionalTextListField,
    featuresDeliverables: optionalTextListField,
    timeline: optionalTextField,
    budgetSummary: optionalTextField,
    websiteType: optionalTextField,
    designStyle: optionalTextField,
    websiteBuildType: optionalTextField,
    frontendFramework: optionalTextField,
    backendTechnology: optionalTextField,
    databaseType: optionalTextField,
    hosting: optionalTextField,
    pageCount: optionalTextField,
    creativeType: optionalTextField,
    volume: optionalTextField,
    engagementModel: optionalTextField,
    brandStage: optionalTextField,
    brandDeliverables: optionalTextListField,
    targetAudience: optionalTextField,
    businessCategory: optionalTextField,
    targetLocations: optionalTextListField,
    seoGoals: optionalTextListField,
    duration: optionalTextField,
    appType: optionalTextField,
    appFeatures: optionalTextListField,
    platformRequirements: optionalTextListField,
    status: projectStatusEnum.optional(),
    proposal: proposalPayload.optional()
  })
});

