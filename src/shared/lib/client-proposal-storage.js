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

const getProposalSignature = (proposal = {}) => {
  const title = (proposal.projectTitle || proposal.title || "")
    .trim()
    .toLowerCase();
  const service = (proposal.serviceKey || proposal.service || "")
    .trim()
    .toLowerCase();
  const summary = (proposal.summary || proposal.content || "")
    .trim()
    .toLowerCase();

  if (!title && !service) {
    return `${title}::${service}::${summary.slice(0, 120)}`;
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

  const normalized = proposals.map(normalizeSavedProposal);
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
  const merged = [...base];

  incoming.forEach((proposal) => {
    const signature = getProposalSignature(proposal);
    const index = merged.findIndex(
      (item) => getProposalSignature(item) === signature
    );

    if (index === -1) {
      merged.push(proposal);
      return;
    }

    const current = merged[index];
    const currentTimestamp = new Date(
      current.updatedAt || current.createdAt || 0
    ).getTime();
    const nextTimestamp = new Date(
      proposal.updatedAt || proposal.createdAt || 0
    ).getTime();

    if (nextTimestamp >= currentTimestamp) {
      merged[index] = {
        ...current,
        ...proposal,
        id: current.id || proposal.id,
      };
    }
  });

  return merged;
};

const persistSavedProposalsToStorage = (proposals, activeId, storageKeys) => {
  if (typeof window === "undefined") return;

  const keys = storageKeys || getProposalStorageKeys();
  if (!Array.isArray(proposals) || proposals.length === 0) {
    window.localStorage.removeItem(keys.listKey);
    window.localStorage.removeItem(keys.singleKey);
    return;
  }

  window.localStorage.setItem(keys.listKey, JSON.stringify(proposals));
  const active =
    proposals.find((proposal) => proposal.id === activeId) || proposals[0];

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

  return { proposals, activeId };
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
