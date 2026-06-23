import React, { startTransition, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { generateRandomString } from "@/components/ui/evervault-card";

const MATRIX_SPOTLIGHT_RADIUS = 250;

function MatrixPattern({ mouseX, mouseY, randomString }) {
    const maskImage = useMotionTemplate`radial-gradient(${MATRIX_SPOTLIGHT_RADIUS}px at ${mouseX}px ${mouseY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.15) 80%, transparent 100%)`;
    const style = { maskImage, WebkitMaskImage: maskImage };

    return (
        <div className="pointer-events-none">
            <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] opacity-20" />
            <motion.div
                className="absolute inset-0 bg-linear-to-r from-primary to-primary/20 opacity-100 transition duration-500 backdrop-blur-xl"
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
    Check,
    Users,
    Image as ImageIcon,
    FileText,
    Trash2,
    Globe,
    MessageSquarePlus,
    ChevronDown,
    Lightbulb
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
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { getSession } from '@/shared/lib/auth-storage';
import {
    mergeProposalStructureDefinitions,
    parseProposalStructureDefinitions,
} from '@/shared/lib/project-proposal-fields';
import {
    forceSentenceBreaks,
    normalizeMarkdownContent,
    parseAssistantMessageLayout,
} from '@/components/pages/guestAiMessageLayout';
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
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const { primaryKey: GUEST_CHAT_STORAGE_KEY } = getGuestChatStorageKeys();
const { primaryKey: GUEST_CHAT_SIDEBAR_SIZE_KEY } =
    getGuestChatSidebarSizeStorageKeys();
const MAX_PREVIOUS_CHAT_ITEMS = 30;
const REMOVE_BOLD_MARKDOWN_COMPONENTS = {
    strong: ({ node, ...props }) => <span {...props} />,
    b: ({ node, ...props }) => <span {...props} />,
};
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
const BRIEFING_FILE_TEXT_MAX_CHARS = 12000;

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
    'paid advertising': 'performance marketing',
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

const R2_LIGHT_LOGOS = {
    '3d animation cgi videos vfx': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    '3d animation cgi video vfx': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    '3d animation': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    'cgi video': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    'cgi video services': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    'cgi vfx': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/3D%20AnimationCGI%20VideosVFX.png',
    'ai automation': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/AI%20Automation.png',
    'ai video generation': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/AI%20Video%20Generation.png',
    'branding kit': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Branding%20Kit.png',
    'branding and brand identity': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Branding%20Kit.png',
    'branding': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Branding%20Kit.png',
    'crm and erp solutions': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/crm%20%26%20epr.png',
    'crm and erp integrated solutions': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/crm%20%26%20epr.png',
    'crm erp integrated solutions': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/crm%20%26%20epr.png',
    'creative and design': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Creative%20%26%20Design.png',
    'creative design': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Creative%20%26%20Design.png',
    'mobile app development': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Mobile%20App%20Development.png',
    'app development': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/Mobile%20App%20Development.png',
    'paid advertising': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/paid%20advertising.png',
    'paid ads': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/paid%20advertising.png',
    'performance marketing': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/paid%20advertising.png',
    'seo': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/seogmb.png',
    'seo optimization': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/seogmb.png',
    'seo and gmb': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/seogmb.png',
    'social media marketing': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/social%20media%20marketing.png',
    'social media management': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/social%20media%20marketing.png',
    'video services': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/video%20services.png',
    'voice agent': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/voice%20agent.png',
    'website development': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/website%20development.png',
    'web development': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/website%20development.png',
    'writing and content': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/writing%20%26%20content.png',
    'writing content': 'https://pub-af6c20e7d44b4900bc48bb8b07ffb6a3.r2.dev/catamarket/writing%20%26%20content.png',
};

const resolveServiceLogoSrc = (service = {}, isDark = false) => {
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

    if (!isDark) {
        const r2Keys = Object.keys(R2_LIGHT_LOGOS);
        for (const candidate of candidates) {
            const normalized = normalizeServiceLogoKey(candidate);
            if (!normalized) continue;

            const mappedKey = SERVICE_LOGO_ALIASES[normalized] || normalized;
            if (R2_LIGHT_LOGOS[mappedKey]) return R2_LIGHT_LOGOS[mappedKey];

            const fuzzyKey = r2Keys.find((key) => key.includes(mappedKey) || mappedKey.includes(key));
            if (fuzzyKey) return R2_LIGHT_LOGOS[fuzzyKey];
        }
    }

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

const SERVICES_BADGE_FROST_MIN_OVERLAP = 24;
const SERVICES_BADGE_FROST_TRIGGER_DISTANCE =
    MATRIX_SPOTLIGHT_RADIUS - SERVICES_BADGE_FROST_MIN_OVERLAP;

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

const formatServiceStartingPrice = (service = {}) => {
    if (service?.price) return service.price;

    const minBudget = Number(service?.min_budget);
    if (Number.isFinite(minBudget) && minBudget > 0) {
        return `\u20B9${minBudget.toLocaleString('en-IN')}/-`;
    }

    return '\u20B910,000/-';
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

const sanitizeAssistantContent = (content = "") => {
    if (typeof content !== "string") return "";

    return content
        .replace(/(^|[ \t\r\n])Q\d+\s*[\.\:\-]?\s*/gim, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
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

const FREEFORM_FOLLOWUP_OPTION_REGEX = /\b(not sure|other|suggest|recommend|advice|help|guidance|decide for me|choose for me|open to recommendations?)\b/i;
const AUTO_HELPER_QUESTION_REGEX = /\b(budget|price|pricing|cost|timeline|ready|launch|deadline|when would you like|when do you want|how soon)\b/i;
const AUTO_RECOMMEND_OPTION_VALUE = 'Recommend best option';
const EXCLUSIVE_NONE_LIKE_PHRASES = [
    'none',
    'none of these',
    'none of the above',
    'nothing yet',
    'nothing available',
    'not sure',
    'not sure yet',
    'unsure',
    'undecided',
    'undecided yet',
    'havent decided',
    'have not decided',
    'dont know',
    'do not know',
    'dont know yet',
    'do not know yet',
    'no idea',
    'no preference',
    'no assets yet',
    'no materials yet',
    'none for now',
    'nothing for now',
];
const EXCLUSIVE_NONE_LIKE_BLOCKLIST = /\bother\b/i;
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
                <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{normalized}</ReactMarkdown>
            </div>
        );
    }

    return (
        <div className={`${className} space-y-4`}>
            {blocks.map((block, index) => (
                <div key={`assistant-block-${index}`}>
                    <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{block}</ReactMarkdown>
                </div>
            ))}
        </div>
    );
};

const AssistantMessageBody = ({
    content,
    isDark,
    enableOptionClick = false,
    forceInteractiveOptions = false,
    onOptionClick = () => { },
    isOptionSelected = () => false,
    isMultiInput = false,
    isSingleChoiceInput = false,
    selectedCount = 0,
    onSubmitMulti = () => { }
}) => {
    const { contextText, questionText, options } = parseAssistantMessageLayout(content, {
        forceInteractiveOptions,
    });
    const hasStructuredQuestion = Boolean(questionText) || options.length > 0;
    const assistantMarkdownClassName = `prose prose-sm max-w-none break-words text-[13px] leading-normal prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0.5 prose-strong:font-normal prose-headings:font-normal ${isDark
        ? 'prose-invert prose-p:text-slate-100 prose-li:text-slate-100 prose-headings:text-white prose-a:text-primary'
        : 'prose-p:text-slate-700 prose-li:text-slate-700 prose-headings:text-slate-900 prose-a:text-primary'
        }`;

    if (!hasStructuredQuestion) {
        return <AssistantMarkdownBlocks content={content} className={assistantMarkdownClassName} />;
    }

    return (
        <div className="space-y-2">
            {contextText && (
                <AssistantMarkdownBlocks content={contextText} className={assistantMarkdownClassName} />
            )}

            {questionText && (
                <div className={`rounded-2xl border px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${isDark ? 'border-primary/20 bg-primary/5' : 'border-primary/30 bg-primary/12'}`}>
                    <div className={`prose prose-sm max-w-none break-words text-[12.5px] font-medium leading-normal prose-p:my-0.5 ${isDark ? 'prose-invert prose-p:text-primary' : 'prose-p:text-slate-800'}`}>
                        <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{questionText}</ReactMarkdown>
                    </div>
                </div>
            )}

            {options.length > 0 && (
                <div className={`grid gap-1.5 ${
                    options.length > 8
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                        : options.length > 4
                            ? 'grid-cols-1 sm:grid-cols-2'
                            : 'grid-cols-1'
                }`}>
                    {options.map((option) => (
                        enableOptionClick ? (
                            <button
                                key={`${option.number}-${option.text}`}
                                type="button"
                                onClick={() => onOptionClick(option.text)}
                                className={`group flex w-full items-start gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all ${isOptionSelected(option.text)
                                    ? 'border-primary bg-primary/18 ring-1 ring-primary/45'
                                    : isDark
                                        ? 'border-white/15 bg-white/[0.045] hover:border-white/30 hover:bg-white/[0.09]'
                                        : 'border-black/10 bg-white hover:border-black/20 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-bold keep-white shadow-sm ${isDark ? 'border-white/15 bg-white/5 text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none text-[13px] leading-normal prose-p:my-0 ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
                                    <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{option.text}</ReactMarkdown>
                                </div>
                            </button>
                        ) : (
                            <div
                                key={`${option.number}-${option.text}`}
                                className={`flex items-start gap-2 rounded-xl border px-2.5 py-1.5 ${isDark ? 'border-white/15 bg-white/[0.045]' : 'border-black/10 bg-white'}`}
                            >
                                <span className={`mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-bold keep-white shadow-sm ${isDark ? 'border-white/15 bg-white/5 text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}>
                                    {option.number}
                                </span>
                                <div className={`prose prose-sm max-w-none text-[13px] leading-normal prose-p:my-0 ${isDark ? 'prose-invert text-slate-100' : 'text-slate-700'}`}>
                                    <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{option.text}</ReactMarkdown>
                                </div>
                            </div>
                        )
                    ))}

                    {enableOptionClick && isMultiInput && (
                        <div className="col-span-full mt-1.5">
                            <Button
                                type="button"
                                className="rounded-full bg-primary px-4 py-1.5 h-8 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                                disabled={selectedCount === 0}
                                onClick={onSubmitMulti}
                            >
                                Send selection
                            </Button>
                        </div>
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

const toSingleLinePlaceholder = (value = '') =>
    String(value || '')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
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

const isNoneLikeSelectionOption = (value = '') => {
    const normalized = normalizeHelperIntentText(String(value || '').replace(/[/'’]/g, ' '));
    if (!normalized) return false;
    if (EXCLUSIVE_NONE_LIKE_BLOCKLIST.test(normalized)) return false;
    if (EXCLUSIVE_NONE_LIKE_PHRASES.includes(normalized)) return true;

    return (
        /\b(?:none|nothing|not sure|unsure|undecided|no idea|no preference)\b/i.test(normalized)
        && !/\b(?:logo|design|brand|identity|packaging|guidelines|document|assets|website|app|marketing|seo)\b/i.test(normalized)
    );
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
        || optionTexts.find((text) => (
            !FREEFORM_FOLLOWUP_OPTION_REGEX.test(normalizeHelperIntentText(text))
            && !isNoneLikeSelectionOption(text)
        ))
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
    forceRecommendationPopup = false,
    disableAutoRecommendationPopup = false,
}) => {
    if (disableAutoRecommendationPopup) return false;
    if (forceRecommendationPopup) return true;
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
                <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{normalizeProposalPreviewContent(content)}</ReactMarkdown>
            </div>
        );
    }

    const presentMetaFields = PROPOSAL_META_FIELDS.filter(({ key }) => parsed.fields[key]);

    return (
        <div className="space-y-5">
            {presentMetaFields.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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

const BRIEFING_KICKOFF_OPTIONS = [
    'ASAP',
    'This week',
    'Next week',
    'In 2 weeks',
    'This month',
    'Flexible',
];

const BRIEFING_DURATION_OPTIONS = [
    'Under 1 week',
    '1-2 weeks',
    '3-4 weeks',
    '1-2 months',
    '3-6 months',
    'Ongoing',
];

const createInitialBriefingAnswers = () => ({
    role: '',
    goal: '',
    budgetMin: '',
    budgetMax: '',
    kickoff: '',
    duration: '',
});

const BRIEFING_STEP_DEFINITIONS = [
    {
        key: 'role',
        label: 'Who should step into this brief?',
        eyebrow: 'Set the direction',
        placeholder: 'e.g. Full-Stack Developer, Brand Designer, SEO Specialist...',
    },
    {
        key: 'goal',
        label: 'What should they help you bring to life?',
        eyebrow: 'Shape the outcome',
        placeholder: 'Enter your project brief...',
    },
];

const normalizeBriefingFragment = (value = '') =>
    String(value || '')
        .replace(/\s+/g, ' ')
        .trim();

const formatBriefingBudgetRange = (minValue = '', maxValue = '') => {
    const min = normalizeBriefingFragment(minValue);
    const max = normalizeBriefingFragment(maxValue);
    if (min && max) return `₹${min} - ₹${max}`;
    if (min) return `from ₹${min}`;
    if (max) return `up to ₹${max}`;
    return '';
};

const buildBriefingSentenceParts = ({
    role = '',
    goal = '',
    budgetMin = '',
    budgetMax = '',
    kickoff = '',
    duration = '',
    referenceCount = 0,
}) => ({
    role: normalizeBriefingFragment(role),
    goal: normalizeBriefingFragment(goal),
    budget: formatBriefingBudgetRange(budgetMin, budgetMax),
    kickoff: normalizeBriefingFragment(kickoff),
    duration: normalizeBriefingFragment(duration),
    references: referenceCount > 0 ? `${referenceCount} reference${referenceCount === 1 ? '' : 's'} attached` : '',
});

const buildBriefingSummary = ({
    answers = createInitialBriefingAnswers(),
    referenceLinks = [],
    attachmentCount = 0,
    fileContexts = [],
}) => {
    const parts = buildBriefingSentenceParts({
        ...answers,
        referenceCount: (Array.isArray(referenceLinks) ? referenceLinks.length : 0) + Number(attachmentCount || 0),
    });
    const lines = [
        `I'm looking for ${parts.role || 'the right specialist'} to ${parts.goal || 'move this project forward'}.`,
    ];

    if (parts.budget || parts.kickoff || parts.duration) {
        lines.push([
            parts.budget ? `Budget: ${parts.budget}` : '',
            parts.kickoff ? `Kickoff: ${parts.kickoff}` : '',
            parts.duration ? `Duration: ${parts.duration}` : '',
        ].filter(Boolean).join(' | '));
    }

    const normalizedLinks = (Array.isArray(referenceLinks) ? referenceLinks : []).filter(Boolean);
    if (normalizedLinks.length > 0) {
        lines.push(`Reference links:\n${normalizedLinks.map((link) => `- ${link}`).join('\n')}`);
    }

    const readableFileContexts = (Array.isArray(fileContexts) ? fileContexts : [])
        .map((entry) => ({
            name: String(entry?.name || 'Attachment').trim() || 'Attachment',
            typeLabel: String(entry?.typeLabel || 'File').trim() || 'File',
            text: String(entry?.text || '').trim(),
        }))
        .filter((entry) => entry.text);

    if (readableFileContexts.length > 0) {
        lines.push([
            'Reference file content:',
            ...readableFileContexts.map((entry) =>
                [
                    `### ${entry.name}`,
                    `Type: ${entry.typeLabel}`,
                    '',
                    entry.text.slice(0, BRIEFING_FILE_TEXT_MAX_CHARS),
                ].join('\n').trim()
            ),
        ].join('\n\n'));
    }

    if (attachmentCount > 0) {
        lines.push(`Attached ${attachmentCount} reference file${attachmentCount === 1 ? '' : 's'} for context.`);
    }

    return lines.filter(Boolean).join('\n\n').trim();
};

const getBriefingFileExtension = (fileName = '') => {
    const match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] || '';
};

const getBriefingFileTypeLabel = (file = {}) => {
    const mimeType = String(file?.type || '').toLowerCase();
    const extension = getBriefingFileExtension(file?.name || '');

    if (mimeType === 'application/pdf' || extension === 'pdf') return 'PDF';
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || extension === 'docx'
    ) {
        return 'DOCX';
    }
    if (mimeType === 'application/msword' || extension === 'doc') return 'DOC';
    if (mimeType === 'text/plain' || extension === 'txt') return 'TXT';
    if (extension === 'zip') return 'ZIP';
    if (mimeType.startsWith('image/')) return 'Image';
    return 'File';
};

const truncateBriefingFileText = (text = '') => {
    const normalized = String(text || '').replace(/\u0000/g, '').trim();
    if (normalized.length <= BRIEFING_FILE_TEXT_MAX_CHARS) {
        return normalized;
    }
    return `${normalized.slice(0, BRIEFING_FILE_TEXT_MAX_CHARS).trimEnd()}\n\n[Truncated to keep the request size manageable.]`;
};

const extractBriefingTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items.filter((item) => item.str.trim().length > 0);

        items.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5) {
                return yDiff;
            }
            return a.transform[4] - b.transform[4];
        });

        let pageText = '';
        let lastY = null;
        items.forEach((item) => {
            const { str: text, transform } = item;
            const y = transform[5];
            if (lastY !== null && Math.abs(y - lastY) > 5) {
                pageText += '\n';
            }
            pageText += (pageText && pageText[pageText.length - 1] !== '\n' ? ' ' : '') + text;
            lastY = y;
        });

        fullText += `${pageText}\n\n`;
    }

    return truncateBriefingFileText(fullText);
};

const extractBriefingTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return truncateBriefingFileText(result.value || '');
};

const extractBriefingTextFromFile = async (file) => {
    const extension = getBriefingFileExtension(file?.name || '');
    const mimeType = String(file?.type || '').toLowerCase();

    if (mimeType === 'application/pdf' || extension === 'pdf') {
        return extractBriefingTextFromPdf(file);
    }

    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || extension === 'docx'
    ) {
        return extractBriefingTextFromDocx(file);
    }

    if (mimeType === 'text/plain' || extension === 'txt') {
        return truncateBriefingFileText(await file.text());
    }

    return '';
};

const buildBriefingGoalSuggestions = (role = '') => {
    const normalizedRole = normalizeServiceLogoKey(role);
    if (/\b(brand|design|ui|ux|creative)\b/.test(normalizedRole)) {
        return [
            'refresh our visual identity',
            'design a polished landing page',
            'create a modern brand system',
            'improve product UX across key flows',
        ];
    }
    if (/\b(seo|content|writer|copy)\b/.test(normalizedRole)) {
        return [
            'grow organic traffic',
            'rewrite our website messaging',
            'publish SEO-focused content',
            'improve local search visibility',
        ];
    }
    if (/\b(video|editor|motion|ugc|cgi)\b/.test(normalizedRole)) {
        return [
            'edit short-form content for paid ads',
            'create launch videos for a product',
            'produce polished reel-style edits',
            'turn raw footage into branded content',
        ];
    }
    if (/\b(ai|automation|agent|crm|erp)\b/.test(normalizedRole)) {
        return [
            'automate lead follow-up',
            'build an internal AI assistant',
            'streamline operations with workflows',
            'connect our CRM with customer support',
        ];
    }
    if (/\b(app|mobile|ios|android)\b/.test(normalizedRole)) {
        return [
            'build an MVP from scratch',
            'ship a mobile app for customers',
            'add new product features',
            'turn an idea into a working prototype',
        ];
    }
    return [
        'build an MVP from scratch',
        'launch a stronger online presence',
        'redesign an existing product experience',
        'grow demand with sharper positioning',
    ];
};

const BRIEFING_SERVICE_MATCHERS = [
    {
        test: /\b(website|landing page|landing pages|web app|webapp|portal|dashboard|frontend|full stack|full-stack|saas|mvp|site)\b/i,
        aliases: ['website development', 'web development', 'web dev', 'software development'],
    },
    {
        test: /\b(mobile app|ios|android|react native|flutter|app store|play store)\b/i,
        aliases: ['app development', 'mobile app development'],
    },
    {
        test: /\b(ai automation|automation|workflow|agent|chatbot|voice bot|voice agent|whatsapp bot|ai assistant)\b/i,
        aliases: ['ai automation', 'voice agent', 'crm and erp integrated solutions'],
    },
    {
        test: /\b(brand|branding|identity|logo|visual system)\b/i,
        aliases: ['branding', 'branding kit', 'creative and design'],
    },
    {
        test: /\b(ui|ux|product design|wireframe|figma|design system)\b/i,
        aliases: ['creative and design', 'website development'],
    },
    {
        test: /\b(seo|search engine|organic traffic|gmb|google business)\b/i,
        aliases: ['seo', 'seo / gmb'],
    },
    {
        test: /\b(content|copywriting|blog|articles|messaging|writer)\b/i,
        aliases: ['writing and content'],
    },
    {
        test: /\b(video|reel|shorts|ugc|editor|editing|motion|cgi)\b/i,
        aliases: ['video services', 'ugc marketing', 'cgi video services'],
    },
    {
        test: /\b(meta ads|google ads|performance marketing|paid ads|paid advertising)\b/i,
        aliases: ['paid advertising', 'performance marketing'],
    },
    {
        test: /\b(social media|instagram|linkedin|content calendar|organic social)\b/i,
        aliases: ['social media marketing', 'social media marketing organic'],
    },
];

const inferBriefingService = (services = [], answers = {}) => {
    const source = normalizeServiceLogoKey([
        answers?.role,
        answers?.goal,
    ].filter(Boolean).join(' '));
    if (!source) return null;

    const normalizedServices = Array.isArray(services)
        ? services.map((service) => ({
            service,
            haystack: normalizeServiceLogoKey([
                service?.name,
                service?.title,
                service?.slug,
                service?.id,
            ].filter(Boolean).join(' ')),
        }))
        : [];

    let bestMatch = null;
    let bestScore = -1;

    BRIEFING_SERVICE_MATCHERS.forEach((matcher, matcherIndex) => {
        if (!matcher.test.test(source)) return;

        normalizedServices.forEach((entry) => {
            const aliasScore = matcher.aliases.reduce((score, alias) => {
                const normalizedAlias = normalizeServiceLogoKey(alias);
                return entry.haystack.includes(normalizedAlias) ? score + 5 : score;
            }, 0);
            const tokenScore = entry.haystack
                .split(' ')
                .filter((token) => token.length >= 3 && source.includes(token))
                .length;
            
            if (aliasScore === 0 && tokenScore === 0) return;

            const score = aliasScore + tokenScore - matcherIndex * 0.01;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry.service;
            }
        });
    });

    return bestMatch;
};

const GuestAIDemo = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [randomString] = useState(() => generateRandomString(20000));
    const [isServicesBadgeNearGlow, setIsServicesBadgeNearGlow] = useState(false);
    const [isSubtitleNearGlow, setIsSubtitleNearGlow] = useState(false);
    const [isModeTabsNearGlow, setIsModeTabsNearGlow] = useState(false);
    const servicesBadgeRef = useRef(null);
    const subtitleContainerRef = useRef(null);
    const modeTabsContainerRef = useRef(null);

    useEffect(() => {
        const checkElementProximity = (element, clientX, clientY) => {
            if (!element) return false;
            const bounds = element.getBoundingClientRect();
            const deltaX = clientX < bounds.left
                ? bounds.left - clientX
                : clientX > bounds.right
                    ? clientX - bounds.right
                    : 0;
            const deltaY = clientY < bounds.top
                ? bounds.top - clientY
                : clientY > bounds.bottom
                    ? clientY - bounds.bottom
                    : 0;
            return Math.hypot(deltaX, deltaY) <= SERVICES_BADGE_FROST_TRIGGER_DISTANCE;
        };

        const updateAllProximities = (clientX, clientY) => {
            const badgeNear = checkElementProximity(servicesBadgeRef.current, clientX, clientY);
            const subtitleNear = checkElementProximity(subtitleContainerRef.current, clientX, clientY);
            const modeTabsNear = checkElementProximity(modeTabsContainerRef.current, clientX, clientY);

            setIsServicesBadgeNearGlow((v) => v === badgeNear ? v : badgeNear);
            setIsSubtitleNearGlow((v) => v === subtitleNear ? v : subtitleNear);
            setIsModeTabsNearGlow((v) => v === modeTabsNear ? v : modeTabsNear);
        };

        const handleMouseMove = (event) => {
            mouseX.set(event.clientX);
            mouseY.set(event.clientY);
            updateAllProximities(event.clientX, event.clientY);
        };

        const handleMouseLeave = () => {
            setIsServicesBadgeNearGlow(false);
            setIsSubtitleNearGlow(false);
            setIsModeTabsNearGlow(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [mouseX, mouseY]);

    const handleCardGlowMouseMove = useCallback((event) => {
        const cardElement = event.currentTarget;
        const bounds = cardElement.getBoundingClientRect();
        cardElement.style.setProperty('--card-glow-x', `${event.clientX - bounds.left}px`);
        cardElement.style.setProperty('--card-glow-y', `${event.clientY - bounds.top}px`);
    }, []);

    const { theme, isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        document.documentElement.classList.add("marketplace-page");
        document.documentElement.classList.add("ai-demo-page");
        return () => {
            document.documentElement.classList.remove("marketplace-page");
            document.documentElement.classList.remove("ai-demo-page");
        };
    }, []);

    const [serviceSelectionMode, setServiceSelectionMode] = useState(
        SERVICE_SELECTION_MODES.FREELANCER
    );
    const [services, setServices] = useState([]);
    const [servicesError, setServicesError] = useState("");
    const [loading, setLoading] = useState(true);
    const [briefingAnswers, setBriefingAnswers] = useState(() => createInitialBriefingAnswers());
    const [briefingStepIndex, setBriefingStepIndex] = useState(0);
    const [briefingReferenceInput, setBriefingReferenceInput] = useState('');
    const [briefingReferenceLinks, setBriefingReferenceLinks] = useState([]);
    const [briefingFiles, setBriefingFiles] = useState([]);
    const [briefingSubmitting, setBriefingSubmitting] = useState(false);
    const [showAllRoleServices, setShowAllRoleServices] = useState(false);
    const [pendingBriefSubmission, setPendingBriefSubmission] = useState(null);
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
    const [isRecommendationPanelOpen, setIsRecommendationPanelOpen] = useState(false);
    const [usedRecommendationKey, setUsedRecommendationKey] = useState('');
    const [attentionRecommendationKey, setAttentionRecommendationKey] = useState('');
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
    const briefingAttachmentInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const thinkingIntervalRef = useRef(null);
    const messagesRef = useRef(messages);
    const agencyFlowStateRef = useRef(agencyFlowState);
    const dismissedAutoHelperKeysRef = useRef(new Set());
    const shouldFocusAfterAssistantResponseRef = useRef(false);
    const lastAssistantMessageKeyRef = useRef('');
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
    const agencyFlowProgressLabel = isAgencyFlowActive
        ? `${Math.min(
            agencyFlowState.currentServiceIndex + (isAgencyFlowCompleted ? 1 : 0),
            agencyFlowState.selectedServices.length || 0
        )}/${agencyFlowState.selectedServices.length || 0}`
        : '';
    const agencySelectionSummary = agencySelectedServices
        .map((service) => String(service?.name || service?.title || '').trim())
        .filter(Boolean);
    const isMultiInput = normalizedInputType === 'multi_select'
        || normalizedInputType === 'multi_option'
        || normalizedInputType === 'grouped_multi_select';
    const isSingleChoiceInput = normalizedInputType === 'single_select'
        || normalizedInputType === 'single option'
        || normalizedInputType === 'single_option';
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
    const orderedServices = useMemo(() => {
        if (!Array.isArray(services) || services.length < 2) {
            return Array.isArray(services) ? services : [];
        }

        return [...services]
            .sort((a, b) =>
                String(a?.title || a?.name || '')
                    .localeCompare(String(b?.title || b?.name || ''), undefined, {
                        sensitivity: 'base',
                        numeric: true,
                    }),
            );
    }, [services]);
    const briefingGoalSuggestions = useMemo(
        () => buildBriefingGoalSuggestions(briefingAnswers.role),
        [briefingAnswers.role]
    );
    const inferredBriefingService = useMemo(
        () => inferBriefingService(orderedServices, briefingAnswers),
        [orderedServices, briefingAnswers]
    );
    const briefingSentence = useMemo(() => buildBriefingSentenceParts({
        ...briefingAnswers,
        referenceCount: briefingReferenceLinks.length + briefingFiles.length,
    }), [briefingAnswers, briefingReferenceLinks.length, briefingFiles.length]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        agencyFlowStateRef.current = agencyFlowState;
    }, [agencyFlowState]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestedMode = String(
            params.get('mode') || params.get('flow') || ''
        ).trim().toLowerCase();

        if (requestedMode === SERVICE_SELECTION_MODES.AGENCY) {
            setServiceSelectionMode(SERVICE_SELECTION_MODES.AGENCY);
            return;
        }

        if (requestedMode === SERVICE_SELECTION_MODES.FREELANCER) {
            setServiceSelectionMode(SERVICE_SELECTION_MODES.FREELANCER);
        }
    }, [location.search]);

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
        
        const messageElements = document.querySelectorAll('.guest-ai-message');
        const lastMessageElement = messageElements[messageElements.length - 1];

        if (lastMessageElement) {
            const viewportHeight = viewport.clientHeight;
            const messageHeight = lastMessageElement.offsetHeight;
            
            if (messageHeight > viewportHeight * 0.6) {
                const viewportRect = viewport.getBoundingClientRect();
                const msgRect = lastMessageElement.getBoundingClientRect();
                const relativeTop = msgRect.top - viewportRect.top + viewport.scrollTop;
                viewport.scrollTo({ top: relativeTop - 20, behavior: 'smooth' });
            } else {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }
        } else {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [getScrollViewport]);

    const getVisibleMessageInput = useCallback(() => {
        if (typeof document === 'undefined') return inputRef.current;

        const candidates = Array.from(
            document.querySelectorAll('textarea[data-guest-ai-input="true"]')
        );
        const visibleField = candidates.find((element) =>
            element instanceof HTMLElement
            && element.getClientRects().length > 0
            && window.getComputedStyle(element).visibility !== 'hidden'
        );

        return visibleField || inputRef.current;
    }, []);

    const focusMessageInput = useCallback(() => {
        if (!shouldShowTextInput) return;
        const field = getVisibleMessageInput();
        if (!field || field.disabled) return;

        if (
            typeof document !== 'undefined'
            && document.activeElement
            && document.activeElement !== field
            && typeof document.activeElement.blur === 'function'
        ) {
            document.activeElement.blur();
        }

        try {
            field.focus();
        } catch {
            field.focus({ preventScroll: true });
        }

        if (typeof field.scrollIntoView === 'function') {
            field.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }

        const textLength = typeof field.value === 'string' ? field.value.length : 0;
        if (typeof field.setSelectionRange === 'function') {
            field.setSelectionRange(textLength, textLength);
        }
    }, [getVisibleMessageInput, shouldShowTextInput]);

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
    const contextualPendingOptionPlaceholder = toSingleLinePlaceholder(
        stripMarkdownDecorators(
            pendingOptionFollowup?.loadingAdvice
                ? "Please wait..."
                : (pendingOptionFollowup?.placeholder || contextualPendingOptionHelperCopy.placeholder || pendingOptionPlaceholder)
        )
    );
    const pendingRecommendedAnswer = resolvePendingRecommendedAnswer({
        pendingFollowup: pendingOptionFollowup,
        notice: contextualPendingOptionNotice,
        placeholder: contextualPendingOptionPlaceholder,
    });
    const activeRecommendationKey = `${pendingOptionFollowup?.questionKey || ''}::${pendingOptionFollowup?.optionValue || ''}`;
    const isCurrentRecommendationUsed = Boolean(
        activeRecommendationKey
        && usedRecommendationKey
        && activeRecommendationKey === usedRecommendationKey
    );
    const shouldPulseRecommendationBulb = Boolean(
        isPendingOptionFollowup
        && activeRecommendationKey
        && attentionRecommendationKey === activeRecommendationKey
        && !isRecommendationPanelOpen
        && !isCurrentRecommendationUsed
    );
    const shouldForceRecommendationPopup = Boolean(inputConfig?.showRecommendationPopup);
    const shouldDisableAutoRecommendationPopup = Boolean(inputConfig?.disableAutoRecommendationPopup);
    const shouldAutoRecommendQuestion = !latestAssistantIsProposal
        && Boolean(latestAssistantPrompt.questionText)
        && shouldAutoRecommendCurrentQuestion({
            questionText: latestAssistantPrompt.questionText,
            contextText: latestAssistantPrompt.contextText,
            forceRecommendationPopup: shouldForceRecommendationPopup,
            disableAutoRecommendationPopup: shouldDisableAutoRecommendationPopup,
        });
    const automaticQuestionHelperKey = shouldAutoRecommendQuestion
        ? `${sessionId || 'guest'}::${normalizeOptionToken(latestAssistantPrompt.questionText)}::${normalizeOptionToken(latestAssistantPrompt.contextText)}`
        : '';

    useEffect(() => {
        if (!pendingOptionFollowup) {
            setIsRecommendationPanelOpen(false);
        }
    }, [pendingOptionFollowup]);

    useEffect(() => {
        if (!pendingOptionFollowup) {
            setUsedRecommendationKey('');
        }
    }, [pendingOptionFollowup]);

    useEffect(() => {
        if (!isPendingOptionFollowup || !activeRecommendationKey || isCurrentRecommendationUsed) {
            setAttentionRecommendationKey('');
            return;
        }
        setAttentionRecommendationKey(activeRecommendationKey);
    }, [
        activeRecommendationKey,
        isCurrentRecommendationUsed,
        isPendingOptionFollowup,
    ]);

    useEffect(() => {
        if (!isRecommendationPanelOpen || !activeRecommendationKey) return;
        setAttentionRecommendationKey((current) => (
            current === activeRecommendationKey ? '' : current
        ));
    }, [activeRecommendationKey, isRecommendationPanelOpen]);

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
                    placeholder: toSingleLinePlaceholder(stripMarkdownDecorators(data?.placeholder || fallbackPlaceholder)),
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
                    placeholder: toSingleLinePlaceholder(stripMarkdownDecorators(fallbackPlaceholder)),
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
        const isNoneLikeOption = isNoneLikeSelectionOption(resolvedValue);

        if (isMultiInput) {
            if (isNoneLikeOption) {
                setPendingOptionFollowup(null);
                setSelectedOptions([resolvedValue]);
                handleSendMessage(null, [resolvedValue], { ignorePendingOptionFollowup: true });
                return;
            }

            const alreadySelected = optionIsSelected(resolvedValue);
            setSelectedOptions((prev) => {
                const withoutNoneLike = prev.filter(
                    (value) => !isNoneLikeSelectionOption(value)
                );
                const alreadyChosen = prev.some(
                    (v) => normalizeOptionToken(v) === normalizeOptionToken(resolvedValue)
                );
                if (alreadyChosen) {
                    return withoutNoneLike.filter(
                        (v) => normalizeOptionToken(v) !== normalizeOptionToken(resolvedValue)
                    );
                }
                return [...withoutNoneLike, resolvedValue];
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
                    setIsRecommendationPanelOpen(true);
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
            setIsRecommendationPanelOpen(true);
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

    const applyPendingRecommendation = useCallback(() => {
        if (!pendingRecommendedAnswer) return;
        setInput((current) => current.trim() ? current : pendingRecommendedAnswer);
        setIsRecommendationPanelOpen(false);
        if (activeRecommendationKey) {
            setUsedRecommendationKey(activeRecommendationKey);
        }
        requestAnimationFrame(() => focusMessageInput());
    }, [activeRecommendationKey, focusMessageInput, pendingRecommendedAnswer]);

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
        if (!selectedService || isTyping || !shouldShowTextInput) return undefined;

        const latestAssistant = [...messages]
            .reverse()
            .find((message) => message?.role === 'assistant');
        const latestAssistantKey = latestAssistant
            ? `${latestAssistant.content || ''}::${messages.length}`
            : '';

        if (latestAssistantKey !== lastAssistantMessageKeyRef.current) {
            lastAssistantMessageKeyRef.current = latestAssistantKey;
            if (latestAssistantKey) {
                shouldFocusAfterAssistantResponseRef.current = true;
            }
        }

        if (!shouldFocusAfterAssistantResponseRef.current || !latestAssistantKey) {
            return undefined;
        }

        const rafId = window.requestAnimationFrame(() => {
            focusMessageInput();
        });
        const timeoutIds = [120, 280, 520, 900].map((delay, index, delays) => window.setTimeout(() => {
            focusMessageInput();
            if (index === delays.length - 1) {
                shouldFocusAfterAssistantResponseRef.current = false;
            }
        }, delay));

        return () => {
            window.cancelAnimationFrame(rafId);
            timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
        };
    }, [messages, isTyping, selectedService, shouldShowTextInput, focusMessageInput]);

    useEffect(() => {
        if (!isTyping && shouldShowTextInput) {
            const rafId = window.requestAnimationFrame(() => {
                focusMessageInput();
            });
            const timeoutId = window.setTimeout(() => {
                focusMessageInput();
            }, 120);
            const retryTimeoutId = window.setTimeout(() => {
                focusMessageInput();
            }, 280);
            const finalRetryTimeoutId = window.setTimeout(() => {
                focusMessageInput();
            }, 520);

            return () => {
                window.cancelAnimationFrame(rafId);
                window.clearTimeout(timeoutId);
                window.clearTimeout(retryTimeoutId);
                window.clearTimeout(finalRetryTimeoutId);
            };
        }

        return undefined;
    }, [messages, isTyping, shouldShowTextInput, inputConfig, selectedService, focusMessageInput]);

    useEffect(() => {
        setSelectedOptions([]);
    }, [inputConfig.type, inputConfig.options]);

    useEffect(() => {
        if (shouldDisableAutoRecommendationPopup && pendingOptionFollowup?.autoSuggestion) {
            setPendingOptionFollowup(null);
        }
    }, [pendingOptionFollowup?.autoSuggestion, shouldDisableAutoRecommendationPopup]);

    useEffect(() => {
        if (!pendingOptionFollowup?.autoSuggestion) return;

        if (!automaticQuestionHelperKey) {
            setPendingOptionFollowup(null);
        }
    }, [automaticQuestionHelperKey, pendingOptionFollowup?.autoSuggestion]);

    useEffect(() => {
        if (!automaticQuestionHelperKey) return;
        if (dismissedAutoHelperKeysRef.current.has(automaticQuestionHelperKey)) return;
        if (shouldDisableAutoRecommendationPopup) return;

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
        shouldDisableAutoRecommendationPopup,
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

    const isAllowedUploadFile = useCallback((file) => {
        if (!file) return false;
        if (file.type?.startsWith('image/')) return true;
        if (ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) return true;

        const name = String(file.name || '').toLowerCase();
        return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));
    }, []);

    const resetBriefingState = useCallback(() => {
        setBriefingAnswers(createInitialBriefingAnswers());
        setBriefingStepIndex(0);
        setBriefingReferenceInput('');
        setBriefingReferenceLinks([]);
        setBriefingFiles([]);
        setBriefingSubmitting(false);
        setPendingBriefSubmission(null);
    }, []);

    const updateBriefingAnswer = useCallback((key, value) => {
        setBriefingAnswers((current) => ({
            ...current,
            [key]: value,
        }));
    }, []);

    const addBriefingReferenceLink = useCallback(() => {
        const normalizedLink = normalizeSharedUrl(briefingReferenceInput);
        if (!normalizedLink) {
            if (briefingReferenceInput.trim()) {
                toast.error('Enter a valid link to add it to the brief.');
            }
            return false;
        }

        let added = false;
        setBriefingReferenceLinks((current) => {
            if (current.includes(normalizedLink)) return current;
            added = true;
            return [...current, normalizedLink].slice(0, 5);
        });
        setBriefingReferenceInput('');
        return added;
    }, [briefingReferenceInput]);

    const removeBriefingReferenceLink = useCallback((index) => {
        setBriefingReferenceLinks((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }, []);

    const handleBriefingFilePick = useCallback((event) => {
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

        setBriefingFiles((current) => {
            const deduped = [...current];
            nextValidFiles.forEach((file) => {
                const exists = deduped.some((entry) =>
                    entry.name === file.name
                    && entry.size === file.size
                    && entry.lastModified === file.lastModified
                );
                if (!exists) deduped.push(file);
            });
            return deduped.slice(0, 5);
        });
    }, [isAllowedUploadFile]);

    const removeBriefingFile = useCallback((index) => {
        setBriefingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    }, []);

    const currentBriefingStepKey = BRIEFING_STEP_DEFINITIONS[briefingStepIndex]?.key || 'role';

    const isCurrentBriefingStepValid = useMemo(() => {
        if (currentBriefingStepKey === 'role') return normalizeBriefingFragment(briefingAnswers.role).length >= 3;
        if (currentBriefingStepKey === 'goal') return normalizeBriefingFragment(briefingAnswers.goal).length >= 8;
        if (currentBriefingStepKey === 'budget') return Boolean(formatBriefingBudgetRange(briefingAnswers.budgetMin, briefingAnswers.budgetMax));
        if (currentBriefingStepKey === 'kickoff') return Boolean(normalizeBriefingFragment(briefingAnswers.kickoff));
        if (currentBriefingStepKey === 'duration') return Boolean(normalizeBriefingFragment(briefingAnswers.duration));
        return true;
    }, [briefingAnswers, currentBriefingStepKey]);

    const goToNextBriefingStep = useCallback(() => {
        if (!isCurrentBriefingStepValid) return;
        startTransition(() => {
            setBriefingStepIndex((current) => Math.min(BRIEFING_STEP_DEFINITIONS.length - 1, current + 1));
        });
    }, [isCurrentBriefingStepValid]);

    const goToPreviousBriefingStep = useCallback(() => {
        startTransition(() => {
            setBriefingStepIndex((current) => Math.max(0, current - 1));
        });
    }, []);

    async function startBriefingConversation() {
        if (!inferredBriefingService) {
            toast.error(servicesError || 'We could not match the brief to a service yet.');
            return;
        }

        setBriefingSubmitting(true);

        let fileContexts = [];
        if (briefingFiles.length > 0) {
            const extractedContexts = await Promise.all(
                briefingFiles.map(async (file) => {
                    try {
                        const text = await extractBriefingTextFromFile(file);
                        return {
                            name: file.name || 'Attachment',
                            typeLabel: getBriefingFileTypeLabel(file),
                            text,
                        };
                    } catch (error) {
                        console.warn('[GuestAIDemo] Failed to extract text from briefing file:', file?.name, error);
                        return {
                            name: file.name || 'Attachment',
                            typeLabel: getBriefingFileTypeLabel(file),
                            text: '',
                        };
                    }
                }),
            );

            fileContexts = extractedContexts;

            const unreadableFiles = extractedContexts.filter((entry) => !String(entry.text || '').trim());
            if (unreadableFiles.length > 0) {
                toast.info(
                    `${unreadableFiles.length} attached file${unreadableFiles.length === 1 ? '' : 's'} could not be text-read in the browser and will be uploaded as files only.`,
                );
            }
        }

        const summary = buildBriefingSummary({
            answers: briefingAnswers,
            referenceLinks: briefingReferenceLinks,
            attachmentCount: briefingFiles.length,
            fileContexts,
        });

        setPendingBriefSubmission({
            content: summary,
            attachments: briefingFiles,
        });

        const started = await startServiceConversation(inferredBriefingService, {
            preserveExistingMessages: false,
            flowMode: SERVICE_SELECTION_MODES.FREELANCER,
        });

        if (!started) {
            setPendingBriefSubmission(null);
            setBriefingSubmitting(false);
        }
    }

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
        setIsRecommendationPanelOpen(false);
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

        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get('service') !== (service.slug || service.id)) {
            currentParams.set('service', service.slug || service.id);
            navigate(`${window.location.pathname}?${currentParams.toString()}`, { replace: true, state: window.location.state });
        }

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
        shouldFocusAfterAssistantResponseRef.current = true;
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
                    data.history.map((message) => (
                        message?.role === 'assistant' && typeof message.content === 'string'
                            ? { ...message, content: sanitizeAssistantContent(message.content) }
                            : message
                    )),
                    [],
                    completedThinkingMeta
                )
                : [{
                    role: 'assistant',
                    content: sanitizeAssistantContent(data.message || `Hello! I see you're interested in ${service.name}.`),
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
        navigate,
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

    // Auto-select service from URL query parameter or location state
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const queryService = queryParams.get('service');
        const stateHasChat = location.state?.openChat;

        if (!queryService && !stateHasChat && selectedService) {
            dismissedAutoHelperKeysRef.current = new Set();
            setSelectedService(null);
            setSessionId(null);
            replaceMessages([]);
            resetChatComposerState();
            resetAgencyFlow();
            setAgencySelectedServiceIds([]);
            resetBriefingState();
            return;
        }
        
        if (services.length > 0 && !selectedService && (queryService || stateHasChat)) {
            const requestedId = queryService || location.state?.serviceId;
            const requestedTitle = location.state?.serviceTitle;
            
            const CAROUSEL_ID_TO_TITLE = {
                'web_development': 'Website Development',
                'app_development': 'App Development',
                'ai_automation': 'AI Automation',
                'crm_erp': 'CRM & ERP Integrated Solutions',
                'seo': 'SEO / GMB',
                'influencer_marketing': 'Influencer Marketing',
                'social_media_marketing': 'Social Media Marketing',
                'ugc_marketing': 'UGC Marketing',
                'creative_design': 'Creative & Design',
                'brandkit': 'Branding Kit',
                'paid_advertising': 'Paid Advertising',
                'content_writing': 'Writing & Content',
                'video_services': 'Video Services',
                'ai_video_generation': 'AI Video Generation',
                '3d_services': '3D Animation',
                'voice_agent': 'Voice Agent',
            };
            
            const aliasTitle = CAROUSEL_ID_TO_TITLE[requestedId];

            const normalizeStr = (str) => (str || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
            const normReqId = normalizeStr(requestedId);
            const normReqTitle = normalizeStr(requestedTitle);
            const normAliasTitle = normalizeStr(aliasTitle);

            const matchedService = services.find(
                s => (normReqId && normalizeStr(s.id) === normReqId) || 
                     (normReqId && normalizeStr(s.slug) === normReqId) ||
                     (normReqTitle && normalizeStr(s.title) === normReqTitle) ||
                     (normReqTitle && normalizeStr(s.name) === normReqTitle) ||
                     (normReqId && normalizeStr(s.name) === normReqId) ||
                     (normAliasTitle && normalizeStr(s.name) === normAliasTitle) ||
                     (normAliasTitle && normalizeStr(s.title) === normAliasTitle)
            );

            if (matchedService) {
                if (stateHasChat) {
                    const state = { ...location.state };
                    delete state.openChat;
                    navigate(window.location.pathname + window.location.search, { replace: true, state });
                }
                
                startServiceConversation(matchedService, {
                    preserveExistingMessages: false,
                    flowMode: SERVICE_SELECTION_MODES.FREELANCER,
                });
            }
        }
    }, [
        services, 
        location, 
        navigate, 
        selectedService, 
        startServiceConversation, 
        replaceMessages, 
        resetChatComposerState, 
        resetAgencyFlow, 
        resetBriefingState
    ]);

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
        const attachmentSource = Array.isArray(options?.pendingAttachmentsOverride)
            ? options.pendingAttachmentsOverride
            : pendingAttachments;
        let contentToSend = forcedContent ?? input;

        if (!ignorePendingOptionFollowup && pendingOptionValue && !pendingOptionFollowup?.autoSuggestion) {
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
        const hasAttachments = attachmentSource.length > 0;

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
            shouldFocusAfterAssistantResponseRef.current = true;
            setIsTyping(true);
            startThinkingTrace(requestStartedAt);
            setIsUploadingAttachment(hasAttachments);
            const uploadStartedAt = getNowTimestamp();
            const uploadedAttachments = hasAttachments
                ? await Promise.all(attachmentSource.map((file) => uploadGuestAttachment(file)))
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
                    content: sanitizeAssistantContent(data.message),
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

    useEffect(() => {
        if (!pendingBriefSubmission || !sessionId || !selectedService || loading || isTyping) return;

        const nextBriefPayload = pendingBriefSubmission;
        setPendingBriefSubmission(null);
        void handleSendMessage(null, nextBriefPayload.content, {
            ignorePendingOptionFollowup: true,
            pendingAttachmentsOverride: nextBriefPayload.attachments,
        }).finally(() => {
            setBriefingSubmitting(false);
            resetBriefingState();
        });
    }, [
        handleSendMessage,
        isTyping,
        loading,
        pendingBriefSubmission,
        resetBriefingState,
        selectedService,
        sessionId,
    ]);

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
            navigate(
                `/signin/phone?role=client&redirect=${encodeURIComponent(CLIENT_DASHBOARD_SEND_PROPOSAL_PATH)}`,
                {
                    state: {
                        fromProposal: true,
                    },
                },
            );
        }
    };

    const handleBackToServices = () => {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.has('service')) {
            currentParams.delete('service');
            const search = currentParams.toString();
            navigate(`${window.location.pathname}${search ? '?' + search : ''}`, { replace: true, state: window.location.state });
        }
        dismissedAutoHelperKeysRef.current = new Set();
        setSelectedService(null);
        setSessionId(null);
        replaceMessages([]);
        resetChatComposerState();
        resetAgencyFlow();
        setAgencySelectedServiceIds([]);
        resetBriefingState();
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

    const currentBriefingStep = BRIEFING_STEP_DEFINITIONS[briefingStepIndex] || BRIEFING_STEP_DEFINITIONS[0];
    const isLastBriefingStep = briefingStepIndex === BRIEFING_STEP_DEFINITIONS.length - 1;
    const canContinueBriefing = isLastBriefingStep
        ? Boolean(inferredBriefingService) && !briefingSubmitting
        : isCurrentBriefingStepValid;
    const briefingBackdropClasses = isDark
        ? 'bg-[radial-gradient(circle_at_top,rgba(var(--brand-rgb),0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(var(--brand-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(24,24,27,1)_0%,rgba(15,15,18,1)_100%)]'
        : 'bg-[radial-gradient(circle_at_top,rgba(var(--brand-rgb),0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(var(--brand-rgb),0.08),transparent_30%),linear-gradient(180deg,rgba(var(--background-rgb),1)_0%,rgba(var(--brand-rgb),0.08)_100%)]';
    const briefingGlowClasses = isDark ? 'bg-primary/14' : 'bg-primary/15';
    const briefingEyebrowClasses = isDark ? 'text-primary/70' : 'text-primary/80';
    const briefingHeadingClasses = isDark ? 'text-white' : 'text-foreground';
    const briefingHeadingSizeClasses = isDark
        ? 'text-[clamp(1.45rem,2.2vw,2.2rem)] leading-[1.16] tracking-[-0.024em] [text-shadow:0_0_28px_rgba(255,255,255,0.04)]'
        : 'text-[clamp(1.55rem,2.5vw,2.4rem)] leading-[1.14] tracking-[-0.024em]';
    const briefingAccentTextClasses = isDark ? '!text-primary' : '!text-[#D9692A]';
    const briefingBodyClasses = isDark ? 'text-muted-foreground' : 'text-muted-foreground';
    const briefingHeroStageClasses = isDark
        ? 'border-primary/14 bg-[linear-gradient(135deg,rgba(var(--brand-rgb),0.08)_0%,rgba(255,255,255,0.02)_22%,rgba(16,16,19,0.96)_70%)] shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.04),0_45px_120px_-70px_rgba(var(--brand-rgb),0.45)]'
        : 'border-transparent bg-transparent';
    const briefingCardClasses = isDark
        ? 'border-primary/16 bg-[linear-gradient(180deg,rgba(23,23,27,0.96)_0%,rgba(14,14,18,0.98)_100%)] shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.05),0_0_44px_rgba(var(--brand-rgb),0.08),0_55px_120px_-70px_rgba(0,0,0,0.88)]'
        : 'bg-white border border-[#e8e0d5] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]';
    const briefingCardDividerClasses = isDark ? 'border-border/70' : 'border-border/40';
    const briefingStepEyebrowClasses = isDark ? 'text-primary/90' : 'text-muted-foreground';
    const briefingStepTitleClasses = isDark ? 'text-white' : 'text-foreground';
    const briefingFieldTextClasses = isDark ? 'text-white placeholder:text-white/30' : 'text-foreground placeholder:text-muted-foreground/50';
    const briefingMicroLabelClasses = isDark ? 'text-muted-foreground' : 'text-muted-foreground';
    const briefingChipClasses = isDark
        ? 'border-border/70 bg-transparent text-zinc-200 hover:border-primary/50 hover:bg-primary/10 hover:text-white'
        : 'border-primary bg-white text-foreground hover:bg-primary/5 hover:text-primary';
    const briefingSelectedChipClasses = isDark ? 'border-primary bg-primary text-primary-foreground' : 'border-primary bg-primary !text-white';
    const briefingBudgetFieldClasses = isDark ? 'border-border/70 bg-white/[0.04]' : 'border-[#e4dbd2] bg-[#faf8f6]';
    const briefingUploadClasses = isDark
        ? 'border-border/70 bg-white/[0.03] text-zinc-300 hover:border-primary/50 hover:bg-primary/10'
        : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5';
    const briefingTagClasses = isDark ? 'border-border/70 bg-white/[0.04]' : 'border-border bg-background/70';
    const briefingTagTextClasses = isDark ? 'text-zinc-200' : 'text-foreground';
    const briefingTagSubtleClasses = isDark ? 'text-zinc-400' : 'text-muted-foreground';
    const briefingIconButtonClasses = isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground';
    const briefingBackButtonClasses = briefingStepIndex === 0
        ? (isDark ? 'cursor-not-allowed border-border/60 text-zinc-600' : 'cursor-not-allowed text-muted-foreground/50')
        : (isDark ? 'border-border/70 text-zinc-200 hover:border-primary/50 hover:bg-primary/10' : 'text-foreground hover:text-primary');
    const briefingHintClasses = isDark ? 'text-zinc-400' : 'text-muted-foreground';
    const briefingLikelyMatchClasses = isDark ? 'text-zinc-300' : 'text-muted-foreground';
    const briefingPrimaryButtonClasses = canContinueBriefing
        ? `bg-primary ${isDark ? 'text-[#1C1B1F]' : '!text-white'} hover:-translate-y-0.5 hover:brightness-95`
        : (isDark ? 'cursor-not-allowed bg-zinc-700 text-zinc-300' : 'cursor-not-allowed bg-muted text-muted-foreground');
    const briefingTextareaTypographyClasses = isDark
        ? 'text-[clamp(1rem,1.7vw,1.28rem)]'
        : 'text-[clamp(1.15rem,2.1vw,1.55rem)]';
    const visibleRoleServices = showAllRoleServices ? orderedServices : orderedServices.slice(0, 7);

    if (!selectedService) {
        return (
            <>
                <Navbar />
                <main className="relative min-h-screen overflow-hidden bg-background pt-16 text-foreground transition-colors sm:pt-20">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className={`absolute inset-0 ${briefingBackdropClasses}`} />
                        <div className={`absolute left-1/2 top-24 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full blur-[110px] ${briefingGlowClasses}`} />
                        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
                    </div>

                    <div className={`relative z-10 mx-auto w-full px-5 py-6 sm:py-10 sm:px-10 max-w-[840px]`}>
                        <div className={`mx-auto flex w-full flex-col justify-center min-h-0 max-w-full`}>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (isLastBriefingStep) {
                                    if (canContinueBriefing) {
                                        void startBriefingConversation();
                                    }
                                    return;
                                }

                                if (isCurrentBriefingStepValid) {
                                    goToNextBriefingStep();
                                }
                            }}
                            className={`relative z-10 overflow-hidden backdrop-blur rounded-[1.5rem] sm:rounded-[2rem] ${briefingCardClasses}`}
                        >
                            <div className="px-6 pt-7 pb-3 sm:px-8 sm:pt-8">
                                <div className="flex gap-4 items-start">
                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.65rem] bg-primary text-[15px] font-bold text-primary-foreground">
                                        {String(briefingStepIndex + 1).padStart(2, '0')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h2 className={`text-lg font-bold leading-snug tracking-[-0.01em] sm:text-xl ${isDark ? 'text-white' : 'text-foreground'}`}>
                                            {currentBriefingStep.key === 'role'
                                                ? 'Choose the direction that best describes your project.'
                                                : `Briefly describe your ${briefingAnswers.role ? String(briefingAnswers.role).toLowerCase() : 'project'} requirement.`}
                                        </h2>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                                            {currentBriefingStep.label}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`space-y-5 px-6 py-4 sm:px-8 sm:py-5`}>
                                {currentBriefingStep.key === 'role' ? (
                                    <>
                                        <div className="space-y-3">
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingMicroLabelClasses}`}>Popular directions</p>
                                            <div className="flex flex-wrap gap-3">
                                                {visibleRoleServices.map((service) => (
                                                    <button
                                                        key={getServiceIdentifier(service)}
                                                        type="button"
                                                        onClick={() => {
                                                            updateBriefingAnswer('role', service?.name || service?.title || '');
                                                            startTransition(() => {
                                                                setBriefingStepIndex((current) => Math.min(BRIEFING_STEP_DEFINITIONS.length - 1, current + 1));
                                                            });
                                                        }}
                                                        className={`rounded-full border px-4 py-2 text-xs transition-colors ${briefingChipClasses}`}
                                                    >
                                                        {service?.name || service?.title}
                                                    </button>
                                                ))}
                                                {orderedServices.length > 7 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAllRoleServices(!showAllRoleServices)}
                                                        className={`rounded-full border px-4 py-2 text-xs transition-colors ${briefingSelectedChipClasses}`}
                                                    >
                                                        {showAllRoleServices ? 'Less' : 'More'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {currentBriefingStep.key === 'goal' ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingMicroLabelClasses}`}>Your requirement</p>
                                            <div className={`flex items-center rounded-xl border px-4 py-3 ${briefingBudgetFieldClasses}`}>
                                                <input
                                                    value={briefingAnswers.goal}
                                                    onChange={(event) => updateBriefingAnswer('goal', event.target.value)}
                                                    placeholder={currentBriefingStep.placeholder}
                                                    className={`w-full bg-transparent text-base outline-none ${briefingFieldTextClasses}`}
                                                />
                                                {briefingAnswers.goal && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateBriefingAnswer('goal', '')}
                                                        className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary !text-white transition-colors hover:brightness-90"
                                                    >
                                                        <X className="h-3 w-3" style={{ color: 'white', stroke: 'white' }} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* <div className={`space-y-3 pt-2`}>
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingMicroLabelClasses}`}>Popular options</p>
                                            <div className="flex flex-wrap gap-3">
                                                {briefingGoalSuggestions.map((suggestion) => {
                                                    const isSelected = briefingAnswers.goal === suggestion;
                                                    return (
                                                        <button
                                                            key={suggestion}
                                                            type="button"
                                                            onClick={() => updateBriefingAnswer('goal', suggestion)}
                                                            className={`rounded-full border px-4 py-2 text-xs transition-colors ${isSelected ? briefingSelectedChipClasses : briefingChipClasses}`}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div> */}
                                    </>
                                ) : null}

                                {currentBriefingStep.key === 'budget' ? (
                                    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                                        <div className="space-y-2">
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${briefingMicroLabelClasses}`}>Min</p>
                                            <div className={`flex items-center rounded-2xl border px-4 py-3 ${briefingBudgetFieldClasses}`}>
                                                <span className="mr-2 text-lg text-[#d37b28]">₹</span>
                                                <input
                                                    value={briefingAnswers.budgetMin}
                                                    onChange={(event) => updateBriefingAnswer('budgetMin', event.target.value.replace(/[^\d,]/g, ''))}
                                                    placeholder="50,000"
                                                    className={`w-full bg-transparent text-xl font-serif italic outline-none sm:text-2xl ${briefingFieldTextClasses}`}
                                                />
                                            </div>
                                        </div>
                                        <div className={`hidden pb-4 text-center sm:block ${briefingMicroLabelClasses}`}>-</div>
                                        <div className="space-y-2">
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${briefingMicroLabelClasses}`}>Max</p>
                                            <div className={`flex items-center rounded-2xl border px-4 py-3 ${briefingBudgetFieldClasses}`}>
                                                <span className="mr-2 text-lg text-[#d37b28]">₹</span>
                                                <input
                                                    value={briefingAnswers.budgetMax}
                                                    onChange={(event) => updateBriefingAnswer('budgetMax', event.target.value.replace(/[^\d,]/g, ''))}
                                                    placeholder="1,00,000"
                                                    className={`w-full bg-transparent text-xl font-serif italic outline-none sm:text-2xl ${briefingFieldTextClasses}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {currentBriefingStep.key === 'kickoff' ? (
                                    <div className="space-y-3">
                                        <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingMicroLabelClasses}`}>Pick one</p>
                                        <div className="flex flex-wrap gap-3">
                                            {BRIEFING_KICKOFF_OPTIONS.map((option) => {
                                                const isSelected = briefingAnswers.kickoff === option;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => {
                                                            updateBriefingAnswer('kickoff', option);
                                                            startTransition(() => {
                                                                setBriefingStepIndex((current) => Math.min(BRIEFING_STEP_DEFINITIONS.length - 1, current + 1));
                                                            });
                                                        }}
                                                        className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${isSelected ? briefingSelectedChipClasses : briefingChipClasses}`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                {currentBriefingStep.key === 'duration' ? (
                                    <div className="space-y-3">
                                        <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingMicroLabelClasses}`}>Pick one</p>
                                        <div className="flex flex-wrap gap-3">
                                            {BRIEFING_DURATION_OPTIONS.map((option) => {
                                                const isSelected = briefingAnswers.duration === option;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => {
                                                            updateBriefingAnswer('duration', option);
                                                            startTransition(() => {
                                                                setBriefingStepIndex((current) => Math.min(BRIEFING_STEP_DEFINITIONS.length - 1, current + 1));
                                                            });
                                                        }}
                                                        className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${isSelected ? briefingSelectedChipClasses : briefingChipClasses}`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}


                            </div>

                            <div className={`flex flex-row items-center justify-between gap-4 border-t px-6 py-4 sm:px-8 ${briefingCardDividerClasses}`}>
                                <button
                                    type="button"
                                    onClick={goToPreviousBriefingStep}
                                    disabled={briefingStepIndex === 0}
                                    className={`flex items-center gap-2 text-[13px] font-semibold transition-colors ${briefingStepIndex === 0 ? 'invisible' : 'disabled:opacity-50'} ${briefingHintClasses} ${briefingBackButtonClasses}`}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </button>

                                <div className="flex items-center gap-4">

                                    {!['role', 'kickoff', 'duration'].includes(currentBriefingStep.key) && (
                                        <button
                                            type="submit"
                                            disabled={!canContinueBriefing}
                                            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all ${isDark ? 'h-11 px-5 text-sm' : 'h-10 px-5 text-sm'} ${briefingPrimaryButtonClasses}`}
                                        >
                                            {isLastBriefingStep ? (briefingSubmitting ? 'Starting...' : 'Continue') : 'Continue'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                        </div>
                    </div>

                    <div className={`relative z-10 mx-auto w-full px-5 ${isDark ? 'py-4 sm:py-6 sm:px-8 lg:px-10 max-w-[1280px]' : 'py-8 sm:px-8 lg:px-10 max-w-[1360px]'}`}>
                        <section className="mt-12 border-t border-white/6 pt-8">
                            <div className="mb-8 text-center">
                                <p className={`text-[11px] font-semibold uppercase tracking-[0.34em] ${briefingEyebrowClasses}`}>Explore Services</p>
                                <h2 className={`mt-3 text-2xl font-semibold sm:text-3xl ${briefingHeadingClasses}`}>Browse service categories</h2>
                                <p className={`mx-auto mt-3 max-w-2xl text-sm ${briefingBodyClasses}`}>
                                    Prefer to browse first? You can still jump directly into a service below.
                                </p>
                            </div>

                            <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-center gap-3">
                                {[
                                    {
                                        key: SERVICE_SELECTION_MODES.FREELANCER,
                                        label: 'Freelancer',
                                    },
                                    {
                                        key: SERVICE_SELECTION_MODES.AGENCY,
                                        label: 'Agency',
                                    },
                                ].map((modeOption) => {
                                    const isActive = serviceSelectionMode === modeOption.key;
                                    return (
                                        <button
                                            key={modeOption.key}
                                            type="button"
                                            onClick={() => setServiceSelectionMode(modeOption.key)}
                                            className={`inline-flex h-11 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-all duration-300 ${isActive
                                                ? `border-primary bg-primary ${isDark ? 'text-[#1C1B1F]' : '!text-white'} shadow-[0_12px_30px_-18px_rgba(249,217,73,0.9)]`
                                                : isDark
                                                    ? 'border-white/12 bg-card/80 text-zinc-200 hover:border-primary/50'
                                                    : 'border-[#dccfb8] bg-white text-[#1c1b1f] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.14)] hover:border-primary/50'
                                                }`}
                                        >
                                            {modeOption.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {isAgencySelectionMode ? (
                                <div className={`mx-auto mb-8 flex max-w-5xl flex-col gap-3 rounded-[1.5rem] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-primary/20 bg-primary/8' : 'border-[#eddc9c] bg-[#fffaf0]'}`}>
                                    <div className="flex flex-wrap gap-2">
                                        {agencySelectionSummary.length > 0 ? (
                                            agencySelectionSummary.map((label) => (
                                                <span
                                                    key={label}
                                                    className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                                                >
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className={`text-sm ${briefingBodyClasses}`}>
                                                Select services below.
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        {agencySelectedServices.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setAgencySelectedServiceIds([])}
                                                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors ${isDark ? 'border-white/10 text-zinc-300 hover:text-white' : 'border-[#dccfb8] text-[#5f5567] hover:text-[#1c1b1f]'}`}
                                            >
                                                Clear
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => startAgencyFlow()}
                                            disabled={agencySelectedServices.length === 0}
                                            className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all ${agencySelectedServices.length > 0
                                                ? `bg-primary ${isDark ? 'text-[#1C1B1F]' : '!text-white'} shadow-[0_12px_30px_-18px_rgba(249,217,73,0.9)] hover:-translate-y-0.5`
                                                : 'cursor-not-allowed bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            <span className={agencySelectedServices.length > 0 ? (isDark ? "text-[#1C1B1F]" : "!text-white") : "!text-muted-foreground"}>Continue with Agency</span>
                                            <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${agencySelectedServices.length > 0 ? (isDark ? 'bg-black/10 text-[#1C1B1F]' : 'bg-white/20 !text-white') : 'bg-background text-zinc-500'}`}>
                                                {agencySelectedServices.length}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                                {orderedServices.map((feature, index) => (
                                    <div
                                        key={feature.id || index}
                                        onClick={() => (
                                            isAgencySelectionMode
                                                ? toggleAgencyServiceSelection(feature)
                                                : handleServiceSelect(feature)
                                        )}
                                        onMouseMove={handleCardGlowMouseMove}
                                        style={{ '--card-glow-x': '50%', '--card-glow-y': '50%', '--primary': isDark ? '#F9D949' : '#D9692A' }}
                                        className={`group relative h-full cursor-pointer overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-2 ${agencySelectedServiceIds.includes(getServiceIdentifier(feature))
                                            ? 'border-primary'
                                            : isDark
                                                ? 'border-white/10 bg-card/85 hover:border-primary/50'
                                                : 'border-[#e8dfcf] bg-white hover:border-primary/60 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                        <div
                                            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                            style={{
                                                background:
                                                    'radial-gradient(260px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.08) 30%, transparent 65%)',
                                            }}
                                        />
                                        {isAgencySelectionMode ? (
                                            <div className="absolute right-4 top-4 z-20">
                                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${agencySelectedServiceIds.includes(getServiceIdentifier(feature))
                                                    ? (isDark ? 'bg-primary text-[#1C1B1F]' : 'bg-primary !text-white')
                                                    : isDark
                                                        ? 'border border-white/10 bg-black/40 text-zinc-400'
                                                        : 'border border-[#e8dfcf] bg-white/90 text-[#7c6f5d]'
                                                    }`}>
                                                    {agencySelectedServiceIds.includes(getServiceIdentifier(feature)) ? 'Selected' : 'Select'}
                                                </span>
                                            </div>
                                        ) : null}
                                        <div className="relative z-10 flex h-full flex-col p-5">
                                            <div className="relative mb-3 flex h-32 w-full items-center justify-center">
                                                <img
                                                    src={resolveServiceLogoSrc(feature, isDark)}
                                                    alt={feature.title || feature.name}
                                                    className="z-10 object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110 h-24 w-24"
                                                />
                                            </div>

                                            <div className="flex grow flex-col items-center text-center">
                                                <h3 className={`mb-2 text-lg font-bold leading-tight transition-colors duration-300 ${isDark ? 'text-white group-hover:text-primary' : 'text-[#1c1b1f] group-hover:!text-[#D9692A]'}`}>
                                                    {feature.title || feature.name}
                                                </h3>

                                                <p className="mb-4 line-clamp-3 text-sm font-medium leading-relaxed text-muted-foreground transition-colors">
                                                    {feature.description}
                                                </p>

                                                <div className="mt-auto flex w-full items-end justify-between border-t border-white/5 pt-4 text-left">
                                                    <div>
                                                        <p className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-[#9c8a77]'}`}>
                                                            Starting at
                                                        </p>
                                                        <p className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white group-hover:text-primary' : 'text-[#1c1b1f] group-hover:!text-[#D9692A]'}`}>
                                                            {formatServiceStartingPrice(feature)}
                                                        </p>
                                                    </div>
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${isDark ? 'border-white/10 text-white group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary' : 'border-[#e8dfcf] text-[#1c1b1f] group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ===== Why Businesses Choose Catalance ===== */}
                            <section id="why-choose-catalance" className="relative py-2 mt-20 sm:mt-28 z-10 max-w-3xl mx-auto w-full">
                                {/* Warm cream background card with adjusted height */}
                                <div className="relative rounded-3xl overflow-hidden border border-orange-100/60 dark:border-white/10 bg-[#FDF7F0] dark:bg-[#18130d] px-4 py-5 sm:px-6 sm:py-5">

                                    {/* Header */}
                                    <div className="text-center mb-4 space-y-2">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-[#1a1209] dark:text-white">
                                            Why Businesses Choose <span className="text-primary">Catalance</span>
                                        </h2>
                                        <p className="text-[#6b5c45] dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                                            Everything you need for successful project delivery — without the marketplace headaches.
                                        </p>

                                        {/* Trust avatars */}
                                        <div className="flex items-center justify-center gap-1.5 pt-0.5">
                                            <div className="flex -space-x-1.5">
                                                {["t1", "t2", "t3", "t4"].map((seed) => (
                                                    <div key={seed} className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-[#FDF7F0] dark:ring-[#18130d] bg-orange-100">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[11px] text-[#6b5c45] dark:text-slate-400">
                                                Trusted by <span className="font-bold text-primary">300+ Businesses</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comparison Table */}
                                    <div className="mx-auto w-full max-w-2xl">
                                        {/* Column Headers */}
                                        <div className="grid grid-cols-2 rounded-2xl overflow-hidden mb-0 shadow-sm">
                                            {/* Catalance header */}
                                            <div className="bg-primary flex items-center justify-center gap-1.5 py-2 px-4">
                                                <img
                                                    src={cataLogo}
                                                    alt="Catalance logo"
                                                    className="h-4 w-4 object-contain invert dark:invert-0"
                                                />
                                                <span className="!text-white dark:!text-black font-bold text-xs sm:text-sm">Catalance</span>
                                            </div>
                                            {/* VS badge & Other Platforms header */}
                                            <div className="bg-[#e8e5e0] dark:bg-[#2a2520] flex items-center justify-center gap-1.5 py-2 px-4 relative">
                                                <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f5f1ec] dark:bg-[#1a1512] border border-[#ddd9d3] dark:border-white/10 flex items-center justify-center z-10">
                                                    <span className="text-[7px] font-extrabold text-[#888] uppercase">vs</span>
                                                </div>
                                                <Users className="w-3.5 h-3.5 text-[#888] dark:text-slate-400" />
                                                <span className="text-[#555] dark:text-slate-300 font-semibold text-xs sm:text-sm">Other Platforms</span>
                                            </div>
                                        </div>

                                        {/* Comparison Rows */}
                                        <div className="divide-y divide-[#e8e0d5] dark:divide-white/10 bg-white/70 dark:bg-white/[0.03] rounded-b-2xl border border-t-0 border-[#e8e0d5] dark:border-white/10">
                                            {[
                                                {
                                                    catalance: { title: "Project Manager Included", desc: "You get a dedicated project manager to lead and coordinate your project." },
                                                    other: { title: "No Project Manager", desc: "You're on your own with no dedicated project manager." },
                                                },
                                                {
                                                    catalance: { title: "Verified Freelancers", desc: "Rigorous verification for skill and experience." },
                                                    other: { title: "Open Marketplace", desc: "Anyone can join with no verification." },
                                                },
                                                {
                                                    catalance: { title: "100% Refund Policy*", desc: "Full refund if you're not satisfied with the work." },
                                                    other: { title: "Limited Protection", desc: "Limited refund and dispute protection." },
                                                },
                                                {
                                                    catalance: { title: "Freelancer Replacement Available*", desc: "We'll replace your freelancer at no extra cost." },
                                                    other: { title: "Find a New Freelancer Yourself", desc: "You have to restart the whole process again." },
                                                },
                                                {
                                                    catalance: { title: "Dedicated Support", desc: "Real people, ready to help you succeed." },
                                                    other: { title: "Self-Service Support", desc: "Mostly help articles and automated replies." },
                                                },
                                                {
                                                    catalance: { title: "Fast Talent Matching", desc: "We match you with the right talent, faster." },
                                                    other: { title: "Endless Profile Searching", desc: "You search, filter and hope for the best." },
                                                },
                                                {
                                                    catalance: { title: "Transparent Pricing", desc: "Clear pricing, no hidden charges." },
                                                    other: { title: "Unexpected Platform Fees", desc: "Service fees and add-ons you didn't expect." },
                                                },
                                                {
                                                    catalance: { title: "Focused on Project Success", desc: "Your success is our top priority." },
                                                    other: { title: "Focused on Transactions", desc: "Their focus is on fees and transactions." },
                                                },
                                            ].map((row, idx) => (
                                                <div key={idx} className="grid grid-cols-2">
                                                    {/* Catalance column */}
                                                    <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4 border-r border-[#e8e0d5] dark:border-white/10">
                                                        <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.catalance.title}</p>
                                                            <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.catalance.desc}</p>
                                                        </div>
                                                    </div>
                                                    {/* Other platforms column */}
                                                    <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4">
                                                        <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-red-100/80 dark:bg-red-900/20 flex items-center justify-center">
                                                            <X className="w-2.5 h-2.5 text-red-500" strokeWidth={3} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.other.title}</p>
                                                            <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.other.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footnote */}
                                        <div className="text-right mt-2">
                                            <span className="text-[9px] text-primary italic font-medium">*Terms & Conditions Apply.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </section>
                    </div>
                </main>
            </>
        );
    }

    if (!selectedService && currentBriefingStepKey === '__legacy_service_picker__') {
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
                            <span
                                ref={servicesBadgeRef}
                                className={`inline-block rounded-full px-6 py-2 text-3xl font-semibold uppercase tracking-[0.4em] text-primary shadow-md transition-all duration-300 ${isServicesBadgeNearGlow
                                        ? 'border border-white/8 bg-white/[0.025] shadow-[0_14px_36px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md'
                                        : 'border border-transparent bg-background'
                                    }`}
                            >
                                Services
                            </span>
                            <div
                                ref={subtitleContainerRef}
                                className={`mx-auto flex max-w-4xl flex-col items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-300 ${isSubtitleNearGlow
                                        ? 'border border-white/8 bg-white/[0.025] shadow-[0_14px_36px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md'
                                        : 'border border-transparent bg-background'
                                    }`}
                            >
                                <h2 className="text-3xl font-semibold text-white">
                                    Clarity across every step of the freelance lifecycle.
                                </h2>
                                <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
                                    {isAgencySelectionMode
                                        ? 'Agency mode lets you bundle multiple services into one guided intake. We will ask each selected service flow in sequence and show one final combined proposal at the end.'
                                        : 'Freelancer mode keeps the current flow unchanged. Pick one service to start the guided chat immediately.'}
                                </p>
                            </div>
                            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 py-1">
                                <div className="text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                                        Choose Your Flow
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-400">
                                        Pick one mode before selecting services.
                                    </p>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                                    <div
                                        ref={modeTabsContainerRef}
                                        className={`grid gap-3 rounded-[2rem] p-2 transition-all duration-300 sm:grid-cols-2 ${isModeTabsNearGlow
                                                ? 'border border-white/8 bg-white/[0.025] shadow-[0_14px_36px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md'
                                                : 'border border-white/8 bg-background'
                                            }`}
                                    >
                                        {[
                                            {
                                                key: SERVICE_SELECTION_MODES.FREELANCER,
                                                label: 'Freelancer',
                                                title: 'Single-service proposal',
                                                description: 'Choose one service and generate one proposal for that service only.',
                                            },
                                            {
                                                key: SERVICE_SELECTION_MODES.AGENCY,
                                                label: 'Agency',
                                                title: 'Multi-service proposal',
                                                description: 'Select multiple services, answer each flow, and receive one combined proposal.',
                                            },
                                        ].map((modeOption) => {
                                            const isActive = serviceSelectionMode === modeOption.key;
                                            return (
                                                <button
                                                    key={modeOption.key}
                                                    type="button"
                                                    onClick={() => setServiceSelectionMode(modeOption.key)}
                                                    className={`rounded-[1.5rem] border px-5 py-4 text-left transition-all duration-300 ${isActive
                                                            ? `border-primary bg-primary ${isDark ? 'text-[#1C1B1F]' : '!text-white'} shadow-[0_16px_36px_-20px_rgba(249,217,73,0.8)]`
                                                            : 'border-white/10 bg-black/20 text-zinc-200 hover:border-primary/40 hover:bg-white/[0.04]'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className={`text-xs font-bold uppercase tracking-[0.22em] ${isActive ? (isDark ? 'text-black/70' : '!text-white/80') : 'text-primary'}`}>
                                                                {modeOption.label}
                                                            </p>
                                                            <h3 className={`mt-2 text-lg font-bold ${isActive ? (isDark ? 'text-black' : '!text-white') : (isDark ? 'text-white' : 'text-foreground')}`}>
                                                                {modeOption.title}
                                                            </h3>
                                                            <p className={`mt-2 text-sm leading-relaxed ${isActive ? (isDark ? 'text-black/75' : 'text-white/80') : 'text-zinc-400'}`}>
                                                                {modeOption.description}
                                                            </p>
                                                        </div>
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${isActive
                                                                ? (isDark ? 'bg-black/10 text-black' : 'bg-white/20 !text-white')
                                                                : 'border border-white/10 text-zinc-400'
                                                            }`}>
                                                            {isActive ? 'Active' : 'Select'}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-center lg:justify-end">
                                        <div
                                            aria-hidden={!isAgencySelectionMode}
                                            className={`flex shrink-0 items-center transition-opacity duration-200 ${isAgencySelectionMode
                                                    ? 'pointer-events-auto opacity-100'
                                                    : 'pointer-events-none opacity-0'
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => startAgencyFlow()}
                                                disabled={agencySelectedServices.length === 0 || !isAgencySelectionMode}
                                                tabIndex={isAgencySelectionMode ? 0 : -1}
                                                aria-label={
                                                    agencySelectedServices.length > 0
                                                        ? `Continue with ${agencySelectedServices.length} selected service${agencySelectedServices.length === 1 ? '' : 's'}`
                                                        : 'Select services to continue'
                                                }
                                                className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-[11px] font-semibold whitespace-nowrap transition-all ${agencySelectedServices.length > 0
                                                        ? `border-primary/40 bg-primary ${isDark ? 'text-[#1C1B1F]' : '!text-white'} hover:-translate-y-0.5 hover:opacity-90`
                                                        : 'cursor-not-allowed border-white/10 bg-background text-zinc-500'
                                                    }`}
                                            >
                                                <span className={agencySelectedServices.length > 0 ? (isDark ? "text-[#1C1B1F]" : "!text-white") : "!text-muted-foreground"}>Continue</span>
                                                <span
                                                    className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${agencySelectedServices.length > 0
                                                            ? (isDark ? 'bg-black/10 text-[#1C1B1F]' : 'bg-white/20 !text-white')
                                                            : 'bg-background text-zinc-500'
                                                        }`}
                                                >
                                                    {agencySelectedServices.length}
                                                </span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                            </div>
                            {isAgencySelectionMode ? (
                                <div className="mx-auto mt-4 flex w-full max-w-5xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left shadow-[0_18px_44px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                                                Agency Selection
                                            </p>
                                            <p className="mt-1 text-sm text-zinc-300">
                                                Choose multiple services and CATA AI will collect each scope, then return one combined proposal.
                                            </p>
                                        </div>
                                        {agencySelectedServices.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setAgencySelectedServiceIds([])}
                                                className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 px-4 text-xs font-semibold text-zinc-300 transition-colors hover:border-primary/40 hover:text-white"
                                            >
                                                Clear selection
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {agencySelectionSummary.length > 0 ? (
                                            agencySelectionSummary.map((label) => (
                                                <span
                                                    key={label}
                                                    className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                                                >
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-zinc-500">
                                                No services selected yet.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                            {orderedServices.length === 0 ? (
                                <div className="col-span-1 sm:col-span-2 lg:col-span-5 text-center text-white/60 py-10">
                                    {servicesError || (loading ? 'Loading services...' : 'No services available.')}
                                </div>
                            ) : (
                                orderedServices.map((feature, index) => {
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
                                            style={{ '--card-glow-x': '50%', '--card-glow-y': '50%', '--primary': isDark ? '#F9D949' : '#D9692A' }}
                                            className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer h-full bg-card hover:-translate-y-2 ${isAgencyCardSelected
                                                    ? 'border-primary'
                                                    : 'border-white/20 hover:border-primary/50'
                                                }`}
                                        >
                                            <div className={`absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent transition-opacity duration-500 ${isAgencyCardSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                                            <div
                                                className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${isAgencyCardSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                style={{
                                                    background: isDark
                                                        ? 'radial-gradient(260px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(249, 217, 73, 0.18) 0%, rgba(249, 217, 73, 0.08) 30%, transparent 65%)'
                                                        : 'radial-gradient(260px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(200, 80, 40, 0.18) 0%, rgba(200, 80, 40, 0.08) 30%, transparent 65%)',
                                                }}
                                            />
                                            {isAgencySelectionMode ? (
                                                <div className="absolute right-4 top-4 z-20">
                                                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${isAgencyCardSelected
                                                            ? (isDark ? 'bg-primary text-[#1C1B1F]' : 'bg-primary !text-white')
                                                            : 'border border-white/10 bg-black/40 text-zinc-400'
                                                        }`}>
                                                        {isAgencyCardSelected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div className="flex flex-col h-full p-5 relative z-10">
                                                <div className="h-32 w-full flex items-center justify-center mb-3 relative">
                                                    <img
                                                        src={resolveServiceLogoSrc(feature, isDark)}
                                                        alt={feature.title || feature.name}
                                                        className="object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500 ease-out w-24 h-24"
                                                    />
                                                </div>

                                                <div className="flex flex-col grow items-center text-center">
                                                    <h3 className={`text-lg font-bold mb-2 leading-tight transition-colors duration-300 ${isAgencyCardSelected ? 'text-primary' : (isDark ? 'text-white group-hover:text-primary' : 'text-[#1c1b1f] group-hover:text-primary')
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
                                                            <p className={`text-lg font-bold transition-colors duration-300 ${isAgencyCardSelected ? 'text-primary' : (isDark ? 'text-white group-hover:text-primary' : 'text-[#1c1b1f] group-hover:text-primary')
                                                                }`}>
                                                                {formatServiceStartingPrice(feature)}
                                                            </p>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors duration-300 ${isAgencyCardSelected
                                                                ? 'border-primary text-primary bg-primary/10'
                                                                : 'border-white/10 text-white group-hover:border-primary group-hover:text-primary group-hover:bg-primary/10'
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

                        {/* ===== Why Businesses Choose Catalance ===== */}
                        <section id="why-choose-catalance" className="relative py-2 mt-20 sm:mt-28 z-10 max-w-3xl mx-auto w-full">
                            {/* Warm cream background card with adjusted height */}
                            <div className="relative rounded-3xl overflow-hidden border border-orange-100/60 dark:border-white/10 bg-[#FDF7F0] dark:bg-[#18130d] px-4 py-5 sm:px-6 sm:py-5">

                                {/* Header */}
                                <div className="text-center mb-4 space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-[#1a1209] dark:text-white">
                                        Why Businesses Choose <span className="text-primary">Catalance</span>
                                    </h2>
                                    <p className="text-[#6b5c45] dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                                        Everything you need for successful project delivery — without the marketplace headaches.
                                    </p>

                                    {/* Trust avatars */}
                                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                                        <div className="flex -space-x-1.5">
                                            {["t1", "t2", "t3", "t4"].map((seed) => (
                                                <div key={seed} className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-[#FDF7F0] dark:ring-[#18130d] bg-orange-100">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[11px] text-[#6b5c45] dark:text-slate-400">
                                            Trusted by <span className="font-bold text-primary">300+ Businesses</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Comparison Table */}
                                <div className="mx-auto w-full max-w-2xl">
                                    {/* Column Headers */}
                                    <div className="grid grid-cols-2 rounded-2xl overflow-hidden mb-0 shadow-sm">
                                        {/* Catalance header */}
                                        <div className="bg-primary flex items-center justify-center gap-1.5 py-2 px-4">
                                            <img
                                                src={cataLogo}
                                                alt="Catalance logo"
                                                className="h-4 w-4 object-contain invert dark:invert-0"
                                            />
                                            <span className="!text-white dark:!text-black font-bold text-xs sm:text-sm">Catalance</span>
                                        </div>
                                        {/* VS badge & Other Platforms header */}
                                        <div className="bg-[#e8e5e0] dark:bg-[#2a2520] flex items-center justify-center gap-1.5 py-2 px-4 relative">
                                            <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f5f1ec] dark:bg-[#1a1512] border border-[#ddd9d3] dark:border-white/10 flex items-center justify-center z-10">
                                                <span className="text-[7px] font-extrabold text-[#888] uppercase">vs</span>
                                            </div>
                                            <Users className="w-3.5 h-3.5 text-[#888] dark:text-slate-400" />
                                            <span className="text-[#555] dark:text-slate-300 font-semibold text-xs sm:text-sm">Other Platforms</span>
                                        </div>
                                    </div>

                                    {/* Comparison Rows */}
                                    <div className="divide-y divide-[#e8e0d5] dark:divide-white/10 bg-white/70 dark:bg-white/[0.03] rounded-b-2xl border border-t-0 border-[#e8e0d5] dark:border-white/10">
                                        {[
                                            {
                                                catalance: { title: "Project Manager Included", desc: "You get a dedicated project manager to lead and coordinate your project." },
                                                other: { title: "No Project Manager", desc: "You're on your own with no dedicated project manager." },
                                            },
                                            {
                                                catalance: { title: "Verified Freelancers", desc: "Rigorous verification for skill and experience." },
                                                other: { title: "Open Marketplace", desc: "Anyone can join with no verification." },
                                            },
                                            {
                                                catalance: { title: "100% Refund Policy*", desc: "Full refund if you're not satisfied with the work." },
                                                other: { title: "Limited Protection", desc: "Limited refund and dispute protection." },
                                            },
                                            {
                                                catalance: { title: "Freelancer Replacement Available*", desc: "We'll replace your freelancer at no extra cost." },
                                                other: { title: "Find a New Freelancer Yourself", desc: "You have to restart the whole process again." },
                                            },
                                            {
                                                catalance: { title: "Dedicated Support", desc: "Real people, ready to help you succeed." },
                                                other: { title: "Self-Service Support", desc: "Mostly help articles and automated replies." },
                                            },
                                            {
                                                catalance: { title: "Fast Talent Matching", desc: "We match you with the right talent, faster." },
                                                other: { title: "Endless Profile Searching", desc: "You search, filter and hope for the best." },
                                            },
                                            {
                                                catalance: { title: "Transparent Pricing", desc: "Clear pricing, no hidden charges." },
                                                other: { title: "Unexpected Platform Fees", desc: "Service fees and add-ons you didn't expect." },
                                            },
                                            {
                                                catalance: { title: "Focused on Project Success", desc: "Your success is our top priority." },
                                                other: { title: "Focused on Transactions", desc: "Their focus is on fees and transactions." },
                                            },
                                        ].map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-2">
                                                {/* Catalance column */}
                                                <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4 border-r border-[#e8e0d5] dark:border-white/10">
                                                    <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.catalance.title}</p>
                                                        <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.catalance.desc}</p>
                                                    </div>
                                                </div>
                                                {/* Other platforms column */}
                                                <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4">
                                                    <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-red-100/80 dark:bg-red-900/20 flex items-center justify-center">
                                                        <X className="w-2.5 h-2.5 text-red-500" strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.other.title}</p>
                                                        <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.other.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footnote */}
                                    <div className="text-right mt-2">
                                        <span className="text-[9px] text-primary italic font-medium">*Terms & Conditions Apply.</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* WHY CATALANCE AI */}
                        <div className="relative z-10 mt-24">
                            <div className="mx-auto mb-12 flex max-w-4xl flex-col items-center gap-3 rounded-2xl bg-background px-5 py-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#ffc800] mb-3">Our Edge</p>
                                <h2 className="text-4xl font-bold text-white">Why Catalance AI?</h2>
                                <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto">We&apos;ve reimagined how businesses discover and hire freelance talent.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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
            <div className="relative">
                {isPendingOptionFollowup && isRecommendationPanelOpen && (
                    <div className={`absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-20 w-full rounded-2xl border p-3 shadow-xl backdrop-blur-xl ${isDark
                        ? 'border-white/10 bg-[#1d1d1d]/95 text-slate-200'
                        : 'border-slate-200 bg-white/95 text-slate-700'
                        }`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-primary/80' : 'text-primary'}`}>
                                    Recommendation
                                </p>
                                <p className="mt-2 text-sm leading-relaxed">
                                    {contextualPendingOptionNotice}
                                </p>
                                {pendingRecommendedAnswer && (
                                    <button
                                        type="button"
                                        className={`mt-2 block w-full rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${isDark
                                            ? 'border-white/10 text-slate-300 hover:border-primary/40 hover:text-white'
                                            : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-slate-900'
                                            }`}
                                        onClick={applyPendingRecommendation}
                                    >
                                        Suggested reply: {pendingRecommendedAnswer}
                                    </button>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 shrink-0 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                onClick={() => setIsRecommendationPanelOpen(false)}
                                aria-label="Hide recommendation"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                className={`text-xs font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                onClick={() => {
                                    if (pendingOptionFollowup?.autoSuggestion && pendingOptionFollowup?.questionKey) {
                                        dismissedAutoHelperKeysRef.current.add(pendingOptionFollowup.questionKey);
                                    }
                                    setPendingOptionFollowup(null);
                                    setSelectedOptions([]);
                                    setInput('');
                                    setIsRecommendationPanelOpen(false);
                                }}
                            >
                                Clear helper
                            </button>
                            {pendingRecommendedAnswer && (
                                <button
                                    type="button"
                                    className={`text-xs font-semibold ${isDark ? 'text-primary hover:text-primary/80' : 'text-primary hover:text-primary/80'}`}
                                    onClick={applyPendingRecommendation}
                                >
                                    Use suggestion
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 md:gap-3">
                    <form
                        onSubmit={handleSendMessage}
                        className={`flex-1 rounded-[clamp(1.25rem,5vw,1.5rem)] md:rounded-3xl border p-[clamp(0.5rem,2.5vw,0.625rem)] md:p-2.5 shadow-md backdrop-blur-xl ${isDark
                            ? 'border-white/10 bg-[#2F2F2F]'
                            : 'border-slate-200 bg-[#F4F4F4]'
                            }`}
                    >
                        {isAgencyFlowCompleted && (
                            <div className={`mb-3 rounded-2xl border px-3.5 py-3 text-sm ${isDark
                                ? 'border-[#ffc800]/20 bg-[#ffc800]/[0.08] text-zinc-200'
                                : 'border-primary/20 bg-primary/10 text-slate-700'
                                }`}>
                                The combined agency proposal is ready. Keep chatting below to refine it. If you want a service-specific change like budget or timeline, name the service first.
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
                                                className={`ml-1 rounded-full p-0.5 ${isDark ? 'hover:bg-white/15' : 'hover:bg-slate-100'}`}
                                                onClick={() => removePendingAttachment(index)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    <div className="flex items-end gap-[clamp(0.35rem,1.8vw,0.5rem)] md:gap-2">
                        <div className="flex flex-1 items-center bg-transparent">
                            <div className="flex flex-col flex-1">
                                <textarea
                                    ref={inputRef}
                                    data-guest-ai-input="true"
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
                                    className={`max-h-[120px] min-h-[clamp(2.5rem,8vw,2.75rem)] w-full resize-none overflow-y-hidden bg-transparent px-[clamp(0.75rem,3vw,1rem)] py-[clamp(0.65rem,2.8vw,0.75rem)] text-[clamp(0.95rem,3.6vw,1rem)] outline-none placeholder-shown:overflow-hidden placeholder-shown:whitespace-nowrap md:min-h-[44px] md:px-4 md:py-3 md:text-base ${isDark
                                        ? 'text-white placeholder:text-slate-400'
                                        : 'text-slate-900 placeholder:text-slate-500'
                                        }`}
                                    disabled={isTyping || isUploadingAttachment}
                                    style={{ overflowY: input.trim() ? 'auto' : 'hidden' }}
                                />
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-[clamp(0.15rem,1vw,0.375rem)] px-[clamp(0.25rem,1vw,0.5rem)] pb-[clamp(0.2rem,1vw,0.375rem)] md:gap-1.5 md:px-2 md:pb-1.5">
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
                                className={`h-[clamp(2rem,8vw,2.25rem)] w-[clamp(2rem,8vw,2.25rem)] rounded-full md:h-9 md:w-9 ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'}`}
                            >
                                <Paperclip className="h-[clamp(0.9rem,3.5vw,1rem)] w-[clamp(0.9rem,3.5vw,1rem)] md:h-4 md:w-4" />
                            </Button>
                            {isSpeechSupported && (
                                <Button
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                    onClick={toggleVoiceInput}
                                    disabled={isTyping || isUploadingAttachment}
                                    className={`h-[clamp(2rem,8vw,2.25rem)] w-[clamp(2rem,8vw,2.25rem)] rounded-full md:h-9 md:w-9 ${isListening ? 'bg-primary/20 text-primary animate-pulse' : isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'}`}
                                >
                                    {isListening ? <MicOff className="h-[clamp(0.9rem,3.5vw,1rem)] w-[clamp(0.9rem,3.5vw,1rem)] md:h-4 md:w-4" /> : <Mic className="h-[clamp(0.9rem,3.5vw,1rem)] w-[clamp(0.9rem,3.5vw,1rem)] md:h-4 md:w-4" />}
                                </Button>
                            )}
                            <Button
                                size="icon"
                                type="submit"
                                disabled={((!input.trim() && pendingAttachments.length === 0) || (isPendingOptionFollowup && !input.trim())) || isTyping || isUploadingAttachment}
                                className={`h-[clamp(2rem,8vw,2.25rem)] w-[clamp(2rem,8vw,2.25rem)] rounded-full transition-colors md:h-9 md:w-9 ${input.trim() || pendingAttachments.length > 0
                                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                                    : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-400'
                                    }`}
                            >
                                <Send className="h-[clamp(0.9rem,3.5vw,1rem)] w-[clamp(0.9rem,3.5vw,1rem)] shrink-0 keep-white md:h-4 md:w-4" />
                            </Button>
                        </div>
                    </div>

                    {isUploadingAttachment && (
                        <p className={`mt-1 pl-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Uploading attachment...
                        </p>
                    )}
                    </form>

                    {isPendingOptionFollowup && (
                        <Button
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setAttentionRecommendationKey((current) => (
                                    current === activeRecommendationKey ? '' : current
                                ));
                                setIsRecommendationPanelOpen((current) => !current);
                            }}
                            className={`mb-[clamp(0.5rem,2.5vw,0.625rem)] h-[clamp(2.75rem,9vw,3.25rem)] w-[clamp(2.75rem,9vw,3.25rem)] shrink-0 rounded-full border shadow-md md:mb-2.5 md:h-11 md:w-11 ${isCurrentRecommendationUsed
                                ? isDark
                                    ? 'border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                    : 'border-slate-300 text-slate-400 hover:bg-black/5 hover:text-slate-600'
                                : isRecommendationPanelOpen
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : shouldPulseRecommendationBulb
                                        ? isDark
                                            ? 'border-[#ffd54a] bg-[#3b3200] text-[#ffd54a] shadow-[0_0_0_1px_rgba(255,213,74,0.35),0_0_18px_rgba(255,213,74,0.45)] animate-pulse'
                                            : 'border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(217,105,42,0.18),0_0_18px_rgba(217,105,42,0.28)] animate-pulse'
                                    : isDark
                                        ? 'border-white/10 bg-[#2F2F2F] text-[#ffd54a] hover:bg-[#383838]'
                                        : 'border-slate-200 bg-white text-primary hover:bg-primary/5'
                                }`}
                            aria-label={isRecommendationPanelOpen ? 'Hide recommendation helper' : 'Show recommendation helper'}
                        >
                            <Lightbulb className="h-[clamp(1rem,4vw,1.2rem)] w-[clamp(1rem,4vw,1.2rem)] md:h-5 md:w-5" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-16 flex h-[calc(100dvh-4rem)] min-h-[calc(100dvh-4rem)] overflow-hidden bg-card lg:mt-20 lg:h-[calc(100dvh-5rem)] lg:min-h-[calc(100dvh-5rem)]">
            {/* Backdrop — closes sidebar when clicking outside */}
            {!isSidebarCompact && (
                <div
                    className="hidden"
                    onClick={toggleSidebarSize}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar drawer — slides in from left as fixed overlay */}
            <aside className={`fixed left-0 top-16 bottom-0 z-40 flex w-72 flex-col transition-transform duration-300 ease-in-out lg:top-20 ${isSidebarCompact ? '-translate-x-full' : 'translate-x-0'} ${isDark ? 'border-r border-white/5 bg-[#151515]' : 'border-r border-slate-200/70 bg-[#fcfcfb]'}`}>
                {/* ── Sidebar header ── */}
                <div className="flex items-center justify-between px-4 pb-1 pt-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ${isDark ? 'bg-white/8' : 'bg-slate-200/70'}`}>
                            <img src={cataLogo} alt="CATA" className="h-3.5 w-3.5 object-contain" />
                        </div>
                        <span className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {isAgencyFlowActive ? 'Agency Brief' : (selectedService?.name || 'Catalance AI')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSidebarSize}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                        title="Close sidebar"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Back to services ── */}
                {isAgencyFlowActive ? (
                    <div className="px-4 pb-2">
                        <div className={`rounded-2xl border px-3 py-3 ${isDark ? 'border-[#ffc800]/15 bg-[#ffc800]/[0.07]' : 'border-primary/15 bg-primary/10'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-[#ffd54a]' : 'text-primary'}`}>
                                        Agency Flow
                                    </p>
                                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {isAgencyFlowCompleted
                                            ? 'Combined proposal ready for refinement.'
                                            : 'Collecting requirements service by service.'}
                                    </p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? 'bg-black/20 text-[#ffd54a]' : 'bg-white text-primary'}`}>
                                    {agencyFlowProgressLabel}
                                </span>
                            </div>
                            {agencyFlowState.selectedServices.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {agencyFlowState.selectedServices.map((service, index) => {
                                        const isCurrentService = !isAgencyFlowCompleted
                                            && index === agencyFlowState.currentServiceIndex;
                                        return (
                                            <span
                                                key={`${getServiceIdentifier(service)}-${index}`}
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${isCurrentService
                                                    ? isDark
                                                        ? 'bg-[#ffc800] text-black'
                                                        : 'bg-primary text-white'
                                                    : isDark
                                                        ? 'bg-white/8 text-slate-300'
                                                        : 'bg-white text-slate-600'
                                                    }`}
                                            >
                                                {service?.name || service?.title || `Service ${index + 1}`}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-col gap-1 px-3 pb-3 pt-2">
                    <button
                        type="button"
                        onClick={() => {
                            void handleRestartCurrentFlow();
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${isDark ? 'text-slate-100 hover:bg-white/4' : 'text-slate-800 hover:bg-slate-200/40'}`}
                        title="Start a new chat"
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
                        New Chat
                    </button>
                    <button
                        type="button"
                        onClick={handleBackToServices}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${isDark ? 'text-slate-400 hover:bg-white/4 hover:text-white' : 'text-slate-500 hover:bg-slate-200/40 hover:text-slate-800'}`}
                        title="Back to services"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                        Back
                    </button>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {/* ── Proposals section ── */}
                    <div className="mb-0.5">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('proposals')}
                            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                        >
                            <Sparkles className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className={`flex-1 text-left text-[13px] font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                Proposals
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {generatedProposals.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.proposals ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.proposals ? (
                            generatedProposals.length === 0 ? (
                                <div className="px-9 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No proposals yet. Chat with CATA AI to generate one.</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5 pb-1 pl-8 pr-1">
                                    {generatedProposals.map((proposal, index) => (
                                        <button
                                            key={proposal.id || `${proposal.projectTitle || 'proposal'}-${index}`}
                                            type="button"
                                            onClick={() => handleOpenProposalPreview(proposal)}
                                            className={`w-full rounded-lg px-3 py-1.5 text-left transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                                        >
                                            <p className={`truncate text-[13px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                                {proposal.projectTitle || 'AI Proposal'}
                                            </p>
                                            {(proposal.budget || proposal.timeline) ? (
                                                <p className={`mt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {[proposal.budget && `Budget: ${proposal.budget}`, proposal.timeline && `Timeline: ${proposal.timeline}`].filter(Boolean).join(' | ')}
                                                </p>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    {/* ── Divider ── */}
                    <div className="h-3" />

                    {/* ── Saved links section ── */}
                    <div className="mb-0.5">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('links')}
                            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                        >
                            <Globe className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className={`flex-1 text-left text-[13px] font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                Saved Links
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {sharedLinks.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.links ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.links ? (
                            sharedLinks.length === 0 ? (
                                <div className="px-9 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Links shared in this chat will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5 pb-1 pl-8 pr-1">
                                    {sharedLinks.map((linkEntry) => (
                                        <a
                                            key={linkEntry.id}
                                            href={linkEntry.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-start gap-2 rounded-lg px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-[13px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{linkEntry.label}</p>
                                                <p className={`truncate text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{linkEntry.url}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    <div className="mb-0.5">
                        <button
                            type="button"
                            onClick={() => toggleSidebarDropdown('files')}
                            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                        >
                            <FileText className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className={`flex-1 text-left text-[13px] font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                Shared Files & Media
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {sharedAttachments.length}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sidebarDropdowns.files ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                        </button>
                        {sidebarDropdowns.files ? (
                            sharedAttachments.length === 0 ? (
                                <div className="px-9 pb-2 pt-1">
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Documents, PDFs, and images you upload will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5 pb-1 pl-8 pr-1">
                                    {sharedAttachments.map((attachment) => (
                                        <a
                                            key={attachment.id}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-start gap-2 rounded-lg px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/40'}`}
                                        >
                                            <div className={`mt-0.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {attachment.isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`truncate text-[13px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{attachment.name}</p>
                                                <p className={`truncate text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    {[attachment.kindLabel, formatBytes(attachment.size)].filter(Boolean).join(' | ')}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </div>

                    <div className="h-5" />
                    <p className={`px-2 pb-2 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Recents
                    </p>
                    <div className="mb-1">
                        {visiblePreviousChats.length === 0 ? (
                            <div className="px-2 pb-2">
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>No previous chats.</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5 px-2 pb-1">
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
                                            className={`group relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/35'}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleLoadPreviousChat(chat)}
                                                disabled={isLoadingHistory || isCurrent}
                                                className="min-w-0 flex-1 text-left outline-none"
                                            >
                                                <p className={`truncate text-[13px] font-normal transition-colors ${isCurrent
                                                    ? isDark ? 'text-white' : 'text-slate-900'
                                                    : isDark ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-700 group-hover:text-slate-900'
                                                    }`}>
                                                    {isLoadingHistory ? 'Loading...' : preview}
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
                        )}
                    </div>
                </div>

                {/* ── Bottom: user / login ── */}
                <div className={`shrink-0 border-t px-3 py-3 ${isDark ? 'border-white/5' : 'border-slate-200/70'}`}>
                    {isAuthLoading ? (
                        <div className="flex items-center gap-2 px-2">
                            <span className={`h-2 w-2 animate-pulse rounded-full bg-primary`} />
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Checking...</p>
                        </div>
                    ) : isUserLoggedIn ? (
                        <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${isDark ? 'hover:bg-white/4' : 'hover:bg-slate-200/35'}`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${isDark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-slate-100'}`}>
                                {userAvatar
                                    ? <img src={userAvatar} alt={userDisplayName} className="h-full w-full object-cover" />
                                    : <User className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`} />
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`truncate text-[13px] font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{userDisplayName}</p>
                                {/* <p className={`truncate text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{userDisplayEmail || 'Authenticated'}</p> */}
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/signin/phone', { state: { redirectTo: '/ai-demo' } })}
                            className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-medium transition-colors ${isDark ? 'text-slate-300 hover:bg-white/4' : 'text-slate-600 hover:bg-slate-200/35'}`}
                        >
                            <LogIn className="h-4 w-4 shrink-0" />
                            Login to save progress
                        </button>
                    )}
                </div>
            </aside>

            <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent pt-3">

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

                <ScrollArea
                    ref={scrollRef}
                    className={`w-full flex-1 min-h-0 pt-4 transition-[padding-left] duration-300 ease-in-out ${!isSidebarCompact ? 'lg:pl-72' : ''}`}
                >
                    <div className={`mx-auto flex w-full max-w-4xl flex-col space-y-4 px-4 sm:px-5 lg:px-8 ${isInitialScreen ? 'min-h-[calc(100vh-16rem)] justify-center py-8 sm:min-h-[calc(100vh-17rem)] sm:py-10' : 'pt-2 pb-6 sm:pb-8'}`}>
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

                            return msg.role === 'user' ? (
                                /* ── USER message: right-aligned bubble ── */
                                <motion.div
                                    key={messageKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full justify-end guest-ai-message"
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
                                                        className={`max-w-[320px] rounded-2xl border px-3.5 py-2.5 text-left ${isDark ? 'border-white/15 bg-white/5 text-slate-200' : 'border-black/5 bg-slate-100 text-slate-700'}`}
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
                                                        <a key={`${attachment.url}-${attachmentIdx}`} href={attachment.url} target="_blank" rel="noopener noreferrer" className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/15' : 'border-black/5'}`}>
                                                            <img src={attachment.url} alt={attachment.name || 'Attachment'} className="max-h-36 object-contain" />
                                                        </a>
                                                    ) : (
                                                        <a key={`${attachment.url}-${attachmentIdx}`} href={attachment.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? 'border-white/15 bg-white/5 text-slate-200' : 'border-black/5 bg-slate-100 text-slate-700'}`}>
                                                            <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                                            <span className="max-w-[150px] truncate">{attachment.name || 'Attachment'}</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* text bubble */}
                                        {messageContent && (
                                            <div className={`rounded-3xl px-5 py-3 text-[13.5px] leading-normal break-words ${isDark
                                                    ? 'bg-[#2F2F2F] text-white'
                                                    : 'bg-[#F0F0F0] text-slate-900'
                                                }`}>
                                                <div className={`prose prose-sm max-w-none prose-p:my-0 prose-strong:font-normal prose-headings:font-normal ${isDark ? 'prose-invert' : ''}`}>
                                                    <ReactMarkdown components={REMOVE_BOLD_MARKDOWN_COMPONENTS}>{messageContent}</ReactMarkdown>
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
                                    className="flex w-full items-start gap-3 guest-ai-message"
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
                                                <div className={`text-[13.5px] leading-normal ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    <ProposalPreview content={messageContent || msg.content} isDark={isDark} />
                                                </div>
                                                <div className={`pt-3 border-t ${isDark ? 'border-white/15' : 'border-slate-100'}`}>
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
                                            <div className={`text-[13.5px] leading-normal ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                                <AssistantMessageBody
                                                    content={messageContent || msg.content}
                                                    isDark={isDark}
                                                    enableOptionClick={shouldEnableOptionClick}
                                                    forceInteractiveOptions={shouldEnableOptionClick}
                                                    onOptionClick={handleChatOptionClick}
                                                    isOptionSelected={isOptionSelectedByText}
                                                    isMultiInput={isMultiInput}
                                                    isSingleChoiceInput={isSingleChoiceInput}
                                                    selectedCount={selectedOptions.length}
                                                    onSubmitMulti={(e) => handleSendMessage(e, selectedOptions, {
                                                        ignorePendingOptionFollowup: Boolean(pendingOptionFollowup?.autoSuggestion),
                                                    })}
                                                />
                                            </div>
                                        )}
                                        {thinkingMeta && (
                                            <div className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
                                className="flex w-full items-start gap-3 guest-ai-message"
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

                    </div>
                </ScrollArea>

                {shouldShowTextInput && (
                    <div
                        className={`shrink-0 w-full px-[clamp(0.75rem,4vw,1rem)] pt-[clamp(0.75rem,4vw,1.5rem)] sm:px-5 lg:px-8 transition-[padding-left] duration-300 ease-in-out ${!isSidebarCompact ? 'lg:pl-72' : ''} bg-gradient-to-t ${isDark ? 'from-[#212121] via-[#212121]/90 to-transparent' : 'from-[#F9F9F9] via-[#F9F9F9]/90 to-transparent'}`}
                        style={{ paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
                    >
                        <div className="mx-auto w-full max-w-4xl space-y-2.5">
                            {renderChatInput()}
                            <p className={`hidden text-center text-xs sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
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
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
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
                                                <path d="m9 18 6-6-6-6" />
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
                                                    <path d="m9 18 6-6-6-6" />
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
                                                    <path d="m9 18 6-6-6-6" />
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


