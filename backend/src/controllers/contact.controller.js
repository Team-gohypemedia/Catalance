import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { sendEmail } from "../lib/email-service.js";

const CONTACT_RECIPIENT_EMAIL = "catalanceofficial@gmail.com";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const submitContactInquiryHandler = asyncHandler(async (req, res) => {
  const {
    name = "",
    email = "",
    subject = "",
    message = ""
  } = req.body || {};

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedSubject = String(subject).trim();
  const normalizedMessage = String(message).trim();

  if (!normalizedName || !normalizedEmail || !normalizedSubject || !normalizedMessage) {
    throw new AppError("All fields are required.", 400);
  }

  const safeName = escapeHtml(normalizedName);
  const safeEmail = escapeHtml(normalizedEmail);
  const safeSubject = escapeHtml(normalizedSubject);
  const safeMessage = escapeHtml(normalizedMessage).replace(/\n/g, "<br />");
  const submittedAt = new Date().toISOString();

  const sent = await sendEmail({
    to: CONTACT_RECIPIENT_EMAIL,
    subject: `[Catalance Contact] ${normalizedSubject}`,
    title: "New Contact Inquiry",
    html: `
      <p>You have received a new contact inquiry from the website.</p>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <p><strong>Submitted At (UTC):</strong> ${escapeHtml(submittedAt)}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
    text: [
      "New Contact Inquiry",
      `Name: ${normalizedName}`,
      `Email: ${normalizedEmail}`,
      `Subject: ${normalizedSubject}`,
      `Submitted At (UTC): ${submittedAt}`,
      "",
      "Message:",
      normalizedMessage
    ].join("\n")
  });

  if (!sent) {
    throw new AppError(
      "We could not send your message right now. Please try again in a moment.",
      502
    );
  }

  res.status(201).json({
    data: {
      message: "Message sent successfully."
    }
  });
});

export const subscribeNewsletterHandler = asyncHandler(async (req, res) => {
  const { email = "" } = req.body || {};
  const normalizedEmail = String(email).trim().toLowerCase();

  if (!normalizedEmail) {
    throw new AppError("Email is required.", 400);
  }

  const submittedAt = new Date().toISOString();
  const safeEmail = escapeHtml(normalizedEmail);

  const sent = await sendEmail({
    to: CONTACT_RECIPIENT_EMAIL,
    subject: "[Catalance Newsletter] New subscription",
    title: "New Newsletter Subscriber",
    html: `
      <p>A new user subscribed to the newsletter.</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Subscribed At (UTC):</strong> ${escapeHtml(submittedAt)}</p>
    `,
    text: [
      "New Newsletter Subscriber",
      `Email: ${normalizedEmail}`,
      `Subscribed At (UTC): ${submittedAt}`
    ].join("\n")
  });

  if (!sent) {
    throw new AppError(
      "We could not complete your subscription right now. Please try again in a moment.",
      502
    );
  }

  // Best-effort confirmation email to subscriber.
  const confirmationSent = await sendEmail({
    to: normalizedEmail,
    subject: "You are subscribed to Catalance updates",
    title: "Subscription Confirmed",
    html: `
      <p>Thanks for subscribing to Catalance updates.</p>
      <p>We&apos;ll share occasional insights and product updates.</p>
    `,
    text: "Thanks for subscribing to Catalance updates."
  });

  if (!confirmationSent) {
    console.warn("[Newsletter] Failed to send confirmation email:", normalizedEmail);
  }

  res.status(201).json({
    data: {
      message: "Subscribed successfully."
    }
  });
});
