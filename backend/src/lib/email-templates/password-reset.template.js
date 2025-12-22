import { env } from "../../config/env.js";

/**
 * Generates HTML email template for password reset
 * @param {string} resetUrl - The full URL for password reset
 * @param {string} userEmail - User's email address
 * @returns {string} HTML email content
 */
export const generatePasswordResetEmail = (resetUrl, userEmail) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 16px;
      color: #555;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: opacity 0.2s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #6c757d;
    }
    .link {
      color: #667eea;
      word-break: break-all;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      
      <p>We received a request to reset the password for your Catalance account associated with <strong>${userEmail}</strong>.</p>
      
      <p>Click the button below to choose a new password:</p>
      
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p style="text-align: center; margin-top: 16px;">
        <em>This link will expire in 1 hour</em>
      </p>
      
      <div class="warning">
        <p><strong>⚠️ Security Notice:</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <p style="margin-top: 32px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p class="link">${resetUrl}</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Catalance. All rights reserved.</p>
      <p style="margin-top: 8px;">This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generates plain text version of password reset email
 * @param {string} resetUrl - The full URL for password reset
 * @param {string} userEmail - User's email address
 * @returns {string} Plain text email content
 */
export const generatePasswordResetTextEmail = (resetUrl, userEmail) => {
    return `
Reset Your Password

Hi there,

We received a request to reset the password for your Catalance account associated with ${userEmail}.

Click the link below to choose a new password:
${resetUrl}

This link will expire in 1 hour.

SECURITY NOTICE:
If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

---
© ${new Date().getFullYear()} Catalance. All rights reserved.
This is an automated message, please do not reply to this email.
  `.trim();
};
