import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const WHATSAPP_PROVIDER = "whatsapp";

const getWhatsAppConfig = () => {
  const graphVersion = String(env.WHATSAPP_GRAPH_VERSION || "").trim().replace(/^\/+|\/+$/g, "");
  const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const accessToken = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const templateName = String(env.WHATSAPP_OTP_TEMPLATE_NAME || "login_otp").trim();
  const templateLanguage = String(env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || "en_US").trim();

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

const buildMissingConfigError = () =>
  new AppError(
    "WhatsApp OTP delivery is not configured.",
    500,
    {
      provider: WHATSAPP_PROVIDER,
      reason: "missing_config"
    }
  );

const buildOtpTemplatePayload = ({ to, otpCode, templateName, templateLanguage, ttlMinutes }) => {
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
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otpCode
            },
            {
              type: "text",
              text: String(ttlMinutes || 15)
            }
          ]
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otpCode
            }
          ]
        }
      ]
    }
  };

  console.log("[WhatsApp OTP] Payload:", JSON.stringify(payload, null, 2));
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
    type: error.type ?? null,
    fbtraceId: error.fbtrace_id ?? null,
    message: error.error_user_msg || error.message || "WhatsApp Cloud API error"
  };
};

export const sendWhatsappOtp = async ({ to, otpCode }) => {
  const config = getWhatsAppConfig();

  if (!config.isConfigured) {
    if (env.NODE_ENV === "production") {
      throw buildMissingConfigError();
    }

    console.warn("[WhatsApp OTP] Missing WhatsApp Cloud API configuration.");
    console.log(`[DEV] WhatsApp OTP for ${to}: ${otpCode}`);
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
        templateName: config.templateName,
        templateLanguage: config.templateLanguage,
        ttlMinutes: env.WHATSAPP_OTP_TTL_MINUTES || 15
      })
    )
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[WhatsApp OTP] Meta API error:", JSON.stringify(payload, null, 2));
    const providerError = parseWhatsAppError(payload);
    throw new AppError(
      providerError.message || "Unable to send WhatsApp verification code.",
      response.status >= 500 ? 502 : 400,
      {
        provider: WHATSAPP_PROVIDER,
        status: response.status,
        ...providerError
      }
    );
  }

  const messageId = payload?.messages?.[0]?.id || null;

  console.log(`[WhatsApp OTP] Accepted for ${to}. ID: ${messageId || "n/a"}`);
  return {
    delivered: true,
    id: messageId,
    waId: payload?.contacts?.[0]?.wa_id || null
  };
};
