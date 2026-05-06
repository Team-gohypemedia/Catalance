import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

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

const resolveExpiresInMinutesText = (expiresInMinutes) => {
  const parsed = Number(expiresInMinutes);
  if (Number.isFinite(parsed) && parsed > 0) {
    return String(Math.min(Math.round(parsed), 60));
  }

  const fallback = Number(env.WHATSAPP_OTP_TTL_MINUTES);
  return String(
    Math.min(
      Number.isFinite(fallback) && fallback > 0 ? Math.round(fallback) : 15,
      60,
    ),
  );
};

// The approved auth template expects the OTP plus the expiry window in the body.
const buildBodyComponent = (otpCode, expiresInMinutes) => ({
  type: "body",
  parameters: [
    {
      type: "text",
      text: otpCode
    },
    {
      type: "text",
      text: resolveExpiresInMinutesText(expiresInMinutes)
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

const getOtpTemplateComponents = ({ otpCode, expiresInMinutes, mode }) => {
  if (mode === "url_button_only") {
    return [buildUrlButtonComponent(otpCode)];
  }

  return [buildBodyComponent(otpCode, expiresInMinutes), buildUrlButtonComponent(otpCode)];
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
        expiresInMinutes,
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
