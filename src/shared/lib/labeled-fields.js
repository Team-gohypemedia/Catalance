export const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLabeledFieldBoundaries = (value = "", labels = []) => {
  let source = String(value || "");
  if (!source) return "";

  for (const label of labels) {
    source = source.replace(
      new RegExp(
        `([.!?])\\s+((?:[-*•]\\s*)?${escapeRegExp(label)}\\s*(?::|-|–|—))`,
        "gi",
      ),
      "$1\n$2",
    );
  }

  return source;
};

export const extractLabeledLineValue = (value = "", labels = []) => {
  const source = normalizeLabeledFieldBoundaries(value, labels);
  if (!source) return "";

  const lines = source.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    for (const label of labels) {
      const match = line.match(
        new RegExp(
          `^(?:[-*•]\\s*)?${escapeRegExp(label)}\\s*(?::|-|–|—)\\s*(.+)$`,
          "i",
        ),
      );
      const extracted = match?.[1]?.trim();
      if (extracted) return extracted;
    }
  }

  return "";
};

export const extractStructuredFieldValue = (
  value = "",
  fieldName = "",
  allFieldNames = [],
) => {
  const normalizedFieldName = String(fieldName || "").trim();
  if (!normalizedFieldName) return "";

  const fieldNames = Array.isArray(allFieldNames) && allFieldNames.length > 0
    ? allFieldNames
    : [normalizedFieldName];
  const source = normalizeLabeledFieldBoundaries(value, fieldNames);
  if (!source) return "";

  const fieldPattern = fieldNames.map(escapeRegExp).join("|");
  const match = source.match(
    new RegExp(
      `(?:^|\\r?\\n)\\s*(?:[-*•]\\s*)?${escapeRegExp(normalizedFieldName)}\\s*:\\s*(.+?)(?=(?:\\r?\\n\\s*(?:[-*•]\\s*)?(?:${fieldPattern})\\s*:)|$)`,
      "is",
    ),
  );

  return match?.[1]?.replace(/^[\s-]+/, "").replace(/[\s-]+$/, "").trim() || "";
};
