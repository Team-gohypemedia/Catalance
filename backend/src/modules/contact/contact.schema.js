import { z } from "zod";

export const submitContactInquirySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(5000)
  })
});

export const subscribeNewsletterSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254)
  })
});
