/** Project offer labels and tones (spec §9.3 statuses, §9.2 payout statuses). Shared by student and console pages. */

export const OFFER_STATUS = {
  OFFERED: { label: "Offer open", tone: "primary" },
  ACCEPTED: { label: "Accepted", tone: "violet" },
  IN_PROGRESS: { label: "In progress", tone: "sky" },
  SUBMITTED: { label: "Submitted", tone: "warning" },
  REVISION_REQUESTED: { label: "Changes requested", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
  DECLINED: { label: "Declined", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  ON_HOLD: { label: "On hold", tone: "neutral" },
  DISPUTED: { label: "Disputed", tone: "danger" },
};

/** Derived stages the API adds on SUBMITTED offers. */
export const OFFER_STAGE = {
  PM_REVIEW: { label: "PM review", tone: "warning" },
  CLIENT_REVIEW: { label: "Client review", tone: "violet" },
};

export const PAYOUT_STATUS = {
  NOT_DUE: { label: "Not due", tone: "neutral" },
  PENDING: { label: "Pending", tone: "sky" },
  ELIGIBLE: { label: "Eligible", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const MILESTONE_STATUS = {
  PENDING: { label: "To do", tone: "neutral" },
  SUBMITTED: { label: "Submitted", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
};

export const LEVEL_LABEL = { BEGINNER: "Beginner", STANDARD: "Standard", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };
export const LEVELS = ["BEGINNER", "STANDARD", "INTERMEDIATE", "ADVANCED"];

export const SPLIT_BASIS_LABEL = { CLIENT_PRICE_EX_TAX: "Client price, excluding tax", CLIENT_PRICE_INC_TAX: "Client price, including tax" };

export const DAYS = [
  ["MON", "Mon"],
  ["TUE", "Tue"],
  ["WED", "Wed"],
  ["THU", "Thu"],
  ["FRI", "Fri"],
  ["SAT", "Sat"],
  ["SUN", "Sun"],
];

/** Status chip label for an offer: SUBMITTED shows its stage (PM review / Client review). */
export const offerChip = (o) => (o?.status === "SUBMITTED" && OFFER_STAGE[o.stage]) || OFFER_STATUS[o?.status] || { label: o?.status || "", tone: "neutral" };

export const skillLine = (o) => [o?.skill?.name, LEVEL_LABEL[o?.level]].filter(Boolean).join(" · ");

/** "Expires in 5h" / "Expires in 2 days" / "Expired" */
export function expiresIn(iso) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `Expires in ${Math.max(1, Math.floor(ms / 60000))} min`;
  if (h < 48) return `Expires in ${h}h`;
  return `Expires in ${Math.floor(h / 24)} days`;
}

export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

/** For <input type="datetime-local">: ISO → local "YYYY-MM-DDTHH:mm" and back. */
export const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
