/**
 * AI tutor building blocks shared by the Tutor page and the lesson player side panel:
 * useTutorChat, useSpeechInput, useSpeak, TutorMessages, TutorComposer.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic, Sparkles, Square, Volume2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

export const SPEECH_LANG = { en: "en-IN", hinglish: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN", mr: "mr-IN" };

function readStore(key) {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Chat state + POST /api/tutor/chat. `storageKey` persists history (optional). */
export function useTutorChat({ language = "en", context, storageKey } = {}) {
  const [messages, setMessages] = useState(() => readStore(storageKey));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      /* storage unavailable */
    }
  }, [messages, storageKey]);

  const send = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content || pending) return;
      const next = [...messages, { role: "user", content, at: Date.now() }];
      setMessages(next);
      setPending(true);
      setError(null);
      try {
        const { reply } = await api.post("/api/tutor/chat", {
          messages: next.slice(-12).map(({ role, content: c }) => ({ role, content: c })),
          language,
          context: context || undefined,
        });
        setMessages((m) => [...m, { role: "assistant", content: reply, at: Date.now() }]);
      } catch (e) {
        setError(e);
      } finally {
        setPending(false);
      }
    },
    [messages, pending, language, context],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, pending, error, send, clear };
}

/** Web Speech API voice input. Returns { supported, listening, start, stop }. */
export function useSpeechInput({ language = "en", onResult }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const supported = Boolean(Recognition);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Recognition) return;
    try {
      recRef.current?.abort();
    } catch {
      /* noop */
    }
    const rec = new Recognition();
    rec.lang = SPEECH_LANG[language] || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      const final = e.results[e.results.length - 1]?.isFinal;
      onResultRef.current?.(text, final);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [Recognition, language]);

  useEffect(() => () => recRef.current?.abort?.(), []);
  return { supported, listening, start, stop };
}

/** Text-to-speech for replies. */
export function useSpeak(language = "en") {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speakingId, setSpeakingId] = useState(null);
  const speak = useCallback(
    (id, markdown) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }
      const plain = markdown
        .replace(/```[\s\S]*?```/g, " (code example on screen) ")
        .replace(/[*_`#>]/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1");
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = SPEECH_LANG[language] || "en-IN";
      u.rate = 1;
      u.onend = () => setSpeakingId(null);
      u.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(u);
    },
    [supported, speakingId, language],
  );
  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);
  return { supported, speak, speakingId };
}

/** Small round tutor mark used beside assistant replies. */
export function TutorMark({ className }) {
  return (
    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-primary", className)} aria-hidden="true">
      <Sparkles className="size-3.5" strokeWidth={1.8} />
    </span>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <TutorMark />
      <div className="flex items-center gap-1 py-2" aria-label="Tutor is typing">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="size-1.5 rounded-full bg-subtle" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}

/** Message list: user messages in a soft bubble, assistant replies as plain reading text. */
export function TutorMessages({ messages, pending, language, compact = false }) {
  const { supported: canSpeak, speak, speakingId } = useSpeak(language);
  return (
    <div className={cn(compact ? "space-y-5" : "space-y-8")}>
      {messages.map((m, i) =>
        m.role === "user" ? (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex justify-end">
            <div className={cn("max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-fg whitespace-pre-wrap", compact ? "text-sm" : "text-[15px] leading-relaxed")}>{m.content}</div>
          </motion.div>
        ) : (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn("flex items-start", compact ? "gap-2.5" : "gap-3")}>
            <TutorMark className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <Markdown className={cn("[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:text-xs", compact ? "text-sm" : "text-[15px] leading-7")}>{m.content}</Markdown>
              {canSpeak && (
                <button
                  type="button"
                  onClick={() => speak(i, m.content)}
                  className="mt-2 -ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                  aria-label={speakingId === i ? "Stop reading aloud" : "Read aloud"}
                >
                  {speakingId === i ? <Square className="size-3 fill-current" /> : <Volume2 className="size-3.5" />}
                  {speakingId === i ? "Stop" : "Read aloud"}
                </button>
              )}
            </div>
          </motion.div>
        ),
      )}
      {pending && <TypingIndicator />}
    </div>
  );
}

/** Composer with textarea, voice input and send. */
export function TutorComposer({ onSend, pending, language, placeholder = "Ask anything", autoFocus = false, compact = false }) {
  const [text, setText] = useState("");
  const baseRef = useRef("");
  const { supported, listening, start, stop } = useSpeechInput({
    language,
    onResult: (t, final) => {
      setText(`${baseRef.current}${baseRef.current ? " " : ""}${t}`.trimStart());
      if (final) baseRef.current = "";
    },
  });
  const submit = (e) => {
    e?.preventDefault();
    if (!text.trim() || pending) return;
    if (listening) stop();
    onSend(text);
    setText("");
  };
  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex items-end gap-1.5 border border-line bg-surface p-1.5 transition-colors focus-within:border-line-strong",
        compact ? "rounded-2xl" : "rounded-3xl p-2 shadow-sm",
      )}
    >
      <label htmlFor="tutor-input" className="sr-only">Message the AI tutor</label>
      <textarea
        id="tutor-input"
        rows={1}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) submit(e);
        }}
        placeholder={listening ? "Listening, speak now" : placeholder}
        className={cn("max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 placeholder:text-subtle focus:outline-none focus-visible:outline-none", compact ? "text-sm" : "text-[15px]")}
      />
      {supported && (
        <button
          type="button"
          onClick={() => {
            if (listening) stop();
            else {
              baseRef.current = text;
              start();
            }
          }}
          className={cn(
            "relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
            listening ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
          aria-label={listening ? "Stop voice input" : "Speak your question"}
          aria-pressed={listening}
        >
          {listening && <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" aria-hidden="true" />}
          {listening ? <Square className="relative size-3.5 fill-current" /> : <Mic className="size-[18px]" strokeWidth={1.8} />}
        </button>
      )}
      <button
        type="submit"
        disabled={!text.trim() || pending}
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-fg transition-opacity disabled:cursor-default disabled:bg-surface-3 disabled:text-subtle"
        aria-label="Send"
      >
        <ArrowUp className="size-[18px]" strokeWidth={2} />
      </button>
    </form>
  );
}
