import { env } from "./env.js";

/**
 * Transactional email via the Resend HTTP API (spec §12: in-app + email in MVP). Same provider as the main
 * Catalance backend, called with fetch so Campus needs no extra dependency.
 *   await sendEmail({ to: "a@b.in", subject: "Payment received", html, text })
 * Never throws: returns { ok, id?, skipped?, error? }. Without RESEND_API_KEY it logs and skips.
 */
const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

/** Placeholder addresses that can't receive mail (phone-only Catalance accounts, seeded demo people). */
export const isDeliverable = (to) => {
  const email = String(to || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@phone.catalance.local") && !email.endsWith("@campus.dev");
};

export async function sendEmail({ to, subject, html, text }) {
  try {
    if (!isDeliverable(to)) return { ok: false, skipped: "undeliverable" };
    if (!subject) return { ok: false, skipped: "no-subject" };
    if (!env.resendApiKey) {
      if (env.nodeEnv !== "test") console.info(`[campus-api] email skipped (RESEND_API_KEY unset): "${subject}"`);
      return { ok: false, skipped: "not-configured" };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.emailFrom, to: [String(to).trim()], subject: String(subject).slice(0, 200), html, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[campus-api] email failed", res.status, data?.message || data?.name || "");
        return { ok: false, error: data?.message || `HTTP ${res.status}` };
      }
      return { ok: true, id: data?.id ?? null };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error("[campus-api] email failed", err?.name === "AbortError" ? "timeout" : err?.message);
    return { ok: false, error: err?.message || "send failed" };
  }
}

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Absolute web URL for an in-app link ("/app/payments" → "https://campus.catalance.in/app/payments"). */
export const webLink = (link) => (link ? (/^https?:\/\//.test(link) ? link : `${env.webUrl}${link.startsWith("/") ? "" : "/"}${link}`) : env.webUrl);

/**
 * A plain, calm Catalance-style email: title, one or two short sentences, one button (spec §14.1: one primary action).
 * Returns { subject, html, text }.
 */
export function renderEmail({ title, body = "", link = null, cta = "Open Campus" }) {
  const url = webLink(link);
  const t = escapeHtml(title);
  const b = escapeHtml(body).replace(/\n/g, "<br>");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF6F0;font-family:Inter,Arial,sans-serif;color:#1c1917">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece6dc;border-radius:16px">
<tr><td style="padding:28px 28px 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8178">Catalance Campus</td></tr>
<tr><td style="padding:0 28px;font-size:20px;line-height:1.3;font-weight:600">${t}</td></tr>
${b ? `<tr><td style="padding:12px 28px 0;font-size:15px;line-height:1.6;color:#57534e">${b}</td></tr>` : ""}
<tr><td style="padding:24px 28px 28px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#D9692A;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px">${escapeHtml(cta)}</a></td></tr>
</table>
<p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#8a8178">You get this email because of activity on your Catalance Campus account. Turn emails off in Settings, Notifications.</p>
</td></tr></table></body></html>`;
  const text = `${title}\n\n${body ? `${body}\n\n` : ""}${cta}: ${url}\n\nTurn emails off in Campus Settings, Notifications.`;
  return { subject: title, html, text };
}
