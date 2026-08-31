import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { prisma } from "./prisma.js";

const WHATSAPP_PROVIDER = "whatsapp";


const maskPhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `***${digits.slice(-4)}` : "unknown";
};

const getWhatsAppConfig = () => {
  const graphVersion = String(env.WHATSAPP_GRAPH_VERSION || "").trim().replace(/^\/+|\/+$/g, "");
  const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const accessToken = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const templateName = String(env.WHATSAPP_OTP_TEMPLATE_NAME || "").trim();
  const templateLanguage = String(env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || "en").trim();

  return {
    graphVersion,
    phoneNumberId,
    accessToken,
    templateName,
    templateLanguage,
    isConfigured: Boolean(
      graphVersion &&
        phoneNumberId &&
        accessToken &&
        templateName &&
        templateLanguage
    )
  };
};

const getTemplateLanguageCandidates = (templateLanguage) => {
  const primaryLanguage = String(templateLanguage || "").trim();
  const candidates = [primaryLanguage];

  if (primaryLanguage === "en_US") {
    candidates.push("en");
  } else if (primaryLanguage === "en") {
    candidates.push("en_US");
  }

  return [...new Set(candidates.filter(Boolean))];
};

const buildMissingConfigError = () =>
  new AppError(
    "WhatsApp OTP delivery is not configured.",
    500,
    {
      provider: WHATSAPP_PROVIDER,
      reason: "missing_config"
    }
  );

// The approved auth template expects only the OTP in the body. Expiry is
// handled by our app state, not a second WhatsApp template variable.
const buildBodyComponent = (otpCode) => ({
  type: "body",
  parameters: [
    {
      type: "text",
      text: otpCode
    }
  ]
});

const buildUrlButtonComponent = (otpCode) => ({
  type: "button",
  sub_type: "url",
  index: "0",
  parameters: [
    {
      type: "text",
      text: otpCode
    }
  ]
});

const getOtpTemplateComponents = ({ otpCode, mode }) => {
  if (mode === "url_button_only") {
    return [buildUrlButtonComponent(otpCode)];
  }

  return [buildBodyComponent(otpCode), buildUrlButtonComponent(otpCode)];
};

const shouldTryNextPayloadMode = ({ providerError, nextMode }) => {
  if (providerError?.code !== 132000) {
    return false;
  }

  return Boolean(nextMode);
};

const buildOtpTemplatePayload = ({
  to,
  otpCode,
  expiresInMinutes,
  templateName,
  templateLanguage,
  mode
}) => {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: templateLanguage
      },
      components: getOtpTemplateComponents({
        otpCode,
        mode
      })
    }
  };

  if (env.NODE_ENV !== "production") {
    console.log("[WhatsApp OTP] Payload:", JSON.stringify(payload, null, 2));
  }

  return payload;
};

const parseWhatsAppError = (payload) => {
  const error = payload?.error;

  if (!error) {
    return {
      code: null,
      message: "Unknown WhatsApp Cloud API error"
    };
  }

  return {
    code: error.code ?? null,
    subcode: error.error_subcode ?? null,
    type: error.type ?? null,
    fbtraceId: error.fbtrace_id ?? null,
    details: error.error_data?.details || null,
    message: error.error_user_msg || error.message || "WhatsApp Cloud API error"
  };
};

export const sendWhatsappOtp = async ({
  to,
  otpCode,
  expiresInMinutes = env.WHATSAPP_OTP_TTL_MINUTES
}) => {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    if (env.NODE_ENV === "production") {
      throw buildMissingConfigError();
    }

    console.warn("[WhatsApp OTP] Missing WhatsApp Cloud API configuration.");
    console.log(`[DEV] WhatsApp OTP for ${maskPhone(to)}: ${otpCode}`);
    return { delivered: false, reason: "missing_config" };
  }

  if (typeof fetch !== "function") {
    throw new AppError(
      "This Node.js runtime does not provide fetch for WhatsApp OTP delivery.",
      500,
      {
        provider: WHATSAPP_PROVIDER,
        reason: "missing_fetch"
      }
    );
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const templateLanguageCandidates = getTemplateLanguageCandidates(config.templateLanguage);
  const payloadModes = ["body_and_url_button", "url_button_only"];
  let lastFailure = null;

  for (let index = 0; index < templateLanguageCandidates.length; index += 1) {
    const templateLanguage = templateLanguageCandidates[index];
    for (let modeIndex = 0; modeIndex < payloadModes.length; modeIndex += 1) {
      const payloadMode = payloadModes[modeIndex];
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          buildOtpTemplatePayload({
            to,
            otpCode,
            expiresInMinutes,
            templateName: config.templateName,
            templateLanguage,
            mode: payloadMode
          })
        )
      });
      const payload = await response.json().catch(() => null);

      if (response.ok) {
        const messageId = payload?.messages?.[0]?.id || null;
        const cleanPhone = String(to || "").replace(/\D/g, "");

        if (cleanPhone) {
          await prisma.whatsAppMessage.create({
            data: {
              fromPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
              toPhone: cleanPhone,
              wamid: messageId,
              messageType: "otp",
              body: `[Authentication OTP] Verification passcode sent to user`,
              direction: "OUTBOUND",
              status: "DELIVERED",
              rawPayload: payload || {}
            }
          }).catch((dbErr) => console.error("[WhatsApp OTP] DB Save Error:", dbErr));
        }

        console.log(
          `[WhatsApp OTP] Accepted for ${maskPhone(to)} with template ${config.templateName}/${templateLanguage} using ${payloadMode}. ID: ${messageId || "n/a"}`
        );
        return {
          delivered: true,
          id: messageId,
          waId: payload?.contacts?.[0]?.wa_id || null
        };
      }


      const providerError = parseWhatsAppError(payload);
      lastFailure = {
        providerError,
        responseStatus: response.status,
        payload,
        templateLanguage,
        payloadMode
      };

      if (providerError.code === 132001 && index < templateLanguageCandidates.length - 1) {
        console.warn(
          `[WhatsApp OTP] Template ${config.templateName}/${templateLanguage} was not found. Trying alternate English locale.`
        );
        break;
      }

      const nextMode = payloadModes[modeIndex + 1];
      if (nextMode && shouldTryNextPayloadMode({ providerError, nextMode })) {
        console.warn(
          `[WhatsApp OTP] Template parameter mismatch with ${payloadMode}. Trying ${nextMode}.`
        );
        continue;
      }

      break;
    }

    if (lastFailure?.providerError?.code === 132001 && index < templateLanguageCandidates.length - 1) {
      continue;
    }

    break;
  }

  console.error("[WhatsApp OTP] Meta API error:", JSON.stringify(lastFailure?.payload, null, 2));
  const providerError = lastFailure?.providerError || {};
  throw new AppError(
    providerError.message || "Unable to send WhatsApp verification code.",
    Number(lastFailure?.responseStatus) >= 500 ? 502 : 400,
    {
      provider: WHATSAPP_PROVIDER,
      status: lastFailure?.responseStatus,
      templateName: config.templateName,
      templateLanguage: lastFailure?.templateLanguage,
      payloadMode: lastFailure?.payloadMode,
      ...providerError
    }
  );
};

export const sendWhatsappNotification = async ({
  to,
  userName = "User",
  title = "Notification",
  message = "You have a new update.",
  link = null,
  overrideTemplateName = null
}) => {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    console.warn("[WhatsApp Notification] Missing WhatsApp Cloud API configuration.");
    return { delivered: false, reason: "missing_config" };
  }

  const cleanPhone = String(to || "").replace(/\D/g, "");
  if (!cleanPhone) {
    return { delivered: false, reason: "invalid_phone" };
  }

  // Extract clean first name
  const cleanFirstName = String(userName || "User")
    .replace(/\d+/g, "")
    .trim()
    .split(" ")[0] || "User";

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: cleanFirstName.slice(0, 60) },
        { type: "text", text: String(title || "Update").slice(0, 60) },
        { type: "text", text: String(message || "New update available").slice(0, 500) }
      ]
    }
  ];

  if (link) {
    const cleanPath = String(link).replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        { type: "text", text: cleanPath }
      ]
    });
  }

  const templateName = overrideTemplateName || env.WHATSAPP_NOTIFICATION_TEMPLATE_NAME || "catalance_notification_v2";

  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: config.templateLanguage || "en"
      },
      components
    }
  };

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data = await response.json().catch(() => null);

    // If Meta returns missing HEADER error, retry with header parameter included
    if (!response.ok && data?.error?.message?.includes("HEADER")) {
      console.warn("[WhatsApp Notification] Template requires HEADER component. Retrying with header...");
      const headerComponents = [
        {
          type: "header",
          parameters: [{ type: "text", text: String(title || "Catalance").slice(0, 60) }]
        },
        ...components
      ];

      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          template: {
            ...payload.template,
            components: headerComponents
          }
        })
      });
      data = await response.json().catch(() => null);
    }

    if (response.ok) {
      const msgId = data?.messages?.[0]?.id || null;
      await prisma.whatsAppMessage.create({
        data: {
          fromPhone: String(env.WHATSAPP_BUSINESS_NUMBER || "918882855425").replace(/\D/g, ""),
          toPhone: cleanPhone,
          wamid: msgId,
          messageType: "notification",
          body: `[${title}]: ${message}`,
          direction: "OUTBOUND",
          status: "DELIVERED",
          rawPayload: data || {}
        }
      }).catch((dbErr) => console.error("[WhatsApp Notification] DB Save Error:", dbErr));

      console.log(`[WhatsApp Notification] Delivered via ${templateName} to ${cleanPhone} for "${title}"`);
      return { delivered: true, id: msgId };
    }


    // Fallback to legacy catalance_notification if new v2 template is still pending Meta review (code 132001)
    if (data?.error?.code === 132001 && templateName !== "catalance_notification") {
      console.warn(`[WhatsApp Notification] Template ${templateName} not active yet on Meta, falling back to catalance_notification...`);
      return sendWhatsappNotification({
        to,
        userName,
        title,
        message,
        link,
        overrideTemplateName: "catalance_notification"
      });
    }

    console.error("[WhatsApp Notification] Meta API Error:", JSON.stringify(data, null, 2));
    return { delivered: false, error: data };
  } catch (error) {
    console.error("[WhatsApp Notification] Network Error:", error);
    return { delivered: false, error: error.message };
  }
};

export const sendFreelancerProfileReminderWhatsapp = async ({
  to,
  userName = "Freelancer",
  completionPercent = 0,
  missingItems = "profile details",
  profileUrl = "https://catalance.in/freelancer/profile"
}) => {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    console.warn("[WhatsApp Profile Reminder] Missing WhatsApp Cloud API configuration.");
    return { delivered: false, reason: "missing_config" };
  }

  const cleanPhone = String(to || "").replace(/\D/g, "");
  if (!cleanPhone) {
    return { delivered: false, reason: "invalid_phone" };
  }

  const cleanMissing = String(missingItems || "profile info").slice(0, 100);

  // Send profile completion reminders as a UTILITY notification via the approved
  // system notification template (catalance_notification_v2 / catalance_notification).
  // This guarantees UTILITY category billing (₹0.30/msg), avoids Marketing template parameter errors,
  // and ensures high delivery success.
  console.log(`[WhatsApp Profile Reminder] Dispatching profile completion reminder as UTILITY notification to ${cleanPhone}...`);
  return sendWhatsappNotification({
    to: cleanPhone,
    userName: userName,
    title: `Account Action Required`,
    message: `Dear ${userName}, please complete your required profile items (${cleanMissing}) for your Catalance account. Tap below to review your account setup: ${profileUrl}`
  });
};


