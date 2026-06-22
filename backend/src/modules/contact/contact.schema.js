import { z } from "zod";

export const submitContactInquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(32).optional().or(z.literal("")),
    subject: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(5000)
  })
});

export const subscribeNewsletterSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254)
  })
});
