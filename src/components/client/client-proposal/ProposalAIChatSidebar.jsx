import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Key, Loader2, Bot, User } from "lucide-react/dist/esm/lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

const SYSTEM_PROMPT = `You are an expert AI proposal strategist tasked with refining project proposals based on user requests.
Your primary role is to act as a thoughtful consultant. You must read the FULL proposal context and understand its holistic goals.

Here are your strict guidelines:
1. **Holistic Updates**: If a user asks for a sweeping change (e.g., "change budget to 50k" or "switch from WordPress to Shopify"), you must organically cascade that change throughout all relevant fields. For example, if they switch to Shopify, you must update the tech stack, adjust deliverables, and tweak the project overview to match Shopify constraints.
2. **Incompatible Requests**: If the user requests a change that makes absolutely no sense, is completely irrelevant, or breaks the core logical fabric of the project (e.g., "add pizza delivery" to an enterprise SaaS platform), politely explain that the change is incompatible with the proposal's scope and DO NOT output a JSON block.
3. **Conversational Reasoning**: Always respond naturally. Explain your thought process, what you are changing, and why. 

When you make changes to the proposal, you MUST include a JSON block containing the new values for the editable fields.

Enclose the JSON inside a markdown code block like so:
\`\`\`json
{
  "budget": "50000",
  "techStackText": "Shopify\nLiquid\nReact"
}
\`\`\`

The proposal has these editable fields:
- title (string)
- clientName (string)
- service (string)
- budget (string)
- timeline (string)
- projectOverview (string)
- objectivesText (string, newline separated)
- deliverablesText (string, newline separated)
- techStackText (string, newline separated)
- notes (string)

Return a partial JSON containing ONLY the fields you strategically updated. Provide your conversational response explaining what you did, followed by the JSON code block.`;

const ProposalAIChatSidebar = ({
  open,
  onClose,
  editableProposalDraft,
  onDraftChange,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseAndApplyProposalUpdates = (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      let changesMade = false;
      Object.keys(parsed).forEach((key) => {
        if (editableProposalDraft[key] !== undefined && parsed[key] !== undefined) {
          onDraftChange(key, String(parsed[key]));
          changesMade = true;
        }
      });
      if (changesMade) {
        toast.success("Proposal updated based on your request.");
      }
    } catch (e) {
      console.error("Failed to parse JSON response from OpenAI", jsonText, e);
      toast.error("Failed to apply updates. The AI gave an invalid response.");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = { role: "user", content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Create context block
      const contextBlock = `CURRENT PROPOSAL STATE:
${JSON.stringify({
  title: editableProposalDraft.title,
  clientName: editableProposalDraft.clientName,
  service: editableProposalDraft.service,
  budget: editableProposalDraft.budget,
  timeline: editableProposalDraft.timeline,
  projectOverview: editableProposalDraft.projectOverview,
  objectivesText: editableProposalDraft.objectivesText,
  deliverablesText: editableProposalDraft.deliverablesText,
  techStackText: editableProposalDraft.techStackText,
  notes: editableProposalDraft.notes,
}, null, 2)}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Catalance AI Editor",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Use mini for faster responses
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contextBlock },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg.content }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to call OpenAI API");
      }

      const data = await response.json();
      const aiContent = data.choices[0]?.message?.content || "";

      let jsonText = null;
      let displayMessage = aiContent;

      const jsonMatch = aiContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
         jsonText = jsonMatch[1];
         // Remove the JSON block from the chat output
         displayMessage = aiContent.replace(/```(?:json)?\n[\s\S]*?\n```/, "").trim();
      } else {
         const fallbackMatch = aiContent.match(/\{[\s\S]*\}/);
         if (fallbackMatch) {
            try {
               JSON.parse(fallbackMatch[0]); 
               jsonText = fallbackMatch[0];
               displayMessage = aiContent.replace(fallbackMatch[0], "").trim();
            } catch (e) {}
         }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: displayMessage || "I have updated the proposal accordingly." },
      ]);

      if (jsonText) {
          parseAndApplyProposalUpdates(jsonText);
      }

    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.message || "An error occurred while communicating with the AI.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-50 flex w-full flex-col border-l border-white/10 bg-background/95 backdrop-blur-xl sm:w-[400px]">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-6 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold tracking-tight">Edit with AI</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-white/10 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
            <div className="space-y-6">
              {messages.length === 0 ? (
                <div className="text-center mt-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2">How can I help?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                    Try asking things like: &quot;Make the timeline 4 weeks shorter&quot; or &quot;Add a section about SEO to the deliverables.&quot;
                  </p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1",
                      m.role === "user" ? "bg-[#334155] text-white" : "bg-primary/20 text-primary"
                    )}>
                      {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 max-w-[80%] text-[13px] leading-relaxed",
                        m.role === "user" 
                          ? "bg-[#334155] text-white rounded-tr-sm" 
                          : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
                      )}
                    >
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3 flex-row">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1 bg-primary/20 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 text-slate-200 px-4 py-2.5 rounded-tl-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-[13px] text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-white/10 bg-accent/30 p-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-end gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message AI..."
                className="pr-12 h-[44px] rounded-2xl border-white/10 bg-background/80 text-sm text-white placeholder:text-[#6f7785] focus-visible:border-primary/45 focus-visible:ring-primary/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="absolute right-1 bottom-1 h-[36px] w-[36px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-3 tracking-wide">
              AI CAN MAKE MISTAKES. REVIEW BEFORE SAVING.
            </p>
          </div>
    </div>
  );
};

export default ProposalAIChatSidebar;
