import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase,
    ArrowRight,
    ArrowLeft,
    Check,
    Bot,
    User,
    Send,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useTheme } from '@/components/providers/theme-provider';
import { request } from '@/shared/lib/api-client';

const CAPABILITY_ITEMS = [
    'Instant requirement gathering',
    'Quote-ready scope capture',
    'AI proposal generation',
    '24/7 guided consultation',
];

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

const OPTION_LINE_REGEX = /^\s*(\d+)\.\s+(.+)$/;
const QUESTION_LINE_REGEX = /\?\s*$/;

const parseAssistantMessageLayout = (content = "") => {
    const normalized = normalizeMarkdownContent(content).replace(/\r/g, "").trim();
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
        return { contextText: normalized, questionText: "", options: [] };
    }

    const questionText = lines[questionIndex];
    const contextText = lines
        .filter((line, idx) => idx !== questionIndex && !OPTION_LINE_REGEX.test(line))
        .join("\n\n")
        .trim();

    return {
        contextText,
        questionText,
        options: optionEntries.map((option) => ({
            number: option.number,
            text: option.text
        }))
    };
};

const AssistantMessageBody = ({ content, isDark }) => {
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
                <div className={`rounded-xl border px-3 py-3 ${isDark ? 'border-primary/40 bg-primary/10' : 'border-primary/30 bg-primary/5'}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-primary' : 'text-[#7a6200]'}`}>
                        Question
                    </p>
                    <div className={`mt-1 prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{questionText}</ReactMarkdown>
                    </div>
                </div>
            )}

            {options.length > 0 && (
                <div className="space-y-2">
                    {options.map((option) => (
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
                    ))}
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

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const normalizedInputType = (inputConfig.type || 'text').toLowerCase();
    const isMultiInput = normalizedInputType === 'multi_select'
        || normalizedInputType === 'multi_option'
        || normalizedInputType === 'grouped_multi_select';
    const hasOptionInput = Array.isArray(inputConfig.options) && inputConfig.options.length > 0;
    const shouldShowTextInput = true;

    const normalizeOptionToken = (value = '') =>
        String(value || '').trim().toLowerCase();

    const optionIsSelected = (value = '') =>
        selectedOptions.some((selected) => normalizeOptionToken(selected) === normalizeOptionToken(value));

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollElement = scrollRef.current.viewport || scrollRef.current;
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }, [messages, isTyping, inputConfig]);

    useEffect(() => {
        if (!isTyping && shouldShowTextInput && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isTyping, shouldShowTextInput, inputConfig]);

    useEffect(() => {
        setSelectedOptions([]);
    }, [inputConfig.type, inputConfig.options]);

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

    const handleServiceSelect = async (service) => {
        setSelectedService(service);
        setLoading(true);
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
                    setMessages([
                        {
                            role: "assistant",
                            content: data.message || `Hello! I see you're interested in **${service.name}**.`
                        }
                    ]);
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
            : contentToSend;

        if ((!isArrayPayload && !textPayload.trim()) || (isArrayPayload && normalizedArray.length === 0) || !sessionId || isTyping) return;

        const userMsg = { role: 'user', content: textPayload };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        setInputConfig({ type: 'text', options: [] });
        setSelectedOptions([]);

        try {
            const response = await request('/guest/chat', {
                method: 'POST',
                timeout: 120000,
                body: JSON.stringify({
                    sessionId,
                    message: isArrayPayload ? normalizedArray : userMsg.content
                })
            });
            const data = unwrapPayload(response);

            if (data?.history) {
                setMessages(data.history);
            } else if (typeof data?.message === 'string' && data.message.trim()) {
                const aiMsg = { role: 'assistant', content: data.message };
                setMessages(prev => [...prev, aiMsg]);
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
        }
    };

    if (loading && !selectedService) {
        return (
            <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-black' : 'bg-[#fbfbfa]'}`}>
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className={isDark ? 'text-sm text-slate-300' : 'text-sm text-slate-600'}>
                        Loading AI workspace...
                    </p>
                </div>
            </div>
        );
    }

    if (!selectedService) {
        return (
            <div className={`min-h-screen ${isDark
                ? 'bg-black bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.10),transparent_55%)]'
                : 'bg-[#fbfbfa] bg-[radial-gradient(ellipse_at_top,rgba(242,204,13,0.14),transparent_58%)]'
                } px-4 py-8 md:px-8 md:py-10`}
            >
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl border p-7 md:p-10 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-sm'}`}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Demo
                        </div>
                        <h1 className={`mt-4 text-3xl font-bold tracking-tight md:text-5xl ${isDark ? 'text-white' : 'text-[#181711]'}`}>
                            Build your project brief with Catalance AI
                        </h1>
                        <p className={`mt-3 max-w-3xl text-base md:text-lg ${isDark ? 'text-[#bab59c]' : 'text-slate-600'}`}>
                            Pick a service, answer guided questions, and get a structured proposal generated in chat.
                        </p>
                    </motion.div>

                    <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {services.length === 0 ? (
                            <div className="md:col-span-2 xl:col-span-3">
                                <Card className={`rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white'}`}>
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
                                >
                                    <Card
                                        className={`h-full cursor-pointer rounded-2xl border transition-all ${isDark
                                            ? 'border-white/10 bg-white/[0.04] hover:border-primary/50 hover:bg-white/[0.07]'
                                            : 'border-black/10 bg-white hover:border-primary/50'
                                            }`}
                                        onClick={() => handleServiceSelect(service)}
                                    >
                                        <CardHeader>
                                            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#181711]'}`}>{service.name}</CardTitle>
                                            <CardDescription className={isDark ? 'text-[#bab59c]' : 'text-slate-600'}>
                                                {service.description || `Start a ${service.name} consultation`}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`inline-flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-primary' : 'text-[#181711]'}`}>
                                                Start consultation
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
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
                    onClick={() => setSelectedService(null)}
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

                <div className={`mt-8 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-white'}`}>
                    <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Capabilities
                    </div>
                    <ul className="space-y-2.5">
                        {CAPABILITY_ITEMS.map((item) => (
                            <li key={item} className={`flex items-start gap-2 text-sm ${isDark ? 'text-[#bab59c]' : 'text-slate-700'}`}>
                                <Check className="mt-0.5 h-4 w-4 text-primary" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
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
                                    onClick={() => setSelectedService(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-primary/15 text-primary' : 'bg-primary/15 text-[#181711]'}`}>
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#181711]'}`}>AI Assistant</h2>
                                <p className={`text-xs ${isDark ? 'text-[#bab59c]' : 'text-slate-500'}`}>Guided consultation</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            Active
                        </span>
                    </div>
                </div>

                <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-3 py-4 md:px-6 md:py-6">
                    <div className="mx-auto max-w-4xl space-y-5 pb-4">
                        {messages.map((msg, idx) => {
                            const proposalCard = msg.role === 'assistant' && isProposalMessage(msg.content);
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
                                            <ProposalPreview content={msg.content} isDark={isDark} />
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
                                                <AssistantMessageBody content={msg.content} isDark={isDark} />
                                            ) : (
                                                msg.content
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

                        {!isTyping && hasOptionInput && (
                            <div className="ml-0 flex flex-wrap gap-2.5 pt-1 md:ml-11">
                                {inputConfig.options.map((option, idx) => {
                                    const label = typeof option === 'string' ? option : option.label;
                                    const value = String(typeof option === 'string' ? option : (option.value ?? option.label));
                                    const isSelected = optionIsSelected(value);

                                    const handleOptionClick = () => {
                                        if (isMultiInput) {
                                            setSelectedOptions((prev) => {
                                                const alreadySelected = prev.some(
                                                    (v) => normalizeOptionToken(v) === normalizeOptionToken(value)
                                                );
                                                if (alreadySelected) {
                                                    return prev.filter(
                                                        (v) => normalizeOptionToken(v) !== normalizeOptionToken(value)
                                                    );
                                                }
                                                return [...prev, value];
                                            });
                                        } else {
                                            handleSendMessage(null, value);
                                        }
                                    };

                                    return (
                                        <Button
                                            key={idx}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${isSelected
                                                ? 'border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50 hover:bg-primary/90'
                                                : isDark
                                                    ? 'border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.09]'
                                                    : 'border-black/15 bg-white text-slate-700 hover:border-primary/50 hover:bg-primary/10'
                                                }`}
                                            onClick={handleOptionClick}
                                        >
                                            {isSelected && <Check className="mr-1.5 h-3.5 w-3.5" />}
                                            {label}
                                        </Button>
                                    );
                                })}

                                {isMultiInput && (
                                    <Button
                                        type="button"
                                        className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                                        disabled={selectedOptions.length === 0 || isTyping}
                                        onClick={(e) => handleSendMessage(e, selectedOptions)}
                                    >
                                        Send selection
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className={`border-t p-4 md:px-6 md:py-5 ${isDark ? 'border-white/10 bg-black/35' : 'border-black/10 bg-white/90'}`}>
                    <div className="mx-auto max-w-4xl space-y-3">
                        {shouldShowTextInput && (
                            <form onSubmit={handleSendMessage} className="relative">
                                <Input
                                    ref={inputRef}
                                    autoFocus
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className={`h-14 rounded-2xl pr-14 text-base ${isDark
                                        ? 'border-white/15 bg-white/[0.06] text-white placeholder:text-slate-400'
                                        : 'border-black/15 bg-white text-slate-900 placeholder:text-slate-400'
                                        }`}
                                    disabled={isTyping}
                                />
                                <Button
                                    size="icon"
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
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
