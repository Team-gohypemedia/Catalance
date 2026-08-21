import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Search from "lucide-react/dist/esm/icons/search";
import Send from "lucide-react/dist/esm/icons/send";
import Phone from "lucide-react/dist/esm/icons/phone";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import User from "lucide-react/dist/esm/icons/user";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import { toast } from "sonner";

export default function AdminWhatsappInbox() {
  const { authFetch } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);

  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await authFetch("/admin/whatsapp/conversations");
      if (res?.success) {
        setConversations(res.conversations || []);
        if (!selectedPhone && res.conversations?.length > 0) {
          setSelectedPhone(res.conversations[0].phone);
        }
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load WhatsApp conversations");
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  const fetchMessages = async (phone, silent = false) => {
    if (!phone) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await authFetch(`/admin/whatsapp/conversations/${phone}`);
      if (res?.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      if (!silent) toast.error("Failed to load messages for this conversation");
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
      const interval = setInterval(() => {
        fetchMessages(selectedPhone, true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPhone || sending) return;

    const textToSend = replyText.trim();
    setSending(true);
    setReplyText("");

    try {
      const res = await authFetch("/admin/whatsapp/send", {
        method: "POST",
        body: JSON.stringify({
          toPhone: selectedPhone,
          message: textToSend
        })
      });

      if (res?.success) {
        toast.success("Message sent to WhatsApp!");
        fetchMessages(selectedPhone, true);
        fetchConversations(true);
      } else {
        toast.error(res?.message || "Failed to send WhatsApp message");
        setReplyText(textToSend);
      }
    } catch (err) {
      toast.error(err.message || "Failed to send WhatsApp message");
      setReplyText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.phone.includes(searchQuery) ||
      (c.senderName && c.senderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  return (
    <AdminLayout>
      <div className="flex h-full flex-col gap-4 p-4 md:p-6">
        <AdminTopBar label="WhatsApp Inbox (+91 8882855425)" />

        <div className="grid h-[calc(100vh-140px)] grid-cols-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-12">
          
          {/* Left Panel: Conversation List */}
          <div className="flex flex-col border-b border-border md:col-span-4 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2 font-semibold">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <MessageSquare className="size-4" />
                </div>
                <span>Conversations</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => fetchConversations()}
              >
                <RefreshCw className={`size-4 ${loadingConvs ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Search input */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search phone or message..."
                  className="pl-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversation list stream */}
            <ScrollArea className="flex-1">
              {loadingConvs && conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="mb-2 size-6 animate-spin" />
                  <p className="text-sm">Loading chats...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <MessageSquare className="mb-2 size-8 opacity-30" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="mt-1 text-xs">
                    Messages sent to +91 8882855425 will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => {
                    const isSelected = conv.phone === selectedPhone;
                    return (
                      <button
                        key={conv.phone}
                        onClick={() => setSelectedPhone(conv.phone)}
                        className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-muted/50 ${
                          isSelected ? "bg-muted/80 font-medium" : ""
                        }`}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-700">
                          {conv.senderName ? conv.senderName.charAt(0).toUpperCase() : <User className="size-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="truncate text-sm font-semibold">
                              {conv.senderName || `+${conv.phone}`}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(conv.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            +{conv.phone}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-foreground/80">
                            {conv.direction === "OUTBOUND" ? "You: " : ""}
                            {conv.lastMessage || "[Media/Attachment]"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="shrink-0 bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Active Chat Room */}
          <div className="flex flex-col bg-muted/20 md:col-span-8">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-border bg-card p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-700">
                      {selectedConv.senderName ? selectedConv.senderName.charAt(0).toUpperCase() : <User className="size-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">
                        {selectedConv.senderName || `WhatsApp Contact`}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="size-3 text-emerald-600" />
                        <span>+{selectedConv.phone}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs">
                    Live WhatsApp Session
                  </Badge>
                </div>

                {/* Messages Feed */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMsgs && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                      <p className="text-sm">No messages in this chat yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOutbound = msg.direction === "OUTBOUND";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isOutbound ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                isOutbound
                                  ? "bg-emerald-600 text-white rounded-br-none"
                                  : "bg-card border border-border text-foreground rounded-bl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                              <div
                                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                  isOutbound ? "text-emerald-100" : "text-muted-foreground"
                                }`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                                {isOutbound && <CheckCheck className="size-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="flex items-center gap-2 border-t border-border bg-card p-3"
                >
                  <Input
                    type="text"
                    placeholder={`Reply to +${selectedPhone}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sending}
                    className="flex-1 text-sm focus-visible:ring-emerald-500"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-1.5 size-4" />
                        Send
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                  <MessageSquare className="size-8" />
                </div>
                <h3 className="text-base font-semibold">WhatsApp Business Inbox</h3>
                <p className="mt-1 max-w-sm text-xs">
                  Select a conversation from the left menu to view incoming messages or reply to clients directly on WhatsApp.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
