const GUEST_FAVORITES_KEY = "marketplace_favorites:guest";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const normalizeFavoriteId = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNonEmptyText = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toFavoriteMap = (rawValue) => {
  const source = asObject(rawValue);
  const next = {};

  Object.entries(source).forEach(([rawId, selected]) => {
    const id = normalizeFavoriteId(rawId);
    if (!id || !selected) return;
    next[id] = true;
  });

  return next;
};

const sanitizeFavoriteSnapshot = (rawSnapshot) => {
  const source = asObject(rawSnapshot);
  const id = normalizeFavoriteId(source.id);
  if (!id) return null;

  return {
    id,
    freelancerId: normalizeFavoriteId(source.freelancerId),
    freelancerName: toNonEmptyText(source.freelancerName) || "Freelancer",
    freelancerAvatar: toNonEmptyText(source.freelancerAvatar),
    freelancerVerified: Boolean(source.freelancerVerified),
    serviceTitle: toNonEmptyText(source.serviceTitle) || "Service",
    serviceKey: toNonEmptyText(source.serviceKey),
    bio: toNonEmptyText(source.bio),
    coverImage: toNonEmptyText(source.coverImage),
    deliveryTime: toNonEmptyText(source.deliveryTime),
    price: toFiniteNumber(source.price),
    priceLabel: toNonEmptyText(source.priceLabel),
    rating: toFiniteNumber(source.rating) || 0,
    reviewCount: toFiniteNumber(source.reviewCount) || 0,
    updatedAt: toNonEmptyText(source.updatedAt) || new Date().toISOString(),
  };
};

const toFavoriteSnapshots = (rawValue) => {
  const source = asObject(rawValue);
  const next = {};

  Object.entries(source).forEach(([rawId, rawSnapshot]) => {
    const id = normalizeFavoriteId(rawId);
    const snapshot = sanitizeFavoriteSnapshot({
      ...asObject(rawSnapshot),
      id: asObject(rawSnapshot).id ?? id,
    });
    if (!id || !snapshot) return;
    next[id] = snapshot;
  });

  return next;
};

const parseMarketplaceFavoritesPayload = (rawValue) => {
  if (!rawValue) {
    return { favoriteMap: {}, itemSnapshots: {} };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { favoriteMap: {}, itemSnapshots: {} };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { favoriteMap: {}, itemSnapshots: {} };
  }

  const hasStructuredShape =
    parsed.favoriteMap !== undefined || parsed.itemSnapshots !== undefined;

  if (!hasStructuredShape) {
    return {
      favoriteMap: toFavoriteMap(parsed),
      itemSnapshots: {},
    };
  }

  return {
    favoriteMap: toFavoriteMap(parsed.favoriteMap),
    itemSnapshots: toFavoriteSnapshots(parsed.itemSnapshots),
  };
};

export const getMarketplaceFavoritesStorageKey = (userId) => {
  const normalizedUserId = normalizeFavoriteId(userId);
  return normalizedUserId
    ? `marketplace_favorites:${normalizedUserId}`
    : GUEST_FAVORITES_KEY;
};

export const loadMarketplaceFavorites = (userId) => {
  if (typeof window === "undefined") {
    return { favoriteMap: {}, itemSnapshots: {} };
  }

  const key = getMarketplaceFavoritesStorageKey(userId);
  try {
    const rawValue = window.localStorage.getItem(key);
    return parseMarketplaceFavoritesPayload(rawValue);
  } catch {
    return { favoriteMap: {}, itemSnapshots: {} };
  }
};

export const saveMarketplaceFavorites = (
  userId,
  { favoriteMap = {}, itemSnapshots = {} } = {},
) => {
  if (typeof window === "undefined") return;

  const key = getMarketplaceFavoritesStorageKey(userId);
  const normalizedFavoriteMap = toFavoriteMap(favoriteMap);
  const normalizedSnapshots = toFavoriteSnapshots(itemSnapshots);
  const payload = {
    version: 2,
    favoriteMap: normalizedFavoriteMap,
    itemSnapshots: normalizedSnapshots,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota and private mode failures.
  }
};

export const createMarketplaceFavoriteSnapshot = (item = {}) => {
  const id = normalizeFavoriteId(item?.id);
  if (!id) return null;

  const serviceDetails = asObject(item?.serviceDetails);
  const rawPrice =
    serviceDetails.startingPrice ??
    serviceDetails.minBudget ??
    serviceDetails.price;

  return sanitizeFavoriteSnapshot({
    id,
    freelancerId: item?.freelancerId || item?.freelancer?.id || null,
    freelancerName: item?.freelancer?.fullName,
    freelancerAvatar: item?.freelancer?.avatar || null,
    freelancerVerified: Boolean(item?.freelancer?.isVerified),
    serviceTitle: item?.service,
    serviceKey: item?.serviceKey || null,
    bio: item?.bio || null,
    coverImage: serviceDetails.coverImage || serviceDetails.image || null,
    deliveryTime: serviceDetails.deliveryTime || null,
    price: toFiniteNumber(rawPrice),
    priceLabel:
      serviceDetails.averageProjectPriceRange || serviceDetails.priceRange || null,
    rating: toFiniteNumber(item?.rating) || 0,
    reviewCount: toFiniteNumber(item?.reviewCount) || 0,
    updatedAt: new Date().toISOString(),
  });
};
