const stripQuestionStepLabels = (content = "") =>
  String(content || "")
    .replace(/^\s*Q\d+\.\s*$/gim, "")
    .replace(/^\s*Q\d+\.\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripInlineOptionListTail = (value = "") => {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";

  const inlineOptionIndex = text.search(/\s+\d+\s*[.)]\s+\S/);
  if (inlineOptionIndex > 0) {
    return text.slice(0, inlineOptionIndex).trim().replace(/[:\-]\s*$/, "").trim();
  }

  return text;
};

export const repairSplitStrongEmphasis = (text = "") => {
  let current = String(text || "");
  if (!current.includes("**")) return current;

  let previous = "";
  while (current !== previous) {
    previous = current;
    current = current
      .replace(/\b([A-Za-z]+)\*\*([A-Za-z][^*\n]*?)\*\*/g, (_, prefix, emphasized) => `**${prefix}${emphasized}**`)
      .replace(/\*\*([^*\n]*?[A-Za-z])\*\*([A-Za-z]+)\b/g, (_, emphasized, suffix) => `**${emphasized}${suffix}**`);
  }

  return current;
};

export const normalizeMarkdownContent = (content = "") =>
  repairSplitStrongEmphasis(
    stripQuestionStepLabels(String(content))
  )
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const OPTION_LINE_REGEX = /^\s*(\d+)\.\s+(.+)$/;
const QUESTION_LINE_REGEX = /\?\s*$/;
const REQUEST_PROMPT_LINE_REGEX =
  /^(?:please\s+)?(?:tell\s+me|share|describe|explain|outline|list|provide|let\s+me\s+know|walk\s+me\s+through|help\s+me\s+understand)\b/i;
const OPTION_PROMPT_CUE_REGEX =
  /\b(choose|select|pick|prefer|options?|choice|choices|kindly|please|type|tap|reply|which one|which of these|here are)\b/i;

export const repairBrokenTechTokens = (text = "") =>
  String(text || "")
    .replace(/\b([A-Za-z][A-Za-z0-9+#-]*)\.\s*\n+\s*(js|ts|io)\b/gi, "$1.$2")
    .replace(/\b([A-Za-z][A-Za-z0-9+#-]*)\.\s+(js|ts|io)\b/gi, "$1.$2");

const INLINE_DOT_PLACEHOLDER = "__DOT__";

export const protectInlineDotTokens = (text = "") =>
  String(text || "").replace(
    /\b(?:https?:\/\/|www\.)[^\s)]+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}\b/gi,
    (match) => match.replace(/\./g, INLINE_DOT_PLACEHOLDER),
  );

export const restoreProtectedInlineDots = (text = "") =>
  String(text || "").replaceAll(INLINE_DOT_PLACEHOLDER, ".");

const ABBREVIATION_DOT_PLACEHOLDER = "__ABBR_DOT__";

const protectSentenceBreakAbbreviations = (text = "") =>
  String(text || "").replace(
    /\b(Dr|Mr|Mrs|Ms|e\.g|i\.e|etc)\.(?=(?:["')\]]|\s))/gi,
    (_, value) => `${value}${ABBREVIATION_DOT_PLACEHOLDER}`,
  );

const restoreSentenceBreakAbbreviations = (text = "") =>
  String(text || "").replaceAll(ABBREVIATION_DOT_PLACEHOLDER, ".");

export const forceSentenceBreaks = (text = "") => {
  const source = repairBrokenTechTokens(String(text || ""));
  if (!source) return source;

  if (source.includes("\n") || /(^|\s)([-*]|\d+\.)\s+/m.test(source)) {
    return source;
  }

  return restoreSentenceBreakAbbreviations(
    protectSentenceBreakAbbreviations(source)
    .replace(/([a-z0-9][.?!])\s+(?=[A-Z])/g, "$1\n\n")
  );
};

const normalizeInlineOptions = (text = "") =>
  String(text || "")
    .replace(/\?\s*(\d+)\.\s+/g, "?\n$1. ")
    .replace(/:\s*(\d+)\.\s+/g, ":\n$1. ")
    .replace(/([^\n])\s+(\d+)\.\s+(?=[A-Za-z])/g, "$1\n$2. ");

const normalizeWrappedQuestionContinuations = (text = "") =>
  String(text || "")
    .replace(/\n\s*([,;:])\s*/g, " $1 ")
    .replace(/[ \t]{2,}/g, " ");

const hasNestedOptionMarker = (text = "") => /\b\d+\.\s+\S/.test(String(text || ""));

const dedupeOptionEntries = (optionEntries = []) => {
  const bestByNumber = new Map();

  for (const entry of optionEntries) {
    const number = String(entry?.number || "").trim();
    const text = String(entry?.text || "").trim();
    if (!number || !text) continue;

    const existing = bestByNumber.get(number);
    if (!existing) {
      bestByNumber.set(number, { ...entry, number, text });
      continue;
    }

    const existingHasNested = hasNestedOptionMarker(existing.text);
    const incomingHasNested = hasNestedOptionMarker(text);
    const shouldReplace =
      (existingHasNested && !incomingHasNested) ||
      (existingHasNested === incomingHasNested && text.length < existing.text.length);

    if (shouldReplace) {
      bestByNumber.set(number, { ...entry, number, text });
    }
  }

  return Array.from(bestByNumber.values()).sort((a, b) => Number(a.number) - Number(b.number));
};

export const splitContextAndQuestion = (text = "") => {
  const source = repairBrokenTechTokens(String(text || "")).trim();
  if (!source) return { contextText: "", questionText: "" };
  if (!source.includes("?")) {
    const protectedSource = protectSentenceBreakAbbreviations(protectInlineDotTokens(source));
    const sentenceMatches =
      protectedSource.match(/[^.!?\n]+[.!?]+(?:["')\]]+)?/g) || [protectedSource];
    const restoredSentences = sentenceMatches
      .map((sentence) =>
        restoreProtectedInlineDots(restoreSentenceBreakAbbreviations(sentence.trim())),
      )
      .filter(Boolean);
    const lastSentence = restoredSentences[restoredSentences.length - 1] || "";

    if (REQUEST_PROMPT_LINE_REGEX.test(lastSentence)) {
      const contextText = restoredSentences
        .slice(0, -1)
        .join("\n\n")
        .trim();
      return {
        contextText,
        questionText: lastSentence,
      };
    }

    return { contextText: source, questionText: "" };
  }

  const protectedSource = protectSentenceBreakAbbreviations(protectInlineDotTokens(source));
  const sentenceMatches =
    protectedSource.match(/[^.!?\n]+[.!?]+(?:["')\]]+)?/g) || [protectedSource];
  let questionIdx = -1;

  for (let idx = sentenceMatches.length - 1; idx >= 0; idx -= 1) {
    if (sentenceMatches[idx].trim().endsWith("?")) {
      questionIdx = idx;
      break;
    }
  }

  if (questionIdx === -1) {
    const lines = source
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const lastLine = lines[lines.length - 1] || "";
    if (!lastLine.endsWith("?")) {
      return { contextText: source, questionText: "" };
    }
    return {
      contextText: restoreProtectedInlineDots(
        restoreSentenceBreakAbbreviations(lines.slice(0, -1).join("\n\n").trim()),
      ),
      questionText: restoreProtectedInlineDots(restoreSentenceBreakAbbreviations(lastLine)),
    };
  }

  const questionText = restoreProtectedInlineDots(
    restoreSentenceBreakAbbreviations(sentenceMatches[questionIdx].trim()),
  );
  const contextText = sentenceMatches
    .filter((_, idx) => idx !== questionIdx)
    .map((sentence) => sentence.trim())
    .filter((sentence) => !/^\d+\.$/.test(sentence))
    .join("\n\n")
    .trim();

  return {
    contextText: restoreProtectedInlineDots(restoreSentenceBreakAbbreviations(contextText)),
    questionText,
  };
};

export const parseAssistantMessageLayout = (
  content = "",
  { forceInteractiveOptions = false } = {},
) => {
  const normalized = normalizeWrappedQuestionContinuations(
    normalizeInlineOptions(
      repairBrokenTechTokens(normalizeMarkdownContent(content).replace(/\r/g, "").trim()),
    ),
  );
  if (!normalized) {
    return { contextText: "", questionText: "", options: [] };
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const optionEntries = lines
    .map((line, idx) => {
      const match = line.match(OPTION_LINE_REGEX);
      if (!match) return null;
      return { idx, number: match[1], text: match[2].trim() };
    })
    .filter(Boolean);
  const normalizedOptionEntries = dedupeOptionEntries(optionEntries);

  const hasQuestionLine = lines.some((line) => QUESTION_LINE_REGEX.test(line));
  const isLikelyInteractivePrompt =
    normalizedOptionEntries.length >= 2 &&
    normalizedOptionEntries.length <= 24 &&
    (hasQuestionLine || OPTION_PROMPT_CUE_REGEX.test(normalized) || forceInteractiveOptions);

  if (optionEntries.length > 0 && !isLikelyInteractivePrompt) {
    return { contextText: forceSentenceBreaks(normalized), questionText: "", options: [] };
  }

  let questionIndex = -1;
  for (let idx = lines.length - 1; idx >= 0; idx -= 1) {
    if (QUESTION_LINE_REGEX.test(lines[idx])) {
      questionIndex = idx;
      break;
    }
  }

  if (questionIndex === -1 && optionEntries.length > 0) {
    const firstOptionIndex = optionEntries[0].idx;
    for (let idx = firstOptionIndex - 1; idx >= 0; idx -= 1) {
      if (!OPTION_LINE_REGEX.test(lines[idx])) {
        questionIndex = idx;
        break;
      }
    }
  }

  if (questionIndex === -1) {
    const split = splitContextAndQuestion(normalized);
    if (!split.questionText) {
      return { contextText: normalized, questionText: "", options: [] };
    }
    return {
      contextText: split.contextText,
      questionText: split.questionText,
      options: [],
    };
  }

  const splitQuestionLine = splitContextAndQuestion(lines[questionIndex]);
  const hasInlineQuestionSplit = Boolean(splitQuestionLine.questionText);
  const questionText = stripInlineOptionListTail(
    hasInlineQuestionSplit ? splitQuestionLine.questionText : lines[questionIndex],
  );
  const contextParts = lines.filter(
    (line, idx) => idx !== questionIndex && !OPTION_LINE_REGEX.test(line),
  );

  if (hasInlineQuestionSplit && splitQuestionLine.contextText) {
    contextParts.push(splitQuestionLine.contextText);
  }

  const contextText = contextParts.join("\n\n").trim();

  return {
    contextText: forceSentenceBreaks(contextText),
    questionText: forceSentenceBreaks(questionText),
    options: normalizedOptionEntries.map((option) => ({
      number: option.number,
      text: option.text,
    })),
  };
};
