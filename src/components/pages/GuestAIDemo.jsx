import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ArrowRight, ArrowLeft, Check, Bot, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Helper to interact with our new Guest API
const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`/api${endpoint}`, {
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

const GuestAIDemo = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [inputConfig, setInputConfig] = useState({ type: 'text', options: [] });

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch Services on Mount
    useEffect(() => {
        fetchServices();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            const scrollElement = scrollRef.current.viewport || scrollRef.current;
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }, [messages, isTyping, inputConfig]);

    // Auto-focus input when AI stops typing or options change
    useEffect(() => {
        if (!isTyping && inputRef.current) {
            // Small delay to ensure UI updates are done
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isTyping, inputConfig]);

    const fetchServices = async () => {
        try {
            const data = await apiFetch('/ai/services');
            if (data.success) {
                setServices(data.services);
            }
        } catch (error) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSelect = async (service) => {
        setSelectedService(service);
        setLoading(true);
        try {
            // Start Guest Session
            const data = await apiFetch('/guest/start', {
                method: 'POST',
                body: JSON.stringify({ serviceId: service.slug || service.id })
            });

            if (data.success) {
                setSessionId(data.sessionId);
                setMessages([
                    {
                        role: "assistant",
                        content: `Hello! I see you're interested in **${service.name}**. \n\n${service.questions?.[0]?.text || "How can I help you regarding this service?"}`
                    }
                ]);
                setInputConfig(data.inputConfig || { type: 'text', options: [] });
            }
        } catch (error) {
            toast.error("Failed to start chat session");
            setSelectedService(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e, forcedContent = null) => {
        if (e) e.preventDefault();
        const contentToSend = forcedContent || input;

        if (!contentToSend.trim() || !sessionId || isTyping) return;

        const userMsg = { role: 'user', content: contentToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        // Clear options immediately to avoid double clicks
        setInputConfig({ type: 'text', options: [] });

        try {
            const data = await apiFetch('/guest/chat', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    message: userMsg.content
                })
            });

            if (data.success) {
                // Check if the response is a validation error (i.e., AI asks for clarification)
                // We can infer this if the message is short and asks for details, or simply by the context.
                // For now, let's just show the message.

                // If backend sent history, use it to ensure everything is in sync
                if (data.history) {
                    setMessages(data.history);
                } else {
                    const aiMsg = { role: 'assistant', content: data.message };
                    setMessages(prev => [...prev, aiMsg]);
                }

                // Update input configuration for the NEXT question
                if (data.inputConfig) {
                    setInputConfig(data.inputConfig);
                }
            }
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsTyping(false);
        }
    };

    if (loading && !selectedService) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!selectedService) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Choose a Service</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Select a service below to start a consultation with our AI assistant.
                            We'll help define your requirements instantly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <motion.div
                                key={service.id}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    className="h-full cursor-pointer hover:shadow-xl transition-shadow border-slate-200"
                                    onClick={() => handleServiceSelect(service)}
                                >
                                    <CardHeader>
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                            {/* We can map icons later, defaulting for now */}
                                            <Briefcase className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl">{service.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2">
                                            {service.description || "Start a project in " + service.name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm font-medium text-primary flex items-center gap-2">
                                            Start Consultation <ArrowRight className="h-4 w-4" />
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
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar (Service Info) */}
            <div className="w-80 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col gap-6">
                <div>
                    <Button variant="ghost" className="pl-0 gap-2 mb-6" onClick={() => setSelectedService(null)}>
                        <ArrowLeft className="h-4 w-4" /> Back to Services
                    </Button>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedService.name}</h2>
                    <p className="text-slate-500 mt-2">{selectedService.description}</p>
                </div>

                <div className="mt-auto">
                    <div className="bg-slate-100 rounded-lg p-4">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Capabilities</p>
                        <ul className="space-y-2 text-sm text-slate-700">
                            <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" /> Instant Quote Estimation</li>
                            <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" /> Requirement Gathering</li>
                            <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-500" /> 24/7 Availability</li>
                            <li className="flex items-center gap-2 font-semibold text-purple-600">
                                <Bot className="h-3 w-3" /> AI-Powered Analysis (GPT-4o)
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <div className="border-b border-slate-200 p-4 bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="md:hidden">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedService(null)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <Bot className="h-5 w-5 text-purple-600" />
                            AI Assistant
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                                Active
                            </span>
                        </h2>
                    </div>
                </div>
                <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between md:hidden shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedService(null)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <span className="font-semibold">{selectedService.name}</span>
                </header>

                <ScrollArea ref={scrollRef} className="flex-1 min-h-0 p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}

                                <div className={`rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-1">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </motion.div>
                        )}

                        {/* Options Rendering */}
                        {!isTyping && inputConfig.options && inputConfig.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-start pl-12 animate-in fade-in slide-in-from-bottom-2 pt-2">
                                {inputConfig.options.map((option, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                        onClick={() => handleSendMessage(null, typeof option === 'string' ? option : option.label)}
                                    >
                                        {typeof option === 'string' ? option : option.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="max-w-3xl mx-auto space-y-4">

                        <form onSubmit={handleSendMessage} className="relative">
                            <Input
                                ref={inputRef}
                                autoFocus
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="pr-12 py-6 rounded-xl border-slate-300 focus-visible:ring-indigo-500"
                                disabled={isTyping}
                            />
                            <Button
                                size="icon"
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-2 h-8 w-8 rounded-lg"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-center text-xs text-slate-400 mt-2">
                            AI may produce inaccurate information about people, places, or facts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestAIDemo;
