import { z } from "zod";

const proposalStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED", "DRAFT"]);

export const createProposalSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    coverLetter: z.string().min(1),
    amount: z.coerce.number().int().nonnegative(),
    status: proposalStatusEnum.optional(),
    freelancerId: z.string().cuid().optional()
  })
});

export const listProposalsSchema = z.object({
  query: z.object({
    as: z.enum(["owner", "freelancer"]).optional()
  })
});

export const updateProposalSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z
    .object({
      coverLetter: z.string().min(1).optional(),
      amount: z.coerce.number().int().nonnegative().optional()
    })
    .refine(
      (value) => value.coverLetter !== undefined || value.amount !== undefined,
      {
        message: "At least one proposal field must be provided"
      }
    )
});
