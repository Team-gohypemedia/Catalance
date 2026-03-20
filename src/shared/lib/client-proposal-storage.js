const getProposalStorageKeys = (userId) => {
  const suffix = userId ? `:${userId}` : "";
  return {
    listKey: `markify:savedProposals${suffix}`,
    singleKey: `markify:savedProposal${suffix}`,
    syncedKey: `markify:savedProposalSynced${suffix}`,
  };
};

const buildLocalProposalId = () =>
  `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeComparableText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[_/\\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveProposalServiceValue = (proposal = {}) =>
  proposal.serviceKey ||
  proposal.service ||
  proposal.serviceName ||
  proposal.category ||
  proposal.project?.serviceKey ||
  proposal.project?.service ||
  proposal.project?.serviceName ||
  "";

const stripServiceNameFromProjectTitle = (
  projectTitle = "",
  serviceLabel = "",
) => {
  const normalizedProjectTitle = String(projectTitle || "").trim();
  const normalizedServiceLabel = String(serviceLabel || "").trim();

  if (!normalizedProjectTitle) return "";
  if (!normalizedServiceLabel) return normalizedProjectTitle;

  const titleParts = normalizedProjectTitle
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (titleParts.length === 2) {
    const normalizedService = normalizeComparableText(normalizedServiceLabel);

    if (normalizeComparableText(titleParts[0]) === normalizedService) {
      return titleParts[1];
    }

    if (normalizeComparableText(titleParts[1]) === normalizedService) {
      return titleParts[0];
    }
  }

  return normalizedProjectTitle;
};

const resolveProposalTitleValue = (proposal = {}) => {
  const rawTitle =
    proposal.projectTitle ||
    proposal.title ||
    proposal.project?.title ||
    proposal.project?.name ||
    "";
  const serviceValue = resolveProposalServiceValue(proposal);

  return stripServiceNameFromProjectTitle(rawTitle, serviceValue) || rawTitle;
};

const resolveProposalProjectLink = (proposal = {}) =>
  String(
    proposal.syncedProjectId || proposal.projectId || proposal.project?.id || "",
  ).trim();

const mergeProposalRecords = (current = {}, incoming = {}) => {
  const currentTimestamp = new Date(
    current.updatedAt || current.createdAt || 0,
  ).getTime();
  const incomingTimestamp = new Date(
    incoming.updatedAt || incoming.createdAt || 0,
  ).getTime();
  const preferIncoming = incomingTimestamp >= currentTimestamp;
  const preferred = preferIncoming ? incoming : current;
  const fallback = preferIncoming ? current : incoming;

  return {
    ...fallback,
    ...preferred,
    id: current.id || incoming.id || buildLocalProposalId(),
  };
};

const getProposalSignature = (proposal = {}) => {
  const title = normalizeComparableText(resolveProposalTitleValue(proposal));
  const service = normalizeComparableText(resolveProposalServiceValue(proposal));
  const summary = normalizeComparableText(
    proposal.summary || proposal.content || proposal.description || "",
  );

  if (!title && !service) {
    return `${title}::${service}::${summary.slice(0, 160)}`;
  }

  return `${title}::${service}`;
};

const resolveActiveProposalId = (proposals, preferredId, fallbackId) => {
  if (!Array.isArray(proposals) || proposals.length === 0) return null;

  if (
    preferredId &&
    proposals.some((proposal) => proposal.id === preferredId)
  ) {
    return preferredId;
  }

  if (fallbackId && proposals.some((proposal) => proposal.id === fallbackId)) {
    return fallbackId;
  }

  return proposals[0].id;
};

const normalizeSavedProposal = (proposal = {}) => {
  const next = { ...proposal };

  if (!next.id) {
    next.id = next.localId || buildLocalProposalId();
  }

  const text = String(next.content || next.summary || "");
  if (!next.timeline && text) {
    const timelineMatch = text.match(/Timeline[:\s\-\n\u2022]*([^\n]+)/i);
    if (timelineMatch) {
      next.timeline = timelineMatch[1].trim();
    }
  }

  return next;
};

const getProposalDedupKeys = (proposal = {}) => {
  const keys = [];
  const linkedProjectId = resolveProposalProjectLink(proposal);
  const signature = getProposalSignature(proposal);
  const summaryKey = normalizeComparableText(
    proposal.summary || proposal.content || proposal.description || "",
  );
  const serviceKey = normalizeComparableText(resolveProposalServiceValue(proposal));
  const budgetKey = normalizeComparableText(
    proposal.budget || proposal.amount || proposal.project?.budget || "",
  );

  if (proposal.id) {
    keys.push(`id:${String(proposal.id).trim()}`);
  }

  if (linkedProjectId) {
    keys.push(`project:${linkedProjectId}`);
  }

  if (signature && signature !== "::") {
    keys.push(`signature:${signature}`);
  }

  if (summaryKey) {
    keys.push(`summary:${serviceKey}::${budgetKey}::${summaryKey.slice(0, 160)}`);
  }

  return keys;
};

const dedupeSavedProposals = (proposals = []) => {
  const deduped = [];
  const keyToIndex = new Map();

  proposals
    .map(normalizeSavedProposal)
    .forEach((proposal) => {
      const proposalKeys = getProposalDedupKeys(proposal);
      let existingIndex = -1;

      for (const key of proposalKeys) {
        const matchIndex = keyToIndex.get(key);
        if (typeof matchIndex === "number") {
          existingIndex = matchIndex;
          break;
        }
      }

      if (existingIndex === -1) {
        const nextIndex = deduped.length;
        deduped.push(proposal);
        proposalKeys.forEach((key) => keyToIndex.set(key, nextIndex));
        return;
      }

      const mergedProposal = mergeProposalRecords(
        deduped[existingIndex],
        proposal,
      );
      deduped[existingIndex] = mergedProposal;
      getProposalDedupKeys(mergedProposal).forEach((key) =>
        keyToIndex.set(key, existingIndex),
      );
    });

  return deduped;
};

const readSavedProposalsFromKeys = (listKey, singleKey) => {
  if (typeof window === "undefined") {
    return { proposals: [], activeId: null };
  }

  let proposals = [];
  const listRaw = window.localStorage.getItem(listKey);
  const singleRaw = window.localStorage.getItem(singleKey);

  if (listRaw) {
    try {
      const parsed = JSON.parse(listRaw);
      if (Array.isArray(parsed)) proposals = parsed;
    } catch {
      proposals = [];
    }
  }

  if (singleRaw) {
    try {
      const parsed = JSON.parse(singleRaw);
      if (parsed && (parsed.content || parsed.summary || parsed.projectTitle)) {
        const signature = getProposalSignature(parsed);
        const exists = proposals.some(
          (item) => getProposalSignature(item) === signature
        );
        if (!exists) {
          proposals = [...proposals, parsed];
        }
      }
    } catch {
      // Ignore malformed local storage payloads.
    }
  }

  const normalized = dedupeSavedProposals(proposals);
  let activeId = null;

  if (singleRaw) {
    try {
      const parsed = JSON.parse(singleRaw);
      const signature = getProposalSignature(parsed);
      const match =
        normalized.find((item) => item.id === parsed?.id) ||
        normalized.find((item) => getProposalSignature(item) === signature);
      activeId = match?.id || null;
    } catch {
      activeId = null;
    }
  }

  activeId = resolveActiveProposalId(normalized, activeId, null);

  return { proposals: normalized, activeId };
};

const mergeProposalsBySignature = (base = [], incoming = []) => {
  return dedupeSavedProposals([...base, ...incoming]);
};

const persistSavedProposalsToStorage = (proposals, activeId, storageKeys) => {
  if (typeof window === "undefined") return;

  const keys = storageKeys || getProposalStorageKeys();
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(keys.listKey);
    window.localStorage.removeItem(keys.singleKey);
    return;
  }

  const normalized = dedupeSavedProposals(proposals);
  window.localStorage.setItem(keys.listKey, JSON.stringify(normalized));
  const active =
    normalized.find((proposal) => proposal.id === activeId) || normalized[0];

  if (active) {
    window.localStorage.setItem(keys.singleKey, JSON.stringify(active));
  }
};

const loadSavedProposalsFromStorage = (userId) => {
  if (typeof window === "undefined") {
    return { proposals: [], activeId: null };
  }

  const storageKeys = getProposalStorageKeys(userId);
  const guestKeys = getProposalStorageKeys();

  let { proposals, activeId } = readSavedProposalsFromKeys(
    storageKeys.listKey,
    storageKeys.singleKey
  );

  if (userId && guestKeys.listKey !== storageKeys.listKey) {
    const guest = readSavedProposalsFromKeys(
      guestKeys.listKey,
      guestKeys.singleKey
    );

    if (guest.proposals.length) {
      const guestWithOwner = guest.proposals.map((proposal) => ({
        ...proposal,
        ownerId: userId,
      }));
      const merged = mergeProposalsBySignature(proposals, guestWithOwner);
      const nextActiveId = resolveActiveProposalId(
        merged,
        activeId,
        guest.activeId
      );

      persistSavedProposalsToStorage(merged, nextActiveId, storageKeys);
      window.localStorage.removeItem(guestKeys.listKey);
      window.localStorage.removeItem(guestKeys.singleKey);
      window.localStorage.removeItem(guestKeys.syncedKey);

      proposals = merged;
      activeId = nextActiveId;
    }
  }

  const dedupedProposals = dedupeSavedProposals(proposals);
  const nextActiveId = resolveActiveProposalId(dedupedProposals, activeId, null);

  if (
    dedupedProposals.length !== proposals.length ||
    nextActiveId !== activeId
  ) {
    persistSavedProposalsToStorage(dedupedProposals, nextActiveId, storageKeys);
  }

  return { proposals: dedupedProposals, activeId: nextActiveId };
};

const migrateSavedProposalsToUser = (userId) =>
  loadSavedProposalsFromStorage(userId);

export {
  getProposalSignature,
  getProposalStorageKeys,
  loadSavedProposalsFromStorage,
  migrateSavedProposalsToUser,
  persistSavedProposalsToStorage,
  resolveActiveProposalId,
};
