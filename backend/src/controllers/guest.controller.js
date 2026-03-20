import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.js";
import { chatWithAI, generateProposalMarkdown } from "../services/ai.service.js";

const GREETING_ONLY_REGEX = /^(hi|hello|hey|yo|hola|good\s*(morning|afternoon|evening))[!.\s]*$/i;
const NAME_QUESTION_REGEX = /\bname\b/i;
const GREETING_SMALLTALK_REGEX =
    /\b(hi|hello|hey|yo|hola|namaste|salam|how are you|what'?s up|kya\s*hal|kaise\s*ho)\b/i;
const NAME_INTRO_REGEX = /\b(my name is|i am|i'm|this is)\b/i;
const CORRECTION_INTENT_REGEX =
    /\b(change|changed|update|updated|correct|correction|revise|replace|instead|not\s+.*\s+but)\b/i;
const CONTEXT_SUGGESTION_REGEX =
    /\b(suggest|suggestion|recommend|recommended|best|which is better|according to|as per|based on|shared earlier|from earlier|my startup|my case|possible|is it possible|can we build|can this be built|feasible|not sure|confused|difference|explain)\b/i;
const AGENT_IDENTITY_REGEX =
    /\b(what(?:'s| is)\s+your\s+name|your\s+name\??|who\s+are\s+you|are\s+you\s+(?:an?\s+)?(?:ai|bot|human))\b/i;
const GRATITUDE_REGEX = /\b(thanks|thank you|thx|ty)\b/i;
const ATTACHMENT_REFERENCE_REGEX = /\b(pdf|document|doc|file|attachment|uploaded|upload|proposal|brochure|resume|deck|sheet)\b/i;
const EXTRACTION_CONFIDENCE_MIN = 0.7;
const EXTRACTION_CONFIDENCE_UPDATE_MIN = 0.86;
const FRIENDLY_BRIDGES = [
    "Thanks for sharing that.",
    "Great, this helps a lot.",
    "Perfect, we are moving forward well.",
    "Nice, I noted that."
];
const ATTACHMENT_TOKEN_REGEX = /^\[\[ATTACHMENT\]\]([^|]+)\|([^|]+)\|([^|]*)\|(\d+)$/;
const MAX_ATTACHMENT_ANALYSIS_COUNT = 3;
const MAX_SINGLE_ATTACHMENT_TEXT_CHARS = 4000;
const MAX_ATTACHMENT_CONTEXT_CHARS = 9000;
const MAX_VISION_IMAGE_BYTES = 4 * 1024 * 1024;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const PDF_FILE_REGEX = /\.pdf$/i;
const DOCX_FILE_REGEX = /\.docx$/i;
const TEXT_FILE_REGEX = /\.(txt|md|csv|json|xml|yaml|yml)$/i;
let pdfJsModulePromise = null;
let mammothModulePromise = null;

const safeDecodeURIComponent = (value = "") => {
    try {
        return decodeURIComponent(value);
    } catch {
        return String(value || "");
    }
};

const countLikelyMojibakeArtifacts = (value = "") =>
    (String(value || "").match(/Ã.|â.|Â|�/g) || []).length;

const normalizeAttachmentDisplayText = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return "";

    const candidates = [source];
    if (countLikelyMojibakeArtifacts(source) > 0) {
        try {
            const repaired = Buffer.from(source, "latin1").toString("utf8").trim();
            if (repaired) {
                candidates.push(repaired);
            }
        } catch {
            // Keep the original string if repair fails.
        }
    }

    return candidates
        .map((text) => ({
            text,
            artifactCount: countLikelyMojibakeArtifacts(text),
            length: text.length
        }))
        .sort((a, b) => a.artifactCount - b.artifactCount || b.length - a.length)[0]?.text || source;
};

const parseJsonObjectFromRaw = (raw = "") => {
    const source = String(raw || "").trim();
    if (!source) return null;

    const firstBrace = source.indexOf("{");
    const lastBrace = source.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? source.slice(firstBrace, lastBrace + 1)
        : source;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim(),
    ];

    for (const candidate of candidates) {
        if (!candidate.startsWith("{") || !candidate.endsWith("}")) continue;
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    return null;
};

const parseAttachmentTokensFromMessage = (messageText = "") => {
    const lines = String(messageText || "").replace(/\r/g, "").split("\n");
    const attachments = [];
    const plainLines = [];

    for (const rawLine of lines) {
        const line = String(rawLine || "").trim();
        const match = line.match(ATTACHMENT_TOKEN_REGEX);
        if (!match) {
            plainLines.push(rawLine);
            continue;
        }

        const name = normalizeAttachmentDisplayText(safeDecodeURIComponent(match[1] || "")) || "Attachment";
        const url = safeDecodeURIComponent(match[2] || "");
        const type = safeDecodeURIComponent(match[3] || "");
        const size = Number.parseInt(match[4] || "0", 10);

        if (!url) continue;
        attachments.push({
            name,
            url,
            type,
            size: Number.isFinite(size) ? size : 0,
        });
    }

    return {
        plainText: plainLines.join("\n").trim(),
        attachments,
    };
};

const getMostRecentAttachmentsFromMessages = (messages = []) => {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
        const message = messages[idx];
        if (String(message?.role || "").toLowerCase() !== "user") continue;
        const parsed = parseAttachmentTokensFromMessage(String(message?.content || ""));
        if (parsed.attachments.length > 0) {
            return parsed.attachments;
        }
    }

    return [];
};

const clipAttachmentText = (text = "", limit = MAX_SINGLE_ATTACHMENT_TEXT_CHARS) =>
    String(text || "")
        .split("\0")
        .join(" ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, Math.max(0, limit));

const isImageAttachment = (attachment = {}) =>
    String(attachment?.type || "").startsWith("image/")
    || IMAGE_FILE_REGEX.test(String(attachment?.name || ""))
    || IMAGE_FILE_REGEX.test(String(attachment?.url || ""));

const isPdfAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "application/pdf"
    || PDF_FILE_REGEX.test(String(attachment?.name || ""))
    || PDF_FILE_REGEX.test(String(attachment?.url || ""));

const isDocxAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || DOCX_FILE_REGEX.test(String(attachment?.name || ""))
    || DOCX_FILE_REGEX.test(String(attachment?.url || ""));

const isTextAttachment = (attachment = {}) =>
    String(attachment?.type || "").toLowerCase() === "text/plain"
    || TEXT_FILE_REGEX.test(String(attachment?.name || ""))
    || TEXT_FILE_REGEX.test(String(attachment?.url || ""));

const loadPdfJs = async () => {
    if (!pdfJsModulePromise) {
        pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs");
    }
    return pdfJsModulePromise;
};

const loadMammoth = async () => {
    if (!mammothModulePromise) {
        mammothModulePromise = import("mammoth");
    }
    return mammothModulePromise;
};

const fetchAttachmentResponse = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch attachment (${response.status})`);
    }
    return response;
};

const extractPdfContextFromBuffer = async (buffer) => {
    const pdfJs = await loadPdfJs();
    const loadingTask = pdfJs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    let extracted = "";
    const metadata = await pdf.getMetadata().catch(() => null);
    const info = metadata?.info || {};
    const metadataMap = metadata?.metadata;
    const title = normalizeAttachmentDisplayText(
        metadataMap?.get?.("dc:title")
        || metadataMap?.get?.("pdf:Title")
        || info.Title
        || ""
    );
    const subject = normalizeAttachmentDisplayText(info.Subject || "");
    const keywords = normalizeAttachmentDisplayText(info.Keywords || "");

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
            .map((item) => String(item?.str || "").trim())
            .filter(Boolean)
            .join(" ");

        if (!pageText) continue;
        extracted = `${extracted}\n${pageText}`.trim();
        if (extracted.length >= MAX_SINGLE_ATTACHMENT_TEXT_CHARS) break;
    }

    const contextParts = [];
    if (title) contextParts.push(`Document title: ${title}`);
    if (subject) contextParts.push(`Document subject: ${subject}`);
    if (keywords) contextParts.push(`Document keywords: ${keywords}`);
    if (pdf.numPages) contextParts.push(`Page count: ${pdf.numPages}`);
    if (extracted) contextParts.push(`Extracted text:\n${extracted}`);

    return clipAttachmentText(contextParts.join("\n"));
};

const extractDocxTextFromBuffer = async (buffer) => {
    const mammothModule = await loadMammoth();
    const result = await mammothModule.extractRawText({ buffer });
    return clipAttachmentText(result?.value || "");
};

const analyzeImageAttachmentWithVision = async ({ url = "", name = "", type = "" }) => {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey || !url) return "";

    const model = env.OPENROUTER_MODEL || "openai/gpt-4o";
    const referer = env.FRONTEND_URL || env.CORS_ORIGIN || "http://localhost:5173";
    const prompt = [
        "Analyze this uploaded image for project-requirement discovery.",
        `File name: ${name || "image"}`,
        'Return strict JSON: {"summary":"", "visibleText":"", "possibleBrandName":"", "designCues":[]}.',
        "Keep it concise and practical.",
    ].join(" ");

    try {
        const attachmentResponse = await fetchAttachmentResponse(url);
        const imageMimeTypeFromResponse = String(attachmentResponse.headers.get("content-type") || "")
            .split(";")[0]
            .trim()
            .toLowerCase();
        const imageMimeType = imageMimeTypeFromResponse || String(type || "image/png").toLowerCase();
        const imageBuffer = Buffer.from(await attachmentResponse.arrayBuffer());

        if (imageBuffer.length === 0) return "";
        if (imageBuffer.length > MAX_VISION_IMAGE_BYTES) {
            console.warn(
                `[Attachment Vision] Skipped "${name}" because image is larger than ${MAX_VISION_IMAGE_BYTES} bytes.`
            );
            return "";
        }

        // OpenRouter cannot fetch localhost URLs from its cloud infra.
        // Send the image as a data URL payload instead.
        const imageDataUrl = `data:${imageMimeType};base64,${imageBuffer.toString("base64")}`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": referer,
                "X-Title": "Catalance Guest Attachment Analyzer",
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: imageDataUrl } },
                        ],
                    },
                ],
                temperature: 0.2,
                max_tokens: 260,
            }),
            signal: AbortSignal.timeout(25000),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
            console.warn(
                `[Attachment Vision] OpenRouter vision failed (${response.status}): ${data?.error?.message || data?.message || "Unknown error"}`
            );
            return "";
        }

        const rawContentValue = data?.choices?.[0]?.message?.content;
        const rawContent = typeof rawContentValue === "string"
            ? rawContentValue
            : Array.isArray(rawContentValue)
                ? rawContentValue.map((part) => part?.text || "").join("\n").trim()
                : "";
        const parsed = parseJsonObjectFromRaw(rawContent);
        if (parsed) {
            const summary = clipAttachmentText(parsed.summary || "", 500);
            const visibleText = clipAttachmentText(parsed.visibleText || "", 220);
            const possibleBrandName = clipAttachmentText(parsed.possibleBrandName || "", 120);
            const designCues = Array.isArray(parsed.designCues)
                ? parsed.designCues.map((cue) => clipAttachmentText(cue || "", 60)).filter(Boolean).slice(0, 6)
                : [];

            return [
                summary ? `Summary: ${summary}` : "",
                visibleText ? `Visible text: ${visibleText}` : "",
                possibleBrandName ? `Possible brand/company name: ${possibleBrandName}` : "",
                designCues.length > 0 ? `Design cues: ${designCues.join(", ")}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        }

        return clipAttachmentText(rawContent, 600);
    } catch {
        return "";
    }
};

const extractAttachmentContext = async ({ attachment = {}, index = 0 }) => {
    const name = normalizeAttachmentDisplayText(
        String(attachment.name || `Attachment ${index + 1}`).trim()
    );
    const type = String(attachment.type || "").trim();
    const descriptor = `[Attachment ${index + 1}] ${name}${type ? ` (${type})` : ""}`;

    try {
        if (isImageAttachment(attachment)) {
            const visionSummary = await analyzeImageAttachmentWithVision({
                url: attachment.url,
                name,
                type,
            });

            return {
                descriptor,
                extractedContext: visionSummary
                    ? `Image analysis:\n${visionSummary}`
                    : "Image uploaded. Could not extract image details automatically.",
            };
        }

        if (isTextAttachment(attachment)) {
            const response = await fetchAttachmentResponse(attachment.url);
            const text = clipAttachmentText(await response.text());
            if (!text) {
                return {
                    descriptor,
                    extractedContext: "Text file uploaded, but no readable text was found.",
                };
            }
            return {
                descriptor,
                extractedContext: `Extracted text:\n${text}`,
            };
        }

        if (isPdfAttachment(attachment) || isDocxAttachment(attachment)) {
            const response = await fetchAttachmentResponse(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            let extractedDocumentContext = "";
            if (isPdfAttachment(attachment)) {
                extractedDocumentContext = await extractPdfContextFromBuffer(buffer);
            } else {
                const text = clipAttachmentText(await extractDocxTextFromBuffer(buffer));
                extractedDocumentContext = text ? `Extracted text:\n${text}` : "";
            }

            if (!extractedDocumentContext) {
                return {
                    descriptor,
                    extractedContext: "Document uploaded, but no readable text was extracted.",
                };
            }
            return {
                descriptor,
                extractedContext: extractedDocumentContext,
            };
        }
    } catch (error) {
        console.warn(`[Attachment Analysis] Failed for "${name}":`, error?.message || error);
        return {
            descriptor,
            extractedContext: "Attachment uploaded, but extraction failed.",
        };
    }

    return {
        descriptor,
        extractedContext: "Attachment uploaded. This file type is not currently extractable.",
    };
};

const buildAttachmentContextBlock = async ({ attachments = [] }) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return "";
    }

    const limitedAttachments = attachments.slice(0, MAX_ATTACHMENT_ANALYSIS_COUNT);
    const contextItems = [];
    for (let idx = 0; idx < limitedAttachments.length; idx += 1) {
        const insight = await extractAttachmentContext({
            attachment: limitedAttachments[idx],
            index: idx,
        });
        if (!insight) continue;

        contextItems.push(`${insight.descriptor}\n${insight.extractedContext}`.trim());
    }

    return clipAttachmentText(contextItems.join("\n\n"), MAX_ATTACHMENT_CONTEXT_CHARS);
};

const inferAnswerFromAttachmentContext = async ({
    currentQuestionText = "",
    userMessageText = "",
    attachmentContextText = "",
    serviceName = "",
}) => {
    if (!attachmentContextText.trim()) return "";
    if (NAME_QUESTION_REGEX.test(currentQuestionText || "") && !String(userMessageText || "").trim()) {
        return "";
    }

    const inferPrompt = `
You are extracting a direct questionnaire answer from uploaded file context.

Service: "${serviceName}"
Current question: "${currentQuestionText}"
User direct text answer: "${userMessageText}"

Extracted attachment context:
${attachmentContextText}

Task:
1) Decide if attachment context provides a direct answer to the current question.
2) If yes, provide a short final answer text.
3) If no, return empty answer.

Rules:
- For person-name questions, do not infer a personal name from a logo/image.
- For brand/company questions, you may infer a brand name when clearly visible in file content.
- Keep answer concise and specific.

Return JSON only:
{
  "hasAnswer": boolean,
  "answer": string,
  "confidence": number
}
`;

    try {
        const response = await chatWithAI(
            [{ role: "user", content: inferPrompt }],
            [{ role: "system", content: "You are a JSON-only extractor. Return valid JSON only." }],
            "system_extractor"
        );
        if (!response?.success) return "";

        const parsed = parseJsonObjectFromRaw(response.message);
        if (!parsed || parsed.hasAnswer !== true) return "";

        const answer = clipAttachmentText(parsed.answer || "", 180);
        const confidence = Number(parsed.confidence || 0);
        if (!answer) return "";
        if (Number.isFinite(confidence) && confidence < 0.58) return "";

        return answer;
    } catch {
        return "";
    }
};

const buildAttachmentInsightForUser = ({
    attachments = [],
    attachmentContextText = "",
}) => {
    if (!Array.isArray(attachments) || attachments.length === 0) return "";
    const context = clipAttachmentText(attachmentContextText, 650);
    const fileNames = attachments
        .map((file) => normalizeAttachmentDisplayText(file?.name || ""))
        .filter(Boolean)
        .slice(0, 2);
    const fileLabel = fileNames.length > 0 ? fileNames.join(", ") : "your uploaded file";
    const containsPdf = attachments.some((file) => isPdfAttachment(file));

    if (!context) {
        return `I received ${fileLabel}. I will use it if I can pull out useful details from it.`;
    }

    const lines = context
        .split("\n")
        .map((line) => normalizeAttachmentDisplayText(String(line || "").trim()))
        .filter(Boolean);

    const pickByPrefix = (prefix) =>
        lines.find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()));

    const cleanLineValue = (line = "", prefixRegex = /^/) =>
        normalizeAttachmentDisplayText(String(line || "").replace(prefixRegex, "").trim());

    const summaryLine = pickByPrefix("Summary:");
    const visibleTextLine = pickByPrefix("Visible text:");
    const possibleBrandLine = pickByPrefix("Possible brand/company name:");
    const designCuesLine = pickByPrefix("Design cues:");
    const extractedTextLine = pickByPrefix("Extracted text:");
    const titleLine = pickByPrefix("Document title:");
    const subjectLine = pickByPrefix("Document subject:");
    const keywordsLine = pickByPrefix("Document keywords:");
    const pageCountLine = pickByPrefix("Page count:");

    const hasUnreadableDocument = lines.some((line) =>
        /document uploaded, but no readable text was extracted\./i.test(line)
    );
    const hasUnreadableTextFile = lines.some((line) =>
        /text file uploaded, but no readable text was found\./i.test(line)
    );
    const hasImageExtractionFailure = lines.some((line) =>
        /image uploaded\. could not extract image details automatically\./i.test(line)
    );
    const hasExtractionFailure = lines.some((line) =>
        /attachment uploaded, but extraction failed\./i.test(line)
    );
    const hasUnsupportedType = lines.some((line) =>
        /attachment uploaded\. this file type is not currently extractable\./i.test(line)
    );

    if (hasUnreadableDocument) {
        return containsPdf
            ? `I received ${fileLabel}, but I could not reliably read text from it yet. It may be a scanned or image-based PDF. If you upload a text-based copy or clear screenshots of the key pages, I can use that more accurately.`
            : `I received ${fileLabel}, but I could not reliably read enough text from it to use it yet. If you upload a clearer copy, I can try again.`;
    }

    if (hasUnreadableTextFile) {
        return `I received ${fileLabel}, but it did not contain readable text that I could use yet.`;
    }

    if (hasImageExtractionFailure) {
        return `I received ${fileLabel}, but I could not clearly read the important details from it. If you upload a sharper image or a closer view of the key section, I can try again.`;
    }

    if (hasExtractionFailure) {
        return `I received ${fileLabel}, but something went wrong while reading it. Please try uploading it again.`;
    }

    if (hasUnsupportedType) {
        return `I received ${fileLabel}. I can work best with PDFs, DOCX files, text files, and images right now.`;
    }

    const title = cleanLineValue(titleLine, /^Document title:\s*/i);
    const subject = cleanLineValue(subjectLine, /^Document subject:\s*/i);
    const keywords = cleanLineValue(keywordsLine, /^Document keywords:\s*/i);
    const pageCount = cleanLineValue(pageCountLine, /^Page count:\s*/i);
    const possibleBrand = cleanLineValue(possibleBrandLine, /^Possible brand\/company name:\s*/i);
    const visibleText = cleanLineValue(visibleTextLine, /^Visible text:\s*/i);
    const summary = cleanLineValue(summaryLine, /^Summary:\s*/i);
    const designCues = cleanLineValue(designCuesLine, /^Design cues:\s*/i);
    const extractedText = clipAttachmentText(
        String(context.split(/Extracted text:\s*/i)[1] || "")
            .replace(/\s+/g, " ")
            .trim(),
        180
    );
    const hasExtractedBodyText = /Extracted text:\s*\S+/s.test(context);
    const hasReadableDocumentContent = Boolean(
        possibleBrand
        || visibleText
        || summary
        || designCues
        || subject
        || keywords
        || hasExtractedBodyText
    );

    if (!hasReadableDocumentContent && (title || pageCount)) {
        const basicSummary = [
            title,
            pageCount ? `${pageCount} pages` : ""
        ]
            .filter(Boolean)
            .join(" - ");
        return `File summary: ${basicSummary || "basic document details detected."}`;
    }

    let summaryText = summary
        || extractedText
        || visibleText
        || subject
        || keywords
        || designCues
        || title;

    if (possibleBrand && summaryText && !containsNormalizedText(summaryText, possibleBrand)) {
        summaryText = `${possibleBrand}. ${summaryText}`;
    }

    if (!summaryText && pageCount) {
        summaryText = `${pageCount} pages`;
    }

    if (!summaryText) {
        return `File summary: ${fileLabel}`;
    }

    return `File summary: ${clipAttachmentText(summaryText, 260)}`;
};

const isGreetingInsteadOfNameAnswer = (questionText = "", userText = "") => {
    if (!NAME_QUESTION_REGEX.test(questionText || "")) return false;
    const normalized = String(userText || "").toLowerCase().trim();
    if (!normalized) return false;
    if (!GREETING_SMALLTALK_REGEX.test(normalized)) return false;
    if (NAME_INTRO_REGEX.test(normalized)) return false;
    // Keep this fallback for short small-talk style replies.
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    return wordCount <= 8;
};

const buildServiceAwareOpeningMessage = (serviceName = "") => {
    const normalizedServiceName = String(serviceName || "").trim().toLowerCase();
    const scopeLabel = normalizedServiceName
        ? `your ${normalizedServiceName} requirement`
        : "your requirement";

    return `Hello! I'm CATA, here to help with ${scopeLabel}.\nI'd love to learn a little about you first.\nMay I know your name?`;
};

const hasCorrectionIntent = (text = "") => CORRECTION_INTENT_REGEX.test(String(text || ""));
const isContextSuggestionRequest = (text = "") => CONTEXT_SUGGESTION_REGEX.test(String(text || ""));

const getQuestionOptionLabels = (question = {}) => {
    if (!Array.isArray(question?.options)) return [];
    return question.options
        .map((option) =>
            typeof option === "string"
                ? option
                : (option?.label || option?.value || "")
        )
        .map((value) => String(value || "").trim())
        .filter(Boolean);
};

const hasDirectOptionAnswer = (message = "", question = {}) => {
    const normalizedMessage = normalizeTextToken(message);
    if (!normalizedMessage) return false;

    const optionLabels = getQuestionOptionLabels(question);
    if (optionLabels.length === 0) return false;

    return optionLabels.some((label) => {
        const normalizedLabel = normalizeTextToken(label);
        if (!normalizedLabel) return false;
        return (
            normalizedMessage.includes(normalizedLabel) ||
            normalizedLabel.includes(normalizedMessage)
        );
    });
};

const normalizeOptionComparableText = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/\*\*/g, "")
        .replace(/[`_]/g, "")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\s*-\s*/g, "-")
        .replace(/[^a-z0-9\s+-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const findExactOptionLabelMatches = (rawText = "", optionLabels = []) => {
    const normalizedInput = normalizeOptionComparableText(rawText);
    if (!normalizedInput) return [];

    return optionLabels.filter((label) => {
        const normalizedLabel = normalizeOptionComparableText(label);
        if (!normalizedLabel) return false;
        return normalizedInput === normalizedLabel;
    });
};
const extractNumericChoiceNumbers = (text = "", maxOptionCount = 0) => {
    const raw = String(text || "");
    const regex = /\d+/g;
    const numbers = [];
    let match = null;

    while ((match = regex.exec(raw)) !== null) {
        const token = match[0];
        const start = match.index;
        const end = start + token.length;

        // Ignore digits that are part of range-like text (e.g. "2-4 weeks", "1-2 months")
        const leftWindow = raw.slice(Math.max(0, start - 3), start);
        const rightWindow = raw.slice(end, end + 3);
        const isRangeFragment =
            /[\u2013\u2014-]\s*$/.test(leftWindow) ||
            /^\s*[\u2013\u2014-]/.test(rightWindow);
        if (isRangeFragment) continue;

        const value = Number.parseInt(token, 10);
        if (!Number.isFinite(value)) continue;
        if (value < 1 || value > maxOptionCount) continue;
        if (!numbers.includes(value)) numbers.push(value);
    }

    return numbers;
};

const mapNumericReplyToOptions = (question = {}, rawText = "") => {
    const optionLabels = getQuestionOptionLabels(question);
    if (optionLabels.length === 0) {
        return { matched: false, normalizedText: rawText, selectedLabels: [] };
    }

    // Prefer exact label matching first so values like "2-4 weeks" map correctly.
    const exactMatches = findExactOptionLabelMatches(rawText, optionLabels);
    if (exactMatches.length > 0) {
        return {
            matched: true,
            normalizedText: exactMatches.join(", "),
            selectedLabels: exactMatches
        };
    }

    const numbers = extractNumericChoiceNumbers(rawText, optionLabels.length);
    if (numbers.length === 0) {
        return { matched: false, normalizedText: rawText, selectedLabels: [] };
    }

    const selectedLabels = numbers
        .map((number) => optionLabels[number - 1])
        .filter(Boolean);

    if (selectedLabels.length === 0) {
        return { matched: false, normalizedText: rawText, selectedLabels: [] };
    }

    return {
        matched: true,
        normalizedText: selectedLabels.join(", "),
        selectedLabels
    };
};

const countOptionLabelsMentioned = (message = "", question = {}) => {
    const normalizedMessage = normalizeTextToken(message);
    if (!normalizedMessage) return 0;

    return getQuestionOptionLabels(question).reduce((count, label) => {
        const normalizedLabel = normalizeTextToken(label);
        if (!normalizedLabel) return count;
        return normalizedMessage.includes(normalizedLabel) ? count + 1 : count;
    }, 0);
};

const stripExistingOptionLines = (message = "", optionLabels = []) => {
    const normalizedOptionLabels = optionLabels
        .map((label) => normalizeTextToken(label))
        .filter(Boolean);

    if (normalizedOptionLabels.length === 0) {
        return String(message || "").trim();
    }

    const lines = String(message || "").split("\n");
    const keptLines = lines.filter((line) => {
        const trimmed = String(line || "").trim();
        if (!trimmed) return true;
        const withoutPrefix = trimmed.replace(/^(\d+\.\s*|[-*]\s*)/, "");
        const normalizedLine = normalizeTextToken(withoutPrefix);
        if (!normalizedLine) return true;
        return !normalizedOptionLabels.includes(normalizedLine);
    });

    return keptLines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const buildFriendlyMessage = (mainText = "", bridgeText = "") => {
    const cleanMainText = String(mainText || "").trim();
    const cleanBridgeText = String(bridgeText || "").trim();
    if (!cleanMainText) return cleanBridgeText;
    if (!cleanBridgeText) return cleanMainText;
    return `${cleanBridgeText}\n\n${cleanMainText}`;
};

const combineInlineMessages = (...parts) =>
    parts
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(" ");

const stripNameNotedRecap = (message = "") => {
    let cleaned = String(message || "");
    if (!cleaned.trim()) return "";

    const recapPatterns = [
        /\bi(?:'|\u2019)?ve\s+(?:got|noted)\s+your\s+name\b[^.?!\n]*[.?!]?/gi,
        /\bgot\s+your\s+name\s+noted\b[^.?!\n]*[.?!]?/gi,
        /\b(?:so\s+far,\s*)?i\s+know\s+your\s+name\s+is\b[^.?!\n]*\b(?:and|&)\s+your\s+(?:brand|company)\s+is\b[^.?!\n]*[.?!]?/gi,
        /\b(?:so\s+far,\s*)?(?:i|we)\s+(?:have|got|noted|captured|recorded|saved|collected)\s+your\s+name\b[^.?!\n]*\b(?:and|&)\s+your\s+(?:brand|company)\b[^.?!\n]*[.?!]?/gi
    ];

    for (const pattern of recapPatterns) {
        cleaned = cleaned.replace(pattern, " ");
    }

    const isNameBrandRecapSentence = (sentence = "") => {
        const text = String(sentence || "").toLowerCase();
        const hasName = /\byour\s+name\b/.test(text);
        const hasBrand =
            /\byour\s+(?:brand|company)\b/.test(text) ||
            /\byour\s+(?:brand|company)\s+name\b/.test(text) ||
            /\byour\s+company\s+or\s+brand\b/.test(text);
        if (!hasName || !hasBrand) return false;

        const firstPersonRecap =
            /\b(i|we)\b/.test(text) &&
            /\b(have|got|know|noted|captured|recorded|saved|collected)\b/.test(text);
        const sharedRecap = /\byou\S*\s+shared\b/.test(text);
        const soFarRecap = /\bso\s+far\b/.test(text);

        return firstPersonRecap || sharedRecap || soFarRecap;
    };

    cleaned = cleaned
        .split(/(?<=[.?!])\s+/)
        .filter((sentence) => !isNameBrandRecapSentence(sentence))
        .join(" ");

    return cleaned
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^[ \t]+/gm, "")
        .trim();
};

const containsNormalizedText = (source = "", snippet = "") => {
    const normalizedSource = normalizeTextToken(source);
    const normalizedSnippet = normalizeTextToken(snippet);
    if (!normalizedSource || !normalizedSnippet) return false;
    return normalizedSource.includes(normalizedSnippet);
};

const pickFriendlyBridge = (seedText = "") => {
    const normalized = String(seedText || "");
    if (!normalized) return FRIENDLY_BRIDGES[0];
    const score = normalized
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return FRIENDLY_BRIDGES[Math.abs(score) % FRIENDLY_BRIDGES.length];
};

const buildPersonalizedQuestionBridge = ({
    nextQuestionText = "",
    answersByQuestionText = {},
    serviceName = ""
}) => {
    const normalizedQuestion = normalizeTextToken(nextQuestionText);
    const defaultBridge = pickFriendlyBridge(nextQuestionText);

    const clientName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(name)\b/i
    );
    const businessName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(business|company)\b.*\bname\b/i
    );
    const projectIdea = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(describe|requirements|idea|overview|briefly)\b/i
    );
    const appType = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(type of mobile app|app type|what type)\b/i
    );
    const platform = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(platform|android|ios)\b/i
    );
    const features = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(features)\b/i
    );
    const roles = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(who will use|user roles|users)\b/i
    );
    const design = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(design style)\b/i
    );
    const branding = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(branding assets|logo|brand colors)\b/i
    );
    const framework = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(preferred mobile app development approach|development approach|framework|flutter|react native|native)\b/i
    );
    const backend = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(backend technology|backend stack|backend)\b/i
    );
    const timeline = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(timeline|completed|delivery)\b/i
    );

    const firstName = clientName ? String(clientName).trim().split(/\s+/)[0] : "";
    const userPrefix = firstName ? `${firstName}, ` : "";
    const projectLabel =
        businessName || appType || serviceName || "your project";

    if (/which platform|android|ios/.test(normalizedQuestion)) {
        if (framework) return `${userPrefix}since you prefer ${framework}, let's lock the platform that fits best.`;
        return `${userPrefix}for ${projectLabel}, let's finalize the target platform next.`;
    }

    if (/which features|features should|deliverables included/.test(normalizedQuestion)) {
        if (projectIdea) return `${userPrefix}great direction so far - now let's shortlist the core MVP features.`;
        return `${userPrefix}let's map the key features that make ${projectLabel} useful from day one.`;
    }

    if (/who will use|user roles|users/.test(normalizedQuestion)) {
        if (features) return `${userPrefix}to shape the right flows, let's confirm exactly who will use the app.`;
        return `${userPrefix}this will help us keep scope clean for ${projectLabel}.`;
    }

    if (/design style/.test(normalizedQuestion)) {
        if (roles) return `${userPrefix}nice - with ${roles} in mind, let's set the design direction.`;
        return `${userPrefix}let's give ${projectLabel} the right visual feel.`;
    }

    if (/branding assets|logo|brand colors/.test(normalizedQuestion)) {
        if (design) return `${userPrefix}great choice on design style - this helps us align branding quickly.`;
        return `${userPrefix}this helps us keep the UI consistent from the start.`;
    }

    if (/familiar with mobile app technologies/.test(normalizedQuestion)) {
        if (framework || backend) return `${userPrefix}great progress - I already noted parts of your stack.`;
        return `${userPrefix}this helps us pick the most practical build path.`;
    }

    if (/preferred mobile app development approach|development approach/.test(normalizedQuestion)) {
        if (platform) return `${userPrefix}since you're targeting ${platform}, let's confirm the development approach.`;
        return `${userPrefix}this will define speed, maintainability, and budget fit.`;
    }

    if (/backend technology|backend stack/.test(normalizedQuestion)) {
        if (framework) return `${userPrefix}perfect - now let's pair the backend with ${framework}.`;
        return `${userPrefix}this helps us plan scalability and integrations properly.`;
    }

    if (/expected number of users|after launch/.test(normalizedQuestion)) {
        if (backend) return `${userPrefix}awesome - with ${backend} in mind, let's estimate scale targets.`;
        return `${userPrefix}this helps us design architecture that won't break as you grow.`;
    }

    if (/when do you want|timeline|completed/.test(normalizedQuestion)) {
        if (features) return `${userPrefix}great feature set - now let's align a realistic timeline.`;
        return `${userPrefix}this helps us plan phases and milestones clearly.`;
    }

    if (/estimated budget|budget/.test(normalizedQuestion)) {
        if (timeline) return `${userPrefix}nice - with ${timeline} timeline, let's lock a workable budget range.`;
        return `${userPrefix}this helps us keep scope and delivery realistic.`;
    }

    if (/additional requirements|notes/.test(normalizedQuestion)) {
        if (businessName) return `${userPrefix}we're almost done for ${businessName} - anything else you want to add?`;
        return `${userPrefix}last step - share any extra requirements if needed.`;
    }

    if (branding) {
        return `${userPrefix}${defaultBridge} I have noted your branding details too.`;
    }

    return defaultBridge;
};

const buildProgressBridge = ({ nextStep = 0, totalQuestions = 0 }) => {
    if (!totalQuestions || totalQuestions < 5) return "";
    const answeredCount = Math.max(0, Math.min(nextStep, totalQuestions));
    const ratio = answeredCount / totalQuestions;
    if (ratio >= 0.85) return "We are almost done.";
    if (ratio >= 0.55) return "Great pace - we are past the halfway point.";
    if (ratio >= 0.3) return "Nice progress - your scope is getting clear.";
    return "";
};

const buildAgentSideReply = ({ userMessage = "", answersByQuestionText = {} }) => {
    const normalizedUserMessage = normalizeTextToken(userMessage);
    if (!normalizedUserMessage) return "";

    const clientName = findAnswerByQuestionPattern(
        answersByQuestionText,
        /\b(name)\b/i
    );
    const firstName = clientName ? String(clientName).trim().split(/\s+/)[0] : "";
    const userPrefix = firstName ? `${firstName}, ` : "";

    if (AGENT_IDENTITY_REGEX.test(normalizedUserMessage)) {
        return `${userPrefix}I am your Catalance AI planning partner, and I will guide you until the proposal is ready.`;
    }

    if (GRATITUDE_REGEX.test(normalizedUserMessage)) {
        return `${userPrefix}glad to help.`;
    }

    return "";
};

const buildQuickReplyHint = (question = {}) => {
    const optionLabels = getQuestionOptionLabels(question);
    if (optionLabels.length === 0 || optionLabels.length > 6) return "";
    return `Quick reply options: ${optionLabels.join(" | ")}`;
};

const extractFriendlyBridgeFromValidationMessage = (validationMessage = "", nextQuestionText = "") => {
    const cleanMessage = String(validationMessage || "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleanMessage) return "";

    const normalizedNextQuestion = normalizeTextToken(nextQuestionText);
    const firstSentence = cleanMessage
        .split(/(?<=[.!])\s+/)
        .map((part) => part.trim())
        .find(Boolean);

    if (!firstSentence) return "";

    const normalizedFirstSentence = normalizeTextToken(firstSentence);
    if (
        !normalizedFirstSentence ||
        normalizedFirstSentence.includes(normalizedNextQuestion) ||
        firstSentence.includes("?")
    ) {
        return "";
    }

    return firstSentence;
};

const findAnswerByQuestionPattern = (answersByQuestionText = {}, pattern) => {
    if (!answersByQuestionText || typeof answersByQuestionText !== "object") return null;
    for (const [questionText, answer] of Object.entries(answersByQuestionText)) {
        if (!pattern.test(String(questionText || ""))) continue;
        if (!hasAnswerValue(answer)) continue;
        return String(answer).trim();
    }
    return null;
};

const detectTechMentions = (text = "", detectors = []) =>
    detectors
        .filter(({ regex }) => regex.test(text))
        .map(({ label }) => label);

const uniqueList = (items = []) =>
    Array.from(new Set(items.filter(Boolean)));

const buildAppProposalHints = ({ history = [], answersByQuestionText = {} }) => {
    const userCorpus = (history || [])
        .filter((msg) => msg?.role === "user")
        .map((msg) => String(msg.content || ""))
        .join(" \n ");

    const mobileFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /preferred mobile app development approach|development approach|go with|flutter|react native|native android|native ios/i) ||
        findAnswerByQuestionPattern(answersByQuestionText, /tech stack|technologies/i);
    const backendFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /backend technology|backend stack|backend/i);
    const dashboardFromQuestion =
        findAnswerByQuestionPattern(answersByQuestionText, /admin dashboard|dashboard technology|dashboard/i);

    const mobileDetected = detectTechMentions(userCorpus, [
        { regex: /\bflutter\b/i, label: "Flutter" },
        { regex: /react\s*native/i, label: "React Native" },
        { regex: /\bnative\s*android\b|\bkotlin\b|\bjava\b/i, label: "Native Android (Kotlin/Java)" },
        { regex: /\bnative\s*ios\b|\bswift\b/i, label: "Native iOS (Swift)" }
    ]);

    const backendDetected = detectTechMentions(userCorpus, [
        { regex: /\bnode(?:\.?js)?\b/i, label: "Node.js" },
        { regex: /\bpython\b|\bdjango\b|\bflask\b|\bfastapi\b/i, label: "Python" },
        { regex: /\bphp\b|\blaravel\b/i, label: "PHP/Laravel" },
        { regex: /\bjava\b|\bspring\b/i, label: "Java/Spring" },
        { regex: /\bdotnet\b|\.net|c#/i, label: ".NET" }
    ]);

    const dashboardDetected = detectTechMentions(userCorpus, [
        { regex: /\breact(?:\.?js)?\b/i, label: "React.js" },
        { regex: /\bnext(?:\.?js)?\b/i, label: "Next.js" },
        { regex: /\bangular\b/i, label: "Angular" },
        { regex: /\bvue(?:\.?js)?\b/i, label: "Vue.js" }
    ]);

    const appType = findAnswerByQuestionPattern(
        answersByQuestionText,
        /which platform|android|ios|app available on|cross-?platform/i
    );
    const appFeatures = findAnswerByQuestionPattern(
        answersByQuestionText,
        /which features|features should your app include|deliverables/i
    );

    const platformRequirements = [];
    if (mobileFromQuestion || mobileDetected.length) {
        platformRequirements.push(
            `Mobile app: ${mobileFromQuestion || uniqueList(mobileDetected).join(", ")}`
        );
    }
    if (backendFromQuestion || backendDetected.length) {
        platformRequirements.push(
            `Backend: ${backendFromQuestion || uniqueList(backendDetected).join(", ")}`
        );
    }
    if (dashboardFromQuestion || dashboardDetected.length) {
        platformRequirements.push(
            `Dashboard/Admin panel: ${dashboardFromQuestion || uniqueList(dashboardDetected).join(", ")}`
        );
    }

    const hints = {
        appType: appType || null,
        appFeatures: appFeatures || null,
        mobileTechnology: mobileFromQuestion || uniqueList(mobileDetected).join(", ") || null,
        backendTechnology: backendFromQuestion || uniqueList(backendDetected).join(", ") || null,
        dashboardTechnology: dashboardFromQuestion || uniqueList(dashboardDetected).join(", ") || null,
        platformRequirements: platformRequirements.join(" | ") || null
    };

    return Object.values(hints).some(Boolean) ? hints : null;
};

const parseValidationResponse = (rawMessage) => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return null;
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, ""),
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            if (typeof parsed?.isValid === "boolean" && typeof parsed?.message === "string") {
                return parsed;
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    const fallback = raw.replace(/\*\*/g, "");
    const isValidMatch = fallback.match(/"isValid"\s*:\s*(true|false)/i);
    const messageMatch = fallback.match(/"message"\s*:\s*"([\s\S]*?)"/i);
    if (!isValidMatch || !messageMatch) {
        return null;
    }

    return {
        isValid: isValidMatch[1].toLowerCase() === "true",
        message: messageMatch[1].replace(/\\"/g, "\""),
    };
};

const normalizeTextToken = (value = "") =>
    String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

const hasAnswerValue = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some((item) => normalizeTextToken(item));
    return normalizeTextToken(value).length > 0;
};

const toComparableAnswer = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeTextToken(item)).filter(Boolean).sort().join(" | ");
    }

    const normalized = normalizeTextToken(value);
    if (!normalized) return "";

    return normalized
        .split(/,|\/|\band\b/gi)
        .map((part) => normalizeTextToken(part))
        .filter(Boolean)
        .sort()
        .join(" | ");
};

const findQuestionIndex = (questions = [], slugOrId = "") =>
    questions.findIndex(
        (q) => q?.slug === slugOrId || q?.id === slugOrId
    );

const extractAnswerTokens = (answerValue) => {
    if (Array.isArray(answerValue)) {
        return Array.from(
            new Set(
                answerValue
                    .map((item) => normalizeTextToken(item))
                    .filter(Boolean)
            )
        );
    }

    const normalized = normalizeTextToken(answerValue);
    if (!normalized) return [];

    const splitParts = normalized
        .split(/,|\/|\band\b/gi)
        .map((part) => normalizeTextToken(part))
        .filter(Boolean);

    if (!splitParts.includes(normalized)) {
        splitParts.push(normalized);
    }

    return Array.from(new Set(splitParts));
};

const doesExtractedAnswerFitQuestion = (question = {}, answerValue = "") => {
    if (!question || !hasAnswerValue(answerValue)) return false;

    const questionType = normalizeTextToken(question?.type || "input");
    const optionTypes = new Set([
        "single_option",
        "multi_option",
        "multi_select",
        "grouped_multi_select",
        "single_select"
    ]);
    const optionLabels = getQuestionOptionLabels(question);

    if (!optionTypes.has(questionType) || optionLabels.length === 0) {
        return true;
    }

    const normalizedOptionLabels = optionLabels
        .map((label) => normalizeTextToken(label))
        .filter(Boolean);
    const answerTokens = extractAnswerTokens(answerValue);
    if (answerTokens.length === 0) return false;

    return answerTokens.some((token) =>
        normalizedOptionLabels.some((optionLabel) =>
            token === optionLabel
            || token.includes(optionLabel)
            || optionLabel.includes(token)
        )
    );
};

const matchesLogicRule = (answerValue, rule = {}) => {
    const condition = normalizeTextToken(rule.condition || "equals");
    const ruleValue = normalizeTextToken(rule.value || "");
    if (!ruleValue) return false;

    const tokens = extractAnswerTokens(answerValue);
    const joined = tokens.join(" ");

    if (condition === "equals") {
        return tokens.includes(ruleValue);
    }

    if (condition === "not_equals") {
        return !tokens.includes(ruleValue);
    }

    if (condition === "contains") {
        return tokens.some((token) => token.includes(ruleValue)) || joined.includes(ruleValue);
    }

    return false;
};

const resolveNextQuestionIndex = (questions = [], currentIndex = 0, answerValue = "") => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return currentIndex + 1;

    if (Array.isArray(currentQuestion.logic)) {
        for (const rule of currentQuestion.logic) {
            if (!matchesLogicRule(answerValue, rule)) continue;
            if (!rule?.nextQuestionSlug) continue;
            const targetIndex = findQuestionIndex(questions, rule.nextQuestionSlug);
            if (targetIndex !== -1) return targetIndex;
        }
    }

    if (currentQuestion.nextQuestionSlug) {
        const defaultTarget = findQuestionIndex(questions, currentQuestion.nextQuestionSlug);
        if (defaultTarget !== -1) return defaultTarget;
    }

    return currentIndex + 1;
};

const getAnswersBySlug = (sessionAnswers = {}, questions = []) => {
    const result = {};
    if (!sessionAnswers || typeof sessionAnswers !== "object") return result;

    if (sessionAnswers.bySlug && typeof sessionAnswers.bySlug === "object") {
        Object.assign(result, sessionAnswers.bySlug);
    }

    for (const question of questions) {
        if (!question?.slug) continue;
        if (hasAnswerValue(result[question.slug])) continue;

        if (hasAnswerValue(sessionAnswers[question.slug])) {
            result[question.slug] = sessionAnswers[question.slug];
            continue;
        }

        if (hasAnswerValue(sessionAnswers[question.text])) {
            result[question.slug] = sessionAnswers[question.text];
            continue;
        }

        if (
            sessionAnswers.byQuestionText &&
            typeof sessionAnswers.byQuestionText === "object" &&
            hasAnswerValue(sessionAnswers.byQuestionText[question.text])
        ) {
            result[question.slug] = sessionAnswers.byQuestionText[question.text];
        }
    }

    return result;
};

const buildPersistedAnswersPayload = (answersBySlug = {}, questions = []) => {
    const bySlug = {};
    const byQuestionText = {};

    for (const question of questions) {
        if (!question?.slug) continue;
        const value = answersBySlug[question.slug];
        if (!hasAnswerValue(value)) continue;
        bySlug[question.slug] = value;
        byQuestionText[question.text] = value;
    }

    return { bySlug, byQuestionText };
};

const getAnswerBySlugPattern = (answersBySlug = {}, pattern) => {
    if (!answersBySlug || typeof answersBySlug !== "object") return "";
    for (const [slug, value] of Object.entries(answersBySlug)) {
        if (!pattern.test(slug)) continue;
        if (!hasAnswerValue(value)) continue;
        return String(value || "");
    }
    return "";
};

const pickOptionLabelByPatterns = (optionLabels = [], patterns = []) => {
    if (!Array.isArray(optionLabels) || optionLabels.length === 0) return "";
    for (const pattern of patterns) {
        const found = optionLabels.find((label) => pattern.test(normalizeTextToken(label)));
        if (found) return found;
    }
    return "";
};

const buildContextualSuggestionMessage = ({
    question = {},
    answersBySlug = {},
    serviceName = ""
}) => {
    const questionText = String(question?.text || "Could you please confirm this?");
    const optionLabels = getQuestionOptionLabels(question);
    const normalizedQuestion = normalizeTextToken(questionText);
    const combinedContext = Object.values(answersBySlug || {})
        .map((value) => String(value || ""))
        .join(" ");
    const normalizedContext = normalizeTextToken(combinedContext);
    const questionWithOptions = formatQuestionWithOptions(question);

    if (optionLabels.length === 0) {
        return [
            `Good question. This helps me plan your ${serviceName || "project"} better.`,
            "Once you share this, I can guide you more clearly.",
            `Please share this so we can continue:\n${questionText}`
        ].join("\n\n");
    }

    let recommendation = "";
    let reason = "";

    if (/platform|android|ios/.test(normalizedQuestion)) {
        const frameworkAnswer = normalizeTextToken(
            getAnswerBySlugPattern(
                answersBySlug,
                /(dev_framework|mobile|frontend|tech_stack|approach)/i
            )
        );

        if (/flutter|react native|cross/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/both|cross|android.*ios|ios.*android/]);
            reason = "because cross-platform development aligns well with your selected stack.";
        } else if (/kotlin|java|android/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/android/]);
            reason = "because your stack points toward Android-focused development.";
        } else if (/swift|ios/.test(frameworkAnswer)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/ios/]);
            reason = "because your stack points toward iOS-focused development.";
        } else {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/both|cross|android.*ios|ios.*android/]) || optionLabels[0];
            reason = "to maximize reach during early growth.";
        }
    } else if (/who will use|user role|users/.test(normalizedQuestion)) {
        if (/vendor|seller|marketplace|multi/.test(normalizedContext)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/vendor|seller|marketplace/]);
            reason = "because your app flow includes listing and transactions between users.";
        } else if (/admin|dashboard|panel|manage/.test(normalizedContext)) {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/admin|manager/]);
            reason = "because you mentioned admin-side operations earlier.";
        } else {
            recommendation = pickOptionLabelByPatterns(optionLabels, [/customer/]) || optionLabels[0];
            reason = "to keep MVP scope focused and faster to launch.";
        }
    } else if (/design style|branding|look/.test(normalizedQuestion)) {
        recommendation = optionLabels[0];
        reason = "as a safe starting point based on typical startup MVP launches.";
    } else if (/budget/.test(normalizedQuestion)) {
        return `I can suggest a realistic range, but I still need your final budget to continue.\n\n${questionText}`;
    } else {
        recommendation = optionLabels[0];
        reason = "based on the details you've already shared.";
    }

    if (!recommendation) {
        recommendation = optionLabels[0];
    }

    const alternatives = optionLabels
        .filter((label) => normalizeTextToken(label) !== normalizeTextToken(recommendation))
        .slice(0, 2);
    const alternativesLine = alternatives.length > 0
        ? `If that does not fit, you can choose ${alternatives.join(" or ")}.`
        : "";

    return [
        "Good question.",
        `I recommend **${recommendation}** ${reason}`,
        alternativesLine,
        "Quick tip:",
        "- Pick the option that best matches your first launch goal.",
        "- If you are not sure, choose the closest one and we can adjust next.",
        "Please choose one option so we can continue:",
        questionWithOptions
    ]
        .filter(Boolean)
        .join("\n\n")
        .trim();
};

const parseMessageFieldFromJson = (rawMessage = "") => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return "";
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, "")
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            if (typeof parsed?.message === "string" && parsed.message.trim()) {
                return parsed.message.trim();
            }
        } catch {
            // Try next normalization candidate.
        }
    }

    const fallbackMatch = raw.match(/"message"\s*:\s*"([\s\S]*?)"/i);
    if (!fallbackMatch) return "";
    return fallbackMatch[1].replace(/\\"/g, "\"").trim();
};

const buildAnswersContextLines = (answersByQuestionText = {}) =>
    Object.entries(answersByQuestionText || {})
        .filter(([, value]) => hasAnswerValue(value))
        .map(([question, answer]) => `- ${question}: ${String(answer).trim()}`)
        .slice(0, 12)
        .join("\n");

const stringifyAnswerForContext = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .join(", ");
    }
    return String(value || "").trim();
};

const buildSavedResponseContextLines = (answersBySlug = {}, questions = []) =>
    (Array.isArray(questions) ? questions : [])
        .filter((question) => question?.saveResponse && question?.slug)
        .map((question) => {
            const answerValue = answersBySlug?.[question.slug];
            if (!hasAnswerValue(answerValue)) return null;
            const answerText = stringifyAnswerForContext(answerValue);
            if (!answerText) return null;
            const subtitle = String(question?.subtitle || "").trim();
            return subtitle
                ? `- ${question.text}: ${answerText} (intent: ${subtitle})`
                : `- ${question.text}: ${answerText}`;
        })
        .filter(Boolean)
        .slice(0, 12)
        .join("\n");

const buildQuestionSubtitleMapLines = (questions = []) =>
    (Array.isArray(questions) ? questions : [])
        .map((question) => {
            const slug = String(question?.slug || "").trim();
            const subtitle = String(question?.subtitle || "").trim();
            if (!slug || !subtitle) return null;
            return `- ${slug}: ${subtitle}`;
        })
        .filter(Boolean)
        .slice(0, 30)
        .join("\n");

const extractFirstSentence = (value = "") => {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    if (!source) return "";
    const chunks = source.split(/(?<=[.!?])\s+/).map((chunk) => chunk.trim()).filter(Boolean);
    return chunks[0] || source;
};

const clipSentence = (value = "", limit = 180) => {
    const source = String(value || "").replace(/\s+/g, " ").trim();
    if (!source) return "";
    if (source.length <= limit) return source;
    return `${source.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
};

const normalizeGuidanceSentence = (value = "") => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return "";
    const withoutMarkdown = cleaned.replace(/\*\*/g, "");
    const normalizedLead = withoutMarkdown
        .replace(/^based on what you shared,\s*/i, "")
        .replace(/^from your earlier inputs,\s*/i, "")
        .replace(/^for this question,\s*/i, "")
        .replace(/^(i suggest|suggest)\s+/i, "I recommend ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    if (!normalizedLead) return "";
    if (!/^[a-z]/.test(normalizedLead)) return normalizedLead;
    return `${normalizedLead.charAt(0).toUpperCase()}${normalizedLead.slice(1)}`;
};

const stripInlineOptionListTail = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return "";

    const firstOptionIndex = source.search(/\b1\.\s+\S/);
    if (firstOptionIndex === -1) return source;

    const optionTail = source.slice(firstOptionIndex);
    const optionTokenCount = (optionTail.match(/\b\d+\.\s+\S/g) || []).length;
    if (optionTokenCount < 2) return source;

    return source
        .slice(0, firstOptionIndex)
        .replace(/[,:;\-]\s*$/, "")
        .trim();
};

const buildRecentAnswerContextSnippet = ({
    answersBySlug = {},
    questions = [],
    excludeSlug = ""
}) => {
    const answeredRows = (Array.isArray(questions) ? questions : [])
        .filter((question) => question?.slug && question.slug !== excludeSlug)
        .map((question) => {
            const value = answersBySlug?.[question.slug];
            if (!hasAnswerValue(value)) return null;
            return {
                question: String(question.text || "").trim(),
                answer: stringifyAnswerForContext(value)
            };
        })
        .filter(Boolean)
        .slice(-2);

    if (answeredRows.length === 0) return "";
    return answeredRows
        .map((row) => `${row.question}: ${row.answer}`)
        .join(" | ");
};

const extractCurrentRecommendationLine = (text = "") => {
    const lines = String(text || "")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => String(line || "").replace(/\*\*/g, "").trim())
        .filter(Boolean);

    const preferred = lines.find((line) => /\bi suggest\b|\brecommend\b/i.test(line));
    return preferred || "";
};

const parsePostFifthMessageFields = (rawMessage = "") => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) return null;

    const parsed = parseJsonObjectFromRaw(rawMessage);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
    }

    const pickText = (...keys) => {
        for (const key of keys) {
            const value = parsed?.[key];
            if (typeof value !== "string") continue;
            const cleaned = value.trim();
            if (cleaned) return cleaned;
        }
        return "";
    };

    return {
        ack: pickText("ack", "acknowledgement"),
        previousSuggestion: pickText("previousSuggestion", "previous_context_suggestion", "previous"),
        currentRecommendation: pickText("currentRecommendation", "current_question_recommendation", "recommendation"),
        questionLead: pickText("questionLead", "question", "nextQuestionPrompt")
    };
};

const buildOptionLabelsText = (question = {}) => {
    const labels = getQuestionOptionLabels(question);
    if (labels.length === 0) return "No predefined options.";
    return labels.map((label, index) => `${index + 1}. ${label}`).join("\n");
};

const formatQuestionWithOptions = (question = {}) => {
    const questionText = String(question?.text || "").trim();
    const optionsText = buildOptionLabelsText(question);
    const hasOptions = getQuestionOptionLabels(question).length > 0;
    if (!questionText) return "";
    if (!hasOptions) return questionText;
    return `${questionText}\n${optionsText}`;
};

const hasNumberedOptionsInMessage = (value = "") =>
    /\n\s*1\.\s+\S+/.test(String(value || ""));

const shouldAppendQuestionBlockForInfoRequest = ({
    assistantMessage = "",
    question = {}
}) => {
    const message = String(assistantMessage || "").trim();
    if (!message) return true;

    const hasOptions = getQuestionOptionLabels(question).length > 0;
    if (hasOptions) {
        if (hasNumberedOptionsInMessage(message)) return false;
        if (countOptionLabelsMentioned(message, question) >= 2) return false;
        return true;
    }

    return !/[?؟]/.test(message);
};

const buildAiGuidedQuestionMessage = async ({
    serviceName = "",
    userLastMessage = "",
    currentQuestion = {},
    nextQuestion = {},
    answersByQuestionText = {},
    answersBySlug = {},
    allQuestions = [],
    sideReply = "",
    bridgeSegments = [],
    isInitial = false
}) => {
    const nextQuestionText = String(nextQuestion?.text || "").trim();
    if (!nextQuestionText) return "";

    const optionLabelsText = buildOptionLabelsText(nextQuestion);
    const hasOptions = getQuestionOptionLabels(nextQuestion).length > 0;
    const answeredCount = Object.values(answersBySlug || {}).filter((value) => hasAnswerValue(value)).length;
    const isPostFifthAckSuggestionMode = !isInitial && answeredCount >= 5;
    const nextQuestionIndex = nextQuestion?.slug
        ? findQuestionIndex(allQuestions, nextQuestion.slug)
        : -1;
    const isOpeningIntakeQuestion =
        Number.isInteger(nextQuestionIndex) && nextQuestionIndex >= 0 && nextQuestionIndex < 3;
    const answersContext = buildAnswersContextLines(answersByQuestionText);
    const savedResponseContext = buildSavedResponseContextLines(answersBySlug, allQuestions);
    const subtitleMapContext = buildQuestionSubtitleMapLines(allQuestions);
    const currentQuestionSubtitle = String(currentQuestion?.subtitle || "").trim();
    const nextQuestionSubtitle = String(nextQuestion?.subtitle || "").trim();
    const guidanceHints = bridgeSegments
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .reduce((acc, segment) => {
            const normalized = segment.toLowerCase().replace(/\s+/g, " ").trim();
            if (!normalized || acc.seen.has(normalized)) return acc;
            acc.seen.add(normalized);
            acc.rows.push(segment);
            return acc;
        }, { seen: new Set(), rows: [] }).rows
        .slice(0, isPostFifthAckSuggestionMode ? 2 : 4)
        .join(" | ");

    const startTaskBlock = `
Task:
1) Start with one short warm welcome sentence.
2) Add one short friendly bridge sentence that feels human and personal.
3) Ask the required first question naturally (rephrase it; do not copy it verbatim).
4) Do NOT give suggestions, recommendations, best practices, feature ideas, or strategic advice.
5) If options exist, show them as numbered list using exact labels.
`;

    const openingIntakeTaskBlock = `
Task:
1) Briefly acknowledge the user's last answer in one natural sentence.
2) Add one short warm bridge sentence that feels friendly and personalized.
3) Ask the required next question naturally.
4) Do NOT give suggestions, recommendations, best practices, feature ideas, or strategic advice.
5) If options exist, show them as numbered list using the exact labels provided.
`;

    const followupTaskBlock = isOpeningIntakeQuestion
        ? openingIntakeTaskBlock
        : isPostFifthAckSuggestionMode
        ? `
Task:
1) Act like a human expert casually chatting with a client.
2) Acknowledge the user's last answer in 1-2 natural sentences.
3) Give one informative previous-context suggestion that feels personal by referencing one or two earlier confirmed answers or goals.
4) Give one informative, neutral guidance line for the required next question based on its context.
5) If options exist, explain what kind of choice matters here, but do NOT present any option as the best or recommended one unless the user explicitly asks for a recommendation.
6) Ask the required next question naturally (rephrase it; do not copy it verbatim).
7) If options exist, show them as numbered list using the exact labels provided.
`
        : `
Task:
1) Act like a human expert casually chatting with a client.
2) Enthusiastically acknowledge their last answer in 2-3 sentences.
3) Explain with 1-2 concrete reasons why their choice is a strong fit for their project.
4) If options exist, give thoughtful but neutral guidance for this next question and explain it with a practical reason, benefit, or tradeoff.
5) Do NOT tell the user which option is best, which one people should lean toward, or which option you recommend unless the user explicitly asks for a recommendation.
6) If user seems unsure/confused, add helpful guidance before asking.
7) Ask the required next question naturally (rephrase it; do not copy it verbatim).
8) If options exist, show them as numbered list using the exact labels provided.
`;

    const responseLengthRule = isOpeningIntakeQuestion
        ? "- Keep the full response under 50 words. Use up to two short lead-in sentences before the question: one acknowledgement or warm opener, plus one short bridge sentence."
        : isPostFifthAckSuggestionMode
        ? "- Keep it concise in post-question-5 mode and under 150 words total."
        : "- Keep the full response under 150 words total while staying natural and conversational.";

    const postFifthRuleBlock = isPostFifthAckSuggestionMode
        ? `
- This is post-question-5 mode: avoid duplicate acknowledgements/suggestions.
- Keep exactly one acknowledgement + one previous-context suggestion + one current-question recommendation before asking the question.
- Use current_question_context and next_question_context to shape these two suggestion lines.
- Make the previous-context line feel personal: reference one or two earlier confirmed answers, goals, constraints, or preferences in natural language.
- Keep the previous-context line generic across all services. Do NOT assume this is web development unless the user's earlier answers explicitly say so.
- If the latest answer seems inconsistent with earlier answers, handle it softly with phrases like "if that direction is still right" or "based on what you shared earlier" instead of saying the user is wrong.
- Make both suggestion lines informative: each should include one concrete reason, likely benefit, or practical tradeoff tied to the user's context.
- Keep the current-question line neutral by default. Do NOT label one option as "best" or "recommended" unless the user explicitly asks for that help.
- Do not repeat the same reason in both suggestion lines.
`
        : "";

    const outputFormatBlock = isPostFifthAckSuggestionMode
        ? `
Return strict JSON only:
{
  "ack": "one short sentence",
  "previousSuggestion": "one personalized sentence tied to one or two previous confirmed answers; use soft correction if needed",
  "currentRecommendation": "one short sentence tied to the current question/options",
  "questionLead": "one short sentence that asks the next question"
}
`
        : `
Return strict JSON only:
{
    "message": "final assistant message"
}
`;

    const prompt = `
You are writing one assistant message in a guided questionnaire.

Service: "${serviceName}"
User last message: ${JSON.stringify(userLastMessage)}
Question just answered: ${JSON.stringify(String(currentQuestion?.text || ""))}
Required next question (must ask now): ${JSON.stringify(nextQuestionText)}
Required options (if any):
${optionLabelsText}

Context from earlier answers:
${answersContext || "- none yet"}

Saved AI memory (only fields marked "Save Response for AI Context"):
${savedResponseContext || "- none yet"}

Internal question intent (hidden, do not reveal directly to user):
- current_question_context: ${JSON.stringify(currentQuestionSubtitle || "none")}
- next_question_context: ${JSON.stringify(nextQuestionSubtitle || "none")}

Question subtitle map (hidden guidance for flow continuity):
${subtitleMapContext || "- none"}

Helper phrases you may reuse naturally:
    - side_reply: ${JSON.stringify(sideReply)}
    - hints: ${JSON.stringify(guidanceHints)}

${isInitial ? startTaskBlock : followupTaskBlock}

    Rules:
    - Keep it highly human, conversational, and engaging. Avoid being overly brief.
${responseLengthRule}
- NEVER sound like a robot or a questionnaire form. Do NOT use phrases like "I noted that", "It's helpful to know", "This helps me guide you", "So far you have shared", or "Before we continue".
- Act like you are having a normal conversation with a friend about their project.
- Use the same language style as the user last message.
- Use simple English with clear sentences.
- Keep the tone polite, friendly, and enthusiastic in every response.
- Avoid repeating the same idea in multiple lines.
- In normal guided flow, avoid phrases like "I recommend", "best option", "people usually choose", or "people often lean toward" unless the user explicitly asks for a recommendation.
- Do not skip or replace the required next question.
- Do not ask extra unrelated questions.
- If options are provided for the required next question, ask user to choose from those options.
- Do not say "type below" or ask for free-text when options are present.
- Use internal question context and saved AI memory as guidance only; never expose them verbatim.
- Read and use subtitle (AI context) for each relevant question when forming guidance.
${postFifthRuleBlock}
- Keep under ${isOpeningIntakeQuestion ? 50 : 150} words.

${outputFormatBlock}
`;

    try {
        const aiResponse = await chatWithAI(
            [{ role: "user", content: prompt }],
            [{ role: "system", content: "You are a JSON-only writing assistant. Return strict JSON only." }],
            serviceName || "system_question_writer"
        );

        if (!aiResponse?.success) return "";

        if (isPostFifthAckSuggestionMode) {
            const structured = parsePostFifthMessageFields(aiResponse.message) || {};
            const fallbackMessage = parseMessageFieldFromJson(aiResponse.message);
            const fallbackRecentContext = clipSentence(
                buildRecentAnswerContextSnippet({
                    answersBySlug,
                    questions: allQuestions,
                    excludeSlug: currentQuestion?.slug
                }),
                170
            );
            const contextualSuggestionDraft = buildContextualSuggestionMessage({
                question: nextQuestion,
                answersBySlug,
                serviceName
            });
            const contextualRecommendation = extractCurrentRecommendationLine(contextualSuggestionDraft);

            const ack = clipSentence(
                structured.ack
                || extractFirstSentence(fallbackMessage)
                || "Great, thanks for sharing that.",
                170
            );
            const previousSuggestionRaw = structured.previousSuggestion
                || (fallbackRecentContext
                    ? `based on what you shared earlier about ${fallbackRecentContext}, this next choice should stay aligned with that direction.`
                    : "based on what you've already shared, this next choice should stay consistent with your direction.");
            const previousSuggestion = clipSentence(
                normalizeGuidanceSentence(previousSuggestionRaw),
                190
            );
            const currentRecommendationRaw = structured.currentRecommendation
                || contextualRecommendation
                || (nextQuestionSubtitle
                    ? `use this context: ${nextQuestionSubtitle}`
                    : "choose the option that best matches your first-launch goal.");
            const currentRecommendation = clipSentence(
                normalizeGuidanceSentence(currentRecommendationRaw),
                190
            );
            const strippedQuestionLead = stripExistingOptionLines(
                stripInlineOptionListTail(structured.questionLead || nextQuestionText),
                getQuestionOptionLabels(nextQuestion)
            );
            const questionLead = clipSentence(
                strippedQuestionLead || nextQuestionText,
                180
            );

            const uniqueSegments = [];
            const seen = new Set();
            for (const segment of [ack, previousSuggestion, currentRecommendation, questionLead]) {
                const normalized = normalizeTextToken(segment);
                if (!normalized || seen.has(normalized)) continue;
                seen.add(normalized);
                uniqueSegments.push(segment);
            }

            let postFifthMessage = uniqueSegments.join("\n").trim();

            if (hasOptions && !hasNumberedOptionsInMessage(postFifthMessage)) {
                postFifthMessage = `${postFifthMessage}\n\n${optionLabelsText}`;
            }

            return postFifthMessage;
        }

        const parsedMessage = parseMessageFieldFromJson(aiResponse.message);
        if (!parsedMessage) {
            console.error("[buildAiGuidedQuestionMessage] AI Response gave empty or invalid parsed message.", aiResponse);
            return "";
        }

        // We removed the strict question mark test because the AI might naturally end with a colon like "Please choose an option below:"

        if (hasOptions) {
            const optionLabels = getQuestionOptionLabels(nextQuestion);
            const normalizedParsedMessage = stripInlineOptionListTail(parsedMessage);
            if (!hasNumberedOptionsInMessage(normalizedParsedMessage)) {
                const cleanedMessage = stripExistingOptionLines(normalizedParsedMessage, optionLabels);
                return `${cleanedMessage} \n\n${optionLabelsText} `;
            }

            return normalizedParsedMessage;
        }

        return parsedMessage;
    } catch (e) {
        console.error("[buildAiGuidedQuestionMessage] Fatal error:", e);
        return "";
    }
};

const getChangedAnswerDetails = (questions = [], previousAnswersBySlug = {}, nextAnswersBySlug = {}) => {
    const changes = [];
    for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        if (!question?.slug) continue;

        const previousValue = previousAnswersBySlug[question.slug];
        const nextValue = nextAnswersBySlug[question.slug];
        if (!hasAnswerValue(previousValue) || !hasAnswerValue(nextValue)) continue;
        if (toComparableAnswer(previousValue) === toComparableAnswer(nextValue)) continue;

        changes.push({
            index,
            slug: question.slug,
            previousValue,
            nextValue,
            hasFlowLogic:
                (Array.isArray(question.logic) && question.logic.length > 0) ||
                Boolean(question.nextQuestionSlug)
        });
    }
    return changes;
};

const getPossibleNextIndexes = (questions = [], index = 0) => {
    const nextIndexes = new Set();
    const question = questions[index];
    if (!question) return [];

    if (Array.isArray(question.logic)) {
        for (const rule of question.logic) {
            if (!rule?.nextQuestionSlug) continue;
            const targetIndex = findQuestionIndex(questions, rule.nextQuestionSlug);
            if (targetIndex !== -1) nextIndexes.add(targetIndex);
        }
    }

    if (question.nextQuestionSlug) {
        const defaultTarget = findQuestionIndex(questions, question.nextQuestionSlug);
        if (defaultTarget !== -1) nextIndexes.add(defaultTarget);
    }

    if (index + 1 < questions.length) {
        nextIndexes.add(index + 1);
    }

    return Array.from(nextIndexes);
};

const collectReachableIndexes = (questions = [], startIndex = -1) => {
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= questions.length) {
        return new Set();
    }

    const visited = new Set();
    const queue = [startIndex];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!Number.isInteger(current) || visited.has(current)) continue;
        visited.add(current);

        const nextIndexes = getPossibleNextIndexes(questions, current);
        for (const nextIndex of nextIndexes) {
            if (!visited.has(nextIndex)) {
                queue.push(nextIndex);
            }
        }
    }

    return visited;
};

const getDependentIndexesForChanges = (questions = [], changes = []) => {
    const dependentIndexes = new Set();

    for (const change of changes) {
        if (!change?.hasFlowLogic) continue;

        const previousBranchNext = resolveNextQuestionIndex(
            questions,
            change.index,
            change.previousValue
        );
        const nextBranchNext = resolveNextQuestionIndex(
            questions,
            change.index,
            change.nextValue
        );

        if (previousBranchNext === nextBranchNext) continue;

        const previousReachable = collectReachableIndexes(questions, previousBranchNext);
        const nextReachable = collectReachableIndexes(questions, nextBranchNext);

        for (const idx of previousReachable) {
            if (!nextReachable.has(idx) && idx > change.index) {
                dependentIndexes.add(idx);
            }
        }

        for (const idx of nextReachable) {
            if (!previousReachable.has(idx) && idx > change.index) {
                dependentIndexes.add(idx);
            }
        }
    }

    return Array.from(dependentIndexes).sort((a, b) => a - b);
};

const clearAnswersByIndexes = (answersBySlug = {}, questions = [], indexes = []) => {
    const nextAnswers = { ...(answersBySlug || {}) };
    for (const index of indexes) {
        const slug = questions[index]?.slug;
        if (!slug) continue;
        delete nextAnswers[slug];
    }
    return nextAnswers;
};

const applyExtractedAnswerUpdates = ({
    baseAnswersBySlug = {},
    existingAnswersBySlug = {},
    extractedAnswers = [],
    questionIndexBySlug = new Map(),
    questionsBySlug = new Map(),
    questionSlugSet = new Set(),
    currentStep = -1,
    ignoreSlug = "",
    correctionIntent = false,
    logPrefix = "[Auto Capture]"
}) => {
    const nextAnswers = { ...(baseAnswersBySlug || {}) };
    const updatedSlugs = [];

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (questionSlugSet.size > 0 && !questionSlugSet.has(slug))) continue;
        if (ignoreSlug && slug === ignoreSlug) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const targetIndex = questionIndexBySlug.get(slug);
        const targetQuestion = questionsBySlug.get(slug);
        if (targetQuestion && !doesExtractedAnswerFitQuestion(targetQuestion, extracted.answer)) {
            continue;
        }

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const hasExistingAnswer = hasAnswerValue(existingAnswersBySlug[slug]);
        let minConfidence = hasExistingAnswer
            ? (correctionIntent ? EXTRACTION_CONFIDENCE_MIN : EXTRACTION_CONFIDENCE_UPDATE_MIN)
            : EXTRACTION_CONFIDENCE_MIN;

        if (Number.isInteger(currentStep) && currentStep >= 0 && Number.isInteger(targetIndex)) {
            if (targetIndex > currentStep + 1) {
                minConfidence = Math.max(minConfidence, 0.93);
            } else if (targetIndex > currentStep) {
                minConfidence = Math.max(minConfidence, 0.90);
            }
        }

        if (normalizedConfidence < minConfidence) continue;

        if (
            hasExistingAnswer &&
            toComparableAnswer(existingAnswersBySlug[slug]) === toComparableAnswer(extracted.answer)
        ) {
            continue;
        }

        nextAnswers[slug] = extracted.answer;
        updatedSlugs.push(slug);

        if (Number.isInteger(targetIndex)) {
            console.log(
                `${logPrefix} Updated "${slug}" at step ${targetIndex} (confidence = ${normalizedConfidence.toFixed(2)})`
            );
        }
    }

    return { answersBySlug: nextAnswers, updatedSlugs };
};

const findNextUnansweredStep = (questions = [], answersBySlug = {}) => {
    if (!Array.isArray(questions) || questions.length === 0) return 0;

    let step = 0;
    const visited = new Set();

    while (step < questions.length) {
        if (visited.has(step)) {
            break;
        }
        visited.add(step);

        const question = questions[step];
        const answer = question?.slug ? answersBySlug[question.slug] : undefined;

        if (!hasAnswerValue(answer)) {
            return step;
        }

        step = resolveNextQuestionIndex(questions, step, answer);
    }

    return questions.length;
};

const parseAnswerExtractionResponse = (rawMessage) => {
    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
        return [];
    }

    const raw = rawMessage.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const extracted = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? raw.substring(firstBrace, lastBrace + 1)
        : raw;

    const candidates = [
        extracted,
        extracted.replace(/\*\*/g, ""),
        extracted
            .replace(/^\s*```(?: json) ?\s */i, "")
            .replace(/\s*```\s*$/i, ""),
        raw,
        raw.replace(/\*\*/g, "")
    ];

    for (const candidate of candidates) {
        const normalized = candidate
            .replace(/^\s*```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();

        if (!normalized.startsWith("{") || !normalized.endsWith("}")) {
            continue;
        }

        try {
            const parsed = JSON.parse(normalized);
            const rows = Array.isArray(parsed?.answers) ? parsed.answers : [];
            return rows
                .map((row) => ({
                    slug: row?.slug,
                    answer: row?.answer,
                    confidence: Number(row?.confidence)
                }))
                .filter((row) => row.slug && hasAnswerValue(row.answer));
        } catch {
            // Try next normalization candidate.
        }
    }

    return [];
};

const mergeExtractedAnswers = ({
    baseAnswers = {},
    extractedAnswers = [],
    validSlugs = new Set()
}) => {
    const merged = { ...(baseAnswers || {}) };

    for (const extracted of extractedAnswers || []) {
        const slug = extracted?.slug;
        if (!slug || (validSlugs.size > 0 && !validSlugs.has(slug))) continue;
        if (!hasAnswerValue(extracted?.answer)) continue;

        const confidence = Number(extracted?.confidence);
        const normalizedConfidence = Number.isFinite(confidence) ? confidence : 0;
        const existing = merged[slug];

        if (!hasAnswerValue(existing)) {
            if (normalizedConfidence >= 0.65) {
                merged[slug] = extracted.answer;
            }
            continue;
        }

        if (
            toComparableAnswer(existing) !== toComparableAnswer(extracted.answer) &&
            normalizedConfidence >= 0.92
        ) {
            merged[slug] = extracted.answer;
        }
    }

    return merged;
};

const buildQuestionAnswerCoverage = (questions = [], answersBySlug = {}) =>
    questions.map((question) => ({
        slug: question?.slug || "",
        question: question?.text || "",
        answer: hasAnswerValue(answersBySlug[question?.slug]) ? String(answersBySlug[question.slug]) : null
    }));

const extractAnswersFromMessage = async ({ serviceName = "", message = "", questions = [] }) => {
    if (!message || !Array.isArray(questions) || questions.length === 0) {
        return [];
    }

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        subtitle: String(q?.subtitle || "").trim(),
        saveResponse: Boolean(q?.saveResponse),
        options: Array.isArray(q.options)
            ? q.options.map((opt) => ({
                value: typeof opt === "string" ? opt : (opt?.value ?? ""),
                label: typeof opt === "string" ? opt : (opt?.label ?? "")
            }))
            : []
    }));

    const extractorPrompt = `
You are extracting questionnaire answers from a single user message.

Service: ${serviceName}
User message: ${JSON.stringify(message)}
Questionnaire: ${JSON.stringify(compactQuestions)}

Rules:
- Return answers that are explicitly stated or clearly implied by the user's message.
- For option-based questions, if the user's meaning clearly matches one option, return that exact option label as the answer.
- If a question is not clearly answered, skip it.
- Do not force a match when multiple options seem plausible.
- Keep free-text answers short and close to what the user said.
- You may mark later questions as answered if this single message clearly answers them.
- Use higher confidence only when the answer is clear enough that the question can be safely skipped.
- If the message clearly answers the immediate next question, confidence should usually be 0.90 or higher.
- If the message clearly answers a later future question, confidence should usually be 0.93 or higher.
- Use each question's subtitle as intent guidance only.

Return only valid JSON in this format:
{
  "answers": [
    { "slug": "question_slug", "answer": "user answer", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await chatWithAI(
            [{ role: "user", content: extractorPrompt }],
            [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            "system_extractor"
        );

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

const extractAnswersFromConversation = async ({ serviceName = "", history = [], questions = [] }) => {
    if (!Array.isArray(history) || history.length === 0) return [];
    if (!Array.isArray(questions) || questions.length === 0) return [];

    const compactQuestions = questions.map((q) => ({
        slug: q.slug,
        question: q.text,
        type: q.type || "text",
        subtitle: String(q?.subtitle || "").trim(),
        saveResponse: Boolean(q?.saveResponse),
        options: Array.isArray(q.options)
            ? q.options.map((opt) => ({
                value: typeof opt === "string" ? opt : (opt?.value ?? ""),
                label: typeof opt === "string" ? opt : (opt?.label ?? "")
            }))
            : []
    }));

    const transcript = history
        .filter((msg) => msg?.role && msg?.content)
        .map((msg) => `${String(msg.role).toUpperCase()}: ${String(msg.content)}`)
        .join("\n");

    const extractorPrompt = `
You are extracting questionnaire answers from a completed chat transcript.

Service: ${serviceName}
Questions: ${JSON.stringify(compactQuestions)}
Transcript:
${transcript}

Rules:
- Return answers only from USER messages.
- If one user message answers multiple questions, return all matched questions.
- For option-based questions, if the user's wording clearly maps to one option, return that exact option label.
- You may use semantic understanding to match a user's wording to the correct question or option when it is clearly implied.
- Do not force uncertain matches.
- Prefer concise answer text.
- Use confidence 0.90+ only for clear, reliable matches and 0.93+ for strong future-question matches.
- Use each question's subtitle as intent guidance only.

Return strict JSON only:
{
  "answers": [
    { "slug": "question_slug", "answer": "answer text", "confidence": 0.0 }
  ]
}
`;

    try {
        const extractionResponse = await chatWithAI(
            [{ role: "user", content: extractorPrompt }],
            [{ role: "system", content: "You are a JSON-only extractor. Output strict JSON only." }],
            "system_extractor"
        );

        if (!extractionResponse?.success) return [];
        return parseAnswerExtractionResponse(extractionResponse.message);
    } catch {
        return [];
    }
};

// @desc    Start a new guest session with guided questions
// @route   POST /api/guest/start
// @access  Public
export const startGuestSession = asyncHandler(async (req, res) => {
    const { serviceId } = req.body; // Can be slug or ID

    if (!serviceId) {
        throw new AppError("Service ID is required", 400);
    }

    // 1. Find the Service and its Questions
    const service = await prisma.service.findFirst({
        where: {
            OR: [
                { slug: serviceId },
                { id: serviceId }
            ],
            active: true
        },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service not found or inactive", 404);
    }

    const firstQuestionDefinition = service.questions[0];
    const fallbackFirstQuestion = firstQuestionDefinition?.text || "How can I help you regarding this service?";
    const firstQuestionConfig = {
        type: firstQuestionDefinition?.type || "text",
        options: firstQuestionDefinition?.options || []
    };
    const aiFirstQuestion = firstQuestionDefinition
        ? await buildAiGuidedQuestionMessage({
            serviceName: service.name,
            userLastMessage: "",
            currentQuestion: {},
            nextQuestion: firstQuestionDefinition,
            answersByQuestionText: {},
            answersBySlug: {},
            allQuestions: service.questions,
            sideReply: "",
            bridgeSegments: [],
            isInitial: true
        })
        : "";
    const isNameFirstQuestion = NAME_QUESTION_REGEX.test(String(firstQuestionDefinition?.text || ""));
    const firstQuestion = isNameFirstQuestion
        ? buildServiceAwareOpeningMessage(service.name)
        : (aiFirstQuestion || fallbackFirstQuestion);

    // 2. Create Session
    const session = await prisma.aiGuestSession.create({
        data: {
            serviceId: service.slug, // Store slug for consistency
            currentStep: 0,
            answers: {},
        },
    });

    // 3. Create Initial assistant message (The First Question)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId: session.id,
            role: "assistant",
            content: firstQuestion,
        },
    });

    res.status(201).json({
        success: true,
        sessionId: session.id,
        message: firstQuestion,
        inputConfig: firstQuestionConfig,
        history: [{ role: "assistant", content: firstQuestion }]
    });
});

// @desc    Handle chat: Answer questions -> Generate Proposal
// @route   POST /api/guest/chat
// @access  Public
export const guestChat = asyncHandler(async (req, res) => {
    const { sessionId, message } = req.body;

    const incomingArray = Array.isArray(message)
        ? message.filter(Boolean).map(String)
        : [];
    const messageText = Array.isArray(message)
        ? incomingArray.join(", ")
        : (message ?? "");
    const parsedIncomingMessage = parseAttachmentTokensFromMessage(messageText);
    const trimmedMessageText = parsedIncomingMessage.plainText.toString().trim();
    const safeMessageText = messageText.toString().trim();
    const persistedUserMessageContent = safeMessageText || trimmedMessageText;
    const uploadedAttachments = parsedIncomingMessage.attachments;

    console.log(`\n--- [Guest Chat] Session: ${sessionId} ---`);
    console.log(`[User]: ${safeMessageText || message}`);

    if (!sessionId || (!trimmedMessageText && incomingArray.length === 0 && uploadedAttachments.length === 0)) {
        throw new AppError("Session ID and message are required", 400);
    }

    // 1. Fetch Session
    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: { messages: true },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    // 2. Fetch Service Questions
    const service = await prisma.service.findUnique({
        where: { slug: session.serviceId },
        include: {
            questions: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!service) {
        throw new AppError("Service context lost", 404);
    }

    const questions = service.questions;
    const currentStep = session.currentStep;
    const currentQuestion = questions[currentStep];
    const numericSelection = mapNumericReplyToOptions(currentQuestion, trimmedMessageText);
    let userMessageText = numericSelection.matched
        ? numericSelection.normalizedText
        : trimmedMessageText;

    if (numericSelection.matched) {
        console.log(
            `[Numeric Selection] mapped "${trimmedMessageText}" -> "${userMessageText}"`
        );
    }

    const rememberedAttachments = uploadedAttachments.length > 0
        ? []
        : getMostRecentAttachmentsFromMessages(session.messages);
    const activeAttachments = uploadedAttachments.length > 0
        ? uploadedAttachments
        : rememberedAttachments;
    const isReferencingStoredAttachment = uploadedAttachments.length === 0
        && activeAttachments.length > 0
        && ATTACHMENT_REFERENCE_REGEX.test(`${userMessageText} ${safeMessageText}`.trim());

    let attachmentContextText = "";
    let attachmentInferredAnswer = "";
    let attachmentInsightNote = "";
    if (activeAttachments.length > 0) {
        attachmentContextText = await buildAttachmentContextBlock({
            attachments: activeAttachments,
        });
        if (uploadedAttachments.length > 0 || isReferencingStoredAttachment) {
            attachmentInsightNote = buildAttachmentInsightForUser({
                attachments: activeAttachments,
                attachmentContextText,
            });
        }
        if (attachmentInsightNote) {
            console.log(`[Attachment Insight] ${attachmentInsightNote}`);
        }

        attachmentInferredAnswer = await inferAnswerFromAttachmentContext({
            currentQuestionText: currentQuestion?.text || "",
            userMessageText,
            attachmentContextText,
            serviceName: service.name,
        });

        if (!normalizeTextToken(userMessageText) && normalizeTextToken(attachmentInferredAnswer)) {
            userMessageText = attachmentInferredAnswer;
            console.log(
                `[Attachment Inference] inferred answer for "${currentQuestion?.slug || "current-question"}": "${userMessageText}"`
            );
        }
    }

    const userMessageForReasoning = [
        userMessageText,
        attachmentContextText
            ? `Attachment context from uploaded files:\n${attachmentContextText}`
            : "",
    ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

    const existingAnswersBySlug = getAnswersBySlug(session.answers || {}, questions);
    const correctionIntent = hasCorrectionIntent(userMessageText);
    const questionIndexBySlug = new Map(
        questions
            .filter((q) => q?.slug)
            .map((q, index) => [q.slug, index])
    );
    const questionsBySlug = new Map(
        questions
            .filter((q) => q?.slug)
            .map((q) => [q.slug, q])
    );
    const questionSlugSet = new Set(questions.map((q) => q.slug).filter(Boolean));
    let extractedAnswersForMessage = [];
    if (currentStep < questions.length) {
        extractedAnswersForMessage = await extractAnswersFromMessage({
            serviceName: service.name,
            message: userMessageForReasoning || userMessageText,
            questions
        });
    }

    // 3. Save User Answer (Preliminary)
    // We will save it, but we might not advance step if invalid.

    // --- VALIDATION STEP ---
    let validationResult = null;
    let aiResponseContent = "";

    if (currentStep < questions.length) {
        const currentQuestionText = currentQuestion?.text || "";
        const currentQuestionOptions = getQuestionOptionLabels(currentQuestion);
        const currentQuestionSubtitle = String(currentQuestion?.subtitle || "").trim();
        const isOpeningIntakeStep = currentStep >= 0 && currentStep < 3;
        const knownContextByQuestion = buildPersistedAnswersPayload(
            existingAnswersBySlug,
            questions
        ).byQuestionText;
        const savedResponseContext = buildSavedResponseContextLines(
            existingAnswersBySlug,
            questions
        );

        // Prepare context for the NEXT question if it exists
        const nextStepIndex = currentStep + 1;
        const nextQuestionSubtitle = (nextStepIndex < questions.length)
            ? String(questions[nextStepIndex]?.subtitle || "").trim()
            : "";
        const nextQuestionText = (nextStepIndex < questions.length)
            ? questions[nextStepIndex].text
            : "This was the final question. I will now generate the proposal.";
        const validationResponseRules = isOpeningIntakeStep
            ? `
            - This is one of the first three questions.
            - Keep the full response under 50 words total.
            - Use up to two short lead-in sentences before the question: one natural acknowledgement or warm opener, plus one short friendly bridge sentence.
            - Do NOT give suggestions, recommendations, best practices, feature ideas, or strategic advice.
            - If VALID: use one short natural acknowledgement sentence, one short warm bridge sentence, then ask the "Next Question in Script" naturally.
            - If INVALID: use one short natural acknowledgement sentence, one short warm bridge sentence, then re-ask the Current Question naturally.
            - If INFO_REQUEST: answer in at most one short sentence, add one short warm bridge sentence if helpful, then ask the Current Question again. Do NOT add recommendations.
            - For name questions, ask for "name" only. Never ask for "full name" or "real full name".
            - If user sends only a greeting while name is asked, respond warmly and ask their name in a natural way.
            `
            : `
            - If INVALID: Politely ask for clarification or the specific details needed.
            - For name questions, ask for "name" only. Never ask for "full name" or "real full name".
            - If user sends only a greeting while name is asked, respond warmly and ask their name in a natural way.
            - Do not sound corrective or robotic. Avoid phrases like "invalid response", "I caught", "still need", or "wrong answer".
            - If INFO_REQUEST: Give a practical helpful answer with more detail:
              1) Answer the user's confusion/question clearly (2-4 short sentences).
              2) Give one recommendation and why it fits their known context.
              3) Then ask the Current Question again so we can continue the flow.
              4) If Current Question has options, include them as numbered list (1., 2., 3.).
            - If VALID: Acknowledge the answer enthusiastically, providing a short but informative conversational response relating to their answer before asking the "Next Question in Script" naturally.
              Include at least one concrete reason, benefit, or tradeoff tied to the user's known context when relevant.
              (If it's the final question, just say "Thanks! Let me put that together for you.")
            - If INVALID: Politely ask for clarification or the specific details needed. But be sure to write a warm, friendly response before re-asking the question.
            - If the question has options, ask the user to choose from listed options; do not ask to type a custom text answer.
            - Keep wording polite, friendly, and engaging.
            - Keep the total response under 150 words.
            `;

        const validationPrompt = `
            You are a friendly, professional assistant guiding a user through a questionnaire for a "${service.name}" service.
            
            Current Question Asked: "${currentQuestionText}"
            Current Question Options: ${JSON.stringify(currentQuestionOptions)}
            Known Context From Earlier Answers: ${JSON.stringify(knownContextByQuestion)}
            Saved AI Memory Context: ${JSON.stringify(savedResponseContext || "None")}
            Current Question Internal Context: ${JSON.stringify(currentQuestionSubtitle || "None")}
            User's Answer: "${userMessageText}"
            Attachment Context: ${attachmentContextText ? JSON.stringify(attachmentContextText) : '"None"'}
            Attachment-Inferred Answer: "${attachmentInferredAnswer || ""}"
             
            Next Question in Script: "${nextQuestionText}"
            Next Question Internal Context: ${JSON.stringify(nextQuestionSubtitle || "None")}

            Task:
            1. Validate the user's answer to the Current Question.
            - If it's a greeting (hi, hello) but the question expects details -> INVALID.
            - If it's irrelevant/gibberish -> INVALID.
            - If the user is asking an informational side-question (e.g., "what is Flutter?", "which is best for me?") instead of directly answering the current question -> INFO_REQUEST.
            - If direct text is empty but attachment context clearly answers the current question, treat as VALID.
            - Otherwise -> VALID.

            2. Generate a Response Message:
${validationResponseRules}
            - Use "Internal Context" and "Saved AI Memory Context" only as hidden intent guidance. Never reveal those labels/text directly to the user.

            Return ONLY a raw JSON object (double quotes only) with this structure:
            {
                "isValid": boolean,
                "status": "valid_answer" | "invalid_answer" | "info_request",
                "message": string, // The response to send to the user (error feedback OR next question transition)
                "normalizedAnswer": string // For VALID answers, put the final direct answer for the current question (including inferred from attachment). Else empty string.
            }
            Do not use markdown formatting, code fences, or bold text.
        `;

        // We use a separate AI call for validation. 
        const validationResponse = await chatWithAI(
            [{ role: "user", content: validationPrompt }],
            [{ role: "system", content: "You are a JSON-only API. Output strictly valid JSON." }],
            "system_validator"
        );

        if (validationResponse.success) {
            console.log(`[Validation Raw]:`, validationResponse.message);
            const parsedValidation = parseValidationResponse(validationResponse.message);
            if (parsedValidation) {
                validationResult = parsedValidation;
                aiResponseContent = parsedValidation.message;

                // If validator derived a concrete answer from attachment context, use it
                // so the questionnaire step advances instead of re-asking the same question.
                const normalizedAnswerFromValidation = clipAttachmentText(
                    parsedValidation?.normalizedAnswer || "",
                    180
                );
                if (
                    validationResult.isValid &&
                    !normalizeTextToken(userMessageText) &&
                    normalizeTextToken(normalizedAnswerFromValidation)
                ) {
                    userMessageText = normalizedAnswerFromValidation;
                    attachmentInferredAnswer = normalizedAnswerFromValidation;
                    console.log(
                        `[Validation Normalized Answer] using "${userMessageText}" for "${currentQuestion?.slug || "current-question"}"`
                    );
                }

                console.log(`[Validation Parsed]:`, parsedValidation);
            } else {
                console.warn("[Validation] Could not parse structured validator output");
            }
        } else {
            console.warn("[Validation] AI request failed");
        }

        if (!validationResult) {
            const aiReaskCurrentQuestion = await buildAiGuidedQuestionMessage({
                serviceName: service.name,
                userLastMessage: userMessageText,
                currentQuestion,
                nextQuestion: currentQuestion,
                answersByQuestionText: knownContextByQuestion,
                answersBySlug: existingAnswersBySlug,
                allQuestions: questions,
                sideReply: "",
                bridgeSegments: [],
                isInitial: false
            });
            validationResult = {
                isValid: false,
                status: "invalid_answer",
                message: aiReaskCurrentQuestion || formatQuestionWithOptions(currentQuestion),
            };
            aiResponseContent = validationResult.message;
            console.log("[Validation Parse Fallback]:", validationResult);
        }

        if (!validationResult.isValid) {
            if (validationResult.status === "info_request") {
                const questionBlock = formatQuestionWithOptions(currentQuestion);
                if (
                    questionBlock &&
                    shouldAppendQuestionBlockForInfoRequest({
                        assistantMessage: aiResponseContent,
                        question: currentQuestion
                    })
                ) {
                    aiResponseContent = `${aiResponseContent}\n\n${questionBlock}`;
                }
            }

            const correctionCapture = applyExtractedAnswerUpdates({
                baseAnswersBySlug: { ...existingAnswersBySlug },
                existingAnswersBySlug,
                extractedAnswers: extractedAnswersForMessage,
                questionIndexBySlug,
                questionsBySlug,
                questionSlugSet,
                currentStep,
                ignoreSlug: currentQuestion?.slug,
                correctionIntent: true,
                logPrefix: "[Correction Capture]"
            });
            const correctionChanges = getChangedAnswerDetails(
                questions,
                existingAnswersBySlug,
                correctionCapture.answersBySlug
            );

            if (correctionChanges.length > 0) {
                let correctedAnswersBySlug = correctionCapture.answersBySlug;
                const dependentIndexes = getDependentIndexesForChanges(questions, correctionChanges);

                if (dependentIndexes.length > 0) {
                    correctedAnswersBySlug = clearAnswersByIndexes(
                        correctedAnswersBySlug,
                        questions,
                        dependentIndexes
                    );
                    const dependentSlugs = dependentIndexes
                        .map((index) => questions[index]?.slug)
                        .filter(Boolean)
                        .join(", ");
                    console.log(
                        `[Correction Flow] Cleared dependent answers after correction: ${dependentSlugs}`
                    );
                }

                const correctionNextStep = findNextUnansweredStep(questions, correctedAnswersBySlug);
                const correctedPayload = buildPersistedAnswersPayload(correctedAnswersBySlug, questions);

                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: {
                        answers: correctedPayload,
                        currentStep: correctionNextStep
                    }
                });

                await prisma.aiGuestMessage.create({
                    data: {
                        sessionId,
                        role: "user",
                        content: persistedUserMessageContent,
                    },
                });

                const followQuestion = correctionNextStep < questions.length
                    ? questions[correctionNextStep].text
                    : "Thanks, I updated that. Let me generate your proposal now.";
                const personalizedFollowBridge = buildPersonalizedQuestionBridge({
                    nextQuestionText: followQuestion,
                    answersByQuestionText: correctedPayload.byQuestionText,
                    serviceName: service.name
                });
                const correctionBridgeCore = dependentIndexes.length > 0
                    ? `Got it - I updated your earlier answer and adjusted related steps. ${personalizedFollowBridge}`
                    : `Got it - I updated your earlier answer. ${personalizedFollowBridge}`;
                const correctionBridge = [attachmentInsightNote, correctionBridgeCore]
                    .map((part) => String(part || "").trim())
                    .filter(Boolean)
                    .join("\n\n");
                const correctionMessage = stripNameNotedRecap(
                    buildFriendlyMessage(followQuestion, correctionBridge)
                );

                await prisma.aiGuestMessage.create({
                    data: {
                        sessionId,
                        role: "assistant",
                        content: correctionMessage,
                    },
                });

                const sessionReload = await prisma.aiGuestSession.findUnique({
                    where: { id: sessionId },
                    include: { messages: { orderBy: { createdAt: 'asc' } } },
                });

                const correctionInputConfig = correctionNextStep < questions.length
                    ? {
                        type: questions[correctionNextStep].type || "text",
                        options: questions[correctionNextStep].options || []
                    }
                    : { type: "text", options: [] };

                return res.json({
                    success: true,
                    message: correctionMessage,
                    inputConfig: correctionInputConfig,
                    history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
                });
            }

            let invalidFlowAnswersBySlug = existingAnswersBySlug;
            let capturedFutureNote = "";

            if (correctionCapture.updatedSlugs.length > 0) {
                invalidFlowAnswersBySlug = correctionCapture.answersBySlug;
                const capturedPayload = buildPersistedAnswersPayload(
                    invalidFlowAnswersBySlug,
                    questions
                );

                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: {
                        answers: capturedPayload,
                        // Keep user on the same required step even after pre-capturing future answers.
                        currentStep
                    }
                });

                console.log(
                    `[Future Capture] Stored future answer(s) while waiting for current step: ${correctionCapture.updatedSlugs.join(", ")}`
                );
                capturedFutureNote = "";
            }

            // INVALID ANSWER FLOW

            // 1. Save User's (Invalid) Message
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "user",
                    content: persistedUserMessageContent,
                },
            });

            // 2. Save Assistant's Feedback Message
            const fallbackFeedbackFromAi = aiResponseContent
                ? ""
                : await buildAiGuidedQuestionMessage({
                    serviceName: service.name,
                    userLastMessage: userMessageText,
                    currentQuestion,
                    nextQuestion: currentQuestion,
                    answersByQuestionText: buildPersistedAnswersPayload(invalidFlowAnswersBySlug, questions).byQuestionText,
                    answersBySlug: invalidFlowAnswersBySlug,
                    allQuestions: questions,
                    sideReply: "",
                    bridgeSegments: [],
                    isInitial: false
                });
            const feedbackCore = aiResponseContent || fallbackFeedbackFromAi || formatQuestionWithOptions(currentQuestion);
            const sideReply = buildAgentSideReply({
                userMessage: userMessageText,
                answersByQuestionText: buildPersistedAnswersPayload(invalidFlowAnswersBySlug, questions).byQuestionText
            });
            const quickReplyHint = hasNumberedOptionsInMessage(feedbackCore)
                || countOptionLabelsMentioned(feedbackCore, currentQuestion) >= 2
                ? ""
                : buildQuickReplyHint(currentQuestion);
            const feedbackMsg = stripNameNotedRecap(
                [sideReply, capturedFutureNote, attachmentInsightNote, feedbackCore, quickReplyHint]
                    .map((part) => String(part || "").trim())
                    .filter(Boolean)
                    .join("\n\n")
            );
            await prisma.aiGuestMessage.create({
                data: {
                    sessionId,
                    role: "assistant",
                    content: feedbackMsg,
                },
            });

            // 3. Return response WITHOUT incrementing step
            // Re-fetch messages including the new ones
            const sessionReload = await prisma.aiGuestSession.findUnique({
                where: { id: sessionId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            });

            return res.json({
                success: true,
                message: feedbackMsg,
                history: sessionReload.messages.map(m => ({ role: m.role, content: m.content }))
            });
        }
    }
    // --- END VALIDATION STEP ---

    // 3. Save User Answer (Valid)
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "user",
            content: persistedUserMessageContent,
        },
    });

    let updatedAnswersBySlug = { ...existingAnswersBySlug };

    if (currentQuestion?.slug) {
        updatedAnswersBySlug[currentQuestion.slug] = userMessageText;
    }

    let autoCapturedAnswerSlugs = [];
    if (currentStep < questions.length) {
        const autoCapture = applyExtractedAnswerUpdates({
            baseAnswersBySlug: updatedAnswersBySlug,
            existingAnswersBySlug,
            extractedAnswers: extractedAnswersForMessage,
            questionIndexBySlug,
            questionsBySlug,
            questionSlugSet,
            currentStep,
            ignoreSlug: currentQuestion?.slug,
            correctionIntent,
            logPrefix: "[Auto Capture]"
        });
        updatedAnswersBySlug = autoCapture.answersBySlug;
        autoCapturedAnswerSlugs = autoCapture.updatedSlugs;
    }

    const changedAnswers = getChangedAnswerDetails(
        questions,
        existingAnswersBySlug,
        updatedAnswersBySlug
    );
    const dependentIndexes = getDependentIndexesForChanges(questions, changedAnswers);
    const dependentResetApplied = dependentIndexes.length > 0;

    if (dependentResetApplied) {
        updatedAnswersBySlug = clearAnswersByIndexes(updatedAnswersBySlug, questions, dependentIndexes);
        autoCapturedAnswerSlugs = [];
        const dependentSlugs = dependentIndexes
            .map((index) => questions[index]?.slug)
            .filter(Boolean)
            .join(", ");
        console.log(
            `[Flow Reset] Cleared dependent answers only: ${dependentSlugs}`
        );
    } else if (changedAnswers.length > 0) {
        console.log(
            `[Flow Update] Updated previous answers without dependent reset.`
        );
    }

    const nextStep = findNextUnansweredStep(questions, updatedAnswersBySlug);
    const persistedAnswers = buildPersistedAnswersPayload(updatedAnswersBySlug, questions);

    await prisma.aiGuestSession.update({
        where: { id: sessionId },
        data: {
            answers: persistedAnswers,
            currentStep: nextStep
        }
    });

    // 4. Determine Next Assistant Response
    let responseContent = "";
    let nextInputConfig = { type: "text", options: [] };

    if (nextStep < questions.length) {
        const nextQuestion = questions[nextStep];
        const nextQuestionText = nextQuestion.text;
        const expectedImmediateNextStep = resolveNextQuestionIndex(
            questions,
            currentStep,
            currentQuestion?.slug ? updatedAnswersBySlug[currentQuestion.slug] : userMessageText
        );

        const canUseAiTransition = Boolean(aiResponseContent)
            && autoCapturedAnswerSlugs.length === 0
            && !dependentResetApplied
            && nextStep === expectedImmediateNextStep;

        const sideReply = buildAgentSideReply({
            userMessage: userMessageText,
            answersByQuestionText: persistedAnswers.byQuestionText
        });
        const personalizedBridge = buildPersonalizedQuestionBridge({
            nextQuestionText,
            answersByQuestionText: persistedAnswers.byQuestionText,
            serviceName: service.name
        });
        const aiBridge = canUseAiTransition
            ? extractFriendlyBridgeFromValidationMessage(aiResponseContent, nextQuestionText)
            : "";
        const bridgeSegments = [];

        if (aiBridge) {
            bridgeSegments.push(aiBridge);
            if (!containsNormalizedText(aiBridge, personalizedBridge)) {
                bridgeSegments.push(personalizedBridge);
            }
        } else {
            bridgeSegments.push(personalizedBridge);
        }

        if (attachmentInsightNote) {
            const alreadyIncluded = bridgeSegments.some((segment) =>
                containsNormalizedText(segment, attachmentInsightNote)
            );
            if (!alreadyIncluded) {
                bridgeSegments.unshift(attachmentInsightNote);
            }
        }

        if (autoCapturedAnswerSlugs.length > 0) {
            bridgeSegments.push("I have already captured some details from your previous message.");
        }

        if (dependentResetApplied) {
            bridgeSegments.push("I updated related answers so this flow stays consistent.");
        }

        const progressBridge = buildProgressBridge({
            nextStep,
            totalQuestions: questions.length
        });
        if (progressBridge) {
            bridgeSegments.push(progressBridge);
        }

        const aiGuidedQuestionMessage = await buildAiGuidedQuestionMessage({
            serviceName: service.name,
            userLastMessage: userMessageText,
            currentQuestion,
            nextQuestion,
            answersByQuestionText: persistedAnswers.byQuestionText,
            answersBySlug: persistedAnswers.bySlug,
            allQuestions: questions,
            sideReply,
            bridgeSegments
        });

        if (aiGuidedQuestionMessage) {
            responseContent = aiGuidedQuestionMessage;
        } else {
            const combinedBridge = combineInlineMessages(...bridgeSegments);
            const questionMessage = buildFriendlyMessage(nextQuestionText, combinedBridge);
            responseContent = sideReply
                ? buildFriendlyMessage(questionMessage, sideReply)
                : questionMessage;
        }

        // Configure next input
        nextInputConfig = {
            type: nextQuestion.type || "text",
            options: nextQuestion.options || []
        };
    } else {
        // CASE B: All questions answered -> Generate Proposal
        try {
            const proposalHistory = [
                ...session.messages.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: userMessageForReasoning || userMessageText }
            ];
            const allQuestionSlugs = new Set(questions.map((q) => q.slug).filter(Boolean));
            const extractedFromConversation = await extractAnswersFromConversation({
                serviceName: service.name,
                history: proposalHistory,
                questions
            });
            const proposalAnswersBySlug = mergeExtractedAnswers({
                baseAnswers: persistedAnswers.bySlug,
                extractedAnswers: extractedFromConversation,
                validSlugs: allQuestionSlugs
            });
            const proposalAnswersPayload = buildPersistedAnswersPayload(proposalAnswersBySlug, questions);

            if (extractedFromConversation.length > 0) {
                console.log(
                    `[Proposal Enrichment] merged ${extractedFromConversation.length} transcript-derived answer(s).`
                );
            }

            if (
                JSON.stringify(proposalAnswersPayload.bySlug) !==
                JSON.stringify(persistedAnswers.bySlug)
            ) {
                await prisma.aiGuestSession.update({
                    where: { id: sessionId },
                    data: { answers: proposalAnswersPayload }
                });
            }

            const proposalContext = {
                serviceName: service.name,
                serviceId: service.slug,
                questionnaireAnswers: proposalAnswersPayload.byQuestionText,
                questionnaireAnswersBySlug: proposalAnswersPayload.bySlug,
                serviceQuestionAnswers: buildQuestionAnswerCoverage(questions, proposalAnswersPayload.bySlug),
                capturedFields: Object.entries(proposalAnswersPayload.byQuestionText || {})
                    .filter(([, value]) => hasAnswerValue(value))
                    .map(([question, answer]) => ({
                        question,
                        answer: String(answer)
                    }))
            };
            const appHints = buildAppProposalHints({
                history: proposalHistory,
                answersByQuestionText: proposalAnswersPayload.byQuestionText
            });
            if (appHints) {
                proposalContext.appHints = appHints;
            }

            responseContent = await generateProposalMarkdown(
                proposalContext,
                proposalHistory,
                service.name
            );
        } catch (error) {
            console.error("[Proposal] Generation failed:", error?.message || error);
            responseContent = "I have saved your requirements, but I cannot generate the proposal right now. Please sign up and connect with an expert.";
        }
        // No input config for final step (or maybe CTA in future)
    }

    responseContent = stripNameNotedRecap(responseContent);

    // 5. Save Assistant Message
    console.log(`[Assistant]: ${responseContent}`);
    await prisma.aiGuestMessage.create({
        data: {
            sessionId,
            role: "assistant",
            content: responseContent,
        },
    });

    // Re-fetch messages for complete history or append manually
    const newHistory = [
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: persistedUserMessageContent },
        { role: "assistant", content: responseContent }
    ];

    res.json({
        success: true,
        message: responseContent,
        inputConfig: nextInputConfig,
        history: newHistory
    });
});

// @desc    Get guest session history
// @route   GET /api/guest/history/:sessionId
// @access  Public
export const getGuestHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.aiGuestSession.findUnique({
        where: { id: sessionId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        },
    });

    if (!session) {
        throw new AppError("Session not found", 404);
    }

    res.json({
        success: true,
        messages: session.messages,
    });
});


