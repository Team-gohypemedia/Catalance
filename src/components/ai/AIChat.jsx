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

        {/* Sidebar */}
        <aside className="w-[280px] bg-card border-r border-border flex flex-col overflow-y-auto max-md:hidden [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="p-6 border-b border-border">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">Cata</span>
              <span className="text-xl font-bold text-foreground">AI</span>
              <span className="text-xl font-bold text-primary">Assistant</span>
            </div>
            <button
              className="flex items-center gap-2 w-full mt-4 py-3 px-4 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-primary-foreground text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              onClick={startNewChat}
            >
              <Plus className="size-4" />
              New Chat
            </button>
          </div>

          <div className="p-5 border-b border-border">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "View Services", action: "What services do you offer?" },
                { label: "Branding Help", action: "I need help with branding" },
                { label: "Get Pricing", action: "How much does a website cost?" },
                { label: "App Development", action: "I want to build an app" }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickAction(item.action)}
                  className="flex items-center gap-2 py-3 px-4 bg-card border border-border rounded-lg text-foreground text-sm cursor-pointer transition-all text-left hover:bg-accent hover:border-primary hover:translate-x-1"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-transparent">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Our Services</h3>
            <ul className="list-none">
              {services.slice(0, 8).map((service) => (
                <li
                  key={service.id}
                  onClick={() => handleQuickAction(`Tell me about ${service.name}`)}
                  className="py-2.5 px-3 text-sm text-muted-foreground cursor-pointer rounded-md transition-all hover:bg-accent hover:text-foreground"
                >
                  {service.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-gradient-to-b from-background to-card">
          <header className="p-6 border-b border-border bg-card backdrop-blur-sm flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Chat with CATA</h1>
              <p className="text-sm text-muted-foreground">Ask me anything about our services</p>
            </div>
            {proposal && !showProposal && (
              <button
                onClick={() => setShowProposal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <FileText className="size-4" />
                View Proposal
              </button>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 max-md:p-4 [scrollbar-width:thin] [scrollbar-color:var(--primary)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-track]:bg-transparent">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 max-w-[85%] animate-fade-in ${msg.role === "user" ? "self-end flex-row-reverse" : ""
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${msg.role === "assistant"
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                    : "bg-card border-2 border-border"
                    }`}
                >
                  {msg.role === "user" ? <User className="size-5" /> : <Bot className="size-5" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div
                    className={`p-4 rounded-2xl leading-relaxed text-[15px] ${msg.role === "assistant"
                      ? "bg-card border border-border rounded-tl-sm"
                      : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm"
                      }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0">{line}</p>
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
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 max-w-[85%] animate-fade-in items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-sm font-bold shrink-0 text-primary-foreground">
                  <Bot className="size-5" />
                </div>
                <div className="flex flex-col gap-1 justify-center h-10">
                  <div className="relative flex items-center gap-2">
                    {/* Base dim layer */}
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Brain className="size-4" />
                      <span className="text-sm font-medium">Thinking...</span>
                    </div>
                    {/* Shimmering overlay layer */}
                    <div
                      className="absolute inset-0 flex items-center gap-2 text-white"
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

          <div className="p-6 pb-8 bg-card backdrop-blur-sm border-t border-border max-md:p-4">
            <PromptInput
              onSubmit={handleSubmit}
              className="max-w-[900px] mx-auto relative"
            >
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                autoFocus
                className="!bg-card !border-border !text-foreground text-base !p-4 !pr-14 !pb-14 !min-h-14 !max-h-[150px] resize-none w-full !rounded-xl !box-border !break-all !whitespace-pre-wrap !overflow-x-hidden [field-sizing:normal] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus:!border-primary focus:!shadow-[0_0_0_3px_rgba(255,214,10,0.2)] placeholder:!text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!isLoading && !input.trim()}
                className="absolute right-2 bottom-2 z-10 w-9 h-9 rounded-lg border-none cursor-pointer flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg hover:enabled:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </PromptInput>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AIChat;
