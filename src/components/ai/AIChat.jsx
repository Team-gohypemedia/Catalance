import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api-client";
import {
  PromptInput,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { ArrowUp, Square, Plus, Brain, Bot, User, FileText } from "lucide-react";
import { ProposalSidebar } from "@/components/ai-elements/proposal-sidebar";


const DEFAULT_API_BASE = "http://localhost:5000/api";
const API_ROOT = API_BASE_URL || DEFAULT_API_BASE;
const API_URL = `${API_ROOT}/ai`;

const sanitizeAssistantContent = (content = "") => {
  if (typeof content !== "string") return "";
  return content
    .split("\n")
    .map((line) =>
      line.replace(/^\s*(?:-|\*)?\s*(?:your\s+)?options are\s*:?\s*/i, "")
    )
    .join("\n");
};

const buildConversationHistory = (history) =>
  history
    .filter((msg) => msg && msg.content && !msg.isError)
    .map(({ role, content }) => ({ role, content }));

const DEFAULT_WELCOME_MESSAGE = [
  "Hello! I am CATA, your AI assistant.",
  "",
  "Before we begin, what's your name?",
  "",
  "I can help you define your requirements and generate a custom proposal.",
  "",
  "What brings you here today?"
].join("\n");

const DEFAULT_NEW_CHAT_MESSAGE = [
  "Hello! I am CATA, your assistant.",
  "",
  "Before we begin, what's your name?",
  "",
  "I can help you explore our digital services and find the right solution.",
  "",
  "What would you like to work on today?"
].join("\n");

function AIChat({ prefill = "", embedded = false }) {
  const location = useLocation();
  const prefillMessage = typeof prefill === "string" && prefill.length
    ? prefill
    : location.state?.prefill || "";

  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: DEFAULT_WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState(prefillMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [showProposal, setShowProposal] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const focusInput = () => {
    // Find the actual textarea element inside the chat input form
    const textarea = document.querySelector('.max-w-\\[900px\\] textarea');
    if (textarea && textarea.tagName === 'TEXTAREA') {
      textarea.focus();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusInput();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setInput(prefillMessage);
  }, [prefillMessage]);

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setServices(data.services || []);
        }
      })
      .catch((err) => console.error("Failed to fetch services:", err));
  }, []);

  const sendMessage = async (messageText, options = {}) => {
    const { skipUserAppend = false } = options;
    const text = typeof messageText === "string" ? messageText : input;
    if (!text.trim() || isLoading) return;

    if (!skipUserAppend) {
      const userMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: buildConversationHistory(messages)
        })
      });

      const data = await response.json();

      if (data?.success && data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: sanitizeAssistantContent(data.message) }
        ]);

        // Check for proposal data in the response
        if (data.proposal) {
          setProposal(data.proposal);
          setShowProposal(true);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            isError: true,
            retryText: text
          }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check if the server is running.",
          isError: true,
          retryText: text
        }
      ]);
    } finally {
      setIsLoading(false);
      // Re-focus textarea after response
      setTimeout(() => {
        focusInput();
      }, 150);
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => focusInput(), 50);
  };

  const handleRetry = (retryText) => {
    if (!retryText || isLoading) return;
    sendMessage(retryText, { skipUserAppend: true });
  };

  const startNewChat = () => {
    setMessages([{ role: "assistant", content: DEFAULT_NEW_CHAT_MESSAGE }]);
    setInput("");
    setTimeout(() => focusInput(), 50);
  };

  const handleSubmit = ({ text }) => {
    sendMessage(text);
  };

  return (
    <div className={`text-foreground ${embedded ? "h-full" : ""}`}>
      <div className={`flex ${embedded ? "h-full" : "h-screen"} bg-background font-sans relative overflow-hidden`}>
        {/* Proposal Sidebar */}
        <ProposalSidebar
          proposal={proposal}
          isOpen={showProposal}
          onClose={() => setShowProposal(false)}
        />

        {/* Main Chat Area - Centered Layout */}
        <main className="flex-1 flex flex-col">
          {/* Modern Header */}
          <header className="relative px-6 pr-20 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  CATA
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">AI</span>
                </h1>
                <p className="text-xs text-muted-foreground">Your digital services consultant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 px-3 py-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground rounded-lg text-sm font-medium transition-colors cursor-pointer high-contrast-button"
                title="Start a new conversation"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              {proposal && !showProposal && (
                <button
                  onClick={() => setShowProposal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  <FileText className="size-4" />
                  <span className="hidden sm:inline">View Proposal</span>
                </button>
              )}
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="px-6 py-8 flex flex-col gap-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col animate-fade-in ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {/* Role Label */}
                  <span className={`text-xs font-medium mb-1.5 px-1 ${msg.role === "user" ? "text-primary" : "text-muted-foreground"}`}>
                    {msg.role === "user" ? "You" : "CATA"}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl leading-relaxed text-[15px] ${msg.role === "assistant"
                      ? "bg-card border border-border/50 rounded-tl-md"
                      : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-md shadow-lg shadow-primary/20"
                      }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={`${line ? "mb-2 last:mb-0" : "h-2"}`}>{line}</p>
                    ))}
                    {msg.isError && msg.retryText && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRetry(msg.retryText)}
                          disabled={isLoading}
                          className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-start animate-fade-in">
                  <span className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">CATA</span>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md p-4">
                    <div className="relative flex items-center gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="size-4 animate-pulse" />
                        <span className="text-sm font-medium">Thinking...</span>
                      </div>
                      <div
                        className="absolute inset-0 flex items-center gap-2 text-primary"
                        style={{
                          maskImage: 'linear-gradient(110deg, transparent 30%, white 45%, white 55%, transparent 70%)',
                          WebkitMaskImage: 'linear-gradient(110deg, transparent 30%, white 45%, white 55%, transparent 70%)',
                          maskSize: '250% 100%',
                          WebkitMaskSize: '250% 100%',
                          animation: 'mask-shimmer 2s linear infinite',
                          WebkitAnimation: 'mask-shimmer 2s linear infinite'
                        }}
                      >
                        <Brain className="size-4" />
                        <span className="text-sm font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="px-6 py-4">
              {/* Quick Action Chips */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    "What services do you offer?",
                    "I need a website",
                    "Help with branding",
                    "App development"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleQuickAction(suggestion)}
                      className="px-3 py-1.5 text-sm border border-border rounded-full hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer text-muted-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <PromptInput
                onSubmit={handleSubmit}
                className="relative p-2 flex items-end gap-2"
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask CATA anything..."
                  disabled={isLoading}
                  autoFocus
                  className="w-full !bg-transparent !border-none !text-foreground text-base !p-4 !min-h-[50px] !max-h-[150px] resize-none !box-border !break-all !whitespace-pre-wrap !overflow-x-hidden [field-sizing:content] focus:!ring-0 placeholder:!text-muted-foreground/50"
                />
                <button
                  type="submit"
                  disabled={!isLoading && !input.trim()}
                  className="mr-2 h-10 w-10 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg shadow-primary/25"
                >
                  {isLoading ? (
                    <Square className="size-3.5 fill-current" />
                  ) : (
                    <ArrowUp className="size-5" />
                  )}
                </button>
              </PromptInput>
              <p className="text-center text-xs text-muted-foreground/60 mt-3">CATA can make mistakes. Consider checking important information.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AIChat;
