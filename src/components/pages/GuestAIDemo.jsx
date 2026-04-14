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
    ArrowLeft,
    PanelLeftClose,
    PanelLeftOpen,
    LogIn,
    User,
    Send,
    Mic,
    MicOff,
    Sparkles,
    Paperclip,
    X,
    Image as ImageIcon,
    FileText,
    Trash2,
    Globe,
    MessageSquarePlus,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LightRays from '@/components/ui/LightRays';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    mergeProposalStructureDefinitions,
    parseProposalStructureDefinitions,
} from '@/shared/lib/project-proposal-fields';
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
const URL_TOKEN_PREFIX = '[[URL]]';
const URL_TOKEN_REGEX = /^\[\[URL\]\]([^|]+)\|([^|]*)$/;
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

const SERVICE_SELECTION_MODES = Object.freeze({
    FREELANCER: 'freelancer',
    AGENCY: 'agency',
});

const getServiceIdentifier = (service = {}) =>
    String(service?.slug || service?.id || service?.name || '').trim();

const toStoredProposalServiceEntry = (service = {}) => {
    const id = getServiceIdentifier(service);
    const slug = String(service?.slug || service?.id || '').trim();
    const name = String(service?.name || '').trim();

    if (!id && !slug && !name) return null;

    return {
        id: id || slug || name,
        ...(slug ? { slug } : {}),
        ...(name ? { name } : {}),
        ...(typeof service?.agencyProposalStructure === 'string' && service.agencyProposalStructure.trim()
            ? { agencyProposalStructure: service.agencyProposalStructure }
            : {}),
    };
};

const createEmptyAgencyFlowState = () => ({
    active: false,
    selectedServices: [],
    currentServiceIndex: 0,
    currentSessionStartIndex: 0,
    serviceProposals: [],
    serviceSessions: [],
    sharedAnswers: {},
    followupTargetServiceId: '',
    awaitingFollowupServiceSelection: false,
    pendingFollowupMessage: '',
    completed: false,
});

const normalizeAgencySharedAnswers = (value = {}) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const normalizeValue = (input = '', maxLength = 600) =>
        String(input || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLength)
            .trim();

    const nextSharedAnswers = {};
    const personName = normalizeValue(value.personName || value.person_name || '', 120);
    const businessName = normalizeValue(value.businessName || value.business_name || '', 160);
    const businessSummary = normalizeValue(value.businessSummary || value.business_summary || '', 600);
    const websiteUrl = normalizeValue(value.websiteUrl || value.website_url || '', 400);

    if (personName) nextSharedAnswers.personName = personName;
    if (businessName) nextSharedAnswers.businessName = businessName;
    if (businessSummary) nextSharedAnswers.businessSummary = businessSummary;
    if (websiteUrl) nextSharedAnswers.websiteUrl = websiteUrl;

    return nextSharedAnswers;
};

const mergeAgencySharedAnswers = (current = {}, incoming = {}) => ({
    ...normalizeAgencySharedAnswers(current),
    ...normalizeAgencySharedAnswers(incoming),
});

const upsertAgencyServiceSession = (serviceSessions = [], service = {}, sessionId = '') => {
    const nextSessionId = String(sessionId || '').trim();
    const serviceId = getServiceIdentifier(service);
    if (!serviceId || !nextSessionId) {
        return Array.isArray(serviceSessions) ? serviceSessions : [];
    }

    const nextEntry = {
        serviceId,
        serviceName: String(service?.name || '').trim(),
        sessionId: nextSessionId,
    };

    const existingSessions = Array.isArray(serviceSessions) ? serviceSessions : [];
    const remaining = existingSessions.filter((entry) => entry?.serviceId !== serviceId);
    return [...remaining, nextEntry];
};

const getAgencyServiceSessionEntry = (serviceSessions = [], serviceOrId = null) => {
    const serviceId = typeof serviceOrId === 'string'
        ? String(serviceOrId || '').trim()
        : getServiceIdentifier(serviceOrId || {});
    if (!serviceId) return null;

    return (Array.isArray(serviceSessions) ? serviceSessions : []).find((entry) => entry?.serviceId === serviceId) || null;
};

const replaceAgencyServiceProposal = (serviceProposals = [], nextProposal = {}) => {
    const serviceId = getServiceIdentifier(nextProposal?.service || {});
    if (!serviceId || !nextProposal?.content) {
        return Array.isArray(serviceProposals) ? serviceProposals : [];
    }

    const existingRows = Array.isArray(serviceProposals) ? serviceProposals : [];
    const normalizedNextProposal = {
        service: nextProposal.service,
        content: normalizeMarkdownContent(nextProposal.content || ''),
        parsed: nextProposal.parsed || parseProposalContent(nextProposal.content || ''),
    };
    const existingIndex = existingRows.findIndex((row) => getServiceIdentifier(row?.service || {}) === serviceId);

    if (existingIndex >= 0) {
        const nextRows = [...existingRows];
        nextRows[existingIndex] = normalizedNextProposal;
        return nextRows;
    }

    return [...existingRows, normalizedNextProposal];
};

const normalizeAgencyServiceMatchText = (value = '') =>
    normalizeServiceLogoKey(String(value || '').replace(/\band\b/gi, ' '));

const buildAgencyServiceMatchCandidates = (service = {}) => {
    const normalizedName = normalizeAgencyServiceMatchText(service?.name || '');
    const normalizedSlug = normalizeAgencyServiceMatchText(
        String(service?.slug || service?.id || '').replace(/_/g, ' ')
    );
    const candidates = new Set([normalizedName, normalizedSlug]);

    if (/\bwriting\b|\bcontent\b/.test(normalizedName)) {
        candidates.add('writing');
        candidates.add('content');
        candidates.add('writing content');
    }
    if (/\bugc\b/.test(normalizedName)) {
        candidates.add('ugc');
        candidates.add('ugc marketing');
    }
    if (/\bpaid advertising\b|\bperformance marketing\b/.test(normalizedName) || /\bpaid advertising\b/.test(normalizedSlug)) {
        candidates.add('paid advertising');
        candidates.add('performance marketing');
        candidates.add('paid ads');
        candidates.add('ads');
    }
    if (/\b3d\b/.test(normalizedName)) {
        candidates.add('3d');
        candidates.add('3d modeling');
        candidates.add('3d modelling');
    }
    if (/\bai\b|\bautomation\b/.test(normalizedName)) {
        candidates.add('ai');
        candidates.add('automation');
        candidates.add('ai automation');
    }

    return [...candidates].filter((candidate) => candidate && candidate.length >= 2);
};

const findAgencyServiceMatch = ({
    message = '',
    services = [],
}) => {
    const normalizedMessage = normalizeAgencyServiceMatchText(message);
    if (!normalizedMessage) return null;

    const rankedMatches = (Array.isArray(services) ? services : [])
        .map((service) => {
            const candidates = buildAgencyServiceMatchCandidates(service);
            const score = candidates.reduce((bestScore, candidate) => {
                const phraseHit = normalizedMessage.includes(candidate);
                const wordHits = candidate
                    .split(' ')
                    .filter((token) => token.length >= 2)
                    .filter((token) => normalizedMessage.includes(token))
                    .length;
                const candidateScore = phraseHit ? wordHits + 2 : wordHits;
                return Math.max(bestScore, candidateScore);
            }, 0);

            return { service, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    if (rankedMatches.length === 0) return null;
    if (rankedMatches.length === 1) return rankedMatches[0].service;
    if (rankedMatches[0].score === rankedMatches[1].score) return null;
    return rankedMatches[0].service;
};

const isAgencyConfirmationPrompt = (inputConfig = {}) => {
    const normalizedOptions = (Array.isArray(inputConfig?.options) ? inputConfig.options : [])
        .map((option) => String(option || '').trim().toLowerCase())
        .filter(Boolean);
    return normalizedOptions.includes('yes') && normalizedOptions.includes('no');
};

const buildAgencyServiceClarificationMessage = (selectedServices = []) => {
    const labels = (Array.isArray(selectedServices) ? selectedServices : [])
        .map((service) => String(service?.name || '').trim())
        .filter(Boolean);

    if (labels.length === 0) {
        return 'This agency proposal covers multiple services. Tell me which service you want to update.';
    }

    return [
        'This agency proposal covers multiple services. Which service do you want to update?',
        '',
        ...labels.map((label, index) => `${index + 1}. ${label}`),
    ].join('\n');
};

const buildAgencyServiceSelectionMessage = (serviceName = '') =>
    `Got it. Tell me what you want to change for ${serviceName || 'that service'}, and I will refresh the combined proposal.`;

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
        businessName: entry.businessName || current?.businessName || '',
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

const normalizeSharedUrl = (value = '') => {
    const source = String(value || '').trim();
    if (!source) return '';

    const attempts = [source];
    while (/[),.;!?]$/.test(attempts[attempts.length - 1] || '')) {
        attempts.push(attempts[attempts.length - 1].slice(0, -1));
    }

    for (const attempt of attempts) {
        const candidate = String(attempt || '').trim();
        if (!candidate) continue;
        const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
        try {
            const parsed = new URL(withProtocol);
            if (!['http:', 'https:'].includes(parsed.protocol)) continue;
            return parsed.toString();
        } catch {
            // Try the next normalized candidate.
        }
    }

    return '';
};

const buildSharedUrlLabel = (value = '') => {
    try {
        const parsed = new URL(value);
        const hostname = parsed.hostname.replace(/^www\./i, '');
        const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.replace(/\/$/, '') : '';
        return `${hostname}${path}` || hostname || value;
    } catch {
        return String(value || '').trim();
    }
};

const extractSharedUrlsFromText = (value = '') => {
    const seen = new Set();
    const urls = [];
    const text = String(value || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.replace(/(?:https?:\/\/|www\.)[^\s<>"']+/gi, (match) => {
            const normalized = normalizeSharedUrl(match);
            if (!normalized) return match;
            if (!seen.has(normalized)) {
                seen.add(normalized);
                urls.push({
                    url: normalized,
                    label: buildSharedUrlLabel(normalized),
                });
            }
            return ' ';
        }))
        .map((line) => line.replace(/\s{2,}/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return { text, urls };
};

const buildUrlToken = (urlEntry = {}) => {
    const normalizedUrl = normalizeSharedUrl(urlEntry.url || '');
    if (!normalizedUrl) return '';
    const label = buildSharedUrlLabel(urlEntry.label || normalizedUrl);
    return `${URL_TOKEN_PREFIX}${encodeURIComponent(normalizedUrl)}|${encodeURIComponent(label)}`;
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

const parseUrlToken = (line = '') => {
    const match = String(line || '').trim().match(URL_TOKEN_REGEX);
    if (!match) return null;

    const url = normalizeSharedUrl(decodeURIComponent(match[1] || ''));
    const label = decodeURIComponent(match[2] || '');
    if (!url) return null;

    return {
        url,
        label: label || buildSharedUrlLabel(url),
    };
};

const parseMessageContentWithAttachments = (content = '', explicitAttachments = []) => {
    const parsedAttachments = [];
    const parsedUrls = [];
    const textLines = [];
    const contentLines = String(content || '').replace(/\r/g, '').split('\n');

    contentLines.forEach((rawLine) => {
        const parsed = parseAttachmentToken(rawLine);
        if (parsed) {
            parsedAttachments.push(parsed);
            return;
        }
        const parsedUrl = parseUrlToken(rawLine);
        if (parsedUrl) {
            parsedUrls.push(parsedUrl);
            return;
        }
        textLines.push(rawLine);
    });

    const attachmentSeen = new Set();
    const allAttachments = [...(Array.isArray(explicitAttachments) ? explicitAttachments : []), ...parsedAttachments]
        .filter((attachment) => attachment?.url)
        .filter((attachment) => {
            const key = `${attachment.url}|${attachment.name || ''}|${attachment.size || 0}`;
            if (attachmentSeen.has(key)) return false;
            attachmentSeen.add(key);
            return true;
        });

    const urlSeen = new Set();
    const allUrls = parsedUrls
        .filter((entry) => entry?.url)
        .filter((entry) => {
            const key = String(entry.url || '').trim();
            if (!key || urlSeen.has(key)) return false;
            urlSeen.add(key);
            return true;
        });

    return {
        text: textLines.join('\n').trim(),
        attachments: allAttachments,
        urls: allUrls,
    };
};

const isImageAttachment = (attachment = {}) => {
    const type = String(attachment?.type || '').toLowerCase();
    const name = String(attachment?.name || '').toLowerCase();
    return type.startsWith('image/')
        || /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(name);
};

const buildAttachmentKindLabel = (attachment = {}) => {
    if (isImageAttachment(attachment)) return 'Image';

    const extension = String(attachment?.name || '').split('.').pop();
    if (extension && extension !== String(attachment?.name || '')) {
        return extension.toUpperCase();
    }

    const mimeType = String(attachment?.type || '').trim();
    if (mimeType) {
        const mimeLabel = mimeType.includes('/') ? mimeType.split('/').pop() : mimeType;
        return mimeLabel.replace(/[-_]+/g, ' ').toUpperCase();
    }

    return 'File';
};

const extractSharedResourcesFromMessages = (messages = []) => {
    const source = Array.isArray(messages) ? messages : [];
    const urlSeen = new Set();
    const attachmentSeen = new Set();
    const urls = [];
    const attachments = [];

    for (let index = source.length - 1; index >= 0; index -= 1) {
        const message = source[index];
        if (message?.role !== 'user') continue;

        const parsed = parseMessageContentWithAttachments(
            message?.content || '',
            message?.attachments || []
        );

        parsed.urls.forEach((entry, entryIndex) => {
            const normalizedUrl = normalizeSharedUrl(entry?.url || '');
            if (!normalizedUrl || urlSeen.has(normalizedUrl)) return;

            urlSeen.add(normalizedUrl);
            urls.push({
                id: `url-${index}-${entryIndex}`,
                url: normalizedUrl,
                label: buildSharedUrlLabel(entry?.label || normalizedUrl),
            });
        });

        parsed.attachments.forEach((attachment, entryIndex) => {
            const url = String(attachment?.url || '').trim();
            const name = String(attachment?.name || 'Attachment').trim() || 'Attachment';
            const size = Number(attachment?.size || 0);
            const key = `${url}|${name}|${size}`;
            if (!url || attachmentSeen.has(key)) return;

            attachmentSeen.add(key);
            attachments.push({
                id: `attachment-${index}-${entryIndex}`,
                url,
                name,
                type: String(attachment?.type || ''),
                size: Number.isFinite(size) ? size : 0,
                isImage: isImageAttachment(attachment),
                kindLabel: buildAttachmentKindLabel(attachment),
            });
        });
    }

    return {
        urls,
        attachments,
    };
};

const THINKING_STAGES = [
    {
        key: 'understand',
        label: 'Understanding your request',
        detail: 'Reviewing your answer, recent context, and any saved service rules.',
        startMs: 0,
    },
    {
        key: 'rules',
        label: 'Checking service rules',
        detail: 'Applying admin instructions, option priorities, and validation hints.',
        startMs: 900,
    },
    {
        key: 'flow',
        label: 'Selecting the next step',
        detail: 'Working out the right question flow and the best next prompt.',
        startMs: 1900,
    },
    {
        key: 'reply',
        label: 'Writing the reply',
        detail: 'Preparing the final assistant message for this turn.',
        startMs: 3200,
    },
];

const getNowTimestamp = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

const getThinkingStageIndex = (elapsedMs = 0) => {
    let stageIndex = 0;
    for (let index = 0; index < THINKING_STAGES.length; index += 1) {
        if (elapsedMs >= THINKING_STAGES[index].startMs) {
            stageIndex = index;
        }
    }
    return stageIndex;
};

const buildThinkingState = (elapsedMs = 0) => {
    const stageIndex = getThinkingStageIndex(elapsedMs);
    return {
        elapsedMs,
        stageIndex,
        stage: THINKING_STAGES[stageIndex],
        completedStages: THINKING_STAGES.slice(0, stageIndex + 1),
    };
};

const normalizeTimingValue = (value = 0) => {
    const numericValue = Number(value || 0);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.round(numericValue * 10) / 10);
};

const normalizeServerTimingMeta = (value = null) => {
    if (!value || typeof value !== 'object') return null;
    const steps = Array.isArray(value.steps)
        ? value.steps
            .map((step, index) => {
                if (!step || typeof step !== 'object') return null;
                const durationMs = normalizeTimingValue(step.durationMs);
                return {
                    index,
                    key: String(step.key || `step_${index + 1}`).trim() || `step_${index + 1}`,
                    label: String(step.label || step.key || `Step ${index + 1}`).trim() || `Step ${index + 1}`,
                    category: String(step.category || 'server').trim() || 'server',
                    detail: String(step.detail || '').trim(),
                    status: String(step.status || 'ok').trim() || 'ok',
                    durationMs,
                    startOffsetMs: normalizeTimingValue(step.startOffsetMs),
                    endOffsetMs: normalizeTimingValue(step.endOffsetMs),
                    aiModel: String(step.aiModel || '').trim(),
                    aiTask: String(step.aiTask || '').trim(),
                    aiProfile: String(step.aiProfile || '').trim(),
                    aiProvider: String(step.aiProvider || '').trim(),
                    aiMode: String(step.aiMode || '').trim(),
                    aiProviderDurationMs: normalizeTimingValue(step.aiProviderDurationMs),
                    aiAttemptCount: Number.isFinite(Number(step.aiAttemptCount))
                        ? Number(step.aiAttemptCount)
                        : 0,
                    aiPromptTokens: Number.isFinite(Number(step.aiPromptTokens))
                        ? Number(step.aiPromptTokens)
                        : null,
                    aiCompletionTokens: Number.isFinite(Number(step.aiCompletionTokens))
                        ? Number(step.aiCompletionTokens)
                        : null,
                    aiTotalTokens: Number.isFinite(Number(step.aiTotalTokens))
                        ? Number(step.aiTotalTokens)
                        : null,
                };
            })
            .filter(Boolean)
        : [];

    const totalDurationMs = normalizeTimingValue(value.totalDurationMs || value.durationMs);
    if (!totalDurationMs && steps.length === 0) return null;

    return {
        scope: String(value.scope || '').trim(),
        totalDurationMs,
        steps,
    };
};

const buildTimingBreakdown = (durationMs = 0, timingPayload = null) => {
    const serverTiming = normalizeServerTimingMeta(
        timingPayload?.server || timingPayload?.timingMeta || timingPayload?.backend || timingPayload
    );
    const clientTiming = timingPayload?.client && typeof timingPayload.client === 'object'
        ? timingPayload.client
        : {};
    const uploadDurationMs = normalizeTimingValue(clientTiming.uploadDurationMs);
    const clientPreparationDurationMs = normalizeTimingValue(clientTiming.clientPreparationDurationMs);
    const apiRoundTripDurationMs = normalizeTimingValue(clientTiming.apiRoundTripDurationMs);
    const browserNetworkOverheadMs = serverTiming?.totalDurationMs > 0 && apiRoundTripDurationMs > 0
        ? normalizeTimingValue(Math.max(0, apiRoundTripDurationMs - serverTiming.totalDurationMs))
        : 0;

    const clientRows = [
        clientPreparationDurationMs > 0
            ? {
                key: 'client_preparation',
                label: 'Client preparation',
                durationMs: clientPreparationDurationMs,
                detail: 'Preparing the request in the browser before it is sent.',
            }
            : null,
        uploadDurationMs > 0
            ? {
                key: 'attachment_upload',
                label: 'Attachment upload',
                durationMs: uploadDurationMs,
                detail: 'Uploading file attachments before the chat request starts.',
            }
            : null,
        apiRoundTripDurationMs > 0
            ? {
                key: 'api_round_trip',
                label: 'API round trip',
                durationMs: apiRoundTripDurationMs,
                detail: 'Browser-to-backend request and response time.',
            }
            : null,
        browserNetworkOverheadMs > 0
            ? {
                key: 'network_overhead',
                label: 'Network + browser wait',
                durationMs: browserNetworkOverheadMs,
                detail: 'The difference between backend processing time and full API roundtrip time.',
            }
            : null,
    ].filter(Boolean);

    if (!serverTiming && clientRows.length === 0) return null;

    return {
        totalDurationMs: normalizeTimingValue(durationMs),
        clientRows,
        serverTiming,
    };
};

const getTimingBreakdownGroups = (thinkingMeta = null) => {
    const breakdown = thinkingMeta?.timingBreakdown;
    if (!breakdown) return [];

    const groups = [];
    if (breakdown.clientRows.length > 0) {
        groups.push({
            key: 'client',
            label: 'Client',
            rows: breakdown.clientRows,
        });
    }

    if (breakdown.serverTiming) {
        groups.push({
            key: 'server',
            label: 'Server',
            rows: [
                {
                    key: 'server_total',
                    label: 'Total server time',
                    durationMs: breakdown.serverTiming.totalDurationMs,
                    detail: 'Total backend processing time for this response.',
                },
                ...breakdown.serverTiming.steps,
            ],
        });
    }

    return groups;
};

const buildThinkingMeta = (durationMs = 0, timingPayload = null) => {
    const state = buildThinkingState(durationMs);
    return {
        durationMs,
        finalStageLabel: state.stage?.label || 'Completed',
        completedStageLabels: state.completedStages.map((entry) => entry.label),
        timingBreakdown: buildTimingBreakdown(durationMs, timingPayload),
    };
};

const buildBrowserAiDebugRows = (timingPayload = null) => {
    const serverTiming = normalizeServerTimingMeta(
        timingPayload?.server || timingPayload?.timingMeta || timingPayload?.backend || timingPayload
    );

    return Array.isArray(serverTiming?.steps)
        ? serverTiming.steps
            .filter((step) =>
                step?.category === 'ai'
                || step?.aiModel
                || step?.aiTask
                || step?.aiProfile
            )
            .map((step, index) => ({
                step: step.label || step.key || `AI step ${index + 1}`,
                task: step.aiTask || step.aiProfile || '',
                model: step.aiModel || '',
                provider: step.aiProvider || '',
                providerMs: normalizeTimingValue(step.aiProviderDurationMs),
                totalMs: normalizeTimingValue(step.durationMs),
                promptTokens: Number.isFinite(Number(step.aiPromptTokens))
                    ? Number(step.aiPromptTokens)
                    : null,
                completionTokens: Number.isFinite(Number(step.aiCompletionTokens))
                    ? Number(step.aiCompletionTokens)
                    : null,
                totalTokens: Number.isFinite(Number(step.aiTotalTokens))
                    ? Number(step.aiTotalTokens)
                    : null,
                attempts: Number.isFinite(Number(step.aiAttemptCount))
                    ? Number(step.aiAttemptCount)
                    : 0,
            }))
        : [];
};

const logGuestAiBrowserDebug = (label = 'guest/chat', payload = {}) => {
    if (typeof window === 'undefined' || typeof console === 'undefined') return;

    const timingMeta = payload?.timingMeta || null;
    const aiRows = buildBrowserAiDebugRows(timingMeta);
    const modelList = [...new Set(aiRows.map((row) => row.model).filter(Boolean))];
    const groupLabel =
        `[GuestAIDemo][${label}] origin=${window.location.origin} api=${API_BASE_URL} ` +
        `models=${modelList.join(', ') || 'none'}`;

    if (typeof console.groupCollapsed === 'function') {
        console.groupCollapsed(groupLabel);
    } else {
        console.log(groupLabel);
    }

    console.log('API base URL:', API_BASE_URL);
    console.log('Page origin:', window.location.origin);
    if (payload?.sessionId) {
        console.log('Session ID:', payload.sessionId);
    }
    if (payload?.serviceId || payload?.serviceName) {
        console.log('Service:', {
            id: payload.serviceId || '',
            name: payload.serviceName || '',
        });
    }

    if (timingMeta) {
        console.log('Server timing meta:', timingMeta);
    } else {
        console.warn('No timingMeta returned from backend. This usually means the production backend is old or you are hitting a different API deployment.');
    }

    if (aiRows.length > 0 && typeof console.table === 'function') {
        console.table(aiRows);
    } else {
        console.warn('No AI model rows were found in the response timing data.');
    }

    if (typeof console.groupEnd === 'function') {
        console.groupEnd();
    }
};

const formatThinkingDuration = (durationMs = 0) => {
    const safeDuration = Math.max(0, Number(durationMs || 0));
    if (safeDuration < 1000) return `${Math.round(safeDuration)}ms`;
    if (safeDuration < 10000) return `${(safeDuration / 1000).toFixed(1)}s`;
    return `${Math.round(safeDuration / 1000)}s`;
};

const buildThinkingMetaKey = (message = {}) =>
    `${String(message?.role || '')}::${String(message?.content || '').trim()}`;

const mergeMessagesWithThinkingMeta = (
    incomingMessages = [],
    existingMessages = [],
    latestThinkingMeta = null
) => {
    const metaQueues = new Map();

    (Array.isArray(existingMessages) ? existingMessages : []).forEach((message) => {
        if (!message?.thinkingMeta) return;
        const key = buildThinkingMetaKey(message);
        const queue = metaQueues.get(key) || [];
        queue.push(message.thinkingMeta);
        metaQueues.set(key, queue);
    });

    const merged = (Array.isArray(incomingMessages) ? incomingMessages : []).map((message) => {
        const key = buildThinkingMetaKey(message);
        const queue = metaQueues.get(key);
        if (queue?.length) {
            return { ...message, thinkingMeta: queue.shift() };
        }
        return { ...message };
    });

    if (latestThinkingMeta) {
        for (let index = merged.length - 1; index >= 0; index -= 1) {
            if (merged[index]?.role !== 'assistant') continue;
            merged[index] = {
                ...merged[index],
                thinkingMeta: latestThinkingMeta,
            };
            break;
        }
    }

    return merged;
};

const toPreviewText = (messages = []) => { // UPDATED

    const source = [...messages].reverse();
    for (const message of source) {
        const parsed = parseMessageContentWithAttachments(message?.content || '', message?.attachments || []);
        if (parsed.text) return truncateText(parsed.text, 90);
        if (parsed.urls.length > 0) {
            return `Shared ${parsed.urls[0].label || 'link'}`;
        }
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

const upsertStoredGeneratedProposal = (proposalContent, userId, extraMetadata = {}) => {
    if (!isBrowser) return [];
    migrateProposalStorageNamespace();
    if (userId) {
        migrateProposalStorageNamespace(userId);
    }

    const normalizedContent = normalizeMarkdownContent(proposalContent);
    if (!normalizedContent) {
        return readStoredGeneratedProposals(userId);
    }

    const parsed = parseProposalContent(normalizedContent);
    const now = new Date().toISOString();
    const fingerprint = toProposalFingerprint(normalizedContent);
    const { listKey, singleKey, syncedKey } = getProposalStorageKeys(userId);
    const existingProposals = safeParseArray(window.localStorage.getItem(listKey));
    const normalizedExtraMetadata = extraMetadata && typeof extraMetadata === 'object'
        ? extraMetadata
        : {};
    const existingIndex = existingProposals.findIndex((proposal) => {
        const existingFingerprint = proposal?.fingerprint
            || toProposalFingerprint(proposal?.content || proposal?.summary || proposal?.projectTitle || '');
        return existingFingerprint === fingerprint;
    });
    const existingProposal = existingIndex >= 0 ? existingProposals[existingIndex] : null;
    const nextProposalContext = normalizedExtraMetadata?.proposalContext
        && typeof normalizedExtraMetadata.proposalContext === 'object'
        && !Array.isArray(normalizedExtraMetadata.proposalContext)
        ? normalizedExtraMetadata.proposalContext
        : existingProposal?.proposalContext
            && typeof existingProposal.proposalContext === 'object'
            && !Array.isArray(existingProposal.proposalContext)
            ? existingProposal.proposalContext
            : null;

    const proposalToSave = {
        ...(existingProposal && typeof existingProposal === 'object' ? existingProposal : {}),
        id: existingProposal?.id || `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        businessName: parsed.fields?.businessName || parsed.fields?.companyName || "",
        companyName: parsed.fields?.companyName || parsed.fields?.businessName || "",
        projectTitle: parsed.fields?.businessName || parsed.fields?.companyName || parsed.fields?.serviceType || "AI Generated Proposal",
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
        ...(nextProposalContext ? { proposalContext: nextProposalContext } : {}),
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

const normalizeServiceDisplayName = (value = '') => {
    const label = String(value || '').replace(/\s+/g, ' ').trim();
    if (!label) return '';
    if (/^paid advertising\s*\/\s*performance marketing$/i.test(label)) {
        return 'Paid Advertising';
    }
    return label;
};

const normalizeServiceItem = (service = {}) => {
    if (!service || typeof service !== 'object') return service;
    return {
        ...service,
        name: normalizeServiceDisplayName(service?.name),
        title: normalizeServiceDisplayName(service?.title),
    };
};

const isProposalMessage = (content = "") => {
    if (typeof content !== "string") return false;
    return /client name\s*:|project overview\s*:|primary objectives\s*:|features\/deliverables included\s*:/i.test(content);
};

const isAgencyProposalMessage = (content = "") => {
    if (!isProposalMessage(content)) return false;
    return /(^|\n)\s*service breakdown\s*:/i.test(String(content || ""));
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
const AUTO_HELPER_QUESTION_REGEX = /\b(budget|price|pricing|cost|timeline|ready|launch|deadline|when would you like|when do you want|how soon)\b/i;
const AUTO_RECOMMEND_OPTION_VALUE = 'Recommend best option';
const RECOMMENDATION_ACCEPTANCE_PATTERNS = [
    /\b(?:ok|okay|sure|perfect|great|fine|nice|cool)\b/i,
    /\b(?:sounds good|sounds great|works for me|that works|makes sense)\b/i,
    /\b(?:go with (?:that|it|this)|go ahead|use (?:that|it|this)|pick (?:that|it|this)|choose (?:that|it|this))\b/i,
    /\b(?:let(?:s| us) do (?:that|it|this)|proceed with (?:that|it|this)|continue with (?:that|it|this))\b/i,
    /\b(?:recommended (?:one|option)|best option)\b/i,
];
const RECOMMENDATION_ACCEPTANCE_BLOCKERS_REGEX = /\b(?:no|nope|nah|not|don't|do not|instead|different|another|else|change|question|why|how|what|which|but)\b/i;
const RECOMMENDATION_ACCEPTANCE_FILLER_WORDS = new Set([
    'accept',
    'accepted',
    'agree',
    'agreed',
    'ahead',
    'alright',
    'best',
    'choose',
    'continue',
    'cool',
    'do',
    'exactly',
    'fine',
    'go',
    'good',
    'great',
    'it',
    'lets',
    'me',
    'nice',
    'ok',
    'okay',
    'one',
    'option',
    'perfect',
    'pick',
    'please',
    'proceed',
    'recommendation',
    'recommended',
    'right',
    'selection',
    'sounds',
    'sure',
    'that',
    'this',
    'use',
    'with',
    'work',
    'works',
]);

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
    'Service Breakdown',
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

const extractOptionTextValue = (option = null) => {
    if (typeof option === 'string') return option;
    if (!option || typeof option !== 'object') return '';
    return String(option.label || option.value || option.text || '').trim();
};

const isLikelyRecommendationAcceptance = (value = '') => {
    const normalized = normalizeHelperIntentText(value);
    if (!normalized) return false;
    if (RECOMMENDATION_ACCEPTANCE_BLOCKERS_REGEX.test(normalized)) return false;
    if (RECOMMENDATION_ACCEPTANCE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    return tokens.length > 0
        && tokens.length <= 8
        && tokens.every((token) => RECOMMENDATION_ACCEPTANCE_FILLER_WORDS.has(token));
};

const collectKnownOptionPhrases = (...optionGroups) =>
    Array.from(
        new Set(
            optionGroups
                .flatMap((group) => (Array.isArray(group) ? group : []))
                .map((entry) => normalizeHelperIntentText(extractOptionTextValue(entry)))
                .filter((entry) => entry.length >= 3)
        )
    );

const messageMentionsKnownOption = (message = '', ...optionGroups) => {
    const normalizedMessage = normalizeHelperIntentText(message);
    if (!normalizedMessage) return false;

    return collectKnownOptionPhrases(...optionGroups).some((phrase) => {
        const optionPattern = new RegExp(`(^|\\s)${escapeRegExp(phrase).replace(/\s+/g, '\\s+')}($|\\s)`, 'i');
        return optionPattern.test(normalizedMessage);
    });
};

const resolvePendingRecommendedAnswer = ({
    pendingFollowup = null,
    notice = '',
    placeholder = '',
}) => {
    const explicitRecommendation = String(pendingFollowup?.recommendedAnswer || '').trim();
    if (explicitRecommendation) return explicitRecommendation;

    const placeholderMatch = String(placeholder || '').trim().match(/^e\.g\.\s*(.+)$/i);
    const placeholderValue = placeholderMatch?.[1]?.trim() || '';
    if (
        placeholderValue
        && !/\b(?:recommended|suggested|best fit|direction)\b/i.test(normalizeHelperIntentText(placeholderValue))
    ) {
        return placeholderValue;
    }

    const noticeMatch = String(notice || '').trim().match(/^Recommended:\s*(.+?)(?:\.\s|$)/i);
    const noticeValue = noticeMatch?.[1]?.trim() || '';
    if (
        noticeValue
        && !/\b(?:recommended|suggested|best fit|direction)\b/i.test(normalizeHelperIntentText(noticeValue))
    ) {
        return noticeValue;
    }

    return '';
};

const pickRecommendedChatOption = (options = []) => {
    const optionTexts = (Array.isArray(options) ? options : [])
        .map((option) => stripMarkdownDecorators(extractOptionTextValue(option)))
        .filter(Boolean);

    return optionTexts.find((text) => /\brecommend(?:ed)?\b/i.test(text))
        || optionTexts.find((text) => !FREEFORM_FOLLOWUP_OPTION_REGEX.test(normalizeHelperIntentText(text)))
        || '';
};

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

const shouldAutoRecommendCurrentQuestion = ({
    questionText = '',
    contextText = '',
}) => {
    const combinedPrompt = `${normalizeHelperIntentText(questionText)} ${normalizeHelperIntentText(contextText)}`.trim();
    return AUTO_HELPER_QUESTION_REGEX.test(combinedPrompt);
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

const PROPOSAL_DISPLAY_TOKEN_MAP = new Map([
    ['ai', 'AI'],
    ['api', 'API'],
    ['aws', 'AWS'],
    ['b2b', 'B2B'],
    ['b2c', 'B2C'],
    ['crm', 'CRM'],
    ['erp', 'ERP'],
    ['firebase', 'Firebase'],
    ['flutter', 'Flutter'],
    ['inr', 'INR'],
    ['ios', 'iOS'],
    ['mongodb', 'MongoDB'],
    ['mysql', 'MySQL'],
    ['netlify', 'Netlify'],
    ['next.js', 'Next.js'],
    ['nextjs', 'Next.js'],
    ['node.js', 'Node.js'],
    ['nodejs', 'Node.js'],
    ['postgresql', 'PostgreSQL'],
    ['react', 'React'],
    ['react.js', 'React.js'],
    ['saas', 'SaaS'],
    ['seo', 'SEO'],
    ['shopify', 'Shopify'],
    ['sql', 'SQL'],
    ['supabase', 'Supabase'],
    ['ui', 'UI'],
    ['ux', 'UX'],
    ['vercel', 'Vercel'],
    ['whatsapp', 'WhatsApp'],
    ['woocommerce', 'WooCommerce'],
    ['wordpress', 'WordPress'],
]);

const applyProposalDisplayTokenOverrides = (value = '') => {
    let normalized = String(value || '');
    for (const [source, target] of PROPOSAL_DISPLAY_TOKEN_MAP.entries()) {
        normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, 'gi'), target);
    }
    return normalized;
};

const formatProposalDisplaySentenceCaseToken = (token = '', capitalize = false) => {
    const raw = String(token || '');
    const key = raw.toLowerCase();
    if (PROPOSAL_DISPLAY_TOKEN_MAP.has(key)) {
        return PROPOSAL_DISPLAY_TOKEN_MAP.get(key);
    }

    if (/[A-Z].*[a-z]/.test(raw) || /[a-z].*[A-Z]/.test(raw)) {
        return raw;
    }

    const lowered = raw.toLowerCase();
    return capitalize
        ? `${lowered.charAt(0).toUpperCase()}${lowered.slice(1)}`
        : lowered;
};

const formatProposalDisplaySentenceCase = (value = '') => {
    const normalized = stripMarkdownDecorators(String(value || ''))
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return '';

    const cased = normalized
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => {
            let capitalized = false;
            return sentence.replace(/\S+/g, (token) => {
                if (!/[A-Za-z]/.test(token)) {
                    if (/[0-9]/.test(token)) {
                        capitalized = true;
                    }
                    return token;
                }

                const prefixMatch = token.match(/^[^A-Za-z0-9]+/);
                const suffixMatch = token.match(/[^A-Za-z0-9]+$/);
                const prefix = prefixMatch?.[0] || '';
                const suffix = suffixMatch?.[0] || '';
                const core = token.slice(prefix.length, token.length - suffix.length);
                if (!core) return token;

                const nextCore = formatProposalDisplaySentenceCaseToken(core, !capitalized);
                capitalized = true;
                return `${prefix}${nextCore}${suffix}`;
            });
        })
        .join(' ');

    return applyProposalDisplayTokenOverrides(cased);
};

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
            const bulletText = formatProposalDisplaySentenceCase(bulletMatch[1]);
            if (!activeSection) {
                activeSection = ensureProposalSection(sectionsMap, 'Details');
            }
            activeSection.list.push(bulletText);
            continue;
        }

        const keyValueMatch = line.match(/^([^:]{2,80}):\s*(.*)$/);
        if (keyValueMatch) {
            const rawKey = stripMarkdownDecorators(keyValueMatch[1]);
            const value = formatProposalDisplaySentenceCase(keyValueMatch[2] || '');
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
        activeSection.lines.push(formatProposalDisplaySentenceCase(line));
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

const getProposalSectionByTitles = (parsed = {}, titles = []) => {
    const titleSet = new Set(
        (Array.isArray(titles) ? titles : [])
            .map((title) => normalizeProposalKey(title))
            .filter(Boolean)
    );

    if (titleSet.size === 0) return null;
    return (Array.isArray(parsed?.sections) ? parsed.sections : []).find((section) =>
        titleSet.has(normalizeProposalKey(section?.title || ''))
    ) || null;
};

const getProposalSectionItems = (parsed = {}, titles = []) => {
    const section = getProposalSectionByTitles(parsed, titles);
    if (!section) return [];

    return [...(Array.isArray(section.lines) ? section.lines : []), ...(Array.isArray(section.list) ? section.list : [])]
        .map((item) => formatProposalDisplaySentenceCase(item))
        .filter(Boolean);
};

const uniqueProposalListItems = (items = []) =>
    Array.from(
        new Set(
            (Array.isArray(items) ? items : [])
                .map((item) => formatProposalDisplaySentenceCase(item))
                .filter(Boolean)
        )
    );

const AGENCY_CORE_PREFIX_FIELD_DEFINITIONS = [
    { label: 'Client Name', type: 'text' },
    { label: 'Business Name', type: 'text' },
    { label: 'Service Type', type: 'text' },
    { label: 'Project Overview', type: 'text' },
    { label: 'Primary Objectives', type: 'list' },
    { label: 'Features/Deliverables Included', type: 'list' },
];

const AGENCY_CORE_SUFFIX_FIELD_DEFINITIONS = [
    { label: 'Service Breakdown', type: 'list' },
    { label: 'Launch Timeline', type: 'text' },
    { label: 'Budget', type: 'text' },
];

const normalizeAgencyProposalFieldType = (value = 'text') =>
    String(value || '').trim().toLowerCase() === 'list' ? 'list' : 'text';

const buildAgencyProposalFieldDefinitions = (selectedServices = []) => {
    const mergedStructure = mergeProposalStructureDefinitions(
        (Array.isArray(selectedServices) ? selectedServices : []).map((service) => service?.agencyProposalStructure || '')
    );
    const customDefinitions = parseProposalStructureDefinitions(mergedStructure)
        .map((definition) => ({
            label: String(definition?.label || '').trim(),
            type: normalizeAgencyProposalFieldType(definition?.type),
        }))
        .filter((definition) => definition.label);

    if (customDefinitions.length === 0) {
        return [];
    }

    const customKeys = new Set(
        customDefinitions
            .map((definition) => normalizeProposalKey(definition.label))
            .filter(Boolean)
    );

    return [
        ...AGENCY_CORE_PREFIX_FIELD_DEFINITIONS.filter((definition) => !customKeys.has(normalizeProposalKey(definition.label))),
        ...customDefinitions,
        ...AGENCY_CORE_SUFFIX_FIELD_DEFINITIONS.filter((definition) => !customKeys.has(normalizeProposalKey(definition.label))),
    ];
};

const buildAgencyProposalSummary = ({
    selectedServices = [],
    normalizedRows = [],
}) => {
    const selectedServiceNames = (Array.isArray(selectedServices) ? selectedServices : [])
        .map((service) => String(service?.name || '').trim())
        .filter(Boolean);
    const serviceLabel = selectedServiceNames.join(', ');
    const firstParsed = normalizedRows[0]?.parsed || {};
    const clientName = firstParsed?.fields?.clientName || 'To be confirmed';
    const businessName = firstParsed?.fields?.businessName || firstParsed?.fields?.companyName || 'To be confirmed';

    const objectiveItems = uniqueProposalListItems(
        normalizedRows.flatMap((row) => getProposalSectionItems(row.parsed, ['Primary Objectives']))
    );
    const deliverableItems = uniqueProposalListItems(
        normalizedRows.flatMap((row) =>
            getProposalSectionItems(row.parsed, [
                'Features/Deliverables Included',
                'App Features',
                'Platform Requirements',
                'Additional Confirmed Inputs',
            ])
        )
    );
    const overviewSnippets = uniqueProposalListItems(
        normalizedRows.flatMap((row) => getProposalSectionItems(row.parsed, ['Project Overview']))
    );
    const timelineSummary = normalizedRows
        .map((row) => {
            const value = String(row?.parsed?.fields?.launchTimeline || '').trim();
            const serviceName = String(row?.service?.name || '').trim();
            return value && serviceName ? `${serviceName} - ${value}` : '';
        })
        .filter(Boolean)
        .join(' | ');
    const budgetSummary = normalizedRows
        .map((row) => {
            const value = String(row?.parsed?.fields?.budget || '').trim();
            const serviceName = String(row?.service?.name || '').trim();
            return value && serviceName ? `${serviceName} - ${value}` : '';
        })
        .filter(Boolean)
        .join(' | ');
    const serviceBreakdownItems = normalizedRows.map((row) => {
        const serviceName = String(row?.service?.name || row?.parsed?.fields?.serviceType || 'Selected Service').trim();
        const summaryItems = uniqueProposalListItems([
            ...getProposalSectionItems(row.parsed, ['Features/Deliverables Included', 'App Features']),
            ...getProposalSectionItems(row.parsed, ['Platform Requirements', 'Additional Confirmed Inputs']),
        ]);
        const fallbackOverview = getProposalSectionItems(row.parsed, ['Project Overview'])[0] || '';
        const summary = summaryItems.slice(0, 3).join('; ') || fallbackOverview || `Scope aligned to the confirmed ${serviceName.toLowerCase()} requirements.`;
        return `${serviceName}: ${summary}`;
    });

    const combinedObjectives = objectiveItems.length > 0
        ? objectiveItems
        : selectedServiceNames.map((serviceName) => `Deliver the confirmed ${serviceName} scope with coordinated execution.`);
    const combinedDeliverables = deliverableItems.length > 0
        ? deliverableItems
        : serviceBreakdownItems;
    const projectOverview = [
        serviceLabel
            ? `This proposal combines ${serviceLabel} into one coordinated engagement for ${businessName}.`
            : `This proposal combines the selected services into one coordinated engagement for ${businessName}.`,
        overviewSnippets[0] || '',
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    return {
        clientName,
        businessName,
        serviceLabel,
        projectOverview: projectOverview || 'This proposal aligns the selected services into one structured engagement based on the captured requirements.',
        combinedObjectives,
        combinedDeliverables,
        timelineSummary,
        budgetSummary,
        serviceBreakdownItems,
        defaultCustomText: serviceLabel
            ? `Delivery details for ${serviceLabel} will be aligned during the detailed agency planning phase.`
            : 'Delivery details will be aligned during the detailed agency planning phase.',
        defaultCustomList: serviceBreakdownItems.length > 0
            ? serviceBreakdownItems
            : ['Coordinate delivery across the selected services in one structured engagement.'],
    };
};

const collectAgencyFieldMatches = (normalizedRows = [], label = '') =>
    (Array.isArray(normalizedRows) ? normalizedRows : [])
        .map((row) => {
            const items = uniqueProposalListItems(getProposalSectionItems(row?.parsed, [label]));
            if (items.length === 0) return null;

            return {
                serviceName: String(row?.service?.name || row?.parsed?.fields?.serviceType || 'Selected Service').trim(),
                items,
            };
        })
        .filter(Boolean);

const buildAgencyFieldPayload = (definition = {}, { text = '', items = [] } = {}) => {
    const type = normalizeAgencyProposalFieldType(definition?.type);
    const normalizedItems = uniqueProposalListItems(items);

    if (type === 'list') {
        if (normalizedItems.length > 0) {
            return { type: 'list', items: normalizedItems };
        }
        const fallbackText = String(text || '').trim();
        return fallbackText ? { type: 'list', items: [fallbackText] } : null;
    }

    const normalizedText = String(text || '').trim() || normalizedItems.join(' | ');
    return normalizedText ? { type: 'text', text: normalizedText } : null;
};

const resolveAgencyCustomFieldPayload = (definition = {}, normalizedRows = [], summary = {}) => {
    const matches = collectAgencyFieldMatches(normalizedRows, definition?.label);
    if (matches.length === 0) {
        return buildAgencyFieldPayload(definition, {
            text: summary.defaultCustomText,
            items: summary.defaultCustomList,
        });
    }

    if (normalizeAgencyProposalFieldType(definition?.type) === 'list') {
        const items = matches.length > 1
            ? matches.flatMap((match) => match.items.map((item) => `${match.serviceName}: ${item}`))
            : matches[0].items;
        return buildAgencyFieldPayload(definition, { items });
    }

    const text = matches.length > 1
        ? matches.map((match) => `${match.serviceName}: ${match.items.join('; ')}`).join(' | ')
        : matches[0].items.join('; ');
    return buildAgencyFieldPayload(definition, { text });
};

const resolveAgencyFieldPayload = (definition = {}, normalizedRows = [], summary = {}) => {
    const normalizedLabel = normalizeProposalKey(definition?.label);

    if (normalizedLabel === 'client name') {
        return buildAgencyFieldPayload(definition, { text: summary.clientName || 'To be confirmed' });
    }
    if (normalizedLabel === 'business name') {
        return buildAgencyFieldPayload(definition, { text: summary.businessName || 'To be confirmed' });
    }
    if (normalizedLabel === 'service type') {
        return buildAgencyFieldPayload(definition, { text: summary.serviceLabel || 'Multi-service engagement' });
    }
    if (normalizedLabel === 'project overview') {
        return buildAgencyFieldPayload(definition, { text: summary.projectOverview });
    }
    if (normalizedLabel === 'primary objectives') {
        return buildAgencyFieldPayload(definition, { items: summary.combinedObjectives });
    }
    if (normalizedLabel === 'features deliverables included') {
        return buildAgencyFieldPayload(definition, { items: summary.combinedDeliverables });
    }
    if (normalizedLabel === 'service breakdown') {
        return buildAgencyFieldPayload(definition, { items: summary.serviceBreakdownItems });
    }
    if (normalizedLabel === 'launch timeline') {
        return buildAgencyFieldPayload(definition, { text: summary.timelineSummary || 'To be confirmed' });
    }
    if (normalizedLabel === 'budget') {
        return buildAgencyFieldPayload(definition, { text: summary.budgetSummary || 'To be confirmed' });
    }

    return resolveAgencyCustomFieldPayload(definition, normalizedRows, summary);
};

const renderAgencyProposalFromDefinitions = ({
    definitions = [],
    normalizedRows = [],
    summary = {},
}) =>
    (Array.isArray(definitions) ? definitions : [])
        .flatMap((definition) => {
            const payload = resolveAgencyFieldPayload(definition, normalizedRows, summary);
            if (!payload) return [];

            if (payload.type === 'list') {
                return [
                    `${definition.label}:`,
                    ...payload.items.map((item) => `- ${item}`),
                    '',
                ];
            }

            return [
                `${definition.label}: ${payload.text}`,
                '',
            ];
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const buildAgencyCombinedProposal = ({
    selectedServices = [],
    serviceProposals = [],
}) => {
    const normalizedRows = (Array.isArray(serviceProposals) ? serviceProposals : [])
        .map((row) => ({
            service: row?.service || {},
            parsed: row?.parsed || parseProposalContent(row?.content || ''),
            content: normalizeMarkdownContent(row?.content || ''),
        }))
        .filter((row) => row.content);
    const summary = buildAgencyProposalSummary({
        selectedServices,
        normalizedRows,
    });
    const agencyFieldDefinitions = buildAgencyProposalFieldDefinitions(selectedServices);

    if (agencyFieldDefinitions.length > 0) {
        return renderAgencyProposalFromDefinitions({
            definitions: agencyFieldDefinitions,
            normalizedRows,
            summary,
        });
    }

    return [
        `Client Name: ${summary.clientName}`,
        `Business Name: ${summary.businessName}`,
        `Service Type: ${summary.serviceLabel || 'Multi-service engagement'}`,
        summary.timelineSummary ? `Launch Timeline: ${summary.timelineSummary}` : '',
        summary.budgetSummary ? `Budget: ${summary.budgetSummary}` : '',
        '',
        'Project Overview:',
        summary.projectOverview,
        '',
        'Primary Objectives:',
        ...summary.combinedObjectives.map((item) => `- ${item}`),
        '',
        'Features/Deliverables Included:',
        ...summary.combinedDeliverables.map((item) => `- ${item}`),
        '',
        'Service Breakdown:',
        ...summary.serviceBreakdownItems.map((item) => `- ${item}`),
    ]
        .filter(Boolean)
        .join('\n')
        .trim();
};

/**
 * Extracts business/brand name from chat history by scanning the latest proposal.
 * @param {Array} messages
 * @returns {string}
 */
const extractBusinessNameFromHistory = (messages = []) => {
    const list = Array.isArray(messages) ? messages : [];

    // 1. Try to get from the latest proposal first (most reliable)
    const latestProposal = [...list].reverse().find(
        (msg) => msg?.role === 'assistant' && isProposalMessage(msg?.content || '')
    );
    if (latestProposal) {
        const parsed = parseProposalContent(latestProposal.content);
        if (parsed.fields?.businessName) return parsed.fields.businessName;
    }

    // 2. Scan conversation: find user answer after AI asks about brand/company name
    const BRAND_QUESTION_RE = /\b(brand\s*(name|names)?|company\s*(name|names)?|business\s*(name|names)?)\b/i;
    const BRAND_ANSWER_MAX_LEN = 50; // brand names are short
    for (let i = 0; i < list.length - 1; i++) {
        const msg = list[i];
        if (msg?.role !== 'assistant') continue;
        const msgContent = String(msg?.content || '');
        // AI must be ASKING a question about the brand name
        if (!BRAND_QUESTION_RE.test(msgContent)) continue;
        if (!msgContent.includes('?')) continue; // must be a question
        // Find the very next user message
        for (let j = i + 1; j < list.length; j++) {
            const next = list[j];
            if (next?.role !== 'user') continue;
            const { text } = parseMessageContentWithAttachments(next?.content || '', next?.attachments || []);
            const trimmed = String(text || '').trim();
            // Brand names: short, single-line, no URLs, not a sentence (no periods/questions in middle)
            const looksLikeBrandName = trimmed.length > 0
                && trimmed.length <= BRAND_ANSWER_MAX_LEN
                && !trimmed.includes('\n')
                && !/^https?:\/\//i.test(trimmed)
                && !/[.!?]/.test(trimmed.slice(0, -1)); // no sentence punctuation except at end
            if (looksLikeBrandName) {
                return trimmed;
            }
            break;
        }
    }

    return '';
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

    const handleCardGlowMouseMove = useCallback((event) => {
        const cardElement = event.currentTarget;
        const bounds = cardElement.getBoundingClientRect();
        cardElement.style.setProperty('--card-glow-x', `${event.clientX - bounds.left}px`);
        cardElement.style.setProperty('--card-glow-y', `${event.clientY - bounds.top}px`);
    }, []);

    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [serviceSelectionMode, setServiceSelectionMode] = useState(
        SERVICE_SELECTION_MODES.FREELANCER
    );
    const [services, setServices] = useState([]);
    const [servicesError, setServicesError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [agencySelectedServiceIds, setAgencySelectedServiceIds] = useState([]);
    const [agencyFlowState, setAgencyFlowState] = useState(() => createEmptyAgencyFlowState());
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
    const [thinkingState, setThinkingState] = useState(null);
    const [isProposalsModalOpen, setIsProposalsModalOpen] = useState(false);
    const [activeResourceLibrary, setActiveResourceLibrary] = useState(null);
    const [sidebarDropdowns, setSidebarDropdowns] = useState({
        proposals: false,
        links: false,
        files: false,
        chats: true,
    });

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const attachmentInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const thinkingIntervalRef = useRef(null);
    const messagesRef = useRef(messages);
    const agencyFlowStateRef = useRef(agencyFlowState);
    const dismissedAutoHelperKeysRef = useRef(new Set());
    const speechBaseInputRef = useRef("");
    const speechFinalRef = useRef("");
    const suppressSpeechCommitRef = useRef(false);
    const normalizedInputType = (inputConfig.type || 'text').toLowerCase();
    const isSidebarCompact = sidebarSize === 'small';
    const isAgencySelectionMode = serviceSelectionMode === SERVICE_SELECTION_MODES.AGENCY;
    const isAgencyFlowActive = agencyFlowState.active;
    const isAgencyFlowCompleted = isAgencyFlowActive && agencyFlowState.completed;
    const agencySelectedServices = agencySelectedServiceIds
        .map((serviceId) => services.find((service) => getServiceIdentifier(service) === serviceId))
        .filter(Boolean);
    const isMultiInput = normalizedInputType === 'multi_select'
        || normalizedInputType === 'multi_option'
        || normalizedInputType === 'grouped_multi_select';
    const hasOptionInput = Array.isArray(inputConfig.options) && inputConfig.options.length > 0;
    const shouldShowTextInput = true;
    const visiblePreviousChats = previousChats.filter((chat) => chat?.sessionId);
    const { urls: sharedLinks, attachments: sharedAttachments } = extractSharedResourcesFromMessages(messages);
    const activeResourceLibraryConfig = activeResourceLibrary === 'links'
        ? {
            title: 'Saved Links',
            icon: Globe,
            items: sharedLinks,
            emptyMessage: 'No links shared in this chat yet.',
        }
        : activeResourceLibrary === 'files'
            ? {
                title: 'Shared Files & Media',
                icon: FileText,
                items: sharedAttachments,
                emptyMessage: 'No files or images shared in this chat yet.',
            }
            : null;
    const ActiveResourceLibraryIcon = activeResourceLibraryConfig?.icon || FileText;
    const isUserLoggedIn = Boolean(isAuthenticated && user);
    const userPrefillName = [user?.fullName, user?.name]
        .map((value) => String(value || '').trim())
        .find(Boolean) || '';
    const userDisplayName = userPrefillName || "Logged-in user";
    const userDisplayEmail = user?.email || "";
    const userAvatar = user?.avatar || user?.profileImage || user?.image || "";
    const selectedProposalPreviewCtaLabel = isAgencyProposalMessage(selectedProposalPreview?.content || '')
        ? 'Find Agency for this proposal'
        : 'Find Freelancer for this proposal';

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        agencyFlowStateRef.current = agencyFlowState;
    }, [agencyFlowState]);

    const replaceMessages = useCallback((nextValue) => {
        const resolvedMessages = typeof nextValue === 'function'
            ? nextValue(messagesRef.current)
            : nextValue;
        const normalizedMessages = Array.isArray(resolvedMessages) ? resolvedMessages : [];
        messagesRef.current = normalizedMessages;
        setMessages(normalizedMessages);
        return normalizedMessages;
    }, []);

    const updateAgencyFlowState = useCallback((nextValue) => {
        const resolvedState = typeof nextValue === 'function'
            ? nextValue(agencyFlowStateRef.current)
            : nextValue;
        const normalizedState = resolvedState && typeof resolvedState === 'object'
            ? resolvedState
            : createEmptyAgencyFlowState();
        agencyFlowStateRef.current = normalizedState;
        setAgencyFlowState(normalizedState);
        return normalizedState;
    }, []);

    const refreshPreviousChats = useCallback(() => {
        setPreviousChats(readStoredGuestSessions());
    }, []);

    const refreshGeneratedProposals = useCallback(() => {
        setGeneratedProposals(readStoredGeneratedProposals(user?.id));
    }, [user?.id]);

    const buildProposalSaveMetadata = useCallback((proposalContent, sourceProposal = null) => {
        const sourceProposalContext = sourceProposal?.proposalContext
            && typeof sourceProposal.proposalContext === 'object'
            && !Array.isArray(sourceProposal.proposalContext)
            ? sourceProposal.proposalContext
            : {};
        const nextProposalContext = { ...sourceProposalContext };
        const normalizedProposalContent = normalizeMarkdownContent(proposalContent);

        if (isAgencyProposalMessage(normalizedProposalContent)) {
            const currentAgencyFlow = agencyFlowStateRef.current;
            const selectedServices = Array.isArray(sourceProposalContext?.selectedServices)
                && sourceProposalContext.selectedServices.length > 0
                ? sourceProposalContext.selectedServices
                : currentAgencyFlow.selectedServices;
            const normalizedSelectedServices = selectedServices
                .map((service) => toStoredProposalServiceEntry(service))
                .filter(Boolean);
            const sharedAnswers = Object.keys(normalizeAgencySharedAnswers(sourceProposalContext?.sharedAnswers)).length > 0
                ? normalizeAgencySharedAnswers(sourceProposalContext.sharedAnswers)
                : normalizeAgencySharedAnswers(currentAgencyFlow.sharedAnswers);

            nextProposalContext.flowMode = SERVICE_SELECTION_MODES.AGENCY;
            if (normalizedSelectedServices.length > 0) {
                nextProposalContext.selectedServices = normalizedSelectedServices;
                nextProposalContext.selectedServiceIds = normalizedSelectedServices
                    .map((service) => String(service?.id || service?.slug || service?.name || '').trim())
                    .filter(Boolean);
                nextProposalContext.selectedServiceNames = normalizedSelectedServices
                    .map((service) => String(service?.name || service?.id || service?.slug || '').trim())
                    .filter(Boolean);
                const mergedAgencyProposalStructure = mergeProposalStructureDefinitions(
                    normalizedSelectedServices.map((service) => service?.agencyProposalStructure || '')
                );
                if (mergedAgencyProposalStructure) {
                    nextProposalContext.proposalStructure = mergedAgencyProposalStructure;
                }
            }
            if (Object.keys(sharedAnswers).length > 0) {
                nextProposalContext.sharedAnswers = sharedAnswers;
            }
        } else {
            const normalizedSelectedServices = (
                Array.isArray(sourceProposalContext?.selectedServices)
                    && sourceProposalContext.selectedServices.length > 0
                    ? sourceProposalContext.selectedServices
                    : [selectedService]
            )
                .map((service) => toStoredProposalServiceEntry(service))
                .filter(Boolean);
            const primarySelectedService = normalizedSelectedServices[0] || null;

            if (primarySelectedService) {
                nextProposalContext.flowMode = SERVICE_SELECTION_MODES.FREELANCER;
                nextProposalContext.selectedServices = normalizedSelectedServices;
                nextProposalContext.selectedServiceIds = normalizedSelectedServices
                    .map((service) => service.id)
                    .filter(Boolean);
                nextProposalContext.selectedServiceNames = normalizedSelectedServices
                    .map((service) => service.name || service.id)
                    .filter(Boolean);
                nextProposalContext.serviceId = primarySelectedService.id;
                if (primarySelectedService.name) {
                    nextProposalContext.serviceName = primarySelectedService.name;
                }
            }
        }

        return Object.keys(nextProposalContext).length > 0
            ? { proposalContext: nextProposalContext }
            : {};
    }, [selectedService]);

    const toggleSidebarDropdown = useCallback((section) => {
        setSidebarDropdowns((current) => ({
            ...current,
            [section]: !current[section],
        }));
    }, []);

    const stopThinkingTrace = useCallback(() => {
        if (thinkingIntervalRef.current) {
            window.clearInterval(thinkingIntervalRef.current);
            thinkingIntervalRef.current = null;
        }
        setThinkingState(null);
    }, []);

    const startThinkingTrace = useCallback((startedAt = getNowTimestamp()) => {
        if (thinkingIntervalRef.current) {
            window.clearInterval(thinkingIntervalRef.current);
        }

        const updateThinkingState = () => {
            const elapsedMs = Math.max(0, getNowTimestamp() - startedAt);
            setThinkingState(buildThinkingState(elapsedMs));
        };

        updateThinkingState();
        thinkingIntervalRef.current = window.setInterval(updateThinkingState, 120);
    }, []);

    useEffect(() => () => {
        if (thinkingIntervalRef.current) {
            window.clearInterval(thinkingIntervalRef.current);
        }
    }, []);

    const toggleSidebarSize = useCallback(() => {
        setSidebarSize((previous) => {
            const next = previous === 'small' ? 'large' : 'small';
            writeStoredSidebarSize(next);
            return next;
        });
    }, []);

    const expandSidebar = useCallback(() => {
        setSidebarSize('large');
        writeStoredSidebarSize('large');
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
            businessName: extractBusinessNameFromHistory(list),
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
            ? "I will recommend the best fit for this step based on your project context."
            : `Got it. Tell me what you have in mind for ${pendingOptionLabel}, and I will tailor it for you.`
        : "";
    const pendingOptionPlaceholder = isPendingOptionFollowup
        ? isNotSureFollowup
            ? "e.g. use the recommended answer..."
            : `Tell me a bit more about "${pendingOptionLabel}"...`
        : "Message CATA AI...";
    const latestAssistantMessage = [...messages].reverse().find((message) => message?.role === 'assistant');
    const latestAssistantIsProposal = isProposalMessage(latestAssistantMessage?.content || '');
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
    const contextualPendingOptionNotice = stripMarkdownDecorators(
        pendingOptionFollowup?.loadingAdvice
            ? ((pendingOptionFollowup?.autoSuggestion || isNotSureFollowup) ? "Asking AI for a recommendation..." : "Asking AI for advice...")
            : (pendingOptionFollowup?.notice || contextualPendingOptionHelperCopy.notice || pendingOptionNotice)
    );
    const contextualPendingOptionPlaceholder = stripMarkdownDecorators(pendingOptionFollowup?.loadingAdvice ? "Please wait..." : (pendingOptionFollowup?.placeholder || contextualPendingOptionHelperCopy.placeholder || pendingOptionPlaceholder));
    const pendingRecommendedAnswer = resolvePendingRecommendedAnswer({
        pendingFollowup: pendingOptionFollowup,
        notice: contextualPendingOptionNotice,
        placeholder: contextualPendingOptionPlaceholder,
    });
    const shouldAutoRecommendQuestion = !latestAssistantIsProposal
        && Boolean(latestAssistantPrompt.questionText)
        && shouldAutoRecommendCurrentQuestion({
            questionText: latestAssistantPrompt.questionText,
            contextText: latestAssistantPrompt.contextText,
        });
    const automaticQuestionHelperKey = shouldAutoRecommendQuestion
        ? `${sessionId || 'guest'}::${normalizeOptionToken(latestAssistantPrompt.questionText)}::${normalizeOptionToken(latestAssistantPrompt.contextText)}`
        : '';

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

    const fetchOptionAdvice = useCallback(async (optionValue, extraContext = {}) => {
        const isRecommendationRequest = extraContext.mode === 'auto_question_recommendation'
            || /\b(not sure|other|suggest|recommend|advice|help)\b/i.test(String(optionValue || ''));
        const currentQ = extraContext.questionText ?? latestAssistantPrompt.questionText;
        const questionContext = extraContext.assistantContext ?? latestAssistantPrompt.contextText;
        const currentOptions = Array.isArray(extraContext.currentOptions)
            ? extraContext.currentOptions
            : latestAssistantPrompt.options;
        const localRecommendedAnswer = isRecommendationRequest
            ? pickRecommendedChatOption(currentOptions)
            : '';
        const fallbackNotice = isRecommendationRequest
            ? (
                /^(yes|no)$/i.test(stripMarkdownDecorators(localRecommendedAnswer))
                    ? 'Recommended direction: use the strongest fit for this step based on your current project direction.'
                    : (localRecommendedAnswer
                        ? `Recommended: ${stripMarkdownDecorators(localRecommendedAnswer)}. This is the strongest fit based on your current project direction.`
                        : 'Recommended direction: use the strongest fit for this step based on your current project direction.')
            )
            : `Got it. ${stripMarkdownDecorators(optionValue)}.`;
        const fallbackPlaceholder = isRecommendationRequest
            ? (
                /^(yes|no)$/i.test(stripMarkdownDecorators(localRecommendedAnswer))
                    ? 'e.g. go with the recommended direction'
                    : (localRecommendedAnswer
                        ? `e.g. ${stripMarkdownDecorators(localRecommendedAnswer)}`
                        : 'e.g. go with the recommended direction')
            )
            : 'Tell me a bit more...';

        try {
            const contextText = messages
                .filter((msg) => msg?.role === 'user')
                .slice(-4)
                .map((msg) => msg?.content)
                .join(' ');

            const response = await request('/guest/advice', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    serviceId: selectedService?.slug || selectedService?.id,
                    option: optionValue,
                    context: contextText,
                    currentQuestion: currentQ,
                    assistantContext: questionContext,
                    currentOptions,
                    mode: extraContext.mode || 'manual_option_followup',
                })
            });
            const data = unwrapPayload(response);
            setPendingOptionFollowup((current) => {
                if (current?.optionValue !== optionValue) return current;
                if (extraContext.questionKey && current?.questionKey && current.questionKey !== extraContext.questionKey) {
                    return current;
                }
                return {
                    ...current,
                    loadingAdvice: false,
                    notice: stripMarkdownDecorators(data?.notice || fallbackNotice),
                    placeholder: stripMarkdownDecorators(data?.placeholder || fallbackPlaceholder),
                    recommendedAnswer: stripMarkdownDecorators(String(data?.recommendedAnswer || localRecommendedAnswer || '').trim()),
                };
            });
        } catch {
            setPendingOptionFollowup((current) => {
                if (current?.optionValue !== optionValue) return current;
                if (extraContext.questionKey && current?.questionKey && current.questionKey !== extraContext.questionKey) {
                    return current;
                }
                return {
                    ...current,
                    loadingAdvice: false,
                    notice: stripMarkdownDecorators(fallbackNotice),
                    placeholder: stripMarkdownDecorators(fallbackPlaceholder),
                    recommendedAnswer: stripMarkdownDecorators(String(current?.recommendedAnswer || localRecommendedAnswer || '').trim()),
                };
            });
        }
    }, [
        latestAssistantPrompt.contextText,
        latestAssistantPrompt.options,
        latestAssistantPrompt.questionText,
        messages,
        selectedService?.id,
        selectedService?.slug,
        sessionId,
    ]);

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
        if (!pendingOptionFollowup?.autoSuggestion) return;

        if (!automaticQuestionHelperKey) {
            setPendingOptionFollowup(null);
        }
    }, [automaticQuestionHelperKey, pendingOptionFollowup?.autoSuggestion]);

    useEffect(() => {
        if (!automaticQuestionHelperKey) return;
        if (dismissedAutoHelperKeysRef.current.has(automaticQuestionHelperKey)) return;

        if (pendingOptionFollowup?.autoSuggestion) {
            if (pendingOptionFollowup.questionKey === automaticQuestionHelperKey) return;
        } else if (pendingOptionFollowup) {
            return;
        }

        setPendingOptionFollowup({
            optionValue: AUTO_RECOMMEND_OPTION_VALUE,
            loadingAdvice: true,
            autoSuggestion: true,
            questionKey: automaticQuestionHelperKey,
        });
        fetchOptionAdvice(AUTO_RECOMMEND_OPTION_VALUE, {
            mode: 'auto_question_recommendation',
            questionText: latestAssistantPrompt.questionText,
            assistantContext: latestAssistantPrompt.contextText,
            currentOptions: latestAssistantPrompt.options,
            questionKey: automaticQuestionHelperKey,
        });
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => focusMessageInput());
        }
    }, [
        automaticQuestionHelperKey,
        fetchOptionAdvice,
        focusMessageInput,
        latestAssistantPrompt.contextText,
        latestAssistantPrompt.options,
        latestAssistantPrompt.questionText,
        pendingOptionFollowup,
    ]);

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
            const normalizedServices = extractServices(response).map(normalizeServiceItem);
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

    const resetChatComposerState = useCallback(() => {
        setInput('');
        setPendingAttachments([]);
        setSelectedOptions([]);
        setPendingOptionFollowup(null);
        setInputConfig({ type: 'text', options: [] });
    }, []);

    const resetAgencyFlow = useCallback(() => {
        updateAgencyFlowState(createEmptyAgencyFlowState());
    }, [updateAgencyFlowState]);

    const toggleAgencyServiceSelection = useCallback((service) => {
        const serviceId = getServiceIdentifier(service);
        if (!serviceId) return;

        setAgencySelectedServiceIds((current) => (
            current.includes(serviceId)
                ? current.filter((value) => value !== serviceId)
                : [...current, serviceId]
        ));
    }, []);

    const startServiceConversation = useCallback(async (service, options = {}) => {
        if (!service) return null;

        const preserveExistingMessages = Boolean(options.preserveExistingMessages);
        const baseMessages = Array.isArray(options.baseMessages)
            ? options.baseMessages
            : (preserveExistingMessages ? messagesRef.current : []);
        const nextSessionStartIndex = Number.isInteger(options.sessionStartIndex)
            ? options.sessionStartIndex
            : (preserveExistingMessages ? baseMessages.length : 0);
        const flowMode = options.flowMode || SERVICE_SELECTION_MODES.FREELANCER;
        const sharedAnswers = normalizeAgencySharedAnswers(options.sharedAnswers);

        dismissedAutoHelperKeysRef.current = new Set();
        expandSidebar();
        setSelectedService(service);
        setLoading(true);
        resetChatComposerState();

        if (!preserveExistingMessages) {
            replaceMessages([]);
        }

        try {
            const requestStartedAt = getNowTimestamp();
            const response = await request('/guest/start', {
                method: 'POST',
                timeout: 120000,
                body: JSON.stringify({
                    serviceId: service.slug || service.id,
                    ...(userPrefillName ? { prefillName: userPrefillName } : {}),
                    ...(Object.keys(sharedAnswers).length > 0 ? { sharedAnswers } : {}),
                })
            });
            const data = unwrapPayload(response);
            const completedThinkingMeta = buildThinkingMeta(
                Math.max(0, getNowTimestamp() - requestStartedAt),
                {
                    server: data?.timingMeta || null,
                    client: {
                        clientPreparationDurationMs: 0,
                        uploadDurationMs: 0,
                        apiRoundTripDurationMs: Math.max(0, getNowTimestamp() - requestStartedAt),
                    },
                }
            );
            logGuestAiBrowserDebug('guest/start', {
                timingMeta: data?.timingMeta || null,
                sessionId: data?.sessionId || '',
                serviceId: service?.slug || service?.id || '',
                serviceName: service?.name || '',
            });

            if (!data?.sessionId) {
                console.warn('[GuestAIDemo] Unexpected start payload:', response);
                throw new Error('Failed to start chat session');
            }

            setSessionId(data.sessionId);

            const nextSessionHistory = Array.isArray(data.history) && data.history.length > 0
                ? mergeMessagesWithThinkingMeta(
                    data.history,
                    [],
                    completedThinkingMeta
                )
                : [{
                    role: 'assistant',
                    content: data.message || `Hello! I see you're interested in **${service.name}**.`,
                    thinkingMeta: completedThinkingMeta,
                }];

            if (preserveExistingMessages) {
                replaceMessages([...baseMessages, ...nextSessionHistory]);
            } else {
                replaceMessages(nextSessionHistory);
            }

            setInputConfig(data.inputConfig || { type: 'text', options: [] });

            if (flowMode === SERVICE_SELECTION_MODES.AGENCY) {
                const nextSharedAnswers = mergeAgencySharedAnswers(sharedAnswers, data?.sharedAnswers);
                updateAgencyFlowState((current) => ({
                    ...current,
                    active: true,
                    completed: false,
                    currentSessionStartIndex: nextSessionStartIndex,
                    serviceSessions: upsertAgencyServiceSession(current.serviceSessions, service, data.sessionId),
                    sharedAnswers: Object.keys(nextSharedAnswers).length > 0
                        ? mergeAgencySharedAnswers(current.sharedAnswers, nextSharedAnswers)
                        : current.sharedAnswers,
                }));
            }

            return {
                sessionId: data.sessionId,
                history: nextSessionHistory,
                service,
            };
        } catch (error) {
            console.error('[GuestAIDemo] Failed to start chat session:', error);
            toast.error(error?.message || "Failed to start chat session");
            if (!preserveExistingMessages) {
                setSelectedService(null);
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [
        expandSidebar,
        replaceMessages,
        resetChatComposerState,
        updateAgencyFlowState,
        userPrefillName,
    ]);

    const startAgencyFlow = useCallback(async (selectedServicesOverride = null) => {
        const resolvedServices = Array.isArray(selectedServicesOverride) && selectedServicesOverride.length > 0
            ? selectedServicesOverride
            : agencySelectedServices;
        if (resolvedServices.length === 0) {
            toast.info('Select at least one service to continue with the agency flow.');
            return;
        }

        setServiceSelectionMode(SERVICE_SELECTION_MODES.AGENCY);
        setAgencySelectedServiceIds(resolvedServices.map((service) => getServiceIdentifier(service)));
        updateAgencyFlowState({
            active: true,
            selectedServices: resolvedServices,
            currentServiceIndex: 0,
            currentSessionStartIndex: 0,
            serviceProposals: [],
            serviceSessions: [],
            sharedAnswers: {},
            followupTargetServiceId: '',
            awaitingFollowupServiceSelection: false,
            pendingFollowupMessage: '',
            completed: false,
        });

        const startedSession = await startServiceConversation(resolvedServices[0], {
            preserveExistingMessages: false,
            flowMode: SERVICE_SELECTION_MODES.AGENCY,
            sessionStartIndex: 0,
        });
        if (!startedSession) {
            resetAgencyFlow();
        }
    }, [agencySelectedServices, resetAgencyFlow, startServiceConversation, updateAgencyFlowState]);

    const handleRestartCurrentFlow = useCallback(async () => {
        const currentAgencyFlow = agencyFlowStateRef.current;
        if (currentAgencyFlow.active && currentAgencyFlow.selectedServices.length > 0) {
            await startAgencyFlow(currentAgencyFlow.selectedServices);
            return;
        }

        if (selectedService) {
            setServiceSelectionMode(SERVICE_SELECTION_MODES.FREELANCER);
            setAgencySelectedServiceIds([]);
            resetAgencyFlow();
            await startServiceConversation(selectedService, {
                preserveExistingMessages: false,
                flowMode: SERVICE_SELECTION_MODES.FREELANCER,
            });
        }
    }, [resetAgencyFlow, selectedService, startAgencyFlow, startServiceConversation]);

    const handleLoadPreviousChat = async (chatMeta) => {
        if (!chatMeta?.sessionId) return;
        dismissedAutoHelperKeysRef.current = new Set();
        expandSidebar();
        setServiceSelectionMode(SERVICE_SELECTION_MODES.FREELANCER);
        setAgencySelectedServiceIds([]);
        resetAgencyFlow();
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
        resetChatComposerState();
        replaceMessages([]);

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
                replaceMessages(restored);
            } else {
                replaceMessages([{
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
        setServiceSelectionMode(SERVICE_SELECTION_MODES.FREELANCER);
        setAgencySelectedServiceIds([]);
        resetAgencyFlow();
        await startServiceConversation(service, {
            preserveExistingMessages: false,
            flowMode: SERVICE_SELECTION_MODES.FREELANCER,
        });
    };

    const handleAgencyServiceProposal = useCallback(async ({
        activeService,
        sessionHistory,
        proposalContent,
        thinkingMeta,
        sharedAnswers = {},
    }) => {
        const currentAgencyFlow = agencyFlowStateRef.current;
        if (!currentAgencyFlow.active) return false;
        const nextSharedAnswers = mergeAgencySharedAnswers(
            currentAgencyFlow.sharedAnswers,
            sharedAnswers
        );

        let proposalMessageIndex = -1;
        for (let index = sessionHistory.length - 1; index >= 0; index -= 1) {
            const message = sessionHistory[index];
            if (message?.role === 'assistant' && isProposalMessage(message?.content || '')) {
                proposalMessageIndex = index;
                break;
            }
        }

        const trimmedSessionHistory = proposalMessageIndex >= 0
            ? sessionHistory.slice(0, proposalMessageIndex)
            : sessionHistory;
        const nextServiceProposals = [
            ...currentAgencyFlow.serviceProposals,
            {
                service: activeService,
                content: proposalContent,
                parsed: parseProposalContent(proposalContent),
            },
        ];
        const hasNextService = currentAgencyFlow.currentServiceIndex < currentAgencyFlow.selectedServices.length - 1;

        if (hasNextService) {
            const nextService = currentAgencyFlow.selectedServices[currentAgencyFlow.currentServiceIndex + 1];
            const transitionMessage = {
                role: 'assistant',
                content: `I have captured the ${activeService?.name || 'current service'} requirements. Next, let's cover ${nextService?.name || 'the next service'}.`,
                thinkingMeta,
            };
            const nextDisplayedMessages = [
                ...messagesRef.current.slice(0, currentAgencyFlow.currentSessionStartIndex),
                ...trimmedSessionHistory,
                transitionMessage,
            ];

            replaceMessages(nextDisplayedMessages);
            persistCurrentSessionSummary(trimmedSessionHistory, activeService);
            updateAgencyFlowState((current) => ({
                ...current,
                serviceProposals: nextServiceProposals,
                currentServiceIndex: current.currentServiceIndex + 1,
                currentSessionStartIndex: nextDisplayedMessages.length,
                sharedAnswers: nextSharedAnswers,
                followupTargetServiceId: '',
                awaitingFollowupServiceSelection: false,
                pendingFollowupMessage: '',
                completed: false,
            }));

            await startServiceConversation(nextService, {
                preserveExistingMessages: true,
                baseMessages: nextDisplayedMessages,
                sessionStartIndex: nextDisplayedMessages.length,
                flowMode: SERVICE_SELECTION_MODES.AGENCY,
                sharedAnswers: nextSharedAnswers,
            });
            return true;
        }

        const combinedProposal = buildAgencyCombinedProposal({
            selectedServices: currentAgencyFlow.selectedServices,
            serviceProposals: nextServiceProposals,
        });
        const finalMessages = [
            ...messagesRef.current.slice(0, currentAgencyFlow.currentSessionStartIndex),
            ...trimmedSessionHistory,
            {
                role: 'assistant',
                content: `I have gathered the requirements for all ${currentAgencyFlow.selectedServices.length} selected services. Here is your combined proposal.`,
            },
            {
                role: 'assistant',
                content: combinedProposal,
                thinkingMeta,
            },
        ];

        replaceMessages(finalMessages);
        persistCurrentSessionSummary(trimmedSessionHistory, activeService);
        setInputConfig({ type: 'text', options: [] });
        updateAgencyFlowState((current) => ({
            ...current,
            serviceProposals: nextServiceProposals,
            sharedAnswers: nextSharedAnswers,
            followupTargetServiceId: '',
            awaitingFollowupServiceSelection: false,
            pendingFollowupMessage: '',
            completed: true,
        }));
        return true;
    }, [
        persistCurrentSessionSummary,
        replaceMessages,
        startServiceConversation,
        updateAgencyFlowState,
    ]);

    const getAgencyServiceSelectionOptions = useCallback((selectedServices = []) => (
        (Array.isArray(selectedServices) ? selectedServices : [])
            .map((service) => String(service?.name || '').trim())
            .filter(Boolean)
    ), []);

    const appendAssistantMessage = useCallback((content, thinkingMeta = null) => (
        replaceMessages((prev) => [
            ...prev,
            thinkingMeta
                ? { role: 'assistant', content, thinkingMeta }
                : { role: 'assistant', content },
        ])
    ), [replaceMessages]);

    const handleAgencyCompletedFollowupResponse = useCallback(({
        data,
        targetService,
        thinkingMeta,
    }) => {
        const currentAgencyFlow = agencyFlowStateRef.current;
        const responseSharedAnswers = normalizeAgencySharedAnswers(data?.sharedAnswers);
        const nextSharedAnswers = Object.keys(responseSharedAnswers).length > 0
            ? mergeAgencySharedAnswers(currentAgencyFlow.sharedAnswers, responseSharedAnswers)
            : currentAgencyFlow.sharedAnswers;
        const latestAssistantReply = Array.isArray(data?.history)
            ? [...data.history].reverse().find((message) => message?.role === 'assistant')
            : (typeof data?.message === 'string' && data.message.trim()
                ? { role: 'assistant', content: data.message.trim() }
                : null);

        if (!latestAssistantReply?.content) {
            setInputConfig(data?.inputConfig || { type: 'text', options: [] });
            updateAgencyFlowState((current) => ({
                ...current,
                sharedAnswers: nextSharedAnswers,
            }));
            return;
        }

        if (isProposalMessage(latestAssistantReply.content || '')) {
            const nextServiceProposals = replaceAgencyServiceProposal(currentAgencyFlow.serviceProposals, {
                service: targetService,
                content: latestAssistantReply.content || '',
                parsed: parseProposalContent(latestAssistantReply.content || ''),
            });
            const combinedProposal = buildAgencyCombinedProposal({
                selectedServices: currentAgencyFlow.selectedServices,
                serviceProposals: nextServiceProposals,
            });

            appendAssistantMessage(
                `Updated ${targetService?.name || 'the selected service'} in the agency proposal. Here is the refreshed combined proposal.`
            );
            appendAssistantMessage(combinedProposal, thinkingMeta);
            setInputConfig({ type: 'text', options: [] });
            updateAgencyFlowState((current) => ({
                ...current,
                serviceProposals: nextServiceProposals,
                sharedAnswers: nextSharedAnswers,
                followupTargetServiceId: '',
                awaitingFollowupServiceSelection: false,
                pendingFollowupMessage: '',
                completed: true,
            }));
            return;
        }

        appendAssistantMessage(latestAssistantReply.content || '', thinkingMeta);
        setInputConfig(data?.inputConfig || { type: 'text', options: [] });
        updateAgencyFlowState((current) => ({
            ...current,
            sharedAnswers: nextSharedAnswers,
            followupTargetServiceId: isAgencyConfirmationPrompt(data?.inputConfig)
                ? getServiceIdentifier(targetService)
                : '',
            awaitingFollowupServiceSelection: false,
            pendingFollowupMessage: '',
        }));
    }, [appendAssistantMessage, updateAgencyFlowState]);

    const handleSendMessage = async (e, forcedContent = null, options = {}) => {
        if (e) e.preventDefault();
        const ignorePendingOptionFollowup = Boolean(options?.ignorePendingOptionFollowup);
        let contentToSend = forcedContent ?? input;

        if (!ignorePendingOptionFollowup && pendingOptionValue) {
            const detailText = String(input || '').trim();
            const acceptsPendingRecommendation = Boolean(
                pendingRecommendedAnswer
                && detailText
                && isLikelyRecommendationAcceptance(detailText)
                && !messageMentionsKnownOption(detailText, inputConfig.options, latestAssistantPrompt.options)
            );
            const followupReply = acceptsPendingRecommendation ? pendingRecommendedAnswer : detailText;

            if (!followupReply) {
                toast.info(`Add a short detail for "${pendingOptionLabel}" before sending.`);
                focusMessageInput();
                return;
            }

            if (Array.isArray(contentToSend)) {
                const mergedSelections = contentToSend
                    .filter(Boolean)
                    .map(String)
                    .filter((value) =>
                        normalizeOptionToken(value) !== normalizeOptionToken(pendingOptionValue)
                        && normalizeOptionToken(value) !== normalizeOptionToken(followupReply)
                    );

                contentToSend = [...mergedSelections, followupReply];
            } else {
                contentToSend = followupReply;
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
        const extractedSharedUrls = extractSharedUrlsFromText(trimmedTextPayload);
        const normalizedTextPayload = extractedSharedUrls.text.trim();
        const hasSharedUrls = extractedSharedUrls.urls.length > 0;
        const hasAttachments = pendingAttachments.length > 0;

        if ((!trimmedTextPayload && !hasAttachments && !hasSharedUrls) || !sessionId || isTyping || isUploadingAttachment) return;
        if (isArrayPayload && normalizedArray.length === 0 && !hasAttachments && !hasSharedUrls) return;

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
            const requestStartedAt = getNowTimestamp();
            setIsTyping(true);
            startThinkingTrace(requestStartedAt);
            setIsUploadingAttachment(hasAttachments);
            const uploadStartedAt = getNowTimestamp();
            const uploadedAttachments = hasAttachments
                ? await Promise.all(pendingAttachments.map((file) => uploadGuestAttachment(file)))
                : [];
            const uploadDurationMs = hasAttachments
                ? Math.max(0, getNowTimestamp() - uploadStartedAt)
                : 0;

            const serializedUrls = extractedSharedUrls.urls
                .map((urlEntry) => buildUrlToken(urlEntry))
                .filter(Boolean);
            const serializedAttachments = uploadedAttachments.map((attachment) => buildAttachmentToken(attachment));
            const composedContent = [normalizedTextPayload, serializedUrls.join('\n'), serializedAttachments.join('\n')]
                .filter(Boolean)
                .join('\n')
                .trim();

            const userMsg = { role: 'user', content: composedContent };
            replaceMessages((prev) => [...prev, userMsg]);
            setInput("");
            clearSpeechDraftRefs();
            setPendingAttachments([]);
            setInputConfig({ type: 'text', options: [] });
            setSelectedOptions([]);
            setPendingOptionFollowup(null);

            const currentAgencyFlow = agencyFlowStateRef.current;
            const isAgencyCompletedFollowup = currentAgencyFlow.active && currentAgencyFlow.completed;
            const selectedAgencyServiceOptions = getAgencyServiceSelectionOptions(currentAgencyFlow.selectedServices);
            let agencyCompletedFollowupRoute = null;

            if (isAgencyCompletedFollowup) {
                const normalizedAgencyMessage = String(composedContent || normalizedTextPayload || trimmedTextPayload).trim();
                const matchedAgencyService = findAgencyServiceMatch({
                    message: normalizedAgencyMessage,
                    services: currentAgencyFlow.selectedServices,
                });
                const activeFollowupService = currentAgencyFlow.followupTargetServiceId
                    ? currentAgencyFlow.selectedServices.find((service) =>
                        getServiceIdentifier(service) === currentAgencyFlow.followupTargetServiceId
                    ) || null
                    : null;

                if (currentAgencyFlow.awaitingFollowupServiceSelection) {
                    if (!matchedAgencyService) {
                        appendAssistantMessage(buildAgencyServiceClarificationMessage(currentAgencyFlow.selectedServices));
                        setInputConfig({ type: 'text', options: selectedAgencyServiceOptions });
                        return;
                    }

                    const pendingAgencyMessage = String(currentAgencyFlow.pendingFollowupMessage || '').trim();
                    if (!pendingAgencyMessage) {
                        updateAgencyFlowState((current) => ({
                            ...current,
                            followupTargetServiceId: getServiceIdentifier(matchedAgencyService),
                            awaitingFollowupServiceSelection: false,
                            pendingFollowupMessage: '',
                        }));
                        appendAssistantMessage(buildAgencyServiceSelectionMessage(matchedAgencyService?.name || 'that service'));
                        setInputConfig({ type: 'text', options: [] });
                        return;
                    }

                    const targetSessionEntry = getAgencyServiceSessionEntry(
                        currentAgencyFlow.serviceSessions,
                        matchedAgencyService
                    );
                    if (!targetSessionEntry?.sessionId) {
                        appendAssistantMessage('I could not reopen that service flow. Please restart the agency flow and try again.');
                        setInputConfig({ type: 'text', options: [] });
                        return;
                    }

                    agencyCompletedFollowupRoute = {
                        service: matchedAgencyService,
                        sessionId: targetSessionEntry.sessionId,
                        message: pendingAgencyMessage,
                    };
                    updateAgencyFlowState((current) => ({
                        ...current,
                        followupTargetServiceId: getServiceIdentifier(matchedAgencyService),
                        awaitingFollowupServiceSelection: false,
                        pendingFollowupMessage: '',
                    }));
                } else {
                    const singleSelectedService = currentAgencyFlow.selectedServices.length === 1
                        ? currentAgencyFlow.selectedServices[0]
                        : null;
                    const resolvedAgencyTargetService = matchedAgencyService
                        || (isAgencyConfirmationPrompt(inputConfig) ? activeFollowupService : null)
                        || singleSelectedService;
                    const normalizedAgencySelection = normalizeAgencyServiceMatchText(normalizedAgencyMessage);
                    const isServiceSelectionOnlyMessage = Boolean(
                        matchedAgencyService
                        && normalizedAgencySelection
                        && buildAgencyServiceMatchCandidates(matchedAgencyService).includes(normalizedAgencySelection)
                    );

                    if (!resolvedAgencyTargetService && currentAgencyFlow.selectedServices.length > 1) {
                        updateAgencyFlowState((current) => ({
                            ...current,
                            followupTargetServiceId: '',
                            awaitingFollowupServiceSelection: true,
                            pendingFollowupMessage: normalizedAgencyMessage,
                        }));
                        appendAssistantMessage(buildAgencyServiceClarificationMessage(currentAgencyFlow.selectedServices));
                        setInputConfig({ type: 'text', options: selectedAgencyServiceOptions });
                        return;
                    }

                    if (isServiceSelectionOnlyMessage) {
                        updateAgencyFlowState((current) => ({
                            ...current,
                            followupTargetServiceId: getServiceIdentifier(matchedAgencyService),
                            awaitingFollowupServiceSelection: false,
                            pendingFollowupMessage: '',
                        }));
                        appendAssistantMessage(buildAgencyServiceSelectionMessage(matchedAgencyService?.name || 'that service'));
                        setInputConfig({ type: 'text', options: [] });
                        return;
                    }

                    if (resolvedAgencyTargetService) {
                        const targetSessionEntry = getAgencyServiceSessionEntry(
                            currentAgencyFlow.serviceSessions,
                            resolvedAgencyTargetService
                        );
                        if (!targetSessionEntry?.sessionId) {
                            appendAssistantMessage('I could not reopen that service flow. Please restart the agency flow and try again.');
                            setInputConfig({ type: 'text', options: [] });
                            return;
                        }

                        agencyCompletedFollowupRoute = {
                            service: resolvedAgencyTargetService,
                            sessionId: targetSessionEntry.sessionId,
                            message: normalizedAgencyMessage,
                        };
                        updateAgencyFlowState((current) => ({
                            ...current,
                            followupTargetServiceId: getServiceIdentifier(resolvedAgencyTargetService),
                            awaitingFollowupServiceSelection: false,
                            pendingFollowupMessage: '',
                        }));
                    }
                }
            }

            const apiRequestStartedAt = getNowTimestamp();
            const response = await request('/guest/chat', {
                method: 'POST',
                timeout: 120000,
                body: JSON.stringify({
                    sessionId: agencyCompletedFollowupRoute?.sessionId || sessionId,
                    message: agencyCompletedFollowupRoute
                        ? agencyCompletedFollowupRoute.message
                        : (isArrayPayload && serializedAttachments.length === 0 && serializedUrls.length === 0
                            ? normalizedArray
                            : composedContent)
                })
            });
            const data = unwrapPayload(response);
            const apiRoundTripDurationMs = Math.max(0, getNowTimestamp() - apiRequestStartedAt);
            const clientPreparationDurationMs = Math.max(
                0,
                apiRequestStartedAt - requestStartedAt - uploadDurationMs
            );
            const completedThinkingMeta = buildThinkingMeta(
                Math.max(0, getNowTimestamp() - requestStartedAt),
                {
                    server: data?.timingMeta || null,
                    client: {
                        clientPreparationDurationMs,
                        uploadDurationMs,
                        apiRoundTripDurationMs,
                    },
                }
            );
            logGuestAiBrowserDebug('guest/chat', {
                timingMeta: data?.timingMeta || null,
                sessionId: agencyCompletedFollowupRoute?.sessionId || sessionId,
                serviceId: data?.serviceMeta?.serviceId || agencyCompletedFollowupRoute?.service?.slug || selectedService?.slug || selectedService?.id || '',
                serviceName: data?.serviceMeta?.serviceName || agencyCompletedFollowupRoute?.service?.name || selectedService?.name || '',
            });

            if (agencyCompletedFollowupRoute) {
                handleAgencyCompletedFollowupResponse({
                    data,
                    targetService: agencyCompletedFollowupRoute.service,
                    thinkingMeta: completedThinkingMeta,
                });
                return;
            }

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

            const responseSharedAnswers = normalizeAgencySharedAnswers(data?.sharedAnswers);

            let shouldApplyResponseInputConfig = true;
            if (data?.history) {
                const currentAgencyFlow = agencyFlowStateRef.current;
                const nextAgencySharedAnswers = currentAgencyFlow.active
                    ? mergeAgencySharedAnswers(currentAgencyFlow.sharedAnswers, responseSharedAnswers)
                    : responseSharedAnswers;
                if (currentAgencyFlow.active && Object.keys(responseSharedAnswers).length > 0) {
                    updateAgencyFlowState((current) => ({
                        ...current,
                        sharedAnswers: mergeAgencySharedAnswers(current.sharedAnswers, responseSharedAnswers),
                    }));
                }
                const existingSessionMessages = currentAgencyFlow.active
                    ? messagesRef.current.slice(currentAgencyFlow.currentSessionStartIndex)
                    : messagesRef.current;
                const nextHistory = mergeMessagesWithThinkingMeta(
                    data.history,
                    existingSessionMessages,
                    completedThinkingMeta
                );
                const latestAssistantReply = [...nextHistory]
                    .reverse()
                    .find((message) => message?.role === 'assistant');
                let agencyProposalHandled = false;

                if (
                    currentAgencyFlow.active
                    && latestAssistantReply
                    && isProposalMessage(latestAssistantReply.content || '')
                ) {
                    const agencyActiveService =
                        currentAgencyFlow.selectedServices[currentAgencyFlow.currentServiceIndex]
                        || activeService;
                    agencyProposalHandled = await handleAgencyServiceProposal({
                        activeService: agencyActiveService,
                        sessionHistory: nextHistory,
                        proposalContent: latestAssistantReply.content || '',
                        thinkingMeta: completedThinkingMeta,
                        sharedAnswers: nextAgencySharedAnswers,
                    });
                    if (agencyProposalHandled) {
                        shouldApplyResponseInputConfig = false;
                    }
                }

                if (!agencyProposalHandled && currentAgencyFlow.active) {
                    const nextDisplayedMessages = [
                        ...messagesRef.current.slice(0, currentAgencyFlow.currentSessionStartIndex),
                        ...nextHistory,
                    ];
                    replaceMessages(nextDisplayedMessages);
                    persistCurrentSessionSummary(nextHistory, activeService);
                } else if (!agencyProposalHandled) {
                    replaceMessages(nextHistory);
                    persistCurrentSessionSummary(nextHistory, activeService);
                }
            } else if (typeof data?.message === 'string' && data.message.trim()) {
                const aiMsg = {
                    role: 'assistant',
                    content: data.message,
                    thinkingMeta: completedThinkingMeta,
                };
                const nextMessages = replaceMessages((prev) => [...prev, aiMsg]);
                persistCurrentSessionSummary(nextMessages, activeService);
            } else {
                console.warn('[GuestAIDemo] Unexpected chat payload:', response);
            }

            if (
                shouldApplyResponseInputConfig
                && data?.inputConfig
            ) {
                setInputConfig(data.inputConfig);
            }
        } catch (error) {
            console.error('[GuestAIDemo] Failed to send message:', error);
            toast.error(error?.message || "Failed to send message");
        } finally {
            stopThinkingTrace();
            setIsTyping(false);
            setIsUploadingAttachment(false);
        }
    };

    const handleProceed = (proposalContent, sourceProposal = null) => {
        const nextProposals = upsertStoredGeneratedProposal(
            proposalContent,
            user?.id,
            buildProposalSaveMetadata(proposalContent, sourceProposal),
        );
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
        dismissedAutoHelperKeysRef.current = new Set();
        setSelectedService(null);
        setSessionId(null);
        replaceMessages([]);
        resetChatComposerState();
        resetAgencyFlow();
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

    const handleCloseResourceLibrary = () => {
        setActiveResourceLibrary(null);
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
                void handleRestartCurrentFlow();
            } else {
                handleBackToServices();
            }
        }

        toast.success('Chat removed');
    };

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
                        <div className="text-center space-y-4 relative z-10 mb-10">
                            <span className="inline-block px-6 py-2 text-3xl uppercase tracking-[0.4em] bg-background text-primary rounded-full font-semibold shadow-md">
                                Services
                            </span>
                            <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 rounded-2xl bg-background px-5 py-4">
                                <h2 className="text-3xl font-semibold text-white">
                                    Clarity across every step of the freelance lifecycle.
                                </h2>
                                <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
                                    {isAgencySelectionMode
                                        ? 'Agency mode lets you bundle multiple services into one guided intake. We will ask each selected service flow in sequence and show one final combined proposal at the end.'
                                        : 'Freelancer mode keeps the current flow unchanged. Pick one service to start the guided chat immediately.'}
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <div className="inline-flex rounded-full bg-background p-1">
                                    {[
                                        { key: SERVICE_SELECTION_MODES.FREELANCER, label: 'Freelancer' },
                                        { key: SERVICE_SELECTION_MODES.AGENCY, label: 'Agency' },
                                    ].map((modeOption) => (
                                        <button
                                            key={modeOption.key}
                                            type="button"
                                            onClick={() => setServiceSelectionMode(modeOption.key)}
                                            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                                                serviceSelectionMode === modeOption.key
                                                    ? 'bg-[#ffc800] text-black'
                                                    : 'text-zinc-300 hover:text-white'
                                            }`}
                                        >
                                            {modeOption.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {isAgencySelectionMode ? (
                                <div className="mt-5 flex flex-col items-center gap-3">
                                    <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-background px-4 py-2 text-xs font-medium text-zinc-400">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                                agencySelectedServices.length > 0
                                                    ? 'bg-[#ffc800] shadow-[0_0_18px_rgba(255,200,0,0.75)]'
                                                    : 'bg-zinc-600'
                                            }`}
                                        />
                                        <span className="text-zinc-300">
                                            {agencySelectedServices.length > 0
                                                ? `${agencySelectedServices.length} service${agencySelectedServices.length === 1 ? '' : 's'} selected`
                                                : 'Select services below to start the agency flow'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startAgencyFlow()}
                                        disabled={agencySelectedServices.length === 0}
                                        className={`inline-flex min-w-[280px] items-center justify-center gap-3 rounded-full border bg-background px-6 py-3 text-sm font-semibold transition-all ${
                                            agencySelectedServices.length > 0
                                                ? 'border-[#ffc800]/40 bg-[#ffc800] text-black shadow-[0_20px_40px_-20px_rgba(255,200,0,0.95)] hover:-translate-y-0.5 hover:bg-[#ffd740]'
                                            : 'cursor-not-allowed border-white/10 text-zinc-500'
                                        }`}
                                    >
                                        <span>
                                            {agencySelectedServices.length > 0
                                                ? `Continue with ${agencySelectedServices.length} selected service${agencySelectedServices.length === 1 ? '' : 's'}`
                                                : 'Select services to continue'}
                                        </span>
                                        <span
                                            className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-[11px] font-bold ${
                                                agencySelectedServices.length > 0
                                                    ? 'bg-black/10 text-black'
                                                    : 'bg-background text-zinc-500'
                                            }`}
                                        >
                                            {agencySelectedServices.length}
                                        </span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                            {services.length === 0 ? (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-5 text-center text-white/60 py-10">
                                    {servicesError || (loading ? 'Loading services...' : 'No services available.')}
                                </div>
                            ) : (
                                services.map((feature, index) => {
                                    const featureId = getServiceIdentifier(feature);
                                    const isAgencyCardSelected = agencySelectedServiceIds.includes(featureId);

                                    return (
                                        <div
                                        key={feature.id || index}
                                        onClick={() => (
                                            isAgencySelectionMode
                                                ? toggleAgencyServiceSelection(feature)
                                                : handleServiceSelect(feature)
                                        )}
                                        onMouseMove={handleCardGlowMouseMove}
                                        style={{ '--card-glow-x': '50%', '--card-glow-y': '50%' }}
                                        className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer h-full bg-card hover:-translate-y-2 ${
                                            isAgencyCardSelected
                                            ? 'border-[#ffc800]'
                                                : 'border-white/20 hover:border-[#ffc800]/50'
                                        }`}
                                    >
                                        <div className={`absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent transition-opacity duration-500 ${isAgencyCardSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                        <div
                                            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${isAgencyCardSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            style={{
                                                background:
                                                    'radial-gradient(260px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(255, 200, 0, 0.18) 0%, rgba(255, 200, 0, 0.08) 30%, transparent 65%)',
                                            }}
                                        />
                                        {isAgencySelectionMode ? (
                                            <div className="absolute right-4 top-4 z-20">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                                    isAgencyCardSelected
                                                        ? 'bg-[#ffc800] text-black'
                                                        : 'border border-white/10 bg-black/40 text-zinc-400'
                                                }`}>
                                                    {isAgencyCardSelected ? 'Selected' : 'Select'}
                                                </span>
                                            </div>
                                        ) : null}
                                        <div className="flex flex-col h-full p-5 relative z-10">
                                            <div className="h-32 w-full flex items-center justify-center mb-3 relative">
                                                <img
                                                    src={resolveServiceLogoSrc(feature)}
                                                    alt={feature.title || feature.name}
                                                    className="w-24 h-24 object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500 ease-out"
                                                />
                                            </div>

                                            <div className="flex flex-col grow items-center text-center">
                                                <h3 className={`text-lg font-bold mb-2 leading-tight transition-colors duration-300 ${
                                                    isAgencyCardSelected ? 'text-[#ffc800]' : 'text-white group-hover:text-[#ffc800]'
                                                }`}>
                                                    {feature.title || feature.name}
                                                </h3>

                                                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-4 line-clamp-3 transition-colors">
                                                    {feature.description}
                                                </p>

                                                <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-4 w-full text-left">
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                                            Starting at
                                                        </p>
                                                        <p className={`text-lg font-bold transition-colors duration-300 ${
                                                            isAgencyCardSelected ? 'text-[#ffc800]' : 'text-white group-hover:text-[#ffc800]'
                                                        }`}>
                                                            {feature.price || (feature.min_budget ? `₹${feature.min_budget.toLocaleString('en-IN')}/-` : '₹10,000/-')}
                                                        </p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                                                        isAgencyCardSelected
                                                            ? 'border-[#ffc800] text-[#ffc800] bg-[#ffc800]/10'
                                                            : 'border-white/10 text-white group-hover:border-[#ffc800] group-hover:text-[#ffc800] group-hover:bg-[#ffc800]/10'
                                                    }`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* WHY CATALANCE AI */}
                        <div className="relative z-10 mt-24">
                            <div className="mx-auto mb-12 flex max-w-4xl flex-col items-center gap-3 rounded-2xl bg-background px-5 py-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffc800] mb-3">Our Edge</p>
                                <h2 className="text-4xl font-bold text-white">Why Catalance AI?</h2>
                                <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto">We&apos;ve reimagined how businesses discover and hire freelance talent.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[
                                    { icon: '⚡', title: 'Instant Qualification', desc: 'AI filters your requirements in real-time — no back-and-forth emails, no wasted calls.' },
                                    { icon: '🔒', title: 'Verified Professionals', desc: 'Every freelancer is vetted with portfolio review, skill assessments, and client references.' },
                                    { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees. Budgets are defined upfront in your AI-generated proposal.' },
                                    { icon: '📈', title: 'Scope-Driven Matching', desc: 'Your project scope drives freelancer matching — we connect you with specialists.' },
                                    { icon: '🕐', title: 'Save Hours of Discovery', desc: 'CATA AI compresses the entire discovery and briefing phase into minutes.' },
                                    { icon: '🌐', title: 'Multi-Service Support', desc: 'From SEO to app dev, branding to CRM — one platform, one AI, unlimited combinations.' },
                                ].map((card, i) => (
                                    <div
                                        key={i}
                                        onMouseMove={handleCardGlowMouseMove}
                                        style={{ '--card-glow-x': '50%', '--card-glow-y': '50%' }}
                                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card p-6 transition-transform duration-300 hover:scale-[1.02]"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                        <div
                                            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                                            style={{
                                                background:
                                                    'radial-gradient(240px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(255, 200, 0, 0.16) 0%, rgba(255, 200, 0, 0.07) 30%, transparent 65%)',
                                            }}
                                        />
                                        <div className="relative z-10">
                                            <div className="text-3xl mb-4">{card.icon}</div>
                                            <h3 className="text-white font-bold text-base mb-2">{card.title}</h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STATS BAR */}
                        <div className="relative z-10 mt-24">
                            <div
                                onMouseMove={handleCardGlowMouseMove}
                                style={{ '--card-glow-x': '50%', '--card-glow-y': '50%' }}
                                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
                            >
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    style={{
                                        background:
                                            'radial-gradient(340px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(255, 200, 0, 0.18) 0%, rgba(255, 200, 0, 0.08) 30%, transparent 70%)',
                                    }}
                                />
                                {[
                                    { value: '500+', label: 'Verified Freelancers' },
                                    { value: '1,200+', label: 'Projects Delivered' },
                                    { value: '4.9★', label: 'Average Client Rating' },
                                    { value: '15+', label: 'Service Categories' },
                                ].map((stat, i) => (
                                    <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                                        <span className="text-4xl font-extrabold text-[#ffc800] tracking-tight">{stat.value}</span>
                                        <span className="text-zinc-400 text-sm font-medium">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="relative z-10 mt-14 mb-8 px-4 py-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-[1240px]">
                                <div className="relative overflow-hidden rounded-[2rem] border bg-background px-6 py-12 sm:px-10 sm:py-14 lg:min-h-[460px] lg:px-16">
                                    <div className="absolute inset-0 bg-background" />
                                    <div
                                        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[70%]"
                                        style={{
                                            background: 'linear-gradient(180deg, var(--primary) 0%, var(--background) 100%)',
                                            opacity: 1,
                                        }}
                                    />

                                    <div
                                        className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex justify-center"
                                        style={{
                                            WebkitMaskImage:
                                                'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.76) 58%, rgba(0,0,0,0.34) 82%, rgba(0,0,0,0) 100%)',
                                            maskImage:
                                                'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 34%, rgba(0,0,0,0.76) 58%, rgba(0,0,0,0.34) 82%, rgba(0,0,0,0) 100%)',
                                        }}
                                    >
                                        <div className="h-[440px] w-full">
                                            <LightRays
                                                raysOrigin="top-center"
                                                raysColor="#000000"
                                                raysSpeed={0.9}
                                                lightSpread={0.9}
                                                rayLength={2}
                                                fadeDistance={1}
                                                followMouse={false}
                                                mouseInfluence={0}
                                                noiseAmount={0}
                                                distortion={0}
                                                className="h-full w-full opacity-70"
                                            />
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex min-h-[360px] items-center justify-center">
                                        <div className="w-full max-w-[760px] text-center">
                                            <h3 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">Ready to get started?</h3>
                                            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground" hidden={isAgencySelectionMode}>Pick a service above, chat with CATA AI, and receive a professional proposal — completely free.</p>
                                            {isAgencySelectionMode ? (
                                                <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
                                                    Select your services above, let CATA AI run through each scope, and receive one combined proposal at the end.
                                                </p>
                                            ) : null}
                                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#ffc800] px-8 py-3 text-sm font-bold text-black shadow-[0_8px_30px_-8px_rgba(255,200,0,0.6)] transition-colors hover:bg-[#ffd740]">
                                                {isAgencySelectionMode ? 'Choose Services' : 'Choose a Service'}
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
        const composerPlaceholder = isAgencyFlowCompleted
            ? 'Refine the combined proposal by naming a service or asking for a change...'
            : contextualPendingOptionPlaceholder;

        return (
            <form
                onSubmit={handleSendMessage}
                className={`rounded-3xl border p-2.5 shadow-md backdrop-blur-xl ${isDark
                    ? 'border-white/10 bg-[#2F2F2F]'
                    : 'border-slate-200 bg-[#F4F4F4]'
                    }`}
            >
                {isAgencyFlowCompleted && (
                    <div className={`mb-3 rounded-2xl border px-3.5 py-3 text-sm ${isDark
                        ? 'border-[#ffc800]/20 bg-[#ffc800]/[0.08] text-zinc-200'
                        : 'border-amber-200 bg-amber-50 text-slate-700'
                        }`}>
                        The combined agency proposal is ready. Keep chatting below to refine it. If you want a service-specific change like budget or timeline, name the service first.
                    </div>
                )}
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
                                if (pendingOptionFollowup?.autoSuggestion && pendingOptionFollowup?.questionKey) {
                                    dismissedAutoHelperKeysRef.current.add(pendingOptionFollowup.questionKey);
                                }
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
                                placeholder={composerPlaceholder}
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
            {/* Backdrop — closes sidebar when clicking outside */}
            {!isSidebarCompact && (
                <div
                    className="hidden"
                    onClick={toggleSidebarSize}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar drawer — slides in from left as fixed overlay */}
            <aside className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col w-72 shadow-2xl transition-transform duration-300 ease-in-out lg:top-20 ${isSidebarCompact ? '-translate-x-full' : 'translate-x-0'} ${isDark ? 'bg-[#171717] border-r border-white/[0.06]' : 'bg-white border-r border-slate-200'}`}>
                {/* ── Sidebar header ── */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg ${isDark ? 'bg-amber-300/15' : 'bg-amber-100'}`}>
                            <img src={cataLogo} alt="CATA" className="h-4 w-4 object-contain" />
                        </div>
                        <span className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {isAgencyFlowActive ? 'Agency Brief' : (selectedService?.name || 'Catalance AI')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSidebarSize}
                        className={`h-7 w-7 rounded-md flex items-center justify-center ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Back to services ── */}
                <div className={`px-3 pb-2 flex gap-1.5 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
                    <button
                        type="button"
                        onClick={handleBackToServices}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                        title="Back to services"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void handleRestartCurrentFlow();
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        title="Start a new chat"
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
                        New Chat
                    </button>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {/* ── Proposals section ── */}
                    <div className="mb-1 px-3">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('proposals')}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                        >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-50 text-amber-600'}`}>
                                <Sparkles className="h-3 w-3" />
                            </div>
                            <span className={`flex-1 text-left text-sm font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>
                                Proposals
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-primary/25 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                    {generatedProposals.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.proposals ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.proposals ? (
                            generatedProposals.length === 0 ? (
                                <div className="px-2 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No proposals yet. Chat with CATA AI to generate one.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 px-1 pb-1">
                                    {generatedProposals.map((proposal, index) => (
                                        <button
                                            key={proposal.id || `${proposal.projectTitle || 'proposal'}-${index}`}
                                            type="button"
                                            onClick={() => handleOpenProposalPreview(proposal)}
                                            className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                        >
                                            <p className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {proposal.projectTitle || 'AI Proposal'}
                                            </p>
                                            {(proposal.budget || proposal.timeline) ? (
                                                <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {[proposal.budget && `Budget: ${proposal.budget}`, proposal.timeline && `Timeline: ${proposal.timeline}`].filter(Boolean).join(' | ')}
                                                </p>
                                            ) : null}
                                            <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {formatPreviousChatTime(proposal.updatedAt || proposal.createdAt)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    {/* ── Divider ── */}
                    <div className={`mx-4 my-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />

                    {/* ── Saved links section ── */}
                    <div className="mb-1 px-3">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('links')}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                        >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <Globe className="h-3 w-3" />
                            </div>
                            <span className={`flex-1 text-left text-sm font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>
                                Saved Links
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {sharedLinks.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.links ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.links ? (
                            sharedLinks.length === 0 ? (
                                <div className="px-2 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Links shared in this chat will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 px-1 pb-1">
                                    {sharedLinks.map((linkEntry) => (
                                        <a
                                            key={linkEntry.id}
                                            href={linkEntry.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-start gap-2 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                                        >
                                            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                                <Globe className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{linkEntry.label}</p>
                                                <p className={`truncate text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{linkEntry.url}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    <div className="mb-1 px-3">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('files')}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                        >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <FileText className="h-3 w-3" />
                            </div>
                            <span className={`flex-1 text-left text-sm font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>
                                Shared Files & Media
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {sharedAttachments.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.files ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.files ? (
                            sharedAttachments.length === 0 ? (
                                <div className="px-2 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Documents, PDFs, and images you upload will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 px-1 pb-1">
                                    {sharedAttachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-start gap-2 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                                        >
                                            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                                {attachment.isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{attachment.name}</p>
                                                <p className={`truncate text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {[attachment.kindLabel, formatBytes(attachment.size)].filter(Boolean).join(' | ')}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    <div className={`mx-4 my-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
                    <div className="mb-1 px-3">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('chats')}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
                        >
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <MessageSquarePlus className="h-3 w-3" />
                            </div>
                            <span className={`flex-1 text-left text-sm font-medium ${isDark ? 'text-white' : 'text-slate-600'}`}>
                                Recent Chats
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {visiblePreviousChats.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.chats ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.chats ? (
                            visiblePreviousChats.length === 0 ? (
                                <div className="px-2 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>No previous chats.</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5 px-1 pb-1">
                                    {visiblePreviousChats.map((chat) => {
                                        const isCurrent = chat.sessionId === sessionId;
                                        const isLoadingHistory = loadingHistoryId === chat.sessionId;
                                        const brandName = chat.businessName || '';
                                        const preview = brandName
                                            ? `${chat.serviceName || 'Service'} - ${brandName}`
                                            : (chat.preview || chat.serviceName || 'No preview');
                                        return (
                                            <div
                                                key={chat.sessionId}
                                                className={`group relative flex items-center gap-1.5 rounded-md px-2 py-2 transition-colors ${isCurrent
                                                    ? isDark ? 'bg-white/10' : 'bg-slate-100'
                                                    : isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => handleLoadPreviousChat(chat)}
                                                    disabled={isLoadingHistory || isCurrent}
                                                    className="min-w-0 flex-1 text-left outline-none"
                                                >
                                                    <p className={`truncate text-sm font-medium transition-colors ${isCurrent
                                                        ? isDark ? 'text-amber-300' : 'text-amber-600'
                                                        : isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                                                    }`}>
                                                        {isLoadingHistory ? 'Loading...' : preview}
                                                    </p>
                                                    <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        {formatPreviousChatTime(chat.updatedAt)}
                                                    </p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeletePreviousChat(e, chat)}
                                                    disabled={isLoadingHistory}
                                                    className={`shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                                                    aria-label="Delete chat"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : null}
                    </div>
                </div>

                {/* ── Bottom: user / login ── */}
                <div className={`shrink-0 border-t px-3 py-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                    {isAuthLoading ? (
                        <div className="flex items-center gap-2 px-2">
                            <span className={`h-2 w-2 animate-pulse rounded-full ${isDark ? 'bg-amber-400/50' : 'bg-amber-500/50'}`} />
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Checking...</p>
                        </div>
                    ) : isUserLoggedIn ? (
                        <div className={`flex items-center gap-3 rounded-md px-2 py-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${isDark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-slate-100'}`}>
                                {userAvatar
                                    ? <img src={userAvatar} alt={userDisplayName} className="h-full w-full object-cover" />
                                    : <User className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{userDisplayName}</p>
                                <p className={`truncate text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{userDisplayEmail || 'Authenticated'}</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/login', { state: { redirectTo: '/ai-demo' } })}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <LogIn className="h-4 w-4 shrink-0" />
                            Login to save progress
                        </button>
                    )}
                </div>
            </aside>

            <section className={`relative flex min-w-0 flex-1 flex-col bg-transparent pt-3 ${isInitialScreen ? 'justify-center items-center' : ''}`}>

                {/* Sidebar toggle button in top-left of chat area */}
                <div className="absolute left-3 top-3 z-20">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarSize}
                        className={`h-8 w-8 rounded-lg border ${isDark ? 'border-white/15 text-slate-300 hover:bg-white/10' : 'border-black/10 text-slate-600 hover:bg-black/5'}`}
                        title={isSidebarCompact ? 'Open sidebar' : 'Close sidebar'}
                    >
                        {isSidebarCompact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                <ScrollArea ref={scrollRef} className={`w-full transition-[padding-left] duration-300 ease-in-out ${!isSidebarCompact ? 'lg:pl-72' : ''} ${isInitialScreen ? 'flex flex-col' : 'flex-1 min-h-0 pt-4'}`}>
                    <div className={`mx-auto flex w-full max-w-4xl flex-col space-y-8 px-5 lg:px-8 ${isInitialScreen ? 'pt-8' : 'pt-4 pb-52'}`}>
                        {messages.map((msg, idx) => {
                            const { text: messageContent, attachments: messageAttachments, urls: messageUrls } = parseMessageContentWithAttachments(
                                msg.content,
                                msg.attachments
                            );
                            const proposalCardContent = messageContent || msg.content;
                            const proposalCard = msg.role === 'assistant' && isProposalMessage(proposalCardContent);
                            const proposalCtaLabel = isAgencyProposalMessage(proposalCardContent)
                                ? 'Find an Agency'
                                : 'Find a Freelancer';
                            const messageKey = `${msg.role}-${idx}`;
                            const isLatestAssistantMessage = msg.role === 'assistant' && idx === messages.length - 1;
                            const shouldEnableOptionClick = isLatestAssistantMessage && !isTyping && hasOptionInput;
                            const thinkingMeta = Number.isFinite(Number(msg?.thinkingMeta?.durationMs))
                                ? msg.thinkingMeta
                                : null;
                            const timingBreakdownGroups = getTimingBreakdownGroups(thinkingMeta);

                            return msg.role === 'user' ? (
                                /* ── USER message: right-aligned bubble ── */
                                <motion.div
                                    key={messageKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full justify-end"
                                >
                                    <div className="flex max-w-[75%] flex-col items-end gap-2">
                                        {messageUrls.length > 0 && (
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {messageUrls.map((urlEntry, urlIdx) => (
                                                    <a
                                                        key={`${urlEntry.url}-${urlIdx}`}
                                                        href={urlEntry.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`max-w-[320px] rounded-2xl border px-3.5 py-2.5 text-left ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-black/5 bg-slate-100 text-slate-700'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="h-4 w-4 shrink-0 opacity-70" />
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-500'}`}>
                                                                URL
                                                            </span>
                                                            <span className="min-w-0 truncate text-xs font-medium">
                                                                {urlEntry.label || 'Shared link'}
                                                            </span>
                                                        </div>
                                                        <p className={`mt-1 truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {urlEntry.url}
                                                        </p>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
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
                                            <div className={`rounded-3xl px-5 py-3 text-[15px] leading-relaxed break-words ${
                                                isDark
                                                    ? 'bg-[#2F2F2F] text-white'
                                                    : 'bg-[#F0F0F0] text-slate-900'
                                            }`}>
                                                <div className={`prose prose-sm max-w-none prose-p:my-0 prose-strong:font-semibold ${isDark ? 'prose-invert' : ''}`}>
                                                    <ReactMarkdown>{messageContent}</ReactMarkdown>
                                                </div>
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
                                            <div className="space-y-4">
                                                <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    <Sparkles className="h-3 w-3 text-primary" />
                                                    Proposal ready
                                                </div>
                                                <div className={`text-[15px] leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    <ProposalPreview content={messageContent || msg.content} isDark={isDark} />
                                                </div>
                                                <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                                    <Button
                                                        onClick={() => handleProceed(proposalCardContent)}
                                                        variant="outline"
                                                        className={`rounded-xl px-5 py-2 h-9 text-sm font-medium transition-all ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                                                        {proposalCtaLabel}
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
                                        {thinkingMeta && (
                                            <div className={`mt-2 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Responded in {formatThinkingDuration(thinkingMeta.durationMs)}
                                            </div>
                                        )}
                                        {/* {timingBreakdownGroups.length > 0 && (
                                            <details className={`mt-2 overflow-hidden rounded-2xl border text-[11px] ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'}`}>
                                                <summary className={`cursor-pointer list-none px-3 py-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    View timing breakdown
                                                </summary>
                                                <div className={`space-y-3 border-t px-3 py-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                                    {timingBreakdownGroups.map((group) => (
                                                        <div key={group.key} className="space-y-1.5">
                                                            <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                {group.label}
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {group.rows.map((row, rowIndex) => {
                                                                    const aiMetaText = [
                                                                        row.aiTask ? `Task: ${row.aiTask}` : '',
                                                                        row.aiModel ? `Model: ${row.aiModel}` : '',
                                                                        row.aiProviderDurationMs > 0 ? `Provider: ${formatThinkingDuration(row.aiProviderDurationMs)}` : '',
                                                                        Number.isFinite(Number(row.aiTotalTokens)) && row.aiTotalTokens > 0 ? `Tokens: ${row.aiTotalTokens}` : '',
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(' | ');

                                                                    return (
                                                                        <div
                                                                            key={`${group.key}-${row.key || rowIndex}`}
                                                                            className={`rounded-xl px-3 py-2 ${isDark ? 'bg-white/[0.03]' : 'bg-white'}`}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div className="min-w-0">
                                                                                    <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                                                                        {row.label}
                                                                                    </div>
                                                                                    {row.detail && (
                                                                                        <div className={`mt-0.5 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                                            {row.detail}
                                                                                        </div>
                                                                                    )}
                                                                                    {aiMetaText && (
                                                                                        <div className={`mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                                            {aiMetaText}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className={`shrink-0 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                                    {formatThinkingDuration(row.durationMs)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )} */}
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
                                <div className="flex-1 min-w-0 max-w-[85%]">
                                    <div className={`flex min-h-[2rem] items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <div className="flex shrink-0 items-center gap-1.5 opacity-70">
                                            <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '0ms' }} />
                                            <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '140ms' }} />
                                            <div className={`h-1.5 w-1.5 animate-bounce rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ animationDelay: '280ms' }} />
                                        </div>
                                        <motion.span
                                            key={thinkingState?.stage?.key || THINKING_STAGES[0].key}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                            className={`min-w-0 truncate text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                                        >
                                            {thinkingState?.stage?.label || THINKING_STAGES[0].label}
                                        </motion.span>
                                        <span className={`shrink-0 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>•</span>
                                        <span className={`shrink-0 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {formatThinkingDuration(thinkingState?.elapsedMs || 0)}
                                        </span>
                                    </div>
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
                    <div className={`absolute bottom-0 w-full px-5 pb-4 pt-12 transition-[padding-left] duration-300 ease-in-out lg:px-8 ${!isSidebarCompact ? 'lg:pl-[20rem]' : ''} bg-gradient-to-t ${isDark ? 'from-[#212121] via-[#212121]/90 to-transparent' : 'from-[#F9F9F9] via-[#F9F9F9]/90 to-transparent'}`}>
                        <div className="mx-auto w-full max-w-4xl space-y-2.5">
                            {renderChatInput()}
                            <p className={`text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                AI can make mistakes. Check important info.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {isProposalsModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6"
                    onClick={() => setIsProposalsModalOpen(false)}
                >
                    <div
                        className={`max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${isDark
                            ? 'border-white/15 bg-[#0d0d0f]'
                            : 'border-slate-300/80 bg-white'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Your AI Proposals
                                </h3>
                                {generatedProposals.length > 0 && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                                        {generatedProposals.length}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsProposalsModalOpen(false)}
                                className={`rounded-full p-2 transition-colors ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                aria-label="Close proposals"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {generatedProposals.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
                                    <Sparkles className={`h-8 w-8 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        No proposals yet. Chat with CATA AI to generate one.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {generatedProposals.map((proposal, index) => (
                                        <button
                                            key={proposal.id || `${proposal.projectTitle || 'proposal'}-${index}`}
                                            type="button"
                                            onClick={() => {
                                                setIsProposalsModalOpen(false);
                                                handleOpenProposalPreview(proposal);
                                            }}
                                            className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-semibold ${isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                                                    {proposal.projectTitle || 'AI Proposal'}
                                                </p>
                                                {(proposal.budget || proposal.timeline) && (
                                                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {[
                                                            proposal.budget && `Budget: ${proposal.budget}`,
                                                            proposal.timeline && `Timeline: ${proposal.timeline}`,
                                                        ].filter(Boolean).join(' ?? ')}
                                                    </p>
                                                )}
                                                <p className={`mt-1.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {formatPreviousChatTime(proposal.updatedAt || proposal.createdAt)}
                                                </p>
                                            </div>
                                            <svg
                                                className={`mt-1 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-80 ${isDark ? 'text-white' : 'text-slate-800'}`}
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <path d="m9 18 6-6-6-6"/>
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeResourceLibraryConfig && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6"
                    onClick={handleCloseResourceLibrary}
                >
                    <div
                        className={`max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${isDark
                            ? 'border-white/15 bg-[#0d0d0f]'
                            : 'border-slate-300/80 bg-white'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2.5">
                                <ActiveResourceLibraryIcon className={`h-4 w-4 ${isDark ? 'text-white' : 'text-slate-800'}`} />
                                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {activeResourceLibraryConfig.title}
                                </h3>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                    {activeResourceLibraryConfig.items.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseResourceLibrary}
                                className={`rounded-full p-2 transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                aria-label="Close resource library"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeResourceLibraryConfig.items.length === 0 ? (
                                <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
                                    <ActiveResourceLibraryIcon className={`h-8 w-8 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
                                    <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-500'}`}>
                                        {activeResourceLibraryConfig.emptyMessage}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeResourceLibrary === 'links'
                                        ? sharedLinks.map((linkEntry) => (
                                            <a
                                                key={linkEntry.id}
                                                href={linkEntry.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                                                        {linkEntry.label}
                                                    </p>
                                                    <p className={`mt-1 text-xs break-all ${isDark ? 'text-slate-200' : 'text-slate-500'}`}>
                                                        {linkEntry.url}
                                                    </p>
                                                </div>
                                                <svg
                                                    className={`mt-1 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-80 ${isDark ? 'text-white' : 'text-slate-800'}`}
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <path d="m9 18 6-6-6-6"/>
                                                </svg>
                                            </a>
                                        ))
                                        : sharedAttachments.map((attachment) => (
                                            <a
                                                key={attachment.id}
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                                            >
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {attachment.isImage
                                                        ? <ImageIcon className="h-5 w-5" />
                                                        : <FileText className="h-5 w-5" />
                                                    }
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                                                        {attachment.name}
                                                    </p>
                                                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-500'}`}>
                                                        {[attachment.kindLabel, formatBytes(attachment.size)].filter(Boolean).join(' • ')}
                                                    </p>
                                                </div>
                                                <svg
                                                    className={`mt-1 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-80 ${isDark ? 'text-white' : 'text-slate-800'}`}
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <path d="m9 18 6-6-6-6"/>
                                                </svg>
                                            </a>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                    onClick={() => handleProceed(selectedProposalPreview.content, selectedProposalPreview)}
                                    className="w-full sm:w-auto rounded-xl bg-primary px-8 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90"
                                >
                                    {selectedProposalPreviewCtaLabel}
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
