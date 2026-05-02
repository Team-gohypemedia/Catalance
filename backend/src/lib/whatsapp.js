import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const WHATSAPP_PROVIDER = "whatsapp";

// ── E.164 phone validation ─────────────────────────────────────────
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const assertE164Phone = (value, fieldName) => {
  if (!E164_PHONE_REGEX.test(value)) {
    throw new AppError(
      `${fieldName} must be a valid E.164 phone number, e.g. +918882855425`,
      500,
      { provider: WHATSAPP_PROVIDER, reason: "invalid_phone_format", field: fieldName }
    );
  }
};

// ── Helpers ─────────────────────────────────────────────────────────
const maskPhone = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `***${digits.slice(-4)}` : "unknown";
};

const getWhatsAppConfig = () => {
  const graphVersion = String(env.WHATSAPP_GRAPH_VERSION || "").trim().replace(/^\/+|\/+$/g, "");
  const phoneNumberId = String(env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const accessToken = String(env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const templateName = String(env.WHATSAPP_OTP_TEMPLATE_NAME || "login_otp").trim();
  const templateLanguage = String(env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || "en_US").trim();
  const businessNumber = String(env.WHATSAPP_BUSINESS_NUMBER || "").trim();

  return {
    graphVersion,
    phoneNumberId,
    accessToken,
    templateName,
    templateLanguage,
    businessNumber,
    isConfigured: Boolean(
      graphVersion &&
        phoneNumberId &&
        accessToken &&
        templateName &&
        templateLanguage &&
        businessNumber
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

// ── Template payload builder ────────────────────────────────────────
const buildOtpTemplatePayload = ({ to, otpCode, templateName, templateLanguage, businessNumber }) => {
  // Validate that {{2}} (businessNumber) is a real phone number — never an email
  assertE164Phone(businessNumber, "WHATSAPP_BUSINESS_NUMBER");

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
              text: otpCode                // {{1}} — the OTP code
            },
            {
              type: "text",
              text: businessNumber          // {{2}} — must be phone, not email
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

  if (env.NODE_ENV !== "production") {
    console.log("[WhatsApp OTP] Payload:", JSON.stringify(payload, null, 2));
  }

  return payload;
};

// ── Error parser ────────────────────────────────────────────────────
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

// ── Public API ──────────────────────────────────────────────────────
export const sendWhatsappOtp = async ({ to, otpCode }) => {
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
        businessNumber: config.businessNumber
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

  console.log(`[WhatsApp OTP] Accepted for ${maskPhone(to)}. ID: ${messageId || "n/a"}`);
  return {
    delivered: true,
    id: messageId,
    waId: payload?.contacts?.[0]?.wa_id || null
  };
};
