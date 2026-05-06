import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1)
});

const optionSchema = z.object({
  id: z.string().min(1).max(8),
  text: z.string().min(1).max(500)
});

export const submitDailyChallengeSchema = z.object({
  body: z.object({
    idempotencyKey: z.string().min(8).max(160).optional(),
    answers: z.array(answerSchema).min(1).max(10)
  })
});

export const listAdminQuestionsSchema = z.object({
  query: z.object({
    status: z.string().max(40).optional(),
    search: z.string().max(120).optional(),
    take: z.coerce.number().int().min(1).max(200).optional()
  })
});

export const questionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const adminQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(10).max(2000),
    type: z.enum(["MCQ", "TRUE_FALSE", "SCENARIO_MCQ"]).optional(),
    category: z.enum([
      "CLIENT_COMMUNICATION",
      "SCOPE_MANAGEMENT",
      "DELIVERY",
      "QUALITY_CONTROL",
      "PLATFORM_RULES",
      "BUSINESS_BASICS"
    ]),
    skillTag: z.string().min(1).max(120).optional(),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    options: z.array(optionSchema).min(2).max(4),
    correctOptionId: z.string().min(1).max(8),
    explanation: z.string().min(10).max(2000),
    source: z.string().max(80).optional(),
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED"]).optional()
  })
});

export const updateAdminQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: adminQuestionSchema.shape.body.partial()
});

export const rejectQuestionSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reason: z.string().min(3).max(500)
  })
});

export const listAdminFreelancerProgressSchema = z.object({
  query: z.object({
    search: z.string().max(120).optional(),
    take: z.coerce.number().int().min(1).max(100).optional()
  })
});
