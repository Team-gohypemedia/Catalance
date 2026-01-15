"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import format from "date-fns/format";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import isSameDay from "date-fns/isSameDay";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useSearchParams } from "react-router-dom";
import { SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/shared/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Send from "lucide-react/dist/esm/icons/send";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import UserIcon from "lucide-react/dist/esm/icons/user";
import { cn } from "@/shared/lib/utils";

const formatTime = (value) => {
    try {
        return format(new Date(value), "h:mm a");
    } catch {
        return "";
    }
};

const ManagerChatContent = () => {
    const { user, authFetch, token } = useAuth();
    const { socket: notificationSocket } = useNotifications();
    const [searchParams] = useSearchParams();
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [sending, setSending] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const res = await authFetch("/chat/conversations");
                const data = await res.json();
                if (res.ok) {
                    const convs = data.data || [];
                    setConversations(convs);

                    // Select first conversation or from query params
                    const paramProjectId = searchParams.get("projectId");
                    if (paramProjectId) {
                        const matching = convs.find(c => c.projectId === paramProjectId);
                        if (matching) {
                            setSelectedConversation(matching);
                            setConversationId(matching.id);
                        }
                    } else if (convs.length > 0) {
                        setSelectedConversation(convs[0]);
                        setConversationId(convs[0].id);
                    }
                }
            } catch (e) {
                console.error("Failed to load conversations:", e);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [authFetch, searchParams]);

    // Load messages when conversation changes
    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            try {
                const res = await authFetch(`/chat/conversations/${conversationId}/messages`);
                const data = await res.json();
                if (res.ok) {
                    // Handle both formats: data.data.messages (object) or data.data (array)
                    const msgs = data?.data?.messages || data?.data || [];
                    setMessages(Array.isArray(msgs) ? msgs : []);
                }
            } catch (e) {
                console.error("Failed to load messages:", e);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversationId, authFetch]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !conversationId || sending) return;

        setSending(true);
        try {
            const res = await authFetch(`/chat/conversations/${conversationId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: messageInput.trim(),
                    senderId: user?.id,
                    senderRole: user?.role,
                    senderName: user?.fullName,
                    skipAssistant: true
                })
            });

            if (res.ok) {
                setMessageInput("");
                // Refresh messages
                const msgRes = await authFetch(`/chat/conversations/${conversationId}/messages`);
                const msgData = await msgRes.json();
                if (msgRes.ok) {
                    const msgs = msgData?.data?.messages || msgData?.data || [];
                    setMessages(Array.isArray(msgs) ? msgs : []);
                }
            }
        } catch (e) {
            console.error("Failed to send message:", e);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleBadge = (role) => {
        if (role === "CLIENT") return <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">Client</Badge>;
        if (role === "FREELANCER") return <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">Freelancer</Badge>;
        if (role === "PROJECT_MANAGER") return <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">PM</Badge>;
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen w-full">
                <ManagerTopBar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            <ManagerTopBar />
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Conversations List */}
                <div className="w-72 border-r bg-muted/10 flex flex-col shrink-0 h-full">
                    <div className="p-4 border-b shrink-0">
                        <h2 className="font-semibold">Messages</h2>
                        <p className="text-xs text-muted-foreground">{conversations.length} conversations</p>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                        {conversations.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No conversations yet
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => {
                                            setSelectedConversation(conv);
                                            setConversationId(conv.id);
                                        }}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition",
                                            selectedConversation?.id === conv.id
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <p className="font-medium text-sm line-clamp-1">
                                            {conv.projectTitle || conv.service || "Chat"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {conv.lastMessage?.content?.slice(0, 30) || "No messages yet"}...
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                    {selectedConversation ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b flex items-center gap-3 shrink-0 bg-background">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                        {getInitials(selectedConversation.projectTitle || "Chat")}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{selectedConversation.projectTitle || selectedConversation.service || "Chat"}</h3>
                                    <p className="text-xs text-muted-foreground">Project conversation</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 min-h-0 p-4">
                                <div className="space-y-4">
                                    {messages.map((msg, idx) => {
                                        const isOwn = msg.senderId === user?.id;
                                        return (
                                            <div
                                                key={msg.id || idx}
                                                className={cn(
                                                    "flex gap-2",
                                                    isOwn ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                {!isOwn && (
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(msg.senderName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn(
                                                    "max-w-[70%] rounded-lg px-3 py-2",
                                                    isOwn
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                )}>
                                                    {!isOwn && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-medium">{msg.senderName}</span>
                                                            {getRoleBadge(msg.senderRole)}
                                                        </div>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={cn(
                                                        "text-[10px] mt-1",
                                                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                    )}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 border-t shrink-0 bg-background">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={sending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim() || sending}
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-sm">Choose a conversation from the list to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManagerChat = () => (
    <RoleAwareSidebar>
        <ManagerChatContent />
    </RoleAwareSidebar>
);

export default ManagerChat;
