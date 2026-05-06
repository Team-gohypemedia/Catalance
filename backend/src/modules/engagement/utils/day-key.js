const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const getUtcDayKey = (date = new Date()) =>
  new Date(date).toISOString().slice(0, 10);

export const getNextUtcResetAt = (dayKey = getUtcDayKey()) => {
  const resetDate = new Date(`${dayKey}T00:00:00.000Z`);
  resetDate.setUTCDate(resetDate.getUTCDate() + 1);
  return resetDate.toISOString();
};

export const getPreviousUtcDayKey = (dayKey = getUtcDayKey()) => {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return getUtcDayKey(new Date(date.getTime() - DAY_IN_MS));
};

export const getDayKeyAgeInDays = (olderDayKey, newerDayKey = getUtcDayKey()) => {
  if (!olderDayKey) return null;
  const older = new Date(`${olderDayKey}T00:00:00.000Z`).getTime();
  const newer = new Date(`${newerDayKey}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(older) || !Number.isFinite(newer)) return null;
  return Math.round((newer - older) / DAY_IN_MS);
};
