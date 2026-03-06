import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase,
    ArrowRight,
    ArrowLeft,
    Bot,
    User,
    Send,
    Mic,
    MicOff,
    Sparkles,
    History,
    Paperclip,
    X,
    Image as ImageIcon,
    FileText
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

const GUEST_CHAT_STORAGE_KEY = 'markify:guestAiSessions:v1';
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
    return safeParseArray(window.localStorage.getItem(GUEST_CHAT_STORAGE_KEY));
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

const getProposalStorageKeys = (userId) => {
    const suffix = userId ? `:${userId}` : "";
    return {
        listKey: `markify:savedProposals${suffix}`,
        singleKey: `markify:savedProposal${suffix}`,
        syncedKey: `markify:savedProposalSynced${suffix}`,
    };
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

const normalizeInlineOptions = (text = "") =>
    String(text || "")
        // Common AI output: "... question? 1. Option A"
        .replace(/\?\s*(\d+)\.\s+/g, '?\n$1. ')
        // Fallback for prompt formats like "Please choose: 1. A"
        .replace(/:\s*(\d+)\.\s+/g, ':\n$1. ');

const splitContextAndQuestion = (text = "") => {
    const source = String(text || "").trim();
    if (!source) return { contextText: "", questionText: "" };
    if (!source.includes("?")) return { contextText: source, questionText: "" };

    const sentenceMatches = source.match(/[^.!?\n]+[.!?]+/g) || [source];
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
            contextText: lines.slice(0, -1).join("\n\n").trim(),
            questionText: lastLine
        };
    }

    const questionText = sentenceMatches[questionIdx].trim();
    const contextText = sentenceMatches
        .filter((_, idx) => idx !== questionIdx)
        .map((sentence) => sentence.trim())
        .filter((sentence) => !/^\d+\.$/.test(sentence))
        .map((sentence) => sentence.trim())
        .join(" ")
        .trim();

    return { contextText, questionText };
};

const parseAssistantMessageLayout = (content = "") => {
    const normalized = normalizeInlineOptions(
        normalizeMarkdownContent(content).replace(/\r/g, "").trim()
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
        contextText,
        questionText,
        options: optionEntries.map((option) => ({
            number: option.number,
            text: option.text
        }))
    };
};

const AssistantMessageBody = ({
    content,
    isDark,
    enableOptionClick = false,
    onOptionClick = () => { },
    isOptionSelected = () => false,
    isMultiInput = false,
    selectedCount = 0,
    onSubmitMulti = () => { }
}) => {
    const { contextText, questionText, options } = parseAssistantMessageLayout(content);
    const hasStructuredQuestion = Boolean(questionText) || options.length > 0;

    if (!hasStructuredQuestion) {
        return (
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {contextText && (
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{contextText}</ReactMarkdown>
                </div>
            )}

            {questionText && (
                <div className={`rounded-xl border px-3 py-3 ${isDark ? 'border-white/12 bg-white/[0.03]' : 'border-black/10 bg-white'}`}>
                    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{questionText}</ReactMarkdown>
                    </div>
                </div>
            )}

            {options.length > 0 && (
                <div className="space-y-2">
                    {options.map((option) => (
                        enableOptionClick ? (
                            <button
                                key={`${option.number}-${option.text}`}
                                type="button"
                                onClick={() => onOptionClick(option.text)}
                                className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-all ${isOptionSelected(option.text)
                                    ? 'border-primary bg-primary/20 ring-1 ring-primary/50'
                                    : isDark
                                        ? 'border-white/15 bg-white/[0.04] hover:bg-white/[0.08]'
                                        : 'border-black/10 bg-[#faf9f5] hover:bg-slate-100'
                                    }`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[11px] font-semibold ${isDark ? 'bg-white/15 text-slate-100' : 'bg-slate-900 text-white'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none leading-relaxed ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
                                    <ReactMarkdown>{option.text}</ReactMarkdown>
                                </div>
                            </button>
                        ) : (
                            <div
                                key={`${option.number}-${option.text}`}
                                className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-white/15 bg-white/[0.04]' : 'border-black/10 bg-[#faf9f5]'}`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full text-[11px] font-semibold ${isDark ? 'bg-white/15 text-slate-100' : 'bg-slate-900 text-white'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none leading-relaxed ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
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

const stripMarkdownDecorators = (value = '') =>
    String(value)
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim();

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
    const normalized = normalizeMarkdownContent(content).replace(/\r/g, '');
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
                <ReactMarkdown>{normalizeMarkdownContent(content)}</ReactMarkdown>
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const { user } = useAuth();

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
    const [isListening, setIsListening] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [previousChats, setPreviousChats] = useState(() => readStoredGuestSessions());
    const [loadingHistoryId, setLoadingHistoryId] = useState(null);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const speechBaseInputRef = useRef("");
    const speechFinalRef = useRef("");
    const normalizedInputType = (inputConfig.type || 'text').toLowerCase();
    const isMultiInput = normalizedInputType === 'multi_select'
        || normalizedInputType === 'multi_option'
        || normalizedInputType === 'grouped_multi_select';
    const hasOptionInput = Array.isArray(inputConfig.options) && inputConfig.options.length > 0;
    const shouldShowTextInput = true;
    const visiblePreviousChats = previousChats.filter((chat) => chat?.sessionId);

    const refreshPreviousChats = useCallback(() => {
        setPreviousChats(readStoredGuestSessions());
    }, []);

    const persistCurrentSessionSummary = useCallback((history) => {
        if (!sessionId || !selectedService) return;

        const list = Array.isArray(history) ? history : [];
        const nextSessions = upsertStoredGuestSession({
            sessionId,
            serviceId: selectedService.slug || selectedService.id || '',
            serviceName: selectedService.name || 'AI Consultation',
            serviceDescription: selectedService.description || '',
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

    const normalizeOptionToken = (value = '') =>
        String(value || '').trim().toLowerCase();

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
        return String(typeof matched === 'string' ? matched : (matched.value ?? matched.label ?? raw));
    };

    const isOptionSelectedByText = (optionText = '') =>
        optionIsSelected(resolveConfiguredOptionValue(optionText));

    const handleChatOptionClick = (optionText = '') => {
        const resolvedValue = resolveConfiguredOptionValue(optionText);
        if (!resolvedValue) return;

        if (isMultiInput) {
            setSelectedOptions((prev) => {
                const alreadySelected = prev.some(
                    (v) => normalizeOptionToken(v) === normalizeOptionToken(resolvedValue)
                );
                if (alreadySelected) {
                    return prev.filter(
                        (v) => normalizeOptionToken(v) !== normalizeOptionToken(resolvedValue)
                    );
                }
                return [...prev, resolvedValue];
            });
            return;
        }

        handleSendMessage(null, resolvedValue);
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        refreshPreviousChats();
    }, [refreshPreviousChats]);

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
    }, []);

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

    const handleSendMessage = async (e, forcedContent = null) => {
        if (e) e.preventDefault();
        const contentToSend = forcedContent ?? input;
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
            setPendingAttachments([]);
            setInputConfig({ type: 'text', options: [] });
            setSelectedOptions([]);

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

            if (data?.history) {
                setMessages(data.history);
                persistCurrentSessionSummary(data.history);
            } else if (typeof data?.message === 'string' && data.message.trim()) {
                const aiMsg = { role: 'assistant', content: data.message };
                setMessages(prev => [...prev, aiMsg]);
                persistCurrentSessionSummary([...messages, userMsg, aiMsg]);
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
        const parsed = parseProposalContent(proposalContent);
        const projectTitle = parsed.fields?.serviceType || parsed.fields?.businessName || "AI Generated Proposal";
        
        const now = new Date().toISOString();
        const { listKey, singleKey, syncedKey } = getProposalStorageKeys(user?.id);
        const proposalToSave = {
            id: `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            projectTitle,
            service: parsed.fields?.serviceType || "General services",
            serviceKey: parsed.fields?.serviceType || "",
            summary: proposalContent,
            content: proposalContent,
            budget: parsed.fields?.budget || "",
            timeline: parsed.fields?.launchTimeline || "",
            ownerId: user?.id || null,
            syncedProjectId: null,
            syncedAt: null,
            createdAt: now,
            updatedAt: now,
        };

        // Load existing proposals
        let existingProposals = [];
        try {
            const stored = localStorage.getItem(listKey);
            if (stored) existingProposals = JSON.parse(stored);
        } catch {
            // Ignore malformed localStorage payloads and continue with a new list.
        }

        existingProposals.push(proposalToSave);
        localStorage.setItem(listKey, JSON.stringify(existingProposals));
        localStorage.setItem(singleKey, JSON.stringify(proposalToSave));
        if (syncedKey) localStorage.removeItem(syncedKey);

        if (user) {
            if (user.role === "CLIENT") {
                toast.success("Proposal saved! Redirecting to dashboard...");
                navigate("/client");
            } else {
                toast.info("Please create a client account to proceed with this proposal.");
                navigate("/signup?role=client", { state: { redirectTo: "/client", fromProposal: true } });
            }
        } else {
            toast.success("Proposal saved! Please create an account to continue.");
            navigate("/signup?role=client", { state: { redirectTo: "/client", fromProposal: true } });
        }
    };

    const handleBackToServices = () => {
        setSelectedService(null);
        setSessionId(null);
        setMessages([]);
        setInput('');
        setPendingAttachments([]);
        setSelectedOptions([]);
        setInputConfig({ type: 'text', options: [] });
    };

    if (loading && !selectedService) {
        return (
            <>
                <Navbar />
                <div className={`flex min-h-screen items-center justify-center px-4 pb-10 pt-28 ${isDark ? 'bg-black' : 'bg-[#fbfbfa]'}`}>
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
                <div className={`relative min-h-screen overflow-hidden ${isDark
                    ? 'bg-black bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.10),transparent_55%)]'
                    : 'bg-[#fbfbfa] bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.14),transparent_58%)]'
                    } px-4 pb-10 pt-28 md:px-8 md:pb-12 md:pt-32`}
                >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-64 ${isDark
                    ? 'bg-[linear-gradient(180deg,rgba(242,204,13,0.10),transparent)]'
                    : 'bg-[linear-gradient(180deg,rgba(242,204,13,0.12),transparent)]'
                    }`} />
                <div className={`pointer-events-none absolute right-[-120px] top-28 h-72 w-72 rounded-full blur-3xl ${isDark
                    ? 'bg-primary/10'
                    : 'bg-primary/15'
                    }`} />
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative overflow-hidden rounded-3xl border p-7 md:p-10 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-sm'}`}
                    >
                        <div className={`pointer-events-none absolute inset-0 ${isDark
                            ? 'bg-[linear-gradient(112deg,rgba(255,255,255,0.05)_0%,transparent_46%,rgba(242,204,13,0.16)_100%)]'
                            : 'bg-[linear-gradient(112deg,rgba(255,255,255,0.80)_0%,transparent_46%,rgba(242,204,13,0.22)_100%)]'
                            }`} />
                        <div className={`pointer-events-none absolute -right-20 top-8 h-52 w-52 rounded-full blur-3xl ${isDark ? 'bg-primary/20' : 'bg-primary/25'}`} />

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Demo
                            </div>
                            <h1 className={`mt-4 text-4xl font-bold tracking-tight md:text-6xl ${isDark ? 'text-white' : 'text-[#181711]'}`}>
                                Build your project brief with
                                <span className="block bg-gradient-to-r from-primary via-[#f8de72] to-primary bg-clip-text text-transparent">
                                    Catalance AI
                                </span>
                            </h1>
                            <p className={`mt-4 max-w-3xl text-base md:text-xl ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                                Pick a service, answer guided questions, and get a structured proposal generated in chat.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-2.5">
                                {DEMO_HIGHLIGHTS.map((item) => (
                                    <span
                                        key={item}
                                        className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold ${isDark
                                            ? 'border border-white/15 bg-white/[0.04] text-slate-100'
                                            : 'border border-black/10 bg-white text-slate-700'
                                            }`}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#181711]'}`}>
                                Choose Your Service
                            </h2>
                            <p className={`mt-1 text-sm ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                                {services.length > 0
                                    ? `${services.length} services ready for guided consultation`
                                    : 'Select a service to begin your AI consultation'}
                            </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isDark ? 'border border-white/15 bg-white/[0.03] text-slate-200' : 'border border-black/10 bg-white text-slate-600'}`}>
                            Tap any card to start
                        </span>
                    </div>

                    <div className="relative mt-8 px-1 sm:px-2 md:px-3">
                        <div className={`pointer-events-none absolute inset-x-8 top-5 h-24 blur-3xl ${isDark ? 'bg-primary/10' : 'bg-primary/15'}`} />
                        <div className="relative mx-auto grid max-w-[1260px] grid-cols-1 gap-7 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
                        {services.length === 0 ? (
                            <div className="md:col-span-2 xl:col-span-3">
                                <Card className={`rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white shadow-sm'}`}>
                                    <CardHeader>
                                        <CardTitle className={isDark ? 'text-white' : 'text-[#181711]'}>
                                            Services unavailable
                                        </CardTitle>
                                        <CardDescription className={isDark ? 'text-[#bab59c]' : 'text-slate-600'}>
                                            {servicesError || "We could not load services right now. Please retry."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button onClick={fetchServices}>
                                            Retry
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            services.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index * 0.04, 0.25) }}
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.995 }}
                                >
                                    <Card
                                        className={`group relative mx-auto h-full w-full max-w-[390px] cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${isDark
                                            ? 'border-white/10 bg-white/[0.04] hover:-translate-y-1 hover:border-primary/55 hover:bg-white/[0.07] hover:shadow-[0_24px_50px_-25px_rgba(242,204,13,0.42)]'
                                            : 'border-black/10 bg-white hover:border-primary/50 hover:shadow-[0_20px_45px_-28px_rgba(20,20,20,0.30)]'
                                            }`}
                                        onClick={() => handleServiceSelect(service)}
                                    >
                                        <div className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${isDark
                                            ? 'bg-[radial-gradient(circle_at_80%_15%,rgba(242,204,13,0.22),transparent_42%)]'
                                            : 'bg-[radial-gradient(circle_at_80%_15%,rgba(242,204,13,0.24),transparent_44%)]'
                                            }`} />
                                        <CardHeader className="relative space-y-2 px-5 pb-2 pt-5">
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'border border-primary/35 bg-primary/10 text-primary' : 'border border-primary/30 bg-primary/10 text-[#181711]'}`}>
                                                    AI Guided
                                                </span>
                                            </div>
                                            <CardTitle className={`text-[1.75rem] leading-tight ${isDark ? 'text-white' : 'text-[#181711]'}`}>{service.name}</CardTitle>
                                            <CardDescription className={`mt-1 min-h-[2.8rem] text-[15px] leading-relaxed ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                                                {service.description || `Start a ${service.name} consultation`}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="relative px-5 pb-5 pt-0">
                                            <div className={`mt-1 flex items-center justify-between border-t pt-3.5 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                                <div className={`inline-flex items-center gap-2 text-[15px] font-semibold ${isDark ? 'text-primary' : 'text-[#181711]'}`}>
                                                    Start consultation
                                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                                </div>
                                                <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    0{index + 1}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                        </div>
                    </div>
                </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden ${isDark
            ? 'bg-black bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.10),transparent_50%)]'
            : 'bg-[#fbfbfa] bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.14),transparent_55%)]'
            }`}
        >
            <aside className={`hidden w-80 shrink-0 border-r p-6 md:flex md:flex-col ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white/80'}`}>
                <Button
                    variant="ghost"
                    className={`mb-6 w-fit rounded-full ${isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
                    onClick={handleBackToServices}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to services
                </Button>

                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                    <Briefcase className="h-5 w-5" />
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#181711]'}`}>{selectedService.name}</h2>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                    {selectedService.description}
                </p>

                <div className={`mt-8 flex min-h-0 flex-1 flex-col rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-white'}`}>
                    <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <History className="h-3.5 w-3.5" />
                        Previous chats
                    </div>
                    {visiblePreviousChats.length === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                            No previous chats yet.
                        </p>
                    ) : (
                        <div className="space-y-2 overflow-y-auto pr-1">
                            {visiblePreviousChats.map((chat) => {
                                const isCurrent = chat.sessionId === sessionId;
                                const isLoadingHistory = loadingHistoryId === chat.sessionId;

                                return (
                                    <button
                                        key={chat.sessionId}
                                        type="button"
                                        onClick={() => handleLoadPreviousChat(chat)}
                                        disabled={isLoadingHistory || isCurrent}
                                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${isCurrent
                                            ? isDark
                                                ? 'border-primary/40 bg-primary/10'
                                                : 'border-primary/40 bg-primary/10'
                                            : isDark
                                                ? 'border-white/12 bg-white/[0.03] hover:bg-white/[0.06]'
                                                : 'border-black/10 bg-[#fbfbfa] hover:bg-slate-100/80'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`truncate text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {chat.serviceName || selectedService.name}
                                            </p>
                                            <span className={`shrink-0 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {formatPreviousChatTime(chat.updatedAt)}
                                            </span>
                                        </div>
                                        <p className={`mt-1 line-clamp-2 text-sm ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                            {chat.preview || 'No preview available'}
                                        </p>
                                        <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {isLoadingHistory ? 'Loading...' : `${chat.messageCount || 0} messages`}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            <section className={`flex min-w-0 flex-1 flex-col ${isDark ? 'bg-transparent' : 'bg-transparent'}`}>
                <div className={`border-b px-4 py-4 md:px-6 ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-white/85'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={handleBackToServices}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#181711]'}`}>AI Assistant</h2>
                                <p className={`text-xs ${isDark ? 'text-[#bab59c]' : 'text-slate-500'}`}>
                                    {selectedService?.name} - Guided consultation
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                            Active
                        </span>
                    </div>
                </div>

                <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-3 py-4 md:px-6 md:py-6">
                    <div className="mx-auto max-w-4xl space-y-5 pb-4">
                        {messages.map((msg, idx) => {
                            const { text: messageContent, attachments: messageAttachments } = parseMessageContentWithAttachments(
                                msg.content,
                                msg.attachments
                            );
                            const proposalCard = msg.role === 'assistant' && isProposalMessage(messageContent || msg.content);
                            const messageKey = `${msg.role}-${idx}`;

                            return (
                                <motion.div
                                    key={messageKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}

                                    {proposalCard ? (
                                        <div className={`w-full max-w-[96%] rounded-2xl border p-5 shadow-sm md:p-6 ${isDark ? 'border-primary/30 bg-white/[0.04] text-white' : 'border-primary/40 bg-white text-[#181711]'}`}>
                                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Generated Proposal
                                            </div>
                                            <ProposalPreview content={messageContent || msg.content} isDark={isDark} />
                                            <div className={`mt-6 pt-5 flex justify-end ${isDark ? 'border-t border-primary/20' : 'border-t border-primary/20'}`}>
                                                <Button 
                                                    onClick={() => handleProceed(messageContent || msg.content)}
                                                    className="w-full sm:w-auto px-8 py-2.5 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                                                >
                                                    Find Freelancer for this proposal
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed md:text-[15px]
                                            ${msg.role === 'user'
                                                    ? 'rounded-tr-none bg-slate-900 text-white'
                                                    : isDark
                                                        ? 'rounded-tl-none border border-white/10 bg-white/[0.06] text-white'
                                                        : 'rounded-tl-none border border-black/10 bg-white text-slate-800'
                                                }`}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <AssistantMessageBody
                                                    content={messageContent || msg.content}
                                                    isDark={isDark}
                                                    enableOptionClick={
                                                        msg.role === 'assistant' &&
                                                        idx === messages.length - 1 &&
                                                        !isTyping &&
                                                        hasOptionInput
                                                    }
                                                    onOptionClick={handleChatOptionClick}
                                                    isOptionSelected={isOptionSelectedByText}
                                                    isMultiInput={isMultiInput}
                                                    selectedCount={selectedOptions.length}
                                                    onSubmitMulti={(e) => handleSendMessage(e, selectedOptions)}
                                                />
                                            ) : (
                                                <div className="space-y-2">
                                                    {messageContent && (
                                                        <div className="whitespace-pre-wrap break-words">
                                                            {messageContent}
                                                        </div>
                                                    )}
                                                    {messageAttachments.length > 0 && (
                                                        <div className="space-y-2">
                                                            {messageAttachments.map((attachment, attachmentIdx) => {
                                                                const isImageAttachment = String(attachment.type || '').startsWith('image/')
                                                                    || /\.(jpg|jpeg|png|gif|webp)$/i.test(String(attachment.url || ''));

                                                                if (isImageAttachment) {
                                                                    return (
                                                                        <a
                                                                            key={`${attachment.url}-${attachmentIdx}`}
                                                                            href={attachment.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block overflow-hidden rounded-lg border border-white/15 bg-black/15"
                                                                        >
                                                                            <img
                                                                                src={attachment.url}
                                                                                alt={attachment.name || 'Attachment'}
                                                                                className="max-h-40 w-full object-cover"
                                                                            />
                                                                        </a>
                                                                    );
                                                                }

                                                                return (
                                                                    <a
                                                                        key={`${attachment.url}-${attachmentIdx}`}
                                                                        href={attachment.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${isDark
                                                                            ? 'border-white/20 bg-white/[0.04] text-slate-100'
                                                                            : 'border-black/15 bg-white/85 text-slate-700'
                                                                            }`}
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                                                        <span className="truncate">{attachment.name || 'Attachment'}</span>
                                                                        {attachment.size > 0 && (
                                                                            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                                {formatBytes(attachment.size)}
                                                                            </span>
                                                                        )}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {msg.role === 'user' && (
                                        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-start gap-3"
                            >
                                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className={`flex items-center gap-2 rounded-2xl rounded-tl-none border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-black/10 bg-white'}`}>
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '140ms' }} />
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '280ms' }} />
                                </div>
                            </motion.div>
                        )}

                    </div>
                </ScrollArea>

                <div className={`border-t p-4 md:px-6 md:py-5 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white/90'}`}>
                    <div className="mx-auto max-w-4xl space-y-3">
                        {shouldShowTextInput && (
                            <form
                                onSubmit={handleSendMessage}
                                className={`rounded-2xl border p-2 ${isDark
                                    ? 'border-white/12 bg-white/[0.03]'
                                    : 'border-black/10 bg-[#fbfbfa]'
                                    }`}
                            >
                                {pendingAttachments.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {pendingAttachments.map((file, index) => {
                                            const imageFile = String(file.type || '').startsWith('image/');
                                            return (
                                                <div
                                                    key={`${file.name}-${file.size}-${index}`}
                                                    className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs ${isDark
                                                        ? 'border-white/20 bg-white/[0.07] text-slate-200'
                                                        : 'border-black/15 bg-white text-slate-700'
                                                        }`}
                                                >
                                                    {imageFile ? (
                                                        <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                                                    ) : (
                                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                                    )}
                                                    <span className="max-w-[190px] truncate">{file.name}</span>
                                                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {formatBytes(file.size)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className={`rounded-full p-0.5 ${isDark ? 'hover:bg-white/15' : 'hover:bg-slate-100'}`}
                                                        onClick={() => removePendingAttachment(index)}
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Input
                                        ref={inputRef}
                                        autoFocus
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className={`h-12 flex-1 rounded-xl text-base ${isDark
                                            ? 'border-0 bg-transparent text-white placeholder:text-slate-400'
                                            : 'border-0 bg-transparent text-slate-900 placeholder:text-slate-400'
                                            }`}
                                        disabled={isTyping || isUploadingAttachment}
                                    />
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
                                        onClick={openAttachmentPicker}
                                        disabled={isTyping || isUploadingAttachment}
                                        aria-label="Upload image or document"
                                        title="Upload image or document"
                                        className={`h-10 w-10 rounded-xl ${isDark
                                            ? 'border border-white/20 bg-white/[0.08] text-slate-200 hover:bg-white/[0.14]'
                                            : 'border border-black/15 bg-white text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    {isSpeechSupported && (
                                        <Button
                                            size="icon"
                                            type="button"
                                            onClick={toggleVoiceInput}
                                            disabled={isTyping || isUploadingAttachment}
                                            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                            title={isListening ? 'Stop voice input' : 'Start voice input'}
                                            className={`${isListening
                                                ? 'animate-pulse bg-primary text-primary-foreground hover:bg-primary/90'
                                                : isDark
                                                    ? 'border border-white/20 bg-white/[0.08] text-slate-200 hover:bg-white/[0.14]'
                                                    : 'border border-black/15 bg-white text-slate-700 hover:bg-slate-100'
                                                } h-10 w-10 rounded-xl`}
                                        >
                                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        type="submit"
                                        disabled={(!input.trim() && pendingAttachments.length === 0) || isTyping || isUploadingAttachment}
                                        className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                {isUploadingAttachment && (
                                    <p className={`mt-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Uploading attachment...
                                    </p>
                                )}
                            </form>
                        )}
                        <p className={`text-center text-xs ${isDark ? 'text-[#bab59c]' : 'text-slate-500'}`}>
                            AI may produce inaccurate information about people, places, or facts.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GuestAIDemo;
