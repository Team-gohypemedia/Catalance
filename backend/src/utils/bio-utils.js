const BIO_TEXT_KEYS = [
  "bio",
  "about",
  "description",
  "summary",
  "story",
  "text",
  "headline",
  "intro",
  "aboutMe",
];

const getTextFromObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return "";
  }

  for (const key of BIO_TEXT_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const values = Object.values(obj);
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "object" && value !== null) {
      const nested = getTextFromObject(value);
      if (nested) {
        return nested;
      }
    }
  }

  return "";
};

export const extractBioText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    const isJsonLike =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"));

    if (isJsonLike) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "string") {
          return parsed.trim();
        }
        if (Array.isArray(parsed)) {
          for (const entry of parsed) {
            if (typeof entry === "string" && entry.trim()) {
              return entry.trim();
            }
            if (typeof entry === "object" && entry !== null) {
              const nested = getTextFromObject(entry);
              if (nested) {
                return nested;
              }
            }
          }
          return parsed
            .map((entry) =>
              typeof entry === "string" ? entry.trim() : ""
            )
            .filter(Boolean)
            .join(" ")
            .trim();
        }
        if (typeof parsed === "object" && parsed !== null) {
          const nested = getTextFromObject(parsed);
          if (nested) {
            return nested;
          }
        }
      } catch {
        // Parsing failed, fall back to raw string
      }
    }

    return trimmed;
  }

  if (typeof value === "object") {
    return getTextFromObject(value);
  }

  return String(value).trim();
};
