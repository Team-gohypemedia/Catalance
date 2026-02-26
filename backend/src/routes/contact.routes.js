import { Router } from "express";
import { validateResource } from "../middlewares/validate-resource.js";
import {
  submitContactInquirySchema,
  subscribeNewsletterSchema
} from "../modules/contact/contact.schema.js";
import {
  submitContactInquiryHandler,
  subscribeNewsletterHandler
} from "../controllers/contact.controller.js";

export const contactRouter = Router();

contactRouter.post(
  "/inquiry",
  validateResource(submitContactInquirySchema),
  submitContactInquiryHandler
);

contactRouter.post(
  "/newsletter",
  validateResource(subscribeNewsletterSchema),
  subscribeNewsletterHandler
);
