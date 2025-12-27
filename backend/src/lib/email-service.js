
import { resend } from "./resend.js";
import { env } from "../config/env.js";

// Helper to wrap content in a basic responsive HTML template
const wrapHtml = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; background: #fff; }
    .button { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    h1 { margin: 0; font-size: 24px; }
    p { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Catalance</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Catalance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendEmail = async ({ to, subject, title, html, text }) => {
  if (!resend) {
    console.warn("[EmailService] Resend not configured. Skipping email:", subject);
    return false;
  }

  try {
    const from = env.RESEND_FROM_EMAIL || "Catalance <onboarding@resend.dev>";
    
    // If we only have text, wrap it in a simple p tag for HTML
    const finalHtml = wrapHtml(title || subject, html || `<p>${text}</p>`);

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html: finalHtml,
    });

    if (data.error) {
        console.error("[EmailService] Resend API Error:", data.error);
        return false;
    }

    console.log(`[EmailService] 📧 Email sent to ${to}: ${subject} (ID: ${data.data?.id})`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
};
