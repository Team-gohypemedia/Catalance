import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Languages, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LANGUAGES, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TutorComposer, TutorMessages, useSpeechInput, useTutorChat } from "@/components/learning/tutor";

const SUGGESTIONS = [
  { label: "React state", prompt: "useState aur useEffect mein kya difference hai? Simple example do." },
  { label: "SQL joins", prompt: "Explain LEFT JOIN vs INNER JOIN with an example from an online store." },
  { label: "Instagram growth", prompt: "How do I plan Instagram content for a small bakery in Jaipur?" },
  { label: "Pricing a gig", prompt: "How much should I charge for my first landing page gig?" },
  { label: "Resume review", prompt: "How do I make my resume stand out for a web developer internship?" },
  { label: "Prompting AI", prompt: "How do I write a good prompt for generating Instagram captions?" },
];

const LANG_KEY = "campus-tutor-lang";

function LanguagePicker({ value, onChange }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Tutor language</span>
      <Languages className="pointer-events-none absolute left-3 size-3.5 text-subtle" aria-hidden="true" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface pr-4 pl-8 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg focus:border-line-strong focus:outline-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Tutor() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) || user?.language || "en";
    } catch {
      return user?.language || "en";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      /* storage unavailable */
    }
  }, [language]);

  const { messages, pending, error, send, clear } = useTutorChat({ language, storageKey: `campus-tutor-${user?.id || "me"}` });
  const { supported: voiceSupported } = useSpeechInput({ language });
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-3xl flex-col">
      {/* slim header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-medium tracking-tight">AI tutor</h1>
          <p className="hidden text-sm text-muted sm:block">Explains step by step, in your language.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguagePicker value={language} onChange={setLanguage} />
          {!empty && (
            <Button variant="ghost" size="sm" leftIcon={Plus} onClick={clear} className="rounded-full font-medium">
              New chat
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {empty ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
              Namaste {firstName}, what shall we <em className="accent">learn</em> today?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-balance text-muted">
              Ask about a concept, an error or a client question. English, Hinglish, Hindi, Tamil, Telugu, Bengali or Marathi. {voiceSupported ? "Type, or tap the mic and speak." : ""}
            </p>
            <div className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.label}
                  type="button"
                  title={s.prompt}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + 0.04 * i, duration: 0.4 }}
                  onClick={() => send(s.prompt)}
                  className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  {s.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 pt-10 pb-4">
            <TutorMessages messages={messages} pending={pending} userName={user?.name} language={language} />
            {error && (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <span className="text-muted">{error.message || "The tutor couldn't reply. Try again."}</span>
                <Button size="sm" variant="outline" onClick={() => send(messages.filter((m) => m.role === "user").at(-1)?.content || "")}>
                  Retry
                </Button>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <div className="sticky bottom-20 z-10 bg-linear-to-t from-bg via-bg to-transparent pt-6 pb-2 lg:bottom-0 lg:pb-4">
          <TutorComposer onSend={send} pending={pending} language={language} placeholder="Ask anything" autoFocus />
          <p className={cn("mt-2.5 text-center text-xs text-subtle")}>The tutor can make mistakes, so double-check code and numbers. Chats stay on this device.</p>
        </div>
      </div>
    </div>
  );
}
