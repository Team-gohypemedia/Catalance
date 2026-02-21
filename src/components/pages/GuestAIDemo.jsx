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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const CAPABILITY_ITEMS = [
    'Instant requirement gathering',
    'Quote-ready scope capture',
    'AI proposal generation',
    '24/7 guided consultation',
];

const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    return data;
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

const GuestAIDemo = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [services, setServices] = useState([]);
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
        if (!isTyping && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isTyping, inputConfig]);

    useEffect(() => {
        setSelectedOptions([]);
    }, [inputConfig.type, inputConfig.options]);

    const fetchServices = async () => {
        try {
            const data = await apiFetch('/ai/services');
            if (data.success) {
                setServices(data.services);
            }
        } catch {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSelect = async (service) => {
        setSelectedService(service);
        setLoading(true);
        try {
            const data = await apiFetch('/guest/start', {
                method: 'POST',
                body: JSON.stringify({ serviceId: service.slug || service.id })
            });

            if (data.success) {
                setSessionId(data.sessionId);
                setMessages([
                    {
                        role: "assistant",
                        content: `Hello! I see you're interested in **${service.name}**.\n\n${service.questions?.[0]?.text || "How can I help you regarding this service?"}`
                    }
                ]);
                setInputConfig(data.inputConfig || { type: 'text', options: [] });
            }
        } catch {
            toast.error("Failed to start chat session");
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
            const data = await apiFetch('/guest/chat', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    message: isArrayPayload ? normalizedArray : userMsg.content
                })
            });

            if (data.success) {
                if (data.history) {
                    setMessages(data.history);
                } else {
                    const aiMsg = { role: 'assistant', content: data.message };
                    setMessages(prev => [...prev, aiMsg]);
                }

                if (data.inputConfig) {
                    setInputConfig(data.inputConfig);
                }
            }
        } catch {
            toast.error("Failed to send message");
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
                        {services.map((service, index) => (
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
                        ))}
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
                                        <div className={`w-full max-w-[92%] rounded-2xl border p-5 ${isDark ? 'border-primary/30 bg-white/[0.04] text-white' : 'border-primary/30 bg-white text-[#181711]'}`}>
                                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                Generated Proposal
                                            </div>
                                            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                                                <ReactMarkdown>{normalizeMarkdownContent(msg.content)}</ReactMarkdown>
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
                                                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
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

                        {!isTyping && inputConfig.options && inputConfig.options.length > 0 && (
                            <div className="ml-0 flex flex-wrap gap-2.5 pt-1 md:ml-11">
                                {inputConfig.options.map((option, idx) => {
                                    const label = typeof option === 'string' ? option : option.label;
                                    const value = String(typeof option === 'string' ? option : (option.value ?? option.label));
                                    const isSelected = selectedOptions.includes(value);

                                    const handleOptionClick = () => {
                                        if (isMultiInput) {
                                            setSelectedOptions(prev =>
                                                prev.includes(value)
                                                    ? prev.filter(v => v !== value)
                                                    : [...prev, value]
                                            );
                                        } else {
                                            handleSendMessage(null, value);
                                        }
                                    };

                                    return (
                                        <Button
                                            key={idx}
                                            type="button"
                                            variant="outline"
                                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${isSelected
                                                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                                : isDark
                                                    ? 'border-white/20 bg-white/[0.04] text-slate-100 hover:bg-white/[0.09]'
                                                    : 'border-black/15 bg-white text-slate-700 hover:border-primary/50 hover:bg-primary/10'
                                                }`}
                                            onClick={handleOptionClick}
                                        >
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
                        {!isMultiInput && (
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
