import {
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  persistSavedProposalsToStorage,
} from "@/shared/lib/client-proposal-storage";
import { formatINR, INR_PREFIX_PATTERN, normalizeINRText } from "@/shared/lib/currency";

export const PROPOSAL_BUDGET_REMINDER_HOURS = 24;
export const PROPOSAL_BUDGET_REMINDER_MS =
  PROPOSAL_BUDGET_REMINDER_HOURS * 60 * 60 * 1000;
export const CLIENT_PROPOSAL_ACTION_INCREASE_BUDGET = "increase-budget";

const BUDGET_ELIGIBLE_STATUSES = new Set(["pending", "sent"]);
const STORED_BUDGET_LINE_PATTERN = new RegExp(
  String.raw`Budget[\s\n]*[-:]*[\s\n]*${INR_PREFIX_PATTERN.source}?\s*[\d,]+\s*(?:k)?`,
  "gi",
);

const normalizeComparableText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[_/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeProposalStatus = (status = "") => {
  switch (String(status || "").trim().toUpperCase()) {
    case "DRAFT":
      return "draft";
    case "ACCEPTED":
      return "accepted";
    case "REJECTED":
    case "DECLINED":
      return "rejected";
    case "PENDING":
      return "pending";
    default:
      return "sent";
  }
};

const getProposalTimestamp = (proposal = {}) => {
  const value = proposal?.createdAt || proposal?.updatedAt || null;
  const parsed = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const replaceStoredBudgetLine = (value = "", formattedBudget) =>
  normalizeINRText(String(value || "")).replace(
    STORED_BUDGET_LINE_PATTERN,
    `Budget\n- ${formattedBudget}`,
  );

export const getProposalBudgetProjectId = (proposal = {}) =>
  String(
    proposal?.syncedProjectId || proposal?.projectId || proposal?.project?.id || "",
  ).trim();

export const resolveProposalBudgetTitle = (proposal = {}) =>
  String(
    proposal?.project?.title ||
      proposal?.projectTitle ||
      proposal?.title ||
      proposal?.project?.name ||
      "this proposal",
  ).trim() || "this proposal";

export const resolveProposalBudgetValue = (proposal = {}) => {
  const candidates = [
    proposal?.project?.budget,
    proposal?.budget,
    proposal?.amount,
    proposal?.proposalContext?.budget,
  ];

  for (const candidate of candidates) {
    const numeric = Number.parseInt(String(candidate ?? "").replace(/[^0-9]/g, ""), 10);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
};

export const getProposalBudgetUpdateTargets = (proposals = [], sourceProposal = null) => {
  const sourceProjectId =
    typeof sourceProposal === "string"
      ? String(sourceProposal).trim()
      : getProposalBudgetProjectId(sourceProposal);

  if (!sourceProjectId) {
    return [];
  }

  return (Array.isArray(proposals) ? proposals : []).filter((proposal) => {
    if (proposal?.isLocalDraft || !proposal?.id || !proposal?.freelancerId) {
      return false;
    }

    if (getProposalBudgetProjectId(proposal) !== sourceProjectId) {
      return false;
    }

    return BUDGET_ELIGIBLE_STATUSES.has(normalizeProposalStatus(proposal?.status));
  });
};

export const isProposalEligibleForBudgetIncrease = (
  proposal = null,
  proposals = [],
) => {
  const targets = getProposalBudgetUpdateTargets(proposals, proposal);

  return targets.some(
    (target) => Date.now() - getProposalTimestamp(target) >= PROPOSAL_BUDGET_REMINDER_MS,
  );
};

export const collectBudgetIncreaseProjects = (proposals = []) => {
  const targets = new Map();

  (Array.isArray(proposals) ? proposals : []).forEach((proposal) => {
    if (!isProposalEligibleForBudgetIncrease(proposal, proposals)) {
      return;
    }

    const projectId = getProposalBudgetProjectId(proposal);
    if (!projectId) {
      return;
    }

    const existing = targets.get(projectId);
    const nextTimestamp = getProposalTimestamp(proposal);

    if (!existing || nextTimestamp > existing.timestamp) {
      targets.set(projectId, {
        projectId,
        proposal,
        timestamp: nextTimestamp,
      });
    }
  });

  return targets;
};

export const resolveProposalBudgetTarget = (proposals = [], target = null) => {
  if (!target) {
    return null;
  }

  if (typeof target === "string") {
    const eligibleProjectTarget =
      getProposalBudgetUpdateTargets(proposals, target).sort(
        (left, right) => getProposalTimestamp(right) - getProposalTimestamp(left),
      )[0] || null;

    if (eligibleProjectTarget) {
      return eligibleProjectTarget;
    }

    return (
      (Array.isArray(proposals) ? proposals : []).find(
        (proposal) => getProposalBudgetProjectId(proposal) === String(target).trim(),
      ) || null
    );
  }

  const sourceProjectId = getProposalBudgetProjectId(target);
  if (!sourceProjectId) {
    return target;
  }

  return resolveProposalBudgetTarget(proposals, sourceProjectId) || target;
};

export const resolveProposalBudgetTab = (proposals = [], projectId = "") => {
  const matchingProposals = (Array.isArray(proposals) ? proposals : []).filter(
    (proposal) => getProposalBudgetProjectId(proposal) === String(projectId).trim(),
  );

  if (
    matchingProposals.some((proposal) =>
      BUDGET_ELIGIBLE_STATUSES.has(normalizeProposalStatus(proposal?.status)),
    )
  ) {
    return "pending";
  }

  if (
    matchingProposals.some(
      (proposal) => normalizeProposalStatus(proposal?.status) === "draft",
    )
  ) {
    return "draft";
  }

  if (
    matchingProposals.some(
      (proposal) => normalizeProposalStatus(proposal?.status) === "rejected",
    )
  ) {
    return "rejected";
  }

  return "pending";
};

export const buildProposalBudgetDetailsPath = (proposals = [], projectId = "") => {
  const normalizedProjectId = String(projectId || "").trim();
  if (!normalizedProjectId) {
    return "/client/proposal";
  }

  const params = new URLSearchParams({
    projectId: normalizedProjectId,
    tab: resolveProposalBudgetTab(proposals, normalizedProjectId),
  });

  return `/client/proposal?${params.toString()}`;
};

export const syncStoredProposalBudgetRecords = ({
  userId,
  projectId,
  projectTitle,
  budgetValue,
}) => {
  const normalizedProjectId = String(projectId || "").trim();
  if (!normalizedProjectId || !Number.isFinite(Number(budgetValue)) || Number(budgetValue) <= 0) {
    return false;
  }

  const { proposals: storedProposals, activeId } = loadSavedProposalsFromStorage(userId);
  if (!storedProposals.length) {
    return false;
  }

  const formattedBudget = formatINR(budgetValue);
  const normalizedTitle = normalizeComparableText(projectTitle);
  let updatedAny = false;

  const nextStoredProposals = storedProposals.map((proposal) => {
    const matchesProjectId =
      getProposalBudgetProjectId(proposal) === normalizedProjectId;
    const matchesTitle =
      normalizedTitle &&
      normalizeComparableText(
        proposal?.projectTitle || proposal?.title || proposal?.businessName || "",
      ) === normalizedTitle;

    if (!matchesProjectId && !matchesTitle) {
      return proposal;
    }

    updatedAny = true;

    return {
      ...proposal,
      budget: String(Math.round(Number(budgetValue))),
      updatedAt: new Date().toISOString(),
      summary: proposal?.summary
        ? replaceStoredBudgetLine(proposal.summary, formattedBudget)
        : proposal?.summary,
      content: proposal?.content
        ? replaceStoredBudgetLine(proposal.content, formattedBudget)
        : proposal?.content,
      proposalContent: proposal?.proposalContent
        ? replaceStoredBudgetLine(proposal.proposalContent, formattedBudget)
        : proposal?.proposalContent,
    };
  });

  if (!updatedAny) {
    return false;
  }

  persistSavedProposalsToStorage(
    nextStoredProposals,
    activeId,
    getProposalStorageKeys(userId),
  );

  return true;
};

