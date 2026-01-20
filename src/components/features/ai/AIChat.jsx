import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/shared/lib/api-client";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import Square from "lucide-react/dist/esm/icons/square";
import Plus from "lucide-react/dist/esm/icons/plus";
import Brain from "lucide-react/dist/esm/icons/brain";
import Bot from "lucide-react/dist/esm/icons/bot";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { ProposalSidebar } from "@/components/features/ai/elements/proposal-sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import X from "lucide-react/dist/esm/icons/x";
import { toast } from "sonner";


const DEFAULT_API_BASE = "http://localhost:5000/api";
const API_ROOT = API_BASE_URL || DEFAULT_API_BASE;
const API_URL = `${API_ROOT}/ai`;
const PROPOSAL_CONTEXT_KEY = "proposal_context";
const CHAT_HISTORY_KEY = "chat_history";

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

const getStoredJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
};

const setStoredJson = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key}:`, error);
  }
};

const createEmptyProposalContext = (serviceName = "") => ({
  clientName: "",
  companyName: "",
  companyBackground: "",
  requirements: [],
  scope: {
    features: [],
    deliverables: []
  },
  timeline: "",
  budget: "",
  constraints: [],
  preferences: [],
  contactInfo: {
    email: "",
    phone: ""
  },
  notes: "",
  serviceName: serviceName || ""
});

const normalizeList = (items) =>
  Array.isArray(items)
    ? items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

const mergeLists = (baseList, nextList) => {
  const base = normalizeList(baseList);
  const next = normalizeList(nextList);
  const seen = new Set(base.map((item) => item.toLowerCase()));
  const merged = [...base];
  next.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });
  return merged;
};

const mergeText = (base, next) => {
  const normalized = typeof next === "string" ? next.trim() : "";
  return normalized ? normalized : base;
};

const mergeProposalContext = (baseContext, update) => {
  const base = baseContext || createEmptyProposalContext();
  const next = update || {};

  return {
    ...base,
    clientName: mergeText(base.clientName, next.clientName),
    companyName: mergeText(base.companyName, next.companyName),
    companyBackground: mergeText(base.companyBackground, next.companyBackground),
    requirements: mergeLists(base.requirements, next.requirements),
    timeline: mergeText(base.timeline, next.timeline),
    budget: mergeText(base.budget, next.budget),
    constraints: mergeLists(base.constraints, next.constraints),
    preferences: mergeLists(base.preferences, next.preferences),
    notes: mergeText(base.notes, next.notes),
    serviceName: mergeText(base.serviceName, next.serviceName),
    scope: {
      features: mergeLists(base.scope?.features, next.scope?.features),
      deliverables: mergeLists(base.scope?.deliverables, next.scope?.deliverables)
    },
    contactInfo: {
      email: mergeText(base.contactInfo?.email, next.contactInfo?.email),
      phone: mergeText(base.contactInfo?.phone, next.contactInfo?.phone)
    }
  };
};

const getLastAssistantMessage = (history) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const msg = history[i];
    if (msg?.role === "assistant" && msg?.content) {
      return msg.content;
    }
  }
  return "";
};

const parseNumberedOptions = (assistantText = "") => {
  const options = new Map();
  assistantText.split("\n").forEach((line) => {
    const match = line.match(/^\s*(\d+)[.)]\s*(.+)$/);
    if (match) {
      options.set(Number(match[1]), match[2].trim());
    }
  });
  return options;
};

const parseSelectionsFromText = (text, options) => {
  const selections = new Set();
  const numbers = text.match(/\d+/g) || [];
  numbers.forEach((value) => {
    const option = options.get(Number(value));
    if (option) selections.add(option);
  });

  if (options.size > 0) {
    const lowered = text.toLowerCase();
    options.forEach((option) => {
      if (lowered.includes(option.toLowerCase())) {
        selections.add(option);
      }
    });
  }

  return Array.from(selections);
};

const extractListItems = (text) => {
  const lines = text.split("\n").map((line) => line.trim());
  const bullets = lines
    .map((line) => line.match(/^[-*]\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .filter(Boolean);
  return bullets;
};

const extractCommaList = (text) => {
  if (!text.includes(",")) return [];
  const items = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 1 ? items : [];
};

const extractTimeline = (text) => {
  const match = text.match(/\b\d+\s*(?:-\s*\d+\s*)?(?:day|week|month|hour|year)s?\b/i);
  if (match) return match[0].replace(/\s+/g, " ").trim();
  if (/asap|urgent|immediately/i.test(text)) return "ASAP";
  if (/flexible|no rush|whenever/i.test(text)) return "Flexible";
  return "";
};

const extractEmail = (text) => {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
};

const extractPhone = (text) => {
  const match = text.match(/\+?\d[\d\s()-]{6,}\d/);
  return match ? match[0].trim() : "";
};

const extractPreferenceStatements = (text) => {
  const statements = text
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const preferences = statements.filter((statement) =>
    /\bprefer|would like|nice to have|should\b/i.test(statement)
  );
  const constraints = statements.filter((statement) =>
    /\bmust|must not|avoid|don't|do not|cannot|can't|no\b/i.test(statement)
  );

  return { preferences, constraints };
};

const isProposalConfirmation = (text, assistantText) => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const explicitRequestPatterns = [
    /\b(generate|create|make|build|draft|update|revise|edit|regenerate)\b.*\bproposal\b/i,
    /\bproposal\b.*\b(generate|create|make|build|draft|update|revise|edit|regenerate)\b/i,
    /\bgo ahead\b/i,
    /\bready\b.*\bproposal\b/i
  ];

  if (explicitRequestPatterns.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  const simpleYes = /^(yes|y|yeah|yep|sure|ok|okay|ready|proceed)\b/i.test(trimmed);
  const prompted = /ready to (see|view|generate).*proposal|generate (your )?proposal|proposal ready/i.test(
    assistantText || ""
  );

  return simpleYes && prompted;
};

const extractProposalUpdate = ({ userText, assistantText, serviceName }) => {
  const update = {};
  const trimmed = userText.trim();
  if (!trimmed) return update;

  if (serviceName) {
    update.serviceName = serviceName;
  }

  const assistantLower = (assistantText || "").toLowerCase();
  const options = parseNumberedOptions(assistantText || "");
  const selections = parseSelectionsFromText(trimmed, options);
  const listItems = extractListItems(trimmed);
  const commaItems = extractCommaList(trimmed);
  const combinedItems = listItems.length ? listItems : commaItems;

  if (/name\?/i.test(assistantLower) && !/business|company/i.test(assistantLower)) {
    update.clientName = trimmed;
  } else if (/business|company name/i.test(assistantLower)) {
    update.companyName = trimmed;
  } else if (/what.*business|describe.*business|about your business|tell me.*business/i.test(assistantLower)) {
    update.companyBackground = trimmed;
  }

  if (/features|functionality|functionalities|modules|scope/i.test(assistantLower)) {
    const features = selections.length ? selections : combinedItems;
    if (features.length) {
      update.scope = { features };
    }
  }

  if (!update.scope?.features?.length && /features|include|need|requirements/i.test(trimmed)) {
    const features = listItems.length ? listItems : commaItems.length ? commaItems : selections;
    if (features.length) {
      update.scope = { features };
    }
  }

  if (/deliverables?/i.test(assistantLower)) {
    const deliverables = selections.length ? selections : combinedItems;
    if (deliverables.length) {
      update.scope = { ...(update.scope || {}), deliverables };
    }
  }

  if (/timeline|deadline|launch|delivery|duration|how soon/i.test(assistantLower) || /timeline|deadline|launch/i.test(trimmed)) {
    update.timeline = extractTimeline(trimmed) || trimmed;
  }

  if (/budget|investment|cost|price/i.test(assistantLower) || /budget|cost|price/i.test(trimmed)) {
    update.budget = trimmed;
  }

  if (/need|looking for|require|goal|objective|pain|problem/i.test(trimmed) && !update.scope?.features?.length) {
    const requirements = combinedItems.length ? combinedItems : [trimmed];
    update.requirements = requirements;
  }

  const { preferences, constraints } = extractPreferenceStatements(trimmed);
  if (preferences.length) update.preferences = preferences;
  if (constraints.length) update.constraints = constraints;

  const email = extractEmail(trimmed);
  const phone = extractPhone(trimmed);
  if (email || phone) {
    update.contactInfo = {
      email,
      phone
    };
  }

  if (/note|important|remember|please make sure/i.test(trimmed)) {
    update.notes = trimmed;
  }

  return update;
};

const hasProposalContext = (context) => {
  if (!context || typeof context !== "object") return false;
  const hasScope = context.scope?.features?.length || context.scope?.deliverables?.length;
  const hasContact = context.contactInfo?.email || context.contactInfo?.phone;
  return Boolean(
    context.clientName ||
      context.companyName ||
      context.companyBackground ||
      (context.requirements && context.requirements.length) ||
      hasScope ||
      context.timeline ||
      context.budget ||
      (context.constraints && context.constraints.length) ||
      (context.preferences && context.preferences.length) ||
      hasContact ||
      context.notes
  );
};




import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';


// Initialize PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function AIChat({ prefill: _prefill = "", embedded = false, serviceName: propServiceName, onProposalChange }) {
  const location = useLocation();
  const serviceName = propServiceName || location.state?.serviceName;

  const getWelcomeMessage = (isNewChat = false) => {
    const baseHola = "Hello! I am CATA, your assistant.";
    const contextPart = serviceName
      ? `I'm here to help you explore our ${serviceName} services and find the perfect solution.`
      : "I'm here to help you explore our digital services and find the perfect solution.";

    const nameQuestion = "May I know your name?";

    return isNewChat
      ? [baseHola, "", contextPart + " " + nameQuestion].join("\n")
      : `${baseHola} ${contextPart} ${nameQuestion}`;
  };

  const [messages, setMessages] = useState(() => {
    const initialMsg = { role: "assistant", content: getWelcomeMessage(false) };
    if (typeof window === "undefined") return [initialMsg];

    try {
      const saved = getStoredJson(CHAT_HISTORY_KEY, null);
      return Array.isArray(saved) && saved.length > 0 ? saved : [initialMsg];
    } catch (e) {
      console.error("Failed to load chat history:", e);
      return [initialMsg];
    }
  });

  // Persist chat history to localStorage
  useEffect(() => {
    setStoredJson(CHAT_HISTORY_KEY, buildConversationHistory(messages));
  }, [messages]);

  const [input, setInput] = useState("");
  const [activeFiles, setActiveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);

  const [proposal, setProposal] = useState("");
  const [proposalContext, setProposalContext] = useState(() => {
    const emptyContext = createEmptyProposalContext(serviceName);
    const saved = getStoredJson(PROPOSAL_CONTEXT_KEY, null);
    return saved ? mergeProposalContext(emptyContext, saved) : emptyContext;
  });

  const [showProposal, setShowProposal] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const proposalContextRef = useRef(proposalContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const focusInput = () => {
    // Try using ref first
    if (textareaRef.current) {
      textareaRef.current.focus();
      return;
    }
    // Fallback to querySelector
    const textarea = document.querySelector('textarea[placeholder]');
    if (textarea) {
      textarea.focus();
    }
  };



  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    proposalContextRef.current = proposalContext;
    setStoredJson(PROPOSAL_CONTEXT_KEY, proposalContext);
  }, [proposalContext]);

  useEffect(() => {
    if (!serviceName) return;
    setProposalContext((prev) =>
      mergeProposalContext(prev, { serviceName })
    );
  }, [serviceName]);

  // Notify parent when proposal visibility changes
  useEffect(() => {
    if (onProposalChange) {
      onProposalChange(showProposal);
    }
  }, [showProposal, onProposalChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusInput();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const extractTextFromPdf = async (file) => {
    console.log("Starting PDF extraction for:", file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Filter out empty items
        const items = textContent.items.filter(item => item.str.trim().length > 0);

        // Sort items by Y (descending) then X (ascending) to handle layout
        // PDF coordinates: (0,0) is bottom-left usually, so higher Y is higher up on page.
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5]; // Compare Y
          if (Math.abs(yDiff) > 5) { // If Y difference is significant
            return yDiff; // Sort by Y
          }
          return a.transform[4] - b.transform[4]; // Else sort by X
        });

        let pageText = "";
        let lastY = null;

        items.forEach((item) => {
          const y = item.transform[5];
          const text = item.str;

          if (lastY !== null && Math.abs(y - lastY) > 5) {
            // New line detected (significant Y change)
            pageText += "\n" + text;
          } else {
            // Same line (or close enough) - add space if not first item
            pageText += (pageText ? " " : "") + text;
          }
          lastY = y;
        });

        fullText += pageText + "\n\n";
      }
      console.log("PDF extraction complete. Length:", fullText.length);
      return fullText;
    } catch (err) {
      console.error("PDF Extraction Error:", err);
      throw err;
    }
  };

  const extractTextFromDocx = async (file) => {
    console.log("Starting DOCX extraction for:", file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log("DOCX extraction complete. Length:", result.value.length);
      return result.value;
    } catch (err) {
      console.error("DOCX Extraction Error:", err);
      throw err;
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    const newFiles = [];

    for (const file of files) {
      console.log("Processing file:", file.name, file.type);
      let extractedText = "";

      try {
        if (file.type === "application/pdf") {
          extractedText = await extractTextFromPdf(file);
        } else if (
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.name.endsWith('.docx')
        ) {
          extractedText = await extractTextFromDocx(file);
        } else if (file.type === "text/plain") {
          extractedText = await file.text();
        } else {
          console.warn("Unsupported file type:", file.type);
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }

        if (extractedText.trim()) {
          const structuredContent = [
            `### Document Content: ${file.name}`,
            "---",
            extractedText.trim(),
            "---",
            `\n(System Note: Please analyze the document content above and extract key details.)`
          ].join("\n");

          newFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type.includes('pdf') ? 'PDF' : file.type.includes('word') ? 'DOCX' : 'TXT',
            content: structuredContent
          });
        } else {
          toast.warning(`Could not extract text from: ${file.name}`);
        }
      } catch (error) {
        console.error("File extraction error:", error);
        toast.error(`Failed to read: ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setActiveFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} document(s) attached`);
      setTimeout(focusInput, 100);
    }

    setIsProcessingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId) => {
    setActiveFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const sendMessage = async (messageText, options = {}) => {
    const { skipUserAppend = false } = options;
    const text = typeof messageText === "string" ? messageText : input;
    if (!text.trim() || isLoading) return;

    const lastAssistantMessage = getLastAssistantMessage(messages);
    let nextContext = proposalContextRef.current;
    let nextHistory = buildConversationHistory(messages);

    if (!skipUserAppend) {
      const userMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setActiveFiles([]); // Clear all active files after sending

      const contextUpdate = extractProposalUpdate({
        userText: text,
        assistantText: lastAssistantMessage,
        serviceName
      });
      nextContext = mergeProposalContext(proposalContextRef.current, contextUpdate);
      setProposalContext(nextContext);
      setStoredJson(PROPOSAL_CONTEXT_KEY, nextContext);

      nextHistory = [...buildConversationHistory(messages), userMessage];
      setStoredJson(CHAT_HISTORY_KEY, nextHistory);
    }

    const shouldGenerateProposal =
      !skipUserAppend && isProposalConfirmation(text, lastAssistantMessage);

    setIsLoading(true);

    if (shouldGenerateProposal) {
      try {
        const storedContext = getStoredJson(PROPOSAL_CONTEXT_KEY, nextContext);
        const storedHistory = getStoredJson(CHAT_HISTORY_KEY, nextHistory);

        if (!hasProposalContext(storedContext) || storedHistory.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I don't have your project details yet. Please share your requirements, timeline, budget, and any constraints, then tell me to generate the proposal."
            }
          ]);
          return;
        }

        const response = await fetch(`${API_URL}/proposal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalContext: storedContext,
            chatHistory: storedHistory,
            serviceName
          })
        });

        const data = await response.json();

        if (data?.success && data.proposal) {
          const proposalText =
            typeof data.proposal === "string" ? data.proposal.trim() : "";
          if (!proposalText) {
            throw new Error("Empty proposal response");
          }
          setProposal(proposalText);
          setShowProposal(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Your proposal is ready. Open the proposal panel to review it."
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn't generate the proposal yet. Please try again.",
              isError: true,
              retryText: text
            }
          ]);
        }
      } catch (error) {
        console.error("Proposal error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Proposal generation failed. Please try again.",
            isError: true,
            retryText: text
          }
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          focusInput();
        }, 300);
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: buildConversationHistory(messages),
          serviceName
        })
      });

      const data = await response.json();

      if (data?.success && data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: sanitizeAssistantContent(data.message) }
        ]);
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
      }, 300);
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

  const resetProposalData = ({ resetMessages = false } = {}) => {
    const emptyContext = createEmptyProposalContext(serviceName);
    setProposal("");
    setShowProposal(false);
    setProposalContext(emptyContext);
    proposalContextRef.current = emptyContext;
    setInput("");
    setActiveFiles([]);

    if (resetMessages) {
      setMessages([{ role: "assistant", content: getWelcomeMessage(true) }]);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(PROPOSAL_CONTEXT_KEY);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  const startNewChat = () => {
    resetProposalData({ resetMessages: true });
    setTimeout(() => focusInput(), 50);
  };

  const handleResetProposalData = () => {
    resetProposalData({ resetMessages: true });
    toast.success("Proposal data reset.");
    setTimeout(() => focusInput(), 50);
  };

  const handleSubmit = ({ text }) => {
    sendMessage(text);
  };

  return (
    <div className={`text-foreground ${embedded ? "h-full w-full" : ""}`}>
      <div className={`flex ${embedded ? "h-full w-full" : "h-screen"} bg-background font-sans relative overflow-hidden`}>
        {/* Main Chat Area */}
        <main className={`flex flex-col transition-all duration-300 ${showProposal && embedded ? 'w-1/2' : 'flex-1'}`}>
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
              <button
                onClick={handleResetProposalData}
                className="flex items-center gap-2 px-3 py-2 bg-secondary/60 hover:bg-secondary text-secondary-foreground rounded-lg text-sm font-medium transition-colors cursor-pointer"
                title="Reset proposal data"
              >
                <span className="hidden sm:inline">Reset Proposal</span>
              </button>
              {/* Show View Proposal button when a proposal exists */}
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
              {(isLoading || isProcessingFile) && (
                <div className="flex flex-col items-start animate-fade-in">
                  <span className="text-xs font-medium mb-1.5 px-1 text-muted-foreground">CATA</span>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md p-4">
                    <div className="relative flex items-center gap-2">
                      {isProcessingFile ? (
                        <>
                          <FileText className="size-4 animate-pulse text-primary" />
                          <span className="text-sm font-medium">Reading document...</span>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl">
            {/* Hidden Input for File Upload - Moved outside PromptInput to avoid conflicts */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              multiple
              onChange={handleFileUpload}
            />
            <div className="px-6 py-4">
              {/* Quick Action Chips Removed */}

              {/* File Chips - Left aligned above input */}
              {activeFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start mb-2">
                  {activeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="py-1 px-2 rounded-md bg-[#252525] border border-white/5 flex items-center gap-1.5 group animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                      <div className="h-4 w-4 rounded-[3px] bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shrink-0">
                        <FileText className="size-2.5" />
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[120px]">
                        <span className="text-[9px] font-semibold text-white/90 truncate uppercase tracking-widest leading-none pt-0.5">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-0.5 p-0.5 rounded-sm hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <PromptInput
                onSubmit={handleSubmit}
                className="relative border border-white/10 rounded-2xl bg-[#1a1a1a] shadow-lg focus-within:border-primary transition-all duration-300 overflow-hidden [&>[data-slot=input-group]]:!border-none"
              >
                <PromptInputTextarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit({ text: input });
                    }
                  }}
                  placeholder="Ask anything"
                  disabled={isLoading || isProcessingFile}
                  autoFocus
                  className="w-full !bg-transparent !border-none !text-white text-base !px-4 !py-3 !min-h-[50px] !max-h-[200px] resize-none !box-border !break-all !whitespace-pre-wrap !overflow-x-hidden [field-sizing:content] focus:!ring-0 placeholder:!text-white/20 font-light"
                />

                <PromptInputFooter className="px-3 pb-3 flex items-center justify-between">
                  <PromptInputTools className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-2 h-9 w-9 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                          title="Add attachment"
                          disabled={isLoading || isProcessingFile}
                        >
                          <Plus className="size-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[200px] bg-[#1a1a1a] border-white/10 text-white">
                        <DropdownMenuItem
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
                        >
                          <FileText className="mr-2 size-4 text-white/60" />
                          <span>Upload Document</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>


                  </PromptInputTools>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={(!isLoading && !input.trim() && activeFiles.length === 0) || isProcessingFile}
                      className="h-9 w-9 shrink-0 rounded-lg border-none cursor-pointer flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                      {isLoading ? (
                        <Square className="size-3.5 fill-current" />
                      ) : (
                        <ArrowUp className="size-5" />
                      )}
                    </button>
                  </div>
                </PromptInputFooter>
              </PromptInput>
              <p className="text-center text-xs text-muted-foreground/60 mt-3">CATA can make mistakes. Consider checking important information.</p>
            </div>
          </div>
        </main>

        {/* Proposal Panel - Side by side with chat when embedded */}
        {embedded && showProposal && (
          <div className="w-1/2 h-full border-l border-white/10 bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-300">
            <ProposalSidebar
              proposal={proposal}
              isOpen={true}
              onClose={() => setShowProposal(false)}
              embedded={embedded}
              inline={true}
            />
          </div>
        )}

        {/* Proposal Sidebar - Fixed overlay for non-embedded mode */}
        {!embedded && (
          <ProposalSidebar
            proposal={proposal}
            isOpen={showProposal}
            onClose={() => setShowProposal(false)}
            embedded={false}
          />
        )}
      </div>
    </div>
  );
}

export default AIChat;

