import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { generateRandomString } from "@/components/ui/evervault-card";

function MatrixPattern({ mouseX, mouseY, randomString }) {
    const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.15) 80%, transparent 100%)`;
    const style = { maskImage, WebkitMaskImage: maskImage };

    return (
        <div className="pointer-events-none">
            <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] opacity-20" />
            <motion.div
                className="absolute inset-0 bg-linear-to-r from-primary to-orange-700 opacity-100 transition duration-500 backdrop-blur-xl"
                style={style}
            />
            <motion.div
                className="absolute inset-0 opacity-100 mix-blend-overlay transition duration-500"
                style={style}
            >
                <p className="absolute inset-x-0 h-full wrap-break-word whitespace-pre-wrap text-xs font-mono font-bold text-white transition duration-500">
                    {randomString}
                </p>
            </motion.div>
        </div>
    );
}
import {
    ArrowRight,
    ArrowLeft,
    PanelLeftClose,
    PanelLeftOpen,
    LogIn,
    User,
    Send,
    Mic,
    MicOff,
    Sparkles,
    History,
    Paperclip,
    X,
    Image as ImageIcon,
    FileText,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useTheme } from '@/components/providers/theme-provider';
import { API_BASE_URL, request } from '@/shared/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { getSession } from '@/shared/lib/auth-storage';
import {
    getGuestChatSidebarSizeStorageKeys,
    getGuestChatStorageKeys,
    getProposalListStoragePrefixes,
    getProposalStorageKeys,
    migrateGuestAiStorageNamespace,
    migrateProposalStorageNamespace,
} from '@/shared/lib/storage-keys';
import { CLIENT_DASHBOARD_SEND_PROPOSAL_PATH } from '@/shared/lib/proposal-dashboard-intent';
import cataLogo from '@/assets/logos/logo.svg';

const { primaryKey: GUEST_CHAT_STORAGE_KEY } = getGuestChatStorageKeys();
const { primaryKey: GUEST_CHAT_SIDEBAR_SIZE_KEY } =
    getGuestChatSidebarSizeStorageKeys();
const MAX_PREVIOUS_CHAT_ITEMS = 30;
const ATTACHMENT_TOKEN_PREFIX = '[[ATTACHMENT]]';
const ATTACHMENT_TOKEN_REGEX = /^\[\[ATTACHMENT\]\]([^|]+)\|([^|]+)\|([^|]*)\|(\d+)$/;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const CHAT_FILE_ACCEPT = 'image/*,.pdf,.doc,.docx,.txt,.zip';
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
]);
const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.zip'];

const DEMO_HIGHLIGHTS = [
    'Live AI conversation',
    'Proposal-ready output',
    'No setup needed',
];

const SERVICE_LOGO_MODULES = import.meta.glob('../../assets/icons/*.png', {
    eager: true,
    import: 'default',
});

const normalizeServiceLogoKey = (value = '') =>
    String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[_-]+/g, ' ')
        .replace(/[^a-z0-9 ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const SERVICE_LOGOS_BY_KEY = Object.entries(SERVICE_LOGO_MODULES).reduce((acc, [path, source]) => {
    const fileName = String(path || '').split('/').pop()?.replace(/\.png$/i, '') || '';
    const key = normalizeServiceLogoKey(fileName);
    if (key) {
        acc[key] = source;
    }
    return acc;
}, {});

const SERVICE_LOGO_KEYS = Object.keys(SERVICE_LOGOS_BY_KEY);

const SERVICE_LOGO_ALIASES = {
    branding: 'branding and brand identity',
    'branding kit': 'branding and brand identity',
    'web development': 'website development',
    website: 'website development',
    'website uiux': 'website development',
    'website ui ux': 'website development',
    seo: 'seo optimization',
    'seo search engine optimisation': 'seo optimization',
    'seo search engine optimization': 'seo optimization',
    'social media marketing organic': 'social media management',
    'paid advertising performance': 'performance marketing',
    'performance marketing': 'performance marketing',
    'app development android ios cross platform': 'app development',
    'software development web saas custom systems': 'software development',
    'writing content': 'writing and content',
    'whatsapp chatbot': 'whatsapp chat bot',
    'creative design': 'creative and design',
    'modeling 3d': '3d modeling',
    'cgi video services': 'cgi video',
    'crm erp integrated solutions': 'crm and erp solutions',
    'crm and erp integrated solutions': 'crm and erp solutions',
};

const isLogoUrl = (value = '') => /^(?:https?:\/\/|\/|data:image\/)/i.test(String(value || '').trim());

const resolveServiceLogoSrc = (service = {}) => {
    const explicitLogo = [
        service.logo,
        service.logoUrl,
        service.logo_url,
        service.image,
        service.imageUrl,
        service.image_url,
    ].find((value) => isLogoUrl(value));

    if (explicitLogo) return explicitLogo;

    const candidates = [
        service.slug,
        service.id,
        service.name,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeServiceLogoKey(candidate);
        if (!normalized) continue;

        const mappedKey = SERVICE_LOGO_ALIASES[normalized] || normalized;
        if (SERVICE_LOGOS_BY_KEY[mappedKey]) return SERVICE_LOGOS_BY_KEY[mappedKey];

        const fuzzyKey = SERVICE_LOGO_KEYS.find((key) => key.includes(mappedKey) || mappedKey.includes(key));
        if (fuzzyKey) return SERVICE_LOGOS_BY_KEY[fuzzyKey];
    }

    return cataLogo;
};

const isBrowser = typeof window !== 'undefined';

const safeParseArray = (value) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const readStoredGuestSessions = () => {
    if (!isBrowser) return [];
    migrateGuestAiStorageNamespace();
    return safeParseArray(window.localStorage.getItem(GUEST_CHAT_STORAGE_KEY));
};

const readStoredSidebarSize = () => {
    if (!isBrowser) return 'large';
    migrateGuestAiStorageNamespace();
    const value = window.localStorage.getItem(GUEST_CHAT_SIDEBAR_SIZE_KEY);
    return value === 'small' ? 'small' : 'large';
};

const writeStoredSidebarSize = (size = 'large') => {
    if (!isBrowser) return;
    window.localStorage.setItem(GUEST_CHAT_SIDEBAR_SIZE_KEY, size === 'small' ? 'small' : 'large');
};

const writeStoredGuestSessions = (sessions = []) => {
    if (!isBrowser) return;
    window.localStorage.setItem(GUEST_CHAT_STORAGE_KEY, JSON.stringify(sessions));
};

const upsertStoredGuestSession = (entry = {}) => {
    if (!entry.sessionId) return readStoredGuestSessions();
    const existing = readStoredGuestSessions();
    const now = new Date().toISOString();
    const current = existing.find((item) => item.sessionId === entry.sessionId);

    const normalized = {
        sessionId: entry.sessionId,
        serviceId: entry.serviceId || current?.serviceId || '',
        serviceName: entry.serviceName || current?.serviceName || 'AI Consultation',
        serviceDescription: entry.serviceDescription || current?.serviceDescription || '',
        preview: entry.preview || current?.preview || '',
        messageCount: Number(entry.messageCount || current?.messageCount || 0),
        createdAt: current?.createdAt || entry.createdAt || now,
        updatedAt: entry.updatedAt || now,
    };

    const remaining = existing.filter((item) => item.sessionId !== normalized.sessionId);
    const nextSessions = [normalized, ...remaining]
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, MAX_PREVIOUS_CHAT_ITEMS);

    writeStoredGuestSessions(nextSessions);
    return nextSessions;
};

const removeStoredGuestSession = (sessionId = '') => {
    if (!sessionId) return readStoredGuestSessions();
    const existing = readStoredGuestSessions();
    const nextSessions = existing.filter((item) => item.sessionId !== sessionId);
    writeStoredGuestSessions(nextSessions);
    return nextSessions;
};

const truncateText = (value = '', limit = 120) => {
    const source = String(value || '').trim().replace(/\s+/g, ' ');
    if (!source) return '';
    if (source.length <= limit) return source;
    return `${source.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
};

const formatBytes = (bytes = 0) => {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const buildAttachmentToken = (attachment = {}) => {
    const name = encodeURIComponent(String(attachment.name || 'Attachment'));
    const url = encodeURIComponent(String(attachment.url || ''));
    const type = encodeURIComponent(String(attachment.type || ''));
    const size = Number(attachment.size || 0);
    return `${ATTACHMENT_TOKEN_PREFIX}${name}|${url}|${type}|${size}`;
};

const parseAttachmentToken = (line = '') => {
    const match = String(line || '').trim().match(ATTACHMENT_TOKEN_REGEX);
    if (!match) return null;

    const name = decodeURIComponent(match[1] || '');
    const url = decodeURIComponent(match[2] || '');
    const type = decodeURIComponent(match[3] || '');
    const size = Number(match[4] || 0);

    if (!url) return null;

    return {
        name: name || 'Attachment',
        url,
        type,
        size: Number.isFinite(size) ? size : 0,
    };
};

const parseMessageContentWithAttachments = (content = '', explicitAttachments = []) => {
    const parsedAttachments = [];
    const textLines = [];
    const contentLines = String(content || '').replace(/\r/g, '').split('\n');

    contentLines.forEach((rawLine) => {
        const parsed = parseAttachmentToken(rawLine);
        if (parsed) {
            parsedAttachments.push(parsed);
            return;
        }
        textLines.push(rawLine);
    });

    const seen = new Set();
    const allAttachments = [...(Array.isArray(explicitAttachments) ? explicitAttachments : []), ...parsedAttachments]
        .filter((attachment) => attachment?.url)
        .filter((attachment) => {
            const key = `${attachment.url}|${attachment.name || ''}|${attachment.size || 0}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    return {
        text: textLines.join('\n').trim(),
        attachments: allAttachments,
    };
};

const toPreviewText = (messages = []) => {
    const source = [...messages].reverse();
    for (const message of source) {
        const parsed = parseMessageContentWithAttachments(message?.content || '', message?.attachments || []);
        if (parsed.text) return truncateText(parsed.text, 90);
        if (parsed.attachments.length > 0) {
            return `Shared ${parsed.attachments[0].name || 'attachment'}`;
        }
    }
    return '';
};

const formatPreviousChatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const sameDay = now.toDateString() === date.toDateString();
    if (sameDay) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const PROPOSAL_LIST_STORAGE_PREFIXES = getProposalListStoragePrefixes();

const readAllStoredGeneratedProposalRows = () => {
    if (!isBrowser) return [];
    const rows = [];
    for (let idx = 0; idx < window.localStorage.length; idx += 1) {
        const key = window.localStorage.key(idx);
        if (!key || !PROPOSAL_LIST_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
        rows.push(...safeParseArray(window.localStorage.getItem(key)));
    }
    return rows;
};

const toProposalFingerprint = (content = '') =>
    String(content || '').replace(/\s+/g, ' ').trim().toLowerCase();

const sortStoredGeneratedProposals = (proposals = []) =>
    [...(Array.isArray(proposals) ? proposals : [])]
        .filter((proposal) => proposal && typeof proposal === 'object')
        .reduce((acc, proposal) => {
            const fp = proposal?.fingerprint
                || toProposalFingerprint(proposal?.content || proposal?.summary || proposal?.projectTitle || '');
            if (!fp) return acc;
            if (acc.seen.has(fp)) return acc;
            acc.seen.add(fp);
            acc.rows.push({ ...proposal, fingerprint: fp });
            return acc;
        }, { seen: new Set(), rows: [] }).rows
        .sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt || 0).getTime()
                - new Date(a.updatedAt || a.createdAt || 0).getTime()
        );

const readStoredGeneratedProposals = (userId) => {
    if (!isBrowser) return [];
    migrateProposalStorageNamespace();
    if (userId) {
        migrateProposalStorageNamespace(userId);
    }

    const scopedKey = getProposalStorageKeys(userId).listKey;
    const scopedRows = safeParseArray(window.localStorage.getItem(scopedKey));

    if (!userId) {
        const allStoredRows = readAllStoredGeneratedProposalRows();
        return sortStoredGeneratedProposals([...scopedRows, ...allStoredRows]);
    }

    const guestKey = getProposalStorageKeys(null).listKey;
    const guestRows = safeParseArray(window.localStorage.getItem(guestKey));
    return sortStoredGeneratedProposals([...scopedRows, ...guestRows]);
};

const upsertStoredGeneratedProposal = (proposalContent, userId) => {
    if (!isBrowser) return [];
    migrateProposalStorageNamespace();
    if (userId) {
        migrateProposalStorageNamespace(userId);
    }

    const normalizedContent = normalizeMarkdownContent(proposalContent);
    if (!normalizedContent || !isProposalMessage(normalizedContent)) {
        return readStoredGeneratedProposals(userId);
    }

    const parsed = parseProposalContent(normalizedContent);
    const now = new Date().toISOString();
    const fingerprint = toProposalFingerprint(normalizedContent);
    const { listKey, singleKey, syncedKey } = getProposalStorageKeys(userId);
    const existingProposals = safeParseArray(window.localStorage.getItem(listKey));
    const existingIndex = existingProposals.findIndex((proposal) => {
        const existingFingerprint = proposal?.fingerprint
            || toProposalFingerprint(proposal?.content || proposal?.summary || proposal?.projectTitle || '');
        return existingFingerprint === fingerprint;
    });

    const proposalToSave = {
        id: existingProposals[existingIndex]?.id || `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        projectTitle: parsed.fields?.serviceType || parsed.fields?.businessName || "AI Generated Proposal",
        service: parsed.fields?.serviceType || "General services",
        serviceKey: parsed.fields?.serviceType || "",
        summary: normalizedContent,
        content: normalizedContent,
        proposalContent: normalizedContent,
        budget: parsed.fields?.budget || "",
        timeline: parsed.fields?.launchTimeline || "",
        ownerId: userId || null,
        syncedProjectId: existingProposals[existingIndex]?.syncedProjectId || null,
        syncedAt: existingProposals[existingIndex]?.syncedAt || null,
        createdAt: existingProposals[existingIndex]?.createdAt || now,
        updatedAt: now,
        fingerprint,
    };

    if (existingIndex >= 0) {
        existingProposals[existingIndex] = proposalToSave;
    } else {
        existingProposals.push(proposalToSave);
    }

    const sortedProposals = sortStoredGeneratedProposals(existingProposals);
    window.localStorage.setItem(listKey, JSON.stringify(sortedProposals));
    window.localStorage.setItem(singleKey, JSON.stringify(proposalToSave));
    if (syncedKey) window.localStorage.removeItem(syncedKey);
    return readStoredGeneratedProposals(userId);
};

const unwrapPayload = (value) => {
    if (!value || typeof value !== 'object') return value;
    if ('data' in value && value.data !== undefined && value.data !== null) {
        return value.data;
    }
    return value;
};

const extractServices = (value) => {
    const payload = unwrapPayload(value);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.services)) return payload.services;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const isProposalMessage = (content = "") => {
    if (typeof content !== "string") return false;
    return /client name\s*:|project overview\s*:|primary objectives\s*:|features\/deliverables included\s*:/i.test(content);
};

const normalizeMarkdownContent = (content = "") =>
    String(content)
        .replace(/^```(?:markdown)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

const appendSpeechTranscript = (
    baseInput = '',
    finalTranscript = '',
    interimTranscript = '',
) =>
    [baseInput, finalTranscript, interimTranscript]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();

const OPTION_LINE_REGEX = /^\s*(\d+)\.\s+(.+)$/;
const QUESTION_LINE_REGEX = /\?\s*$/;
const OPTION_PROMPT_CUE_REGEX = /\b(choose|select|pick|prefer|options?|choice|choices|kindly|please|type|tap|reply|which one|which of these|here are)\b/i;
const FREEFORM_FOLLOWUP_OPTION_REGEX = /\b(not sure|other|suggest|recommend|advice|help)\b/i;

const repairBrokenTechTokens = (text = "") =>
    String(text || "")
        // Fix "Node. js" / "Node.\njs" -> "Node.js"
        .replace(/\b([A-Za-z][A-Za-z0-9+#-]*)\.\s*\n+\s*(js|ts|io)\b/gi, '$1.$2')
        .replace(/\b([A-Za-z][A-Za-z0-9+#-]*)\.\s+(js|ts|io)\b/gi, '$1.$2');

const forceSentenceBreaks = (text = "") => {
    const source = repairBrokenTechTokens(String(text || ""));
    if (!source) return source;

    // Preserve authored structure (lists/newlines) and only split single-line blobs.
    if (source.includes("\n") || /(^|\s)([-*]|\d+\.)\s+/m.test(source)) {
        return source;
    }

    return source
        .replace(/\b(Dr|Mr|Mrs|Ms|e\.g|i\.e)\.\s/g, "$1_PROTECT_")
        .replace(/([a-z0-9][.?!])\s+(?=[A-Z])/g, "$1\n\n")
        .replace(/_PROTECT_/g, ". ");
};

const normalizeAssistantParagraphSpacing = (text = "") => {
    const source = String(text || "").replace(/\r/g, "").trim();
    if (!source) return source;

    if (/(^|\n)\s*([-*]|\d+\.)\s+\S/m.test(source)) {
        return source;
    }

    const normalizedLines = source
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n\n");

    return forceSentenceBreaks(normalizedLines);
};

const AssistantMarkdownBlocks = ({ content = '', className = '' }) => {
    const normalized = normalizeAssistantParagraphSpacing(content);
    const blocks = normalized
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean);

    if (blocks.length <= 1) {
        return (
            <div className={className}>
                <ReactMarkdown>{normalized}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className={`${className} space-y-4`}>
            {blocks.map((block, index) => (
                <div key={`assistant-block-${index}`}>
                    <ReactMarkdown>{block}</ReactMarkdown>
                </div>
            ))}
        </div>
    );
};

const normalizeInlineOptions = (text = "") =>
    String(text || "")
        // Common AI output: "... question? 1. Option A"
        .replace(/\?\s*(\d+)\.\s+/g, '?\n$1. ')
        // Fallback for prompt formats like "Please choose: 1. A"
        .replace(/:\s*(\d+)\.\s+/g, ':\n$1. ')
        // Split chained inline options: "1. A 2. B 3. C"
        .replace(/([^\n])\s+(\d+)\.\s+(?=[A-Za-z])/g, '$1\n$2. ');

const hasNestedOptionMarker = (text = "") => /\b\d+\.\s+\S/.test(String(text || ""));

const dedupeOptionEntries = (optionEntries = []) => {
    const bestByNumber = new Map();

    for (const entry of optionEntries) {
        const number = String(entry?.number || '').trim();
        const text = String(entry?.text || '').trim();
        if (!number || !text) continue;

        const existing = bestByNumber.get(number);
        if (!existing) {
            bestByNumber.set(number, { ...entry, number, text });
            continue;
        }

        const existingHasNested = hasNestedOptionMarker(existing.text);
        const incomingHasNested = hasNestedOptionMarker(text);
        const shouldReplace =
            (existingHasNested && !incomingHasNested)
            || (existingHasNested === incomingHasNested && text.length < existing.text.length);

        if (shouldReplace) {
            bestByNumber.set(number, { ...entry, number, text });
        }
    }

    return Array.from(bestByNumber.values()).sort(
        (a, b) => Number(a.number) - Number(b.number)
    );
};

const splitContextAndQuestion = (text = "") => {
    const source = repairBrokenTechTokens(String(text || "")).trim();
    if (!source) return { contextText: "", questionText: "" };
    if (!source.includes("?")) return { contextText: source, questionText: "" };

    const protectedSource = source.replace(
        /\b([A-Za-z][A-Za-z0-9+#-]*)\.(js|ts|io)\b/gi,
        '$1__DOT__$2'
    );
    const restoreProtectedDots = (value = "") => String(value || "").replace(/__DOT__/g, '.');

    const sentenceMatches = protectedSource.match(/[^.!?\n]+[.!?]+/g) || [protectedSource];
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
            contextText: restoreProtectedDots(lines.slice(0, -1).join("\n\n").trim()),
            questionText: restoreProtectedDots(lastLine)
        };
    }

    const questionText = restoreProtectedDots(sentenceMatches[questionIdx].trim());
    const contextText = sentenceMatches
        .filter((_, idx) => idx !== questionIdx)
        .map((sentence) => sentence.trim())
        .filter((sentence) => !/^\d+\.$/.test(sentence))
        .map((sentence) => sentence.trim())
        .join("\n\n")
        .trim();

    return { contextText: restoreProtectedDots(contextText), questionText };
};

const parseAssistantMessageLayout = (content = "", { forceInteractiveOptions = false } = {}) => {
    const normalized = normalizeInlineOptions(
        repairBrokenTechTokens(
            normalizeMarkdownContent(content).replace(/\r/g, "").trim()
        )
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
        normalizedOptionEntries.length <= 12 &&
        (hasQuestionLine || OPTION_PROMPT_CUE_REGEX.test(normalized) || forceInteractiveOptions);

    // Keep numbered informational answers as normal markdown instead of forcing
    // question/option card layout.
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
            options: []
        };
    }

    const splitQuestionLine = splitContextAndQuestion(lines[questionIndex]);
    const hasInlineQuestionSplit = Boolean(splitQuestionLine.questionText);
    const questionText = hasInlineQuestionSplit
        ? splitQuestionLine.questionText
        : lines[questionIndex];
    const contextParts = lines
        .filter((line, idx) => idx !== questionIndex && !OPTION_LINE_REGEX.test(line));

    // Add extracted context only when we actually split a mixed line
    // like "Tip... What would you like...?"
    if (hasInlineQuestionSplit && splitQuestionLine.contextText) {
        contextParts.push(splitQuestionLine.contextText);
    }

    const contextText = contextParts.join("\n\n").trim();

    return {
        contextText: forceSentenceBreaks(contextText),
        questionText: forceSentenceBreaks(questionText),
        options: normalizedOptionEntries.map((option) => ({
            number: option.number,
            text: option.text
        }))
    };
};

const AssistantMessageBody = ({
    content,
    isDark,
    enableOptionClick = false,
    forceInteractiveOptions = false,
    onOptionClick = () => { },
    isOptionSelected = () => false,
    isMultiInput = false,
    selectedCount = 0,
    onSubmitMulti = () => { }
}) => {
    const { contextText, questionText, options } = parseAssistantMessageLayout(content, {
        forceInteractiveOptions,
    });
    const hasStructuredQuestion = Boolean(questionText) || options.length > 0;
    const assistantMarkdownClassName = `prose prose-sm max-w-none break-words text-[0.97rem] leading-7 prose-p:my-3.5 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-strong:font-semibold prose-headings:font-semibold ${isDark
        ? 'prose-invert prose-p:text-slate-100 prose-li:text-slate-100 prose-headings:text-white prose-a:text-amber-300'
        : 'prose-p:text-slate-700 prose-li:text-slate-700 prose-headings:text-slate-900 prose-a:text-amber-700'
        }`;

    if (!hasStructuredQuestion) {
        return <AssistantMarkdownBlocks content={content} className={assistantMarkdownClassName} />;
    }

    return (
        <div className="space-y-4">
            {contextText && (
                <AssistantMarkdownBlocks content={contextText} className={assistantMarkdownClassName} />
            )}

            {questionText && (
                <div className={`rounded-2xl border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${isDark ? 'border-amber-300/35 bg-amber-300/[0.08]' : 'border-amber-400/30 bg-amber-50/80'}`}>
                    <div className={`prose prose-sm max-w-none text-[0.95rem] font-medium leading-7 prose-p:my-1 ${isDark ? 'prose-invert prose-p:text-amber-50' : 'prose-p:text-slate-800'}`}>
                        <ReactMarkdown>{questionText}</ReactMarkdown>
                    </div>
                </div>
            )}

            {options.length > 0 && (
                <div className="space-y-2.5">
                    {options.map((option) => (
                        enableOptionClick ? (
                            <button
                                key={`${option.number}-${option.text}`}
                                type="button"
                                onClick={() => onOptionClick(option.text)}
                                className={`group flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-all ${isOptionSelected(option.text)
                                    ? 'border-primary bg-primary/18 ring-1 ring-primary/45'
                                    : isDark
                                        ? 'border-white/15 bg-white/[0.045] hover:border-white/30 hover:bg-white/[0.09]'
                                        : 'border-black/10 bg-white hover:border-black/20 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[11px] font-semibold ${isDark ? 'bg-white/15 text-slate-100' : 'bg-slate-900 text-white'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none leading-relaxed prose-p:my-0 ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
                                    <ReactMarkdown>{option.text}</ReactMarkdown>
                                </div>
                            </button>
                        ) : (
                            <div
                                key={`${option.number}-${option.text}`}
                                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${isDark ? 'border-white/15 bg-white/[0.045]' : 'border-black/10 bg-white'}`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[11px] font-semibold ${isDark ? 'bg-white/15 text-slate-100' : 'bg-slate-900 text-white'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none leading-relaxed prose-p:my-0 ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
                                    <ReactMarkdown>{option.text}</ReactMarkdown>
                                </div>
                            </div>
                        )
                    ))}

                    {enableOptionClick && isMultiInput && (
                        <Button
                            type="button"
                            className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                            disabled={selectedCount === 0}
                            onClick={onSubmitMulti}
                        >
                            Send selection
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

const PROPOSAL_META_FIELDS = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'businessName', label: 'Business Name' },
    { key: 'serviceType', label: 'Service Type' },
    { key: 'launchTimeline', label: 'Launch Timeline' },
    { key: 'budget', label: 'Budget' },
];

const PROPOSAL_SECTION_ORDER = [
    'Project Overview',
    'Primary Objectives',
    'Features/Deliverables Included',
    'App Features',
    'Platform Requirements',
    'Additional Confirmed Inputs',
];

const normalizeProposalKey = (value = '') =>
    String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const escapeRegExp = (value = '') =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripMarkdownDecorators = (value = '') =>
    String(value)
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim();

const normalizeHelperIntentText = (value = '') =>
    stripMarkdownDecorators(String(value || ''))
        .toLowerCase()
        .replace(/[—–-]/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const buildHistoryPersonalizationLead = (historyContext = '') => {
    const normalized = normalizeHelperIntentText(historyContext);
    if (!normalized) return '';

    if (/\b(booking|appointment|appointments|schedule|scheduling|reservation)\b/.test(normalized)
        && /\b(service|services)\b/.test(normalized)) {
        return "Since you're planning a booking-focused services website, ";
    }

    if (/\b(marketplace|multi vendor|multivendor|vendors|sellers|buyers)\b/.test(normalized)) {
        return "Since you're planning a marketplace-style platform, ";
    }

    if (/\b(e commerce|ecommerce|store|shop|products|catalog|checkout|payments)\b/.test(normalized)) {
        return "Since you're planning a selling-focused project, ";
    }

    if (/\b(seo|search engine|organic traffic)\b/.test(normalized)
        && /\b(next js|nextjs)\b/.test(normalized)) {
        return 'Since strong SEO and performance matter for this project, ';
    }

    if (/\b(next js|nextjs)\b/.test(normalized)) {
        return 'Since you already prefer Next.js for this project, ';
    }

    if (/\b(booking|appointment|appointments|schedule|scheduling|reservation)\b/.test(normalized)) {
        return "Since you're planning a booking-focused project, ";
    }

    if (/\b(mobile app|app|ios|android)\b/.test(normalized)) {
        return "Since you're planning an app, ";
    }

    if (/\b(website|web site|landing page)\b/.test(normalized)) {
        return "Since you're planning a website, ";
    }

    if (/\b(service|services)\b/.test(normalized)) {
        return "Since you're building around your services, ";
    }

    return '';
};

const buildFreeformOptionHelperCopy = ({
    optionLabel = '',
    questionText = '',
    contextText = '',
    serviceName = '',
    historyContext = '',
}) => {
    const normalizedOption = normalizeHelperIntentText(optionLabel);
    const combinedPrompt = `${normalizeHelperIntentText(questionText)} ${normalizeHelperIntentText(contextText)}`.trim();
    const isNotSure = /\bnot sure\b/.test(normalizedOption);
    const cleanedServiceName = stripMarkdownDecorators(serviceName || '').trim();
    const serviceReference = cleanedServiceName ? ` for your ${cleanedServiceName.toLowerCase()} project` : '';
    const personalizationLead = buildHistoryPersonalizationLead(historyContext);
    const personalizeNotice = (notice = '') => {
        const trimmedNotice = String(notice || '').trim();
        if (!trimmedNotice || !personalizationLead) return trimmedNotice;

        if (/^No problem\./i.test(trimmedNotice)) {
            return trimmedNotice.replace(/^No problem\.\s*/i, `No problem. ${personalizationLead}`);
        }

        if (/^Got it\./i.test(trimmedNotice)) {
            return trimmedNotice.replace(/^Got it\.\s*/i, `Got it. ${personalizationLead}`);
        }

        return `${personalizationLead}${trimmedNotice}`;
    };
    const guidanceByIntent = [
        {
            test: /\b(frontend|framework|next js|react|angular|vue)\b/,
            notSureNotice: `No problem! Tell us what matters most — e.g. "I need strong SEO" → Next.js is ideal. "I want a simple interactive app" → React works great. "I prefer no coding" → try a no-code tool. What's your priority?`,
            notSurePlaceholder: 'e.g. "I need strong SEO and fast load times"...',
            otherNotice: `Got it. Tell me which frontend approach you have in mind${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe the frontend approach you want...',
        },
        {
            test: /\b(backend|server|api|technology)\b/,
            notSureNotice: `No problem! Here's a quick guide — "I need real-time features" → Node.js. "I want Python" → Django. "I want serverless" → Firebase or Supabase. What fits your needs?`,
            notSurePlaceholder: 'e.g. "I need real-time updates and REST APIs"...',
            otherNotice: `Got it. Tell me which backend setup you have in mind${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe the backend setup you want...',
        },
        {
            test: /\b(database|mysql|postgresql|mongodb|firebase|supabase)\b/,
            notSureNotice: `No problem! Quick guide — "I have structured data like orders/users" → PostgreSQL. "I need flexible documents" → MongoDB. "I want real-time sync" → Firebase. What kind of data will you store?`,
            notSurePlaceholder: 'e.g. "user profiles, bookings, and payments"...',
            otherNotice: `Got it. Tell me which database or data setup you want${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe the database setup you want...',
        },
        {
            test: /\b(budget|price|pricing|cost)\b/,
            notSureNotice: `No problem! To give you the right scope — a basic landing page starts around ₹15K, a booking webapp around ₹80K–₹2L, a full platform ₹3L+. What range feels comfortable for you?`,
            notSurePlaceholder: 'e.g. "around ₹50,000 to ₹1 lakh"...',
            otherNotice: `Got it. Tell me the budget range you have in mind${serviceReference}, and I will tailor the scope around it.`,
            otherPlaceholder: 'Describe your budget range or expectation...',
        },
        {
            test: /\b(timeline|ready|launch|deadline|when would you like)\b/,
            notSureNotice: `No problem! For reference — a simple site takes 2–4 weeks, a booking app 6–10 weeks, a full platform 3–5 months. When would you ideally want this live?`,
            notSurePlaceholder: 'e.g. "within 2 months" or "by June 2025"...',
            otherNotice: `Got it. Tell me the timeline you have in mind${serviceReference}, and I will tailor the plan around it.`,
            otherPlaceholder: 'Describe your preferred timeline...',
        },
        {
            test: /\b(design|style|look|feel|visual|branding)\b/,
            notSureNotice: `No problem! Examples — "clean and minimal like Apple" → minimalist. "bold and colorful like Zomato" → vibrant. "luxury and elegant" → premium dark. Describe your brand vibe.`,
            notSurePlaceholder: 'e.g. "modern, minimal, and professional"...',
            otherNotice: `Got it. Tell me the design direction you have in mind${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe your preferred design direction...',
        },
        {
            test: /\b(page count|pages|home|about|contact|service detail)\b/,
            notSureNotice: `No problem! Most websites start with: Home, About, Services, Contact. E-commerce adds: Products, Cart, Checkout. Which pages feel essential for your project?`,
            notSurePlaceholder: 'e.g. "home, services, pricing, and contact"...',
            otherNotice: `Got it. Tell me the pages or sections you want${serviceReference}, and I will tailor the structure around them.`,
            otherPlaceholder: 'Describe the pages or sections you want...',
        },
        {
            test: /\b(features|deliverables|include|booking|appointments|functionality)\b/,
            notSureNotice: `No problem! Common picks — "user login + bookings" for a service site. "cart + payments + orders" for a store. "admin panel + reports" for an internal tool. What must your users be able to do?`,
            notSurePlaceholder: 'e.g. "users should book appointments and pay online"...',
            otherNotice: `Got it. Tell me the features or deliverables you have in mind${serviceReference}, and I will tailor it around them.`,
            otherPlaceholder: 'Describe the features or deliverables you want...',
        },
        {
            test: /\b(hosting|deploy|deployment|vercel|aws|render)\b/,
            notSureNotice: `No problem! Quick guide — "fast and free for small apps" → Vercel or Netlify. "more control and scale" → AWS or DigitalOcean. "all-in-one" → Render or Railway. What matters most to you?`,
            notSurePlaceholder: 'e.g. "affordable and easy to manage"...',
            otherNotice: `Got it. Tell me the hosting setup you have in mind${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe the hosting setup you want...',
        },
        {
            test: /\b(what do you want to build|website type|mobile app|what kind of website|what kind of app|project type)\b/,
            notSureNotice: `No problem! Examples — "I want customers to book my services" → Booking webapp. "I want to sell products" → E-commerce store. "I want to share info about my business" → Business website. What do you want your users to do?`,
            notSurePlaceholder: 'e.g. "users should browse my services and book them"...',
            otherNotice: `Got it. Tell me what kind of product you have in mind${serviceReference}, and I will tailor the direction around it.`,
            otherPlaceholder: 'Describe the kind of product you want to build...',
        },
        {
            test: /\b(developed|built|build type|wordpress|shopify|custom development|cms)\b/,
            notSureNotice: `No problem! Quick guide — "I want easy content edits" → WordPress. "I want to sell products" → Shopify. "I want full custom features and branding" → Custom Development. What matters most to you?`,
            notSurePlaceholder: 'e.g. "I want full control and custom features"...',
            otherNotice: `Got it. Tell me the website approach you have in mind${serviceReference}, and I will tailor it around that.`,
            otherPlaceholder: 'Describe the website approach you want...',
        },
    ];

    const matchedIntent = guidanceByIntent.find((entry) => entry.test.test(combinedPrompt));

    if (matchedIntent) {
        return isNotSure
            ? {
                notice: personalizeNotice(matchedIntent.notSureNotice),
                placeholder: matchedIntent.notSurePlaceholder,
            }
            : {
                notice: personalizeNotice(matchedIntent.otherNotice),
                placeholder: matchedIntent.otherPlaceholder,
            };
    }

    return isNotSure
        ? {
            notice: personalizeNotice(`No problem. Tell me a little more about what you need here${serviceReference}, and I will suggest the best fit. (e.g., "I need a simple booking system" or "I want a custom membership area")`),
            placeholder: 'e.g. "I need a clean dashboard for my clients"...',
        }
        : {
            notice: personalizeNotice(`Got it. Tell me what you have in mind here${serviceReference}, and I will tailor it for you.`),
            placeholder: 'Tell me a bit more about what you have in mind...',
        };
};

const PROPOSAL_INLINE_FIELD_LABELS = [
    'Client Name',
    'Business Name',
    'Service Type',
    'Project Overview',
    'Primary Objectives',
    'Features/Deliverables Included',
    'Website Type',
    'Design Style',
    'Website Build Type',
    'Frontend Framework',
    'Backend Technology',
    'Database',
    'Hosting',
    'Page Count',
    'Creative Type',
    'Volume',
    'Engagement Model',
    'Brand Stage',
    'Brand Deliverables',
    'Target Audience',
    'Business Category',
    'Target Locations',
    'SEO Goals',
    'Duration',
    'App Type',
    'App Features',
    'Platform Requirements',
    'Additional Confirmed Inputs',
    'Launch Timeline',
    'Budget',
];

const normalizeProposalPreviewContent = (content = '') => {
    let normalized = normalizeMarkdownContent(content).replace(/\r/g, '');

    normalized = normalized.replace(/([^\n])\s+(#{1,6}\s+)/g, '$1\n$2');

    PROPOSAL_INLINE_FIELD_LABELS.forEach((label) => {
        const escaped = escapeRegExp(label);
        const patterns = [
            new RegExp(`([^\\n])\\s+(#{1,6}\\s*${escaped}\\s*:)`, 'gi'),
            new RegExp(`([^\\n])\\s+(\\*\\*${escaped}\\*\\*\\s*:)`, 'gi'),
            new RegExp(`([^\\n])\\s+(\\*\\*${escaped}:\\*\\*)`, 'gi'),
            new RegExp(`([^\\n])\\s+(${escaped}\\s*:)`, 'gi'),
        ];

        patterns.forEach((pattern) => {
            normalized = normalized.replace(pattern, '$1\n$2');
        });
    });

    return normalized.replace(/\n{3,}/g, '\n\n').trim();
};

const PROPOSAL_META_KEY_MAP = {
    'client name': 'clientName',
    'business name': 'businessName',
    'service type': 'serviceType',
    'launch timeline': 'launchTimeline',
    'budget': 'budget',
};

const ensureProposalSection = (sectionsMap, rawTitle = '') => {
    const title = stripMarkdownDecorators(rawTitle).replace(/:$/, '').trim() || 'Details';
    const key = normalizeProposalKey(title);

    if (!sectionsMap.has(key)) {
        sectionsMap.set(key, { key, title, lines: [], list: [] });
    }

    return sectionsMap.get(key);
};

const parseProposalContent = (content = '') => {
    const normalized = normalizeProposalPreviewContent(content);
    const lines = normalized.split('\n');
    const fields = {};
    const sectionsMap = new Map();
    let activeSection = null;

    for (const rawLine of lines) {
        let line = rawLine.trim();
        if (!line) continue;

        line = line.replace(/^#{1,6}\s*/, '').trim();
        if (!line) continue;

        const bulletMatch = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
        if (bulletMatch) {
            const bulletText = stripMarkdownDecorators(bulletMatch[1]);
            if (!activeSection) {
                activeSection = ensureProposalSection(sectionsMap, 'Details');
            }
            activeSection.list.push(bulletText);
            continue;
        }

        const keyValueMatch = line.match(/^([^:]{2,80}):\s*(.*)$/);
        if (keyValueMatch) {
            const rawKey = stripMarkdownDecorators(keyValueMatch[1]);
            const value = stripMarkdownDecorators(keyValueMatch[2] || '');
            const normalizedKey = normalizeProposalKey(rawKey);
            const metaFieldKey = PROPOSAL_META_KEY_MAP[normalizedKey];

            if (metaFieldKey && value) {
                fields[metaFieldKey] = value;
                activeSection = null;
                continue;
            }

            activeSection = ensureProposalSection(sectionsMap, rawKey);
            if (value) {
                activeSection.lines.push(value);
            }
            continue;
        }

        if (!activeSection) {
            activeSection = ensureProposalSection(sectionsMap, 'Details');
        }
        activeSection.lines.push(stripMarkdownDecorators(line));
    }

    const sections = Array.from(sectionsMap.values())
        .filter((section) => section.lines.length > 0 || section.list.length > 0)
        .sort((a, b) => {
            const aIndex = PROPOSAL_SECTION_ORDER.indexOf(a.title);
            const bIndex = PROPOSAL_SECTION_ORDER.indexOf(b.title);
            const aScore = aIndex === -1 ? 999 : aIndex;
            const bScore = bIndex === -1 ? 999 : bIndex;
            return aScore - bScore;
        });

    return {
        fields,
        sections,
        hasStructuredData: Object.keys(fields).length > 0 || sections.length > 0,
    };
};

const ProposalPreview = ({ content, isDark }) => {
    const parsed = parseProposalContent(content);

    if (!parsed.hasStructuredData) {
        return (
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                <ReactMarkdown>{normalizeProposalPreviewContent(content)}</ReactMarkdown>
            </div>
        );
    }

    const presentMetaFields = PROPOSAL_META_FIELDS.filter(({ key }) => parsed.fields[key]);

    return (
        <div className="space-y-5">
            {presentMetaFields.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {presentMetaFields.map((field) => (
                        <div
                            key={field.key}
                            className={`rounded-xl border px-4 py-3 ${isDark
                                ? 'border-white/10 bg-white/[0.03]'
                                : 'border-black/10 bg-[#faf9f5]'
                                }`}
                        >
                            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#bab59c]' : 'text-slate-500'}`}>
                                {field.label}
                            </p>
                            <p className={`mt-1 text-sm font-medium leading-relaxed ${isDark ? 'text-white' : 'text-[#181711]'}`}>
                                {parsed.fields[field.key]}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-3">
                {parsed.sections.map((section) => (
                    <div
                        key={section.key}
                        className={`rounded-xl border p-4 ${isDark
                            ? 'border-white/10 bg-white/[0.02]'
                            : 'border-black/10 bg-white'
                            }`}
                    >
                        <h4 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-primary' : 'text-[#181711]'}`}>
                            {section.title}
                        </h4>

                        {section.lines.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {section.lines.map((line, index) => (
                                    <p
                                        key={`${section.key}-line-${index}`}
                                        className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                                    >
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}

                        {section.list.length > 0 && (
                            <ul className="mt-3 space-y-2">
                                {section.list.map((item, index) => (
                                    <li key={`${section.key}-item-${index}`} className="flex items-start gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span className={`text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {item}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const GuestAIDemo = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [randomString] = useState(() => generateRandomString(20000));

    useEffect(() => {
        const handleMouseMove = (event) => {
            mouseX.set(event.clientX);
            mouseY.set(event.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [services, setServices] = useState([]);
    const [servicesError, setServicesError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [inputConfig, setInputConfig] = useState({ type: 'text', options: [] });
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [pendingOptionFollowup, setPendingOptionFollowup] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [sidebarSize, setSidebarSize] = useState(() => readStoredSidebarSize());
    const [previousChats, setPreviousChats] = useState(() => readStoredGuestSessions());
    const [generatedProposals, setGeneratedProposals] = useState(() => readStoredGeneratedProposals(user?.id));
    const [selectedProposalPreview, setSelectedProposalPreview] = useState(null);
    const [loadingHistoryId, setLoadingHistoryId] = useState(null);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const speechBaseInputRef = useRef("");
    const speechFinalRef = useRef("");
    const suppressSpeechCommitRef = useRef(false);
    const normalizedInputType = (inputConfig.type || 'text').toLowerCase();
    const isSidebarCompact = sidebarSize === 'small';
    const isMultiInput = normalizedInputType === 'multi_select'
        || normalizedInputType === 'multi_option'
        || normalizedInputType === 'grouped_multi_select';
    const hasOptionInput = Array.isArray(inputConfig.options) && inputConfig.options.length > 0;
    const shouldShowTextInput = true;
    const visiblePreviousChats = previousChats.filter((chat) => chat?.sessionId);
    const isUserLoggedIn = Boolean(isAuthenticated && user);
    const userDisplayName = user?.fullName || user?.name || "Logged-in user";
    const userDisplayEmail = user?.email || "";
    const userAvatar = user?.avatar || user?.profileImage || user?.image || "";
    const sidebarServiceDescription = truncateText(
        selectedService?.description || '',
        isSidebarCompact ? 75 : 120
    );

    const refreshPreviousChats = useCallback(() => {
        setPreviousChats(readStoredGuestSessions());
    }, []);

    const refreshGeneratedProposals = useCallback(() => {
        setGeneratedProposals(readStoredGeneratedProposals(user?.id));
    }, [user?.id]);

    const toggleSidebarSize = useCallback(() => {
        setSidebarSize((previous) => {
            const next = previous === 'small' ? 'large' : 'small';
            writeStoredSidebarSize(next);
            return next;
        });
    }, []);

    const persistCurrentSessionSummary = useCallback((history, serviceOverride = null) => {
        const activeService = serviceOverride || selectedService;
        if (!sessionId || !activeService) return;

        const list = Array.isArray(history) ? history : [];
        const nextSessions = upsertStoredGuestSession({
            sessionId,
            serviceId: activeService.slug || activeService.id || '',
            serviceName: activeService.name || 'AI Consultation',
            serviceDescription: activeService.description || '',
            preview: toPreviewText(list),
            messageCount: list.length,
            updatedAt: new Date().toISOString(),
        });
        setPreviousChats(nextSessions);
    }, [selectedService, sessionId]);

    const getScrollViewport = useCallback(() => {
        const scrollRoot = scrollRef.current;
        if (!scrollRoot) return null;

        if (scrollRoot instanceof HTMLElement && scrollRoot.dataset?.slot === 'scroll-area-viewport') {
            return scrollRoot;
        }

        if (typeof scrollRoot.querySelector === 'function') {
            return (
                scrollRoot.querySelector('[data-slot="scroll-area-viewport"]') ||
                scrollRoot.querySelector('[data-radix-scroll-area-viewport]')
            );
        }

        return null;
    }, []);

    const scrollToLatestMessage = useCallback(() => {
        const viewport = getScrollViewport();
        if (!viewport) return;
        viewport.scrollTop = viewport.scrollHeight;
    }, [getScrollViewport]);

    const focusMessageInput = useCallback(() => {
        if (!shouldShowTextInput) return;
        const field = inputRef.current;
        if (!field || field.disabled) return;

        field.focus({ preventScroll: true });
        const textLength = typeof field.value === 'string' ? field.value.length : 0;
        if (typeof field.setSelectionRange === 'function') {
            field.setSelectionRange(textLength, textLength);
        }
    }, [shouldShowTextInput]);

    const clearSpeechDraftRefs = useCallback(() => {
        speechBaseInputRef.current = "";
        speechFinalRef.current = "";
    }, []);

    const normalizeOptionToken = (value = '') =>
        String(value || '').trim().toLowerCase();

    const requiresFreeformOptionFollowup = (value = '') => {
        const normalized = normalizeOptionToken(
            stripMarkdownDecorators(String(value || '')).replace(/[—–-]/g, ' ')
        );
        return FREEFORM_FOLLOWUP_OPTION_REGEX.test(normalized);
    };

    const pendingOptionValue = String(pendingOptionFollowup?.optionValue || '').trim();
    const pendingOptionLabel = stripMarkdownDecorators(pendingOptionValue);
    const isPendingOptionFollowup = Boolean(pendingOptionValue);
    const pendingOptionNormalized = normalizeOptionToken(
        pendingOptionLabel.replace(/[—–-]/g, ' ')
    );
    const isNotSureFollowup = /\b(not sure|other|suggest|recommend|advice|help)\b/.test(pendingOptionNormalized);
    const pendingOptionNotice = isPendingOptionFollowup
        ? isNotSureFollowup
            ? "No problem. Tell me a little about what you need, and I will suggest the best fit."
            : `Got it. Tell me what you have in mind for ${pendingOptionLabel}, and I will tailor it for you.`
        : "";
    const pendingOptionPlaceholder = isPendingOptionFollowup
        ? isNotSureFollowup
            ? "Tell me a bit about what you are trying to build..."
            : `Tell me a bit more about "${pendingOptionLabel}"...`
        : "Message CATA AI...";
    const latestAssistantMessage = [...messages].reverse().find((message) => message?.role === 'assistant');
    const latestAssistantPrompt = latestAssistantMessage
        ? parseAssistantMessageLayout(latestAssistantMessage.content || '', { forceInteractiveOptions: true })
        : { questionText: '', contextText: '', options: [] };
    const recentUserContext = messages
        .filter((message) => message?.role === 'user')
        .slice(-4)
        .map((message) => parseMessageContentWithAttachments(message?.content || '', message?.attachments || []).text)
        .filter(Boolean)
        .join(' ');
    const contextualPendingOptionHelperCopy = isPendingOptionFollowup
        ? buildFreeformOptionHelperCopy({
            optionLabel: pendingOptionLabel,
            questionText: latestAssistantPrompt.questionText,
            contextText: latestAssistantPrompt.contextText,
            serviceName: selectedService?.name || '',
            historyContext: recentUserContext,
        })
        : { notice: '', placeholder: 'Message CATA AI...' };
    const contextualPendingOptionNotice = pendingOptionFollowup?.loadingAdvice
        ? "Asking AI for advice..."
        : (pendingOptionFollowup?.notice || contextualPendingOptionHelperCopy.notice || pendingOptionNotice);
    const contextualPendingOptionPlaceholder = pendingOptionFollowup?.loadingAdvice
        ? "Please wait..."
        : (pendingOptionFollowup?.placeholder || contextualPendingOptionHelperCopy.placeholder || pendingOptionPlaceholder);

    const optionIsSelected = (value = '') =>
        selectedOptions.some((selected) => normalizeOptionToken(selected) === normalizeOptionToken(value));

    const resolveConfiguredOptionValue = (optionText = '') => {
        const raw = String(optionText || '').trim();
        if (!raw) return '';

        const normalizedRaw = normalizeOptionToken(stripMarkdownDecorators(raw));
        const matched = (inputConfig.options || []).find((option) => {
            const label = typeof option === 'string' ? option : option.label;
            const value = String(typeof option === 'string' ? option : (option.value ?? option.label));
            const normalizedLabel = normalizeOptionToken(stripMarkdownDecorators(String(label || '')));
            const normalizedValue = normalizeOptionToken(stripMarkdownDecorators(value));

            return (
                normalizedRaw === normalizedLabel ||
                normalizedRaw === normalizedValue ||
                normalizedRaw.includes(normalizedLabel) ||
                normalizedLabel.includes(normalizedRaw)
            );
        });

        if (!matched) return raw;
        return String(typeof matched === 'string' ? matched : (matched.label ?? matched.value ?? raw));
    };

    const isOptionSelectedByText = (optionText = '') => {
        const resolvedValue = resolveConfiguredOptionValue(optionText);
        if (optionIsSelected(resolvedValue)) return true;
        return isPendingOptionFollowup
            && normalizeOptionToken(pendingOptionValue) === normalizeOptionToken(resolvedValue);
    };

    const fetchOptionAdvice = async (optionValue) => {
        try {
            const contextText = messages
                .filter((msg) => msg?.role === 'user')
                .slice(-4)
                .map((msg) => msg?.content)
                .join(' ');
            const currentQ = latestAssistantPrompt.questionText;

            const response = await request('/guest/advice', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    serviceId: selectedService?.slug || selectedService?.id,
                    option: optionValue,
                    context: contextText,
                    currentQuestion: currentQ
                })
            });
            const data = unwrapPayload(response);
            setPendingOptionFollowup((current) => {
                if (current?.optionValue !== optionValue) return current;
                return {
                    ...current,
                    loadingAdvice: false,
                    notice: data?.notice || `Got it. ${stripMarkdownDecorators(optionValue)}.`,
                    placeholder: data?.placeholder || 'Tell me a bit more...'
                };
            });
        } catch (err) {
            setPendingOptionFollowup((current) => {
                if (current?.optionValue !== optionValue) return current;
                return { ...current, loadingAdvice: false };
            });
        }
    };

    const handleChatOptionClick = (optionText = '') => {
        const resolvedValue = resolveConfiguredOptionValue(optionText);
        if (!resolvedValue) return;

        const needsFreeformFollowup = requiresFreeformOptionFollowup(resolvedValue);

        if (isMultiInput) {
            const alreadySelected = optionIsSelected(resolvedValue);
            setSelectedOptions((prev) => {
                const alreadyChosen = prev.some(
                    (v) => normalizeOptionToken(v) === normalizeOptionToken(resolvedValue)
                );
                if (alreadyChosen) {
                    return prev.filter(
                        (v) => normalizeOptionToken(v) !== normalizeOptionToken(resolvedValue)
                    );
                }
                return [...prev, resolvedValue];
            });

            if (needsFreeformFollowup) {
                if (alreadySelected) {
                    setPendingOptionFollowup((current) => (
                        normalizeOptionToken(current?.optionValue || '') === normalizeOptionToken(resolvedValue)
                            ? null
                            : current
                    ));
                } else {
                    setPendingOptionFollowup({ optionValue: resolvedValue, loadingAdvice: true });
                    setInput('');
                    fetchOptionAdvice(resolvedValue);
                    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                        window.requestAnimationFrame(() => focusMessageInput());
                    }
                }
            }
            return;
        }

        if (needsFreeformFollowup) {
            setSelectedOptions([resolvedValue]);
            setPendingOptionFollowup({ optionValue: resolvedValue, loadingAdvice: true });
            setInput('');
            fetchOptionAdvice(resolvedValue);
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(() => focusMessageInput());
            }
            return;
        }

        setPendingOptionFollowup(null);
        setSelectedOptions([]);
        handleSendMessage(null, resolvedValue, { ignorePendingOptionFollowup: true });
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, []);

    useEffect(() => {
        refreshPreviousChats();
    }, [refreshPreviousChats]);

    useEffect(() => {
        refreshGeneratedProposals();
    }, [refreshGeneratedProposals]);

    useEffect(() => {
        const latestProposalMessage = [...messages]
            .reverse()
            .find((message) => message?.role === 'assistant' && isProposalMessage(message?.content || ''));

        if (!latestProposalMessage?.content) return;

        const nextProposals = upsertStoredGeneratedProposal(latestProposalMessage.content, user?.id);
        setGeneratedProposals(nextProposals);
    }, [messages, user?.id]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

        const viewport = getScrollViewport();
        if (viewport) {
            viewport.scrollTop = 0;
        }
    }, [selectedService, getScrollViewport]);

    useEffect(() => {
        if (!sessionId || !selectedService || messages.length === 0) return;
        persistCurrentSessionSummary(messages);
    }, [messages, persistCurrentSessionSummary, selectedService, sessionId]);

    useEffect(() => {
        const rafId = window.requestAnimationFrame(() => {
            scrollToLatestMessage();
        });
        return () => window.cancelAnimationFrame(rafId);
    }, [messages, isTyping, inputConfig, selectedService, scrollToLatestMessage]);

    useEffect(() => {
        if (!isTyping && shouldShowTextInput) {
            const rafId = window.requestAnimationFrame(() => {
                focusMessageInput();
            });
            const timeoutId = window.setTimeout(() => {
                focusMessageInput();
            }, 120);

            return () => {
                window.cancelAnimationFrame(rafId);
                window.clearTimeout(timeoutId);
            };
        }

        return undefined;
    }, [messages, isTyping, shouldShowTextInput, inputConfig, selectedService, focusMessageInput]);

    useEffect(() => {
        setSelectedOptions([]);
    }, [inputConfig.type, inputConfig.options]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSpeechSupported(false);
            recognitionRef.current = null;
            return undefined;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = navigator.language || 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            if (suppressSpeechCommitRef.current) {
                return;
            }

            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                const transcript = result?.[0]?.transcript || '';
                if (result.isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                speechFinalRef.current = [speechFinalRef.current, finalTranscript]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
            }

            setInput(
                appendSpeechTranscript(
                    speechBaseInputRef.current,
                    speechFinalRef.current,
                    interimTranscript
                )
            );
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            const error = event?.error;
            if (suppressSpeechCommitRef.current) {
                suppressSpeechCommitRef.current = false;
                clearSpeechDraftRefs();
                return;
            }
            if (error === 'not-allowed' || error === 'service-not-allowed') {
                toast.error('Microphone access is blocked. Please allow microphone access in your browser settings.');
                return;
            }
            if (error === 'audio-capture') {
                toast.error('No microphone detected. Please connect a microphone and try again.');
                return;
            }
            if (error === 'no-speech') {
                toast.info('No speech detected. Please try again.');
                return;
            }
            if (error === 'aborted') {
                return;
            }
            toast.error('Unable to use voice input right now.');
        };

        recognition.onend = () => {
            setIsListening(false);
            if (suppressSpeechCommitRef.current) {
                suppressSpeechCommitRef.current = false;
                clearSpeechDraftRefs();
                return;
            }
            setInput(
                appendSpeechTranscript(
                    speechBaseInputRef.current,
                    speechFinalRef.current,
                    ''
                )
            );
        };

        recognitionRef.current = recognition;
        setIsSpeechSupported(true);

        return () => {
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            try {
                recognition.stop();
            } catch {
                // Ignore cleanup errors from browser speech API quirks.
            }
            recognitionRef.current = null;
        };
    }, [clearSpeechDraftRefs]);

    const toggleVoiceInput = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition || !isSpeechSupported) {
            toast.error("Voice input isn't supported in this browser.");
            return;
        }

        if (isTyping) return;

        if (isListening) {
            try {
                recognition.stop();
            } catch {
                // Ignore stop errors; onend/onerror handlers reset UI state.
            }
            return;
        }

        suppressSpeechCommitRef.current = false;
        speechBaseInputRef.current = input;
        speechFinalRef.current = '';

        try {
            recognition.start();
        } catch (error) {
            const isInvalidState = error?.name === 'InvalidStateError' || /already started/i.test(error?.message || '');
            if (isInvalidState) {
                try {
                    recognition.stop();
                } catch {
                    // Ignore stop fallback errors.
                }
            }
            toast.error('Unable to start voice input.');
        }
    }, [input, isListening, isSpeechSupported, isTyping]);

    const isAllowedUploadFile = useCallback((file) => {
        if (!file) return false;
        if (file.type?.startsWith('image/')) return true;
        if (ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) return true;

        const name = String(file.name || '').toLowerCase();
        return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));
    }, []);

    const handleAttachmentPick = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length === 0) return;

        const nextValidFiles = [];
        files.forEach((file) => {
            if (!isAllowedUploadFile(file)) {
                toast.error(`Unsupported file type: ${file.name}`);
                return;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                toast.error(`"${file.name}" is larger than 10 MB.`);
                return;
            }
            nextValidFiles.push(file);
        });

        if (nextValidFiles.length === 0) return;

        setPendingAttachments((prev) => {
            const dedup = [...prev];
            nextValidFiles.forEach((file) => {
                const exists = dedup.some((item) => (
                    item.name === file.name
                    && item.size === file.size
                    && item.lastModified === file.lastModified
                ));
                if (!exists) dedup.push(file);
            });
            return dedup.slice(0, 5);
        });
    };

    const openAttachmentPicker = () => {
        if (isTyping) return;
        attachmentInputRef.current?.click();
    };

    const removePendingAttachment = (index) => {
        setPendingAttachments((prev) => prev.filter((_, idx) => idx !== index));
    };

    const uploadGuestAttachment = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const activeSession = getSession();
        const headers = activeSession?.accessToken
            ? { Authorization: `Bearer ${activeSession.accessToken}` }
            : {};

        const response = await fetch(`${API_BASE_URL}/upload/chat`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            const message = payload?.error?.message || payload?.message || 'Failed to upload attachment';
            throw new Error(message);
        }

        const data = unwrapPayload(payload);
        if (!data?.url) {
            throw new Error('Attachment upload did not return a URL');
        }

        return {
            name: data.name || file.name || 'Attachment',
            type: data.type || file.type || '',
            size: Number(data.size || file.size || 0),
            url: data.url,
        };
    }, []);

    const fetchServices = async () => {
        try {
            setServicesError("");
            const response = await request('/ai/services', {
                method: 'GET',
                cache: 'no-store',
            });
            const normalizedServices = extractServices(response);
            if (normalizedServices.length > 0) {
                setServices(normalizedServices);
            } else {
                console.warn('[GuestAIDemo] Services payload had no rows:', response);
                setServices([]);
                setServicesError("No services are available right now.");
            }
        } catch (error) {
            console.error('[GuestAIDemo] Failed to load services:', error);
            setServices([]);
            setServicesError(error?.message || "Failed to load services");
            toast.error(error?.message || "Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadPreviousChat = async (chatMeta) => {
        if (!chatMeta?.sessionId) return;
        const fallbackServiceId = chatMeta.serviceId || chatMeta.sessionId;
        const serviceMatch = services.find((service) => (
            service.slug === chatMeta.serviceId
            || service.id === chatMeta.serviceId
            || service.name === chatMeta.serviceName
        ));
        const resolvedService = serviceMatch || {
            id: fallbackServiceId,
            slug: fallbackServiceId,
            name: chatMeta.serviceName || 'AI Consultation',
            description: chatMeta.serviceDescription || '',
        };

        setSelectedService(resolvedService);
        setLoading(true);
        setLoadingHistoryId(chatMeta.sessionId);
        setInput('');
        setPendingAttachments([]);
        setSelectedOptions([]);
        setPendingOptionFollowup(null);
        setMessages([]);
        setInputConfig({ type: 'text', options: [] });

        try {
            const response = await request(`/guest/history/${chatMeta.sessionId}`, {
                method: 'GET',
                timeout: 120000,
                cache: 'no-store',
            });
            const data = unwrapPayload(response);
            const restored = Array.isArray(data?.messages)
                ? data.messages.map((message) => ({
                    role: message.role,
                    content: message.content,
                }))
                : [];

            setSessionId(chatMeta.sessionId);
            setInputConfig(data?.inputConfig || { type: 'text', options: [] });
            if (restored.length > 0) {
                setMessages(restored);
            } else {
                setMessages([{
                    role: 'assistant',
                    content: 'Welcome back. Continue with your requirement and I will assist you.',
                }]);
            }
        } catch (error) {
            console.error('[GuestAIDemo] Failed to load previous chat:', error);
            if (/session not found/i.test(String(error?.message || ''))) {
                const filtered = readStoredGuestSessions().filter((item) => item.sessionId !== chatMeta.sessionId);
                writeStoredGuestSessions(filtered);
                setPreviousChats(filtered);
            }
            toast.error(error?.message || 'Failed to load previous chat');
        } finally {
            setLoadingHistoryId(null);
            setLoading(false);
        }
    };

    const handleServiceSelect = async (service) => {
        setSelectedService(service);
        setLoading(true);
        setInput('');
        setPendingAttachments([]);
        setSelectedOptions([]);
        setPendingOptionFollowup(null);
        try {
            const response = await request('/guest/start', {
                method: 'POST',
                timeout: 120000,
                body: JSON.stringify({ serviceId: service.slug || service.id })
            });
            const data = unwrapPayload(response);

            if (data?.sessionId) {
                setSessionId(data.sessionId);
                if (Array.isArray(data.history) && data.history.length > 0) {
                    setMessages(data.history);
                } else {
                    const initialHistory = [
                        {
                            role: "assistant",
                            content: data.message || `Hello! I see you're interested in **${service.name}**.`
                        }
                    ];
                    setMessages(initialHistory);
                }
                setInputConfig(data.inputConfig || { type: 'text', options: [] });
            } else {
                console.warn('[GuestAIDemo] Unexpected start payload:', response);
                throw new Error('Failed to start chat session');
            }
        } catch (error) {
            console.error('[GuestAIDemo] Failed to start chat session:', error);
            toast.error(error?.message || "Failed to start chat session");
            setSelectedService(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e, forcedContent = null, options = {}) => {
        if (e) e.preventDefault();
        const ignorePendingOptionFollowup = Boolean(options?.ignorePendingOptionFollowup);
        let contentToSend = forcedContent ?? input;

        if (!ignorePendingOptionFollowup && pendingOptionValue) {
            const detailText = String(input || '').trim();
            if (!detailText) {
                toast.info(`Add a short detail for "${pendingOptionLabel}" before sending.`);
                focusMessageInput();
                return;
            }

            if (Array.isArray(contentToSend)) {
                const mergedSelections = contentToSend
                    .filter(Boolean)
                    .map(String)
                    .filter((value) => normalizeOptionToken(value) !== normalizeOptionToken(pendingOptionValue));

                contentToSend = [...mergedSelections, detailText];
            } else {
                contentToSend = detailText;
            }
        }

        const isArrayPayload = Array.isArray(contentToSend);
        const normalizedArray = isArrayPayload
            ? contentToSend.filter(Boolean).map(String)
            : [];
        const textPayload = isArrayPayload
            ? normalizedArray.join(', ')
            : String(contentToSend ?? '');
        const trimmedTextPayload = textPayload.trim();
        const hasAttachments = pendingAttachments.length > 0;

        if ((!trimmedTextPayload && !hasAttachments) || !sessionId || isTyping || isUploadingAttachment) return;
        if (isArrayPayload && normalizedArray.length === 0 && !hasAttachments) return;

        if (isListening && recognitionRef.current) {
            suppressSpeechCommitRef.current = true;
            clearSpeechDraftRefs();
            try {
                recognitionRef.current.stop();
            } catch {
                // Ignore stop errors before sending.
            }
        }

        try {
            setIsTyping(true);
            setIsUploadingAttachment(hasAttachments);

            const uploadedAttachments = hasAttachments
                ? await Promise.all(pendingAttachments.map((file) => uploadGuestAttachment(file)))
                : [];

            const serializedAttachments = uploadedAttachments.map((attachment) => buildAttachmentToken(attachment));
            const composedContent = [trimmedTextPayload, serializedAttachments.join('\n')]
                .filter(Boolean)
                .join('\n')
                .trim();

            const userMsg = { role: 'user', content: composedContent };
            setMessages((prev) => [...prev, userMsg]);
            setInput("");
            clearSpeechDraftRefs();
            setPendingAttachments([]);
            setInputConfig({ type: 'text', options: [] });
            setSelectedOptions([]);
            setPendingOptionFollowup(null);

            const response = await request('/guest/chat', {
                method: 'POST',
                timeout: 120000,
                body: JSON.stringify({
                    sessionId,
                    message: isArrayPayload && serializedAttachments.length === 0
                        ? normalizedArray
                        : composedContent
                })
            });
            const data = unwrapPayload(response);
            const responseServiceId = data?.serviceMeta?.serviceId || '';
            const responseServiceName = data?.serviceMeta?.serviceName || '';
            let activeService = selectedService;

            if (responseServiceId || responseServiceName) {
                const matchedService = services.find((service) => {
                    const slug = service?.slug || service?.id || '';
                    return slug === responseServiceId;
                });
                activeService = matchedService || {
                    ...(selectedService || {}),
                    slug: responseServiceId || selectedService?.slug || selectedService?.id || '',
                    id: responseServiceId || selectedService?.id || selectedService?.slug || '',
                    name: responseServiceName || selectedService?.name || 'AI Consultation',
                    description: matchedService?.description || selectedService?.description || '',
                };
                setSelectedService(activeService);
            }

            if (data?.history) {
                setMessages(data.history);
                persistCurrentSessionSummary(data.history, activeService);
            } else if (typeof data?.message === 'string' && data.message.trim()) {
                const aiMsg = { role: 'assistant', content: data.message };
                setMessages(prev => [...prev, aiMsg]);
                persistCurrentSessionSummary([...messages, userMsg, aiMsg], activeService);
            } else {
                console.warn('[GuestAIDemo] Unexpected chat payload:', response);
            }

            if (data?.inputConfig) {
                setInputConfig(data.inputConfig);
            }
        } catch (error) {
            console.error('[GuestAIDemo] Failed to send message:', error);
            toast.error(error?.message || "Failed to send message");
        } finally {
            setIsTyping(false);
            setIsUploadingAttachment(false);
        }
    };

    const handleProceed = (proposalContent) => {
        const nextProposals = upsertStoredGeneratedProposal(proposalContent, user?.id);
        setGeneratedProposals(nextProposals);

        if (user) {
            toast.success("Proposal saved! Redirecting to dashboard...");
            navigate(CLIENT_DASHBOARD_SEND_PROPOSAL_PATH);
        } else {
            toast.success("Proposal saved! Please create an account to continue.");
            navigate("/signup?role=client", {
                state: {
                    redirectTo: CLIENT_DASHBOARD_SEND_PROPOSAL_PATH,
                    fromProposal: true,
                },
            });
        }
    };

    const handleBackToServices = () => {
        setSelectedService(null);
        setSessionId(null);
        setMessages([]);
        setInput('');
        setPendingAttachments([]);
        setSelectedOptions([]);
        setPendingOptionFollowup(null);
        setInputConfig({ type: 'text', options: [] });
    };

    const handleOpenProposalPreview = (proposal) => {
        if (!proposal?.content) {
            toast.error('Proposal details are not available for this card.');
            return;
        }
        setSelectedProposalPreview(proposal);
    };

    const handleCloseProposalPreview = () => {
        setSelectedProposalPreview(null);
    };

    const handleDeletePreviousChat = (event, chatMeta) => {
        event.preventDefault();
        event.stopPropagation();

        const targetSessionId = chatMeta?.sessionId;
        if (!targetSessionId) return;

        const nextSessions = removeStoredGuestSession(targetSessionId);
        setPreviousChats(nextSessions);

        if (targetSessionId === sessionId) {
            if (selectedService) {
                handleServiceSelect(selectedService);
            } else {
                handleBackToServices();
            }
        }

        toast.success('Chat removed');
    };

    if (loading && !selectedService) {
        return (
            <>
                <Navbar />
                <div className="flex min-h-screen items-center justify-center bg-background px-4 pb-10 pt-28">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className={isDark ? 'text-sm text-slate-300' : 'text-sm text-slate-600'}>
                            Loading AI workspace...
                        </p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!selectedService) {
        return (
            <>
                <Navbar />
                <main className="relative min-h-screen bg-background text-foreground overflow-hidden transition-colors pt-28 pb-10">
                    {/* Matrix Background Layer - Fixed to cover whole screen */}
                    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                        <MatrixPattern
                            mouseX={mouseX}
                            mouseY={mouseY}
                            randomString={randomString}
                        />
                    </div>

                    <div className="relative z-10 max-w-[90rem] mx-auto px-6 py-8">
                        <div className="text-center space-y-2 relative z-10 mb-10">
                            <span className="inline-block px-6 py-2 text-3xl uppercase tracking-[0.4em] bg-background text-primary rounded-full font-semibold shadow-md border border-white/10">
                                Services
                            </span>
                            <h2 className="text-3xl font-semibold text-white">
                                Clarity across every step of the freelance lifecycle.
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                            {services.length === 0 ? (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-5 text-center text-white/60 py-10">
                                    {servicesError || "No services available."}
                                </div>
                            ) : (
                                services.map((feature, index) => (
                                    <div
                                        key={feature.id || index}
                                        onClick={() => handleServiceSelect(feature)}
                                        className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer h-full border-white/20 bg-black shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)] hover:border-[#ffc800]/50 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2`}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                        <div className="flex flex-col h-full p-5 relative z-10">
                                            <div className="h-32 w-full flex items-center justify-center mb-3 relative">
                                                <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-40 h-40 bg-[#ffc800]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                <img
                                                    src={resolveServiceLogoSrc(feature)}
                                                    alt={feature.title || feature.name}
                                                    className="w-24 h-24 object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500 ease-out"
                                                />
                                            </div>

                                            <div className="flex flex-col grow items-center text-center">
                                                <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#ffc800] transition-colors duration-300">
                                                    {feature.title || feature.name}
                                                </h3>

                                                <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-4 line-clamp-3 group-hover:text-zinc-300 transition-colors">
                                                    {feature.description}
                                                </p>

                                                <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-4 w-full text-left">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                                            Starting at
                                                        </p>
                                                        <p className="text-white text-lg font-bold group-hover:text-[#ffc800] transition-colors duration-300">
                                                            {feature.price || (feature.min_budget ? `₹${feature.min_budget.toLocaleString('en-IN')}/-` : '₹10,000/-')}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white group-hover:border-[#ffc800] group-hover:text-[#ffc800] group-hover:bg-[#ffc800]/10 transition-colors duration-300">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* WHY CATALANCE AI */}
                        <div className="relative z-10 mt-24">
                            <div className="text-center mb-12">
                                <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffc800] mb-3">Our Edge</p>
                                <h2 className="text-4xl font-bold text-white">Why Catalance AI?</h2>
                                <p className="text-zinc-400 mt-3 text-base max-w-xl mx-auto">We&apos;ve reimagined how businesses discover and hire freelance talent.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[
                                    { icon: '⚡', title: 'Instant Qualification', desc: 'AI filters your requirements in real-time — no back-and-forth emails, no wasted calls.', gradient: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/20' },
                                    { icon: '🔒', title: 'Verified Professionals', desc: 'Every freelancer is vetted with portfolio review, skill assessments, and client references.', gradient: 'from-blue-500/10 to-indigo-500/5', border: 'border-blue-500/20' },
                                    { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees. Budgets are defined upfront in your AI-generated proposal.', gradient: 'from-green-500/10 to-emerald-500/5', border: 'border-green-500/20' },
                                    { icon: '📈', title: 'Scope-Driven Matching', desc: 'Your project scope drives freelancer matching — we connect you with specialists.', gradient: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/20' },
                                    { icon: '🕐', title: 'Save Hours of Discovery', desc: 'CATA AI compresses the entire discovery and briefing phase into minutes.', gradient: 'from-rose-500/10 to-pink-500/5', border: 'border-rose-500/20' },
                                    { icon: '🌐', title: 'Multi-Service Support', desc: 'From SEO to app dev, branding to CRM — one platform, one AI, unlimited combinations.', gradient: 'from-cyan-500/10 to-teal-500/5', border: 'border-cyan-500/20' },
                                ].map((card, i) => (
                                    <div key={i} className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-6 hover:scale-[1.02] transition-transform duration-300 group`}>
                                        <div className="text-3xl mb-4">{card.icon}</div>
                                        <h3 className="text-white font-bold text-base mb-2">{card.title}</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed">{card.desc}</p>
                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 bg-white group-hover:opacity-30 transition-opacity duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STATS BAR */}
                        <div className="relative z-10 mt-24">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                                {[
                                    { value: '500+', label: 'Verified Freelancers' },
                                    { value: '1,200+', label: 'Projects Delivered' },
                                    { value: '4.9★', label: 'Average Client Rating' },
                                    { value: '15+', label: 'Service Categories' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-4xl font-extrabold text-[#ffc800] tracking-tight">{stat.value}</span>
                                        <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="relative z-10 mt-14 mb-8 text-center space-y-4">
                            <h3 className="text-2xl font-bold text-white">Ready to get started?</h3>
                            <p className="text-zinc-400 text-sm max-w-md mx-auto">Pick a service above, chat with CATA AI, and receive a professional proposal — completely free.</p>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#ffc800] text-black font-bold text-sm hover:bg-[#ffd740] transition-colors shadow-[0_8px_30px_-8px_rgba(255,200,0,0.6)]">
                                Choose a Service
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const isInitialScreen = messages.length > 0 && !messages.some(msg => msg.role === 'user');

    const renderChatInput = () => {
        if (!shouldShowTextInput) return null;

        return (
            <form
                onSubmit={handleSendMessage}
                className={`rounded-3xl border p-2.5 shadow-md backdrop-blur-xl ${isDark
                    ? 'border-white/10 bg-[#2F2F2F]'
                    : 'border-slate-200 bg-[#F4F4F4]'
                    }`}
            >
                {isPendingOptionFollowup && (
                    <div className={`mb-3 flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm ${isDark
                        ? 'bg-white/5 text-slate-200'
                        : 'bg-black/5 text-slate-700'
                        }`}>
                        <p className="min-w-0 flex-1">
                            {contextualPendingOptionNotice}
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 shrink-0 rounded-full hover:bg-black/10`}
                            onClick={() => {
                                setPendingOptionFollowup(null);
                                setSelectedOptions([]);
                                setInput('');
                            }}
                            aria-label="Clear selected special option"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {pendingAttachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2 px-2 pt-1">
                        {pendingAttachments.map((file, index) => {
                            const imageFile = String(file.type || '').startsWith('image/');
                            return (
                                <div
                                    key={`${file.name}-${file.size}-${index}`}
                                    className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${isDark
                                        ? 'border-white/10 bg-[#212121] text-slate-200'
                                        : 'border-slate-300 bg-white text-slate-700'
                                        }`}
                                >
                                    {imageFile ? (
                                        <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    ) : (
                                        <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    )}
                                    <span className="max-w-[190px] truncate font-medium">{file.name}</span>
                                    <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {formatBytes(file.size)}
                                    </span>
                                    <button
                                        type="button"
                                        className={`rounded-full p-0.5 ml-1 ${isDark ? 'hover:bg-white/15' : 'hover:bg-slate-100'}`}
                                        onClick={() => removePendingAttachment(index)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <div className="flex flex-1 items-center bg-transparent">
                        <div className="flex flex-col flex-1">
                            <textarea
                                ref={inputRef}
                                autoFocus
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim() || pendingAttachments.length > 0) {
                                            handleSendMessage(e);
                                        }
                                    }
                                }}
                                rows={1}
                                placeholder={contextualPendingOptionPlaceholder}
                                className={`max-h-[120px] min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-base outline-none ${isDark
                                    ? 'text-white placeholder:text-slate-400'
                                    : 'text-slate-900 placeholder:text-slate-500'
                                    }`}
                                disabled={isTyping || isUploadingAttachment}
                                style={{ overflowY: 'auto' }}
                            />
                        </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-1.5 px-2 pb-1.5">
                        <input
                            ref={attachmentInputRef}
                            type="file"
                            multiple
                            accept={CHAT_FILE_ACCEPT}
                            className="hidden"
                            onChange={handleAttachmentPick}
                        />
                        <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={openAttachmentPicker}
                            disabled={isTyping || isUploadingAttachment}
                            className={`h-9 w-9 rounded-full ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-black/5 text-slate-600'}`}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        {isSpeechSupported && (
                            <Button
                                size="icon"
                                type="button"
                                variant="ghost"
                                onClick={toggleVoiceInput}
                                disabled={isTyping || isUploadingAttachment}
                                className={`h-9 w-9 rounded-full ${isListening ? 'bg-primary/20 text-primary animate-pulse' : isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-black/5 text-slate-600'}`}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                        )}
                        <Button
                            size="icon"
                            type="submit"
                            disabled={((!input.trim() && pendingAttachments.length === 0) || (isPendingOptionFollowup && !input.trim())) || isTyping || isUploadingAttachment}
                            className={`h-9 w-9 rounded-full transition-colors ${
                                input.trim() || pendingAttachments.length > 0
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                                    : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-400'
                            }`}
                        >
                            <Send className="h-4 w-4 shrink-0" />
                        </Button>
                    </div>
                </div>
                {isUploadingAttachment && (
                    <p className={`mt-1 pl-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Uploading attachment...
                    </p>
                )}
            </form>
        );
    };

    return (
        <div className="mt-16 flex h-[calc(100svh-4rem)] overflow-hidden bg-background lg:mt-20 lg:h-[calc(100svh-5rem)]">
            <aside className={`hidden shrink-0 overflow-hidden p-3 transition-all duration-300 md:flex md:flex-col ${isSidebarCompact ? 'w-16 items-center' : 'w-72'} ${isDark ? 'bg-[#171717]' : 'bg-[#F9F9F9]'}`}>
                <div className={`mb-3 flex items-center gap-2 ${isSidebarCompact ? 'flex-col justify-center' : 'justify-between'}`}>
                    {!isSidebarCompact && (
                        <Button
                            variant="ghost"
                            className={`w-fit rounded-full px-2.5 text-sm ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                            onClick={handleBackToServices}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to services
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarSize}
                        className={`h-8 w-8 rounded-lg border shrink-0 ${isDark ? 'border-white/15 text-slate-200 hover:bg-white/10' : 'border-black/10 text-slate-700 hover:bg-slate-100'}`}
                        title={isSidebarCompact ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={isSidebarCompact ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCompact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                <div className={`relative mb-3 overflow-hidden rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-black/5'} ${isSidebarCompact ? 'flex justify-center' : ''}`}>
                    <div className={`relative flex items-start gap-3 ${isSidebarCompact ? 'flex-col items-center' : ''}`}>
                        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border ${isDark ? 'border-amber-300/30 bg-amber-300/15 shadow-[0_0_12px_-3px_rgba(251,191,36,0.4)]' : 'border-amber-300/50 bg-amber-100'} ${isSidebarCompact ? 'h-9 w-9' : 'h-12 w-12'}`}>
                            <img src={cataLogo} alt="CATA AI logo" className={`${isSidebarCompact ? 'h-5 w-5' : 'h-7 w-7'} object-contain`} />
                        </div>
                        {!isSidebarCompact && (
                            <div className="min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>
                                    AI Assistant
                                </p>
                                <h2 className={`mt-0.5 truncate text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {selectedService.name}
                                </h2>
                                <p className={`mt-1 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {sidebarServiceDescription || 'Guided consultation'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {!isSidebarCompact && (
                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex min-h-0 flex-[1.05] flex-col p-2">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'bg-primary/15 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                <Sparkles className="h-3 w-3" />
                                Proposals
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'border border-white/15 bg-white/10 text-slate-300' : 'border border-black/10 bg-black/5 text-slate-600'}`}>
                                {generatedProposals.length}
                            </span>
                        </div>
                        {generatedProposals.length === 0 ? (
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                No proposals generated yet.
                            </p>
                        ) : (
                            <ScrollArea className="-mr-1 min-h-0 flex-1 pr-1">
                                <div className="space-y-2 pb-1">
                                    {generatedProposals.map((proposal, index) => (
                                        <button
                                            key={proposal.id || `${proposal.projectTitle || 'proposal'}-${index}`}
                                            type="button"
                                            onClick={() => handleOpenProposalPreview(proposal)}
                                            className={`group w-full rounded-lg px-3 py-2 text-left transition-colors duration-200 ${isDark
                                                ? 'hover:bg-white/10'
                                                : 'hover:bg-black/5'
                                                }`}
                                            title="Open proposal details"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`truncate text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {proposal.service || selectedService?.name || 'Proposal'}
                                                </p>
                                                <span className={`shrink-0 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {formatPreviousChatTime(proposal.updatedAt || proposal.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`mt-1 truncate ${isSidebarCompact ? 'text-xs' : 'text-sm'} font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                {proposal.projectTitle || 'AI Generated Proposal'}
                                            </p>
                                            {(proposal.budget || proposal.timeline) && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {proposal.budget && (
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${isDark ? 'border-white/15 text-slate-300' : 'border-black/10 text-slate-600'}`}>
                                                            {proposal.budget}
                                                        </span>
                                                    )}
                                                    {proposal.timeline && (
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${isDark ? 'border-white/15 text-slate-300' : 'border-black/10 text-slate-600'}`}>
                                                            {proposal.timeline}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <div className={`flex min-h-0 flex-1 flex-col mt-2 ${isSidebarCompact ? 'p-1' : 'p-2'}`}>
                        <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            <History className="h-3 w-3" />
                            Previous chats
                        </div>
                        {visiblePreviousChats.length === 0 ? (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                No previous chats yet.
                            </p>
                        ) : (
                            <ScrollArea className="-mr-1 min-h-0 flex-1 pr-1">
                                <div className="space-y-1.5 pb-1 pr-3">
                                    {visiblePreviousChats.map((chat) => {
                                        const isCurrent = chat.sessionId === sessionId;
                                        const isLoadingHistory = loadingHistoryId === chat.sessionId;
                                        const compactPreview = [chat.serviceName || selectedService.name, chat.preview]
                                            .filter(Boolean)
                                            .join(' - ');

                                        return (
                                            <div
                                                key={chat.sessionId}
                                                className={`group relative overflow-hidden rounded-lg transition-colors duration-200 ${isCurrent
                                                    ? isDark
                                                        ? 'bg-white/10'
                                                        : 'bg-black/10'
                                                    : isDark
                                                        ? 'hover:bg-white/5'
                                                        : 'hover:bg-black/5'
                                                    }`}
                                            >
                                                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleLoadPreviousChat(chat)}
                                                        disabled={isLoadingHistory || isCurrent}
                                                        className={`min-w-0 rounded-md text-left outline-none ${isCurrent ? 'cursor-default' : ''}`}
                                                    >
                                                        <p className={`truncate ${isSidebarCompact ? 'text-[11px]' : 'text-xs'} font-medium transition-colors ${isCurrent ? (isDark ? 'text-amber-300' : 'text-amber-700') : (isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}`}>
                                                            {compactPreview || 'No preview available'}
                                                        </p>
                                                    </button>
                                                    <span className={`shrink-0 text-[10px] font-medium transition-colors ${isCurrent ? (isDark ? 'text-amber-300/60' : 'text-amber-700/60') : (isDark ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-500')}`}>
                                                        {isLoadingHistory ? 'Loading...' : formatPreviousChatTime(chat.updatedAt)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleDeletePreviousChat(event, chat)}
                                                        disabled={isLoadingHistory}
                                                        className={`relative z-30 shrink-0 rounded-lg p-1.5 opacity-0 transition-all focus-visible:opacity-100 group-hover:opacity-100 ${isDark
                                                            ? 'text-slate-500 hover:bg-red-500/20 hover:text-red-400'
                                                            : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                                                            }`}
                                                        aria-label="Delete previous chat"
                                                        title="Delete chat"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
                )}

                <div className={`mt-auto shrink-0 overflow-hidden ${isSidebarCompact ? 'p-1 flex flex-col items-center' : 'p-3'}`}>
                    {isAuthLoading ? (
                        <div className="flex items-center justify-center">
                            <span className={`h-2.5 w-2.5 animate-pulse rounded-full ${isDark ? 'bg-amber-400/50' : 'bg-amber-500/50'}`} />
                            {!isSidebarCompact && <p className={`ml-2 text-xs font-medium ${isDark ? 'text-amber-200/50' : 'text-amber-700/60'}`}>Checking status...</p>}
                        </div>
                    ) : isUserLoggedIn ? (
                        <div className={isSidebarCompact ? 'flex flex-col items-center gap-2' : ''}>
                            <div className={`flex items-center gap-3 ${isSidebarCompact ? 'justify-center' : ''}`}>
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${isDark ? 'border-[#ffc800]/20 bg-black' : 'border-amber-200 bg-white'}`}>
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={userDisplayName} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className={`h-4 w-4 ${isDark ? 'text-[#ffc800]' : 'text-amber-600'}`} />
                                    )}
                                </div>
                                {!isSidebarCompact && (
                                    <div className="min-w-0">
                                        <p className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            {userDisplayName}
                                        </p>
                                        <p className={`truncate text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                            {userDisplayEmail || 'Authenticated user'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {!isSidebarCompact && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => navigate('/login', { state: { redirectTo: '/ai-demo' } })}
                                    className={`mt-3 w-full h-8 rounded-lg text-xs font-medium transition-colors ${isDark
                                        ? 'bg-white/[0.05] text-white hover:bg-white/[0.1]'
                                        : 'bg-black/5 text-slate-700 hover:bg-black/10'
                                        }`}
                                >
                                    <LogIn className="mr-2 h-3.5 w-3.5" />
                                    Switch account
                                </Button>
                            )}
                        </div>
                    ) : isSidebarCompact ? (
                        <Button
                            type="button"
                            size="icon"
                            onClick={() => navigate('/login', { state: { redirectTo: '/ai-demo' } })}
                            className={`h-10 w-10 rounded-xl font-bold ${isDark ? 'bg-[#ffc800] text-black hover:bg-[#ffc800]/90' : 'bg-amber-400 text-amber-950 hover:bg-amber-500'}`}
                        >
                            <LogIn className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => navigate('/login', { state: { redirectTo: '/ai-demo' } })}
                            className={`w-full h-10 rounded-xl font-bold shadow-none transition-all ${isDark ? 'bg-[#ffc800] text-black hover:bg-[#ffc800]/90 hover:shadow-[0_0_15px_-3px_rgba(255,200,0,0.4)]' : 'bg-amber-400 text-amber-950 hover:bg-amber-500'}`}
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Login to save progress
                        </Button>
                    )}
                </div>
            </aside>

            <section className={`relative flex min-w-0 flex-1 flex-col pt-3 bg-transparent ${isInitialScreen ? 'justify-center items-center' : ''}`}>

                <ScrollArea ref={scrollRef} className={`w-full ${isInitialScreen ? 'flex flex-col' : 'flex-1 min-h-0 pt-4'}`}>
                    <div className={`mx-auto w-full max-w-3xl space-y-8 flex flex-col px-4 md:px-0 ${isInitialScreen ? 'pt-8' : 'pt-4 pb-52'}`}>
                        {messages.map((msg, idx) => {
                            const { text: messageContent, attachments: messageAttachments } = parseMessageContentWithAttachments(
                                msg.content,
                                msg.attachments
                            );
                            const proposalCard = msg.role === 'assistant' && isProposalMessage(messageContent || msg.content);
                            const messageKey = `${msg.role}-${idx}`;
                            const isLatestAssistantMessage = msg.role === 'assistant' && idx === messages.length - 1;
                            const shouldEnableOptionClick = isLatestAssistantMessage && !isTyping && hasOptionInput;

                            return msg.role === 'user' ? (
                                /* ── USER message: right-aligned bubble ── */
                                <motion.div
                                    key={messageKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full justify-end"
                                >
                                    <div className="flex max-w-[75%] flex-col items-end gap-2">
                                        {/* attachments above bubble */}
                                        {messageAttachments.length > 0 && (
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {messageAttachments.map((attachment, attachmentIdx) => {
                                                    const isImg = String(attachment.type || '').startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(String(attachment.url || ''));
                                                    return isImg ? (
                                                        <a key={`${attachment.url}-${attachmentIdx}`} href={attachment.url} target="_blank" rel="noopener noreferrer" className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                                                            <img src={attachment.url} alt={attachment.name || 'Attachment'} className="max-h-36 object-contain" />
                                                        </a>
                                                    ) : (
                                                        <a key={`${attachment.url}-${attachmentIdx}`} href={attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-black/5 bg-slate-100 text-slate-700'}`}>
                                                            <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                            <span className="max-w-[150px] truncate">{attachment.name || 'Attachment'}</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* text bubble */}
                                        {messageContent && (
                                            <div className={`rounded-3xl px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                                                isDark
                                                    ? 'bg-[#2F2F2F] text-white'
                                                    : 'bg-[#F0F0F0] text-slate-900'
                                            }`}>
                                                {messageContent}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                /* ── ASSISTANT message: left-aligned with avatar ── */
                                <motion.div
                                    key={messageKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full items-start gap-3"
                                >
                                    {/* avatar */}
                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                                        <img src={cataLogo} alt="AI logo" className="h-5 w-5 object-contain" />
                                    </div>

                                    {/* content */}
                                    <div className="flex-1 min-w-0 max-w-[85%]">
                                        {proposalCard ? (
                                            <div className={`rounded-2xl border p-5 md:p-6 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm'}`}>
                                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    Generated Proposal
                                                </div>
                                                <ProposalPreview content={messageContent || msg.content} isDark={isDark} />
                                                <div className={`mt-5 pt-4 flex justify-end ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
                                                    <Button
                                                        onClick={() => handleProceed(messageContent || msg.content)}
                                                        className="w-full sm:w-auto px-6 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                                                    >
                                                        Find Freelancer for this proposal
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`text-[15px] leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                <AssistantMessageBody
                                                    content={messageContent || msg.content}
                                                    isDark={isDark}
                                                    enableOptionClick={shouldEnableOptionClick}
                                                    forceInteractiveOptions={shouldEnableOptionClick}
                                                    onOptionClick={handleChatOptionClick}
                                                    isOptionSelected={isOptionSelectedByText}
                                                    isMultiInput={isMultiInput}
                                                    selectedCount={selectedOptions.length}
                                                    onSubmitMulti={(e) => handleSendMessage(e, selectedOptions)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex w-full items-start gap-3"
                            >
                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                                    <img src={cataLogo} alt="AI logo" className="h-5 w-5 object-contain" />
                                </div>
                                <div className="flex min-h-[2rem] items-center gap-1.5 opacity-60">
                                    <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '0ms' }} />
                                    <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '140ms' }} />
                                    <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '280ms' }} />
                                </div>
                            </motion.div>
                        )}

                        {isInitialScreen && (
                            <div className="mt-8 w-full">
                                {renderChatInput()}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Fixed bottom input box only when NOT initial screen */}
                {!isInitialScreen && (
                    <div className={`absolute bottom-0 w-full px-4 pb-4 pt-12 md:px-8 bg-gradient-to-t ${isDark ? 'from-[#212121] via-[#212121]/90 to-transparent' : 'from-[#F9F9F9] via-[#F9F9F9]/90 to-transparent'}`}>
                        <div className="mx-auto w-full max-w-3xl space-y-2.5">
                            {renderChatInput()}
                            <p className={`text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                AI can make mistakes. Check important info.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {selectedProposalPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
                    <div className={`max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl ${isDark
                        ? 'border-white/15 bg-[#0d0d0f]'
                        : 'border-slate-300/80 bg-white'
                        }`}>
                        <div className={`flex items-center justify-between border-b px-5 py-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div>
                                <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {selectedProposalPreview.service || 'Proposal'}
                                </p>
                                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {selectedProposalPreview.projectTitle || 'AI Generated Proposal'}
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={handleCloseProposalPreview}
                                aria-label="Close proposal preview"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="max-h-[calc(88vh-64px)] overflow-y-auto px-5 py-4">
                            <ProposalPreview content={selectedProposalPreview.content} isDark={isDark} />
                            <div className={`mt-6 flex justify-end border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <Button
                                    onClick={() => handleProceed(selectedProposalPreview.content)}
                                    className="w-full sm:w-auto rounded-xl bg-primary px-8 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90"
                                >
                                    Find Freelancer for this proposal
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestAIDemo;
