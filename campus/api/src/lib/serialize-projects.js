import { miniUser } from "./serialize.js";
import { adjustmentsTotal, computeSplit, effectiveStatus, stageOf } from "../services/projects.js";

/**
 * Project offer shapes (API_CONTRACT.md "Projects & PM").
 *   offerStudentOut  → ProjectOfferStudent: what the student sees. Never client price, split basis, share % or platform share (spec §9.1/§9.2).
 *   offerPmOut       → ProjectOffer: the PM view. Finance block only for ADMIN.
 *   offerFinanceOut  → ProjectOfferFinance: ADMIN/FINANCE.
 */

export const OFFER_INCLUDE = {
  skill: { select: { id: true, slug: true, name: true } },
  pm: { select: { id: true, name: true, avatarUrl: true } },
  student: { include: { college: true } },
};

const arr = (v) => (Array.isArray(v) ? v : []);
const skillRef = (s) => (s ? { id: s.id, slug: s.slug, name: s.name } : null);

function milestonesOut(o) {
  const now = Date.now();
  return arr(o.milestones).map((m) => ({
    id: m.id,
    title: m.title,
    dueAt: m.dueAt || null,
    status: m.status || "PENDING",
    overdue: m.status !== "APPROVED" && Boolean(m.dueAt) && new Date(m.dueAt).getTime() < now,
  }));
}

const deliveriesOut = (o) =>
  arr(o.deliveries).map((d) => ({
    version: d.version,
    text: d.text || "",
    links: arr(d.links),
    submittedAt: d.submittedAt,
    review: d.review ? { decision: d.review.decision, note: d.review.note || null, at: d.review.at, by: d.review.by ? { name: d.review.by.name } : null } : null,
  }));

const common = (o) => ({
  id: o.id,
  title: o.title,
  summary: o.summary,
  skill: skillRef(o.skill),
  level: o.level ?? null,
  deliverables: o.deliverables || [],
  acceptanceCriteria: o.acceptanceCriteria || [],
  expectedHours: o.expectedHours ?? null,
  deadline: o.deadline ?? null,
  milestones: milestonesOut(o),
  payoutINR: o.payoutINR,
  revisionLimit: o.revisionLimit,
  revisionsUsed: o.revisionsUsed,
  tools: o.tools || [],
  confidentiality: o.confidentiality || "",
  status: effectiveStatus(o),
  stage: stageOf(o),
  expiresAt: o.expiresAt ?? null,
  respondedAt: o.respondedAt ?? null,
  deliveries: deliveriesOut(o),
  payoutStatus: o.payoutStatus,
  paidAt: o.paidAt ?? null,
  clientAcceptedAt: o.clientAcceptedAt ?? null,
  feedback: o.feedback ?? null,
  rating: o.rating ?? null,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

/** ProjectOfferStudent. History keeps status + time only (PM notes can be internal). */
export function offerStudentOut(o) {
  return {
    ...common(o),
    declineReason: o.declineReason ?? null,
    netPayoutINR: o.payoutINR + adjustmentsTotal(o), // what actually reaches the student after finance adjustments
    pm: o.pm ? { name: o.pm.name } : null,
    support: { link: "/app/help", label: "Help & support" },
    history: arr(o.history).map((h) => ({ status: h.status, at: h.at })),
  };
}

export function financeBlock(o) {
  const split = computeSplit({ ...o, splitBasis: o.splitBasis || "CLIENT_PRICE_EX_TAX" });
  const adj = adjustmentsTotal(o);
  return {
    clientPriceINR: o.clientPriceINR ?? null,
    splitBasis: o.splitBasis ?? null,
    freelancerSharePercent: o.freelancerSharePercent ?? null,
    platformShareINR: o.platformShareINR ?? null, // the stored snapshot
    computedPlatformShareINR: split.platformShareINR, // what the current inputs give (for comparison before saving)
    ruleFreelancerINR: split.ruleFreelancerINR,
    varianceINR: split.varianceINR,
    taxesINR: o.taxesINR ?? null,
    adjustments: arr(o.adjustments),
    adjustmentsTotalINR: adj,
    netPayoutINR: o.payoutINR + adj,
    payoutStatus: o.payoutStatus,
    payoutRef: o.payoutRef ?? null,
    paidAt: o.paidAt ?? null,
  };
}

/** ProjectOffer (PM / admin). */
export function offerPmOut(o, viewer) {
  return {
    ...common(o),
    catalanceProjectId: o.catalanceProjectId ?? null,
    skillId: o.skillId ?? null,
    pmId: o.pmId ?? null,
    pm: o.pm ? { id: o.pm.id, name: o.pm.name, avatarUrl: o.pm.avatarUrl ?? null } : null,
    studentId: o.studentId,
    student: miniUser(o.student),
    declineReason: o.declineReason ?? null,
    shortlistReason: o.shortlistReason || "",
    history: arr(o.history),
    ...(viewer?.role === "ADMIN" ? { finance: financeBlock(o) } : {}),
  };
}

/** ProjectOfferFinance (ADMIN / FINANCE). */
export function offerFinanceOut(o) {
  return {
    id: o.id,
    title: o.title,
    catalanceProjectId: o.catalanceProjectId ?? null,
    skill: skillRef(o.skill),
    level: o.level ?? null,
    status: effectiveStatus(o),
    student: miniUser(o.student),
    pm: o.pm ? { id: o.pm.id, name: o.pm.name } : null,
    payoutINR: o.payoutINR,
    clientAcceptedAt: o.clientAcceptedAt ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    ...financeBlock(o),
  };
}
