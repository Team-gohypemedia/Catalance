const STORAGE_NAMESPACE = "catalance";
const LEGACY_STORAGE_NAMESPACES = ["markify"];

const buildStorageKey = (namespace, name, suffix = "") =>
  `${namespace}:${name}${suffix}`;

const buildNamespacedStorageKey = (name, suffix = "") =>
  buildStorageKey(STORAGE_NAMESPACE, name, suffix);

const buildLegacyStorageKeys = (name, suffix = "") =>
  LEGACY_STORAGE_NAMESPACES.map((namespace) =>
    buildStorageKey(namespace, name, suffix),
  );

const uniqueKeys = (keys = []) =>
  [...new Set((Array.isArray(keys) ? keys : []).filter(Boolean))];

const migrateStorageKey = ({ key, legacyKeys = [] } = {}) => {
  if (typeof window === "undefined" || !key) return false;

  const normalizedLegacyKeys = uniqueKeys(legacyKeys).filter(
    (legacyKey) => legacyKey !== key,
  );

  if (window.localStorage.getItem(key) !== null) {
    normalizedLegacyKeys.forEach((legacyKey) =>
      window.localStorage.removeItem(legacyKey),
    );
    return false;
  }

  for (const legacyKey of normalizedLegacyKeys) {
    const legacyValue = window.localStorage.getItem(legacyKey);
    if (legacyValue === null) continue;

    window.localStorage.setItem(key, legacyValue);
    normalizedLegacyKeys.forEach((staleKey) =>
      window.localStorage.removeItem(staleKey),
    );
    return true;
  }

  return false;
};

const getProposalStorageKeys = (userId) => {
  const suffix = userId ? `:${userId}` : "";

  return {
    listKey: buildNamespacedStorageKey("savedProposals", suffix),
    singleKey: buildNamespacedStorageKey("savedProposal", suffix),
    syncedKey: buildNamespacedStorageKey("savedProposalSynced", suffix),
  };
};

const getLegacyProposalStorageKeys = (userId) => {
  const suffix = userId ? `:${userId}` : "";

  return {
    listKeys: buildLegacyStorageKeys("savedProposals", suffix),
    singleKeys: buildLegacyStorageKeys("savedProposal", suffix),
    syncedKeys: buildLegacyStorageKeys("savedProposalSynced", suffix),
  };
};

const migrateProposalStorageNamespace = (userId) => {
  const currentKeys = getProposalStorageKeys(userId);
  const legacyKeys = getLegacyProposalStorageKeys(userId);

  migrateStorageKey({
    key: currentKeys.listKey,
    legacyKeys: legacyKeys.listKeys,
  });
  migrateStorageKey({
    key: currentKeys.singleKey,
    legacyKeys: legacyKeys.singleKeys,
  });
  migrateStorageKey({
    key: currentKeys.syncedKey,
    legacyKeys: legacyKeys.syncedKeys,
  });

  return currentKeys;
};

const getProposalListStoragePrefixes = () =>
  uniqueKeys([
    buildNamespacedStorageKey("savedProposals"),
    ...buildLegacyStorageKeys("savedProposals"),
  ]);

const getGuestChatStorageKeys = () => ({
  primaryKey: buildNamespacedStorageKey("guestAiSessions:v1"),
  legacyKeys: buildLegacyStorageKeys("guestAiSessions:v1"),
});

const getGuestChatSidebarSizeStorageKeys = () => ({
  primaryKey: buildNamespacedStorageKey("guestAiSidebarSize:v1"),
  legacyKeys: buildLegacyStorageKeys("guestAiSidebarSize:v1"),
});

const migrateGuestAiStorageNamespace = () => {
  const guestChatKeys = getGuestChatStorageKeys();
  const sidebarKeys = getGuestChatSidebarSizeStorageKeys();

  migrateStorageKey({
    key: guestChatKeys.primaryKey,
    legacyKeys: guestChatKeys.legacyKeys,
  });
  migrateStorageKey({
    key: sidebarKeys.primaryKey,
    legacyKeys: sidebarKeys.legacyKeys,
  });
};

const getChatConversationStorageKey = (conversationKey = "") =>
  buildNamespacedStorageKey(`chatConversationId:${conversationKey}`);

const getLegacyChatConversationStorageKeys = (conversationKey = "") =>
  buildLegacyStorageKeys(`chatConversationId:${conversationKey}`);

const migrateChatConversationStorageKey = (conversationKey = "") => {
  const key = getChatConversationStorageKey(conversationKey);

  migrateStorageKey({
    key,
    legacyKeys: getLegacyChatConversationStorageKeys(conversationKey),
  });

  return key;
};

export {
  buildLegacyStorageKeys,
  buildNamespacedStorageKey,
  getChatConversationStorageKey,
  getGuestChatSidebarSizeStorageKeys,
  getGuestChatStorageKeys,
  getProposalListStoragePrefixes,
  getProposalStorageKeys,
  migrateChatConversationStorageKey,
  migrateGuestAiStorageNamespace,
  migrateProposalStorageNamespace,
  migrateStorageKey,
};
