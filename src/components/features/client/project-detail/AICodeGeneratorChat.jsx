import React, { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/context/AuthContext";
import Send from "lucide-react/dist/esm/icons/send";
import Copy from "lucide-react/dist/esm/icons/copy";
import Check from "lucide-react/dist/esm/icons/check";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Bot from "lucide-react/dist/esm/icons/bot";
import User from "lucide-react/dist/esm/icons/user";
import Code from "lucide-react/dist/esm/icons/code";
import Eye from "lucide-react/dist/esm/icons/eye";
import { toast } from "sonner";

const extractHtmlContent = (text) => {
  if (!text) return "";
  const startIndex = text.indexOf("```");
  if (startIndex === -1) {
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) return text;
    return text;
  }
  
  let codeStart = text.indexOf("\n", startIndex);
  if (codeStart === -1) codeStart = startIndex + 3;
  
  let codeEnd = text.lastIndexOf("```");
  if (codeEnd <= codeStart) codeEnd = text.length;
  
  return text.substring(codeStart, codeEnd).trim();
};

const AICodeGeneratorChat = ({ open, onOpenChange, project }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const scrollRef = useRef(null);
  const { authFetch } = useAuth();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (open && !initialLoadDone.current && project) {
      initialLoadDone.current = true;
      generateInitialCode();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const generateInitialCode = async () => {
    const proposalData = project?.proposalJson
      ? JSON.stringify(project.proposalJson, null, 2)
      : "No structured proposal available.";
    
    const description = project?.description || "No description provided.";
    const projectName = project?.title || project?.name || "the project";

    const systemPrompt = `You are an expert web developer and creative UI designer. 
Your task is to design and build a complete, single-file HTML landing page (with embedded CSS/JS) for the business/project described below.

CRITICAL INSTRUCTIONS:
1. DO NOT just convert or display the raw proposal data in HTML.
2. Read the proposal to understand what the business does, what their brand is, and what services they offer.
3. Then, CREATE A REAL WEBSITE for them. Write engaging, realistic marketing copy (e.g., a catchy Hero headline, a "Features" or "Services" section, an "About Us" section, and a Call-to-Action).
4. Use modern, beautiful styling (e.g. vibrant colors, glassmorphism, smooth animations) and a responsive layout.
5. Do NOT use TailwindCSS unless explicitly requested; use vanilla CSS.
6. MANDATORY HARD LIMIT: Your total response MUST NOT exceed 3000 tokens or roughly 10,000 characters. If you write too much CSS or HTML, your response will be violently truncated by the server and the website will be broken. Keep CSS extremely compact. Reuse classes. Keep animations simple. Do not write massive blocks of text.

Here is the project proposal data to understand the business:
${proposalData}

Here is the project description:
${description}

Please generate the complete HTML code for their new landing page. Return ONLY valid HTML inside a \`\`\`html code block. Do not include any other markdown text outside the code block.`;

    await sendMessageToAI(systemPrompt, "Generate initial code based on the proposal");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    
    const instruction = `${userMsg}\n\nRemember: Only output the updated complete HTML inside a \`\`\`html code block.`;
    await sendMessageToAI(instruction, userMsg);
  };

  const sendMessageToAI = async (messageContent, displayMessage = null) => {
    const userMessage = { role: "user", content: displayMessage || messageContent };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyToPass = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await authFetch("/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: historyToPass,
          serviceName: "web_development"
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to generate code");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.content || data.message || data.text || (typeof data === 'string' ? data : "Error parsing response") },
      ]);
    } catch (error) {
      console.error("AI Code Generation Error:", error);
      toast.error(error.message || "Failed to communicate with AI");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error generating the code. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[800px] flex flex-col p-0" style={{ maxWidth: '800px' }}>
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Code Generator
          </SheetTitle>
          <SheetDescription>
            I&apos;ve read your proposal and generated a starting point. Tell me what changes to make!
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="flex flex-col gap-6 pb-20">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div
                    className={`max-w-[85%] w-full rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm max-w-[80%]"
                        : "bg-card border shadow-sm rounded-tl-sm w-full"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="w-full">
                        {msg.content.includes("```") || msg.content.includes("<!DOCTYPE html>") ? (
                          <Tabs defaultValue="preview" className="w-full mt-2">
                            <TabsList className="flex w-full mb-4">
                              <TabsTrigger value="preview" className="flex-1 flex gap-2">
                                <Eye className="w-4 h-4" /> Preview
                              </TabsTrigger>
                              <TabsTrigger value="code" className="flex-1 flex gap-2">
                                <Code className="w-4 h-4" /> HTML Code
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="w-full">
                              <div className="w-full h-[500px] border rounded-md bg-white overflow-hidden shadow-inner">
                                <iframe
                                  srcDoc={extractHtmlContent(msg.content)}
                                  className="w-full h-full border-0"
                                  title="HTML Preview"
                                  sandbox="allow-scripts"
                                />
                              </div>
                            </TabsContent>
                            <TabsContent value="code" className="w-full relative group">
                              <div className="absolute top-2 right-2">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(extractHtmlContent(msg.content), idx)}
                                >
                                  {copiedIndex === idx ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <pre className="p-4 rounded-md bg-slate-950 text-slate-50 overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                                <code>{extractHtmlContent(msg.content)}</code>
                              </pre>
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-500 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-card border shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating code... this might take a moment.
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t mt-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 relative"
            >
              <Input
                placeholder="E.g., Make the background dark, add a contact form..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="pr-12 h-12 rounded-full bg-muted/50 focus-visible:bg-background"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-1 top-1 bottom-1 h-10 w-10 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AICodeGeneratorChat;
