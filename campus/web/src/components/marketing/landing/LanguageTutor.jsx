import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, Check, Mic, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Reveal } from "../primitives";
import { LANG_LESSON, LESSON_LANGS, TUTOR_QUESTIONS } from "./content";

const EASE = [0.22, 1, 0.36, 1];
const langMeta = (v) => LESSON_LANGS.find((l) => l.value === v) || LESSON_LANGS[0];

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Tutor is typing">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1.5 rounded-full bg-ink-muted" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

/** Live AI tutor chat that streams its answer in the selected language. */
function TutorChat({ lang }) {
  const reduce = useReducedMotion();
  const [askId, setAskId] = useState("excel");
  const [phase, setPhase] = useState("done"); // typing | streaming | done
  const [words, setWords] = useState(Infinity);
  const timers = useRef([]);
  const scrollRef = useRef(null);
  const first = useRef(true);

  const clear = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
  };
  useEffect(() => clear, []);

  const question = TUTOR_QUESTIONS.find((q) => q.id === askId);
  const answer = question.a[lang] || question.a.en;
  const tokens = answer.split(" ");

  const start = (id, l = lang) => {
    clear();
    setAskId(id);
    if (reduce) {
      setPhase("done");
      setWords(Infinity);
      return;
    }
    setWords(0);
    setPhase("typing");
    const total = (TUTOR_QUESTIONS.find((q) => q.id === id).a[l] || "").split(" ").length;
    timers.current.push(
      setTimeout(() => {
        setPhase("streaming");
        let n = 0;
        const iv = setInterval(() => {
          n += 1;
          setWords(n);
          if (n >= total) {
            clearInterval(iv);
            setPhase("done");
          }
        }, 50);
        timers.current.push(iv);
      }, 700),
    );
  };

  // Re-answer in the new language when the toggle changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    start(askId, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [words, phase]);

  const meta = langMeta(lang);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink-line bg-ink-2 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
      <div className="flex items-center justify-between gap-3 border-b border-ink-line px-5 py-4">
        <p className="flex items-center gap-3 text-sm font-medium">
          <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg">
            <Bot className="size-4.5" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink-2 bg-success" aria-hidden="true" />
          </span>
          <span>
            Campus AI tutor
            <span className="block text-xs font-normal text-ink-muted">Online · replies in {meta.aria || meta.label}</span>
          </span>
        </p>
        <span className="hidden rounded-full border border-ink-line px-2.5 py-1 text-[11px] text-ink-muted sm:inline">24/7</span>
      </div>

      <div ref={scrollRef} className="h-[300px] space-y-3 overflow-y-auto px-5 py-5 sm:h-[280px]" aria-live="polite" lang={meta.lang}>
        <AnimatePresence initial={false}>
          <motion.p
            key={`q-${askId}-${lang}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] text-primary-fg"
          >
            {question.q[lang] || question.q.en}
          </motion.p>
        </AnimatePresence>
        <div className="flex items-end gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-primary ring-1 ring-ink-line">
            <Bot className="size-3.5" />
          </span>
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-ink px-4 py-3 text-[15px] leading-relaxed text-ink-fg ring-1 ring-ink-line">
            {phase === "typing" ? (
              <TypingDots />
            ) : (
              <>
                {tokens.slice(0, words).join(" ")}
                {phase === "streaming" && <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-ink-fg" aria-hidden="true" />}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-ink-line px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">Try a question</p>
          {phase === "done" && (
            <button type="button" onClick={() => start(askId)} className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-muted hover:text-ink-fg">
              <RotateCcw className="size-3" aria-hidden="true" /> Ask again
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2" lang={meta.lang}>
          {TUTOR_QUESTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              data-tutor-chip={q.id}
              onClick={() => start(q.id)}
              className={cn(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                askId === q.id ? "border-primary text-ink-fg" : "border-ink-line text-ink-muted hover:border-ink-muted hover:text-ink-fg",
              )}
            >
              {q.q[lang] || q.q.en}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2" aria-hidden="true">
          <span className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-ink-line px-4 text-[13px] text-ink-muted">Ask anything, by text or voice…</span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink-line text-ink-muted">
            <Mic className="size-4" />
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
            <Send className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

/** The one dark section: language toggle + lesson snippet + live AI tutor. */
export function LanguageTutor() {
  const { isAuthed } = useAuth();
  const [lang, setLang] = useState("hi");
  const uid = useId();
  const refs = useRef({});
  const meta = langMeta(lang);
  const t = LANG_LESSON[lang];

  const onKey = (e) => {
    const i = LESSON_LANGS.findIndex((l) => l.value === lang);
    let n = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % LESSON_LANGS.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + LESSON_LANGS.length) % LESSON_LANGS.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = LESSON_LANGS.length - 1;
    if (n === null) return;
    e.preventDefault();
    setLang(LESSON_LANGS[n].value);
    refs.current[LESSON_LANGS[n].value]?.focus();
  };

  return (
    <section id="learn-in-your-language" className="bg-ink py-20 text-ink-fg sm:py-28 dark:border-y dark:border-ink-line">
      <div className="container-campus grid items-stretch gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <Reveal className="flex flex-col">
          <p className="eyebrow mb-4 !text-ink-muted" lang="hi-Latn">
            Apni bhasha mein seekho
          </p>
          <h2 className="text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
            Learn in <em className="accent">your language</em>
          </h2>
          <p className="mt-4 max-w-md text-base text-ink-muted sm:text-lg">Every lesson, and a tutor that answers any doubt, any time.</p>

          <div role="tablist" aria-label="Language" onKeyDown={onKey} className="mt-8 flex flex-wrap gap-2">
            {LESSON_LANGS.map((l) => {
              const on = l.value === lang;
              return (
                <button
                  key={l.value}
                  ref={(el) => (refs.current[l.value] = el)}
                  id={`${uid}-tab-${l.value}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={`${uid}-panel`}
                  aria-label={l.aria}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setLang(l.value)}
                  className={cn(
                    "relative cursor-pointer rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    on ? "border-primary text-primary-fg" : "border-ink-line text-ink-muted hover:border-ink-muted hover:text-ink-fg",
                  )}
                >
                  {on && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", bounce: 0.15, duration: 0.4 }} />}
                  <span className="relative" lang={l.lang}>
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${lang}`} className="mt-6 rounded-2xl border border-ink-line bg-ink-2 p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={lang} lang={meta.lang} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: EASE }}>
                <p className="text-xs text-ink-muted">{t.tag}</p>
                <h3 className="mt-1.5 text-xl font-medium tracking-tight">{t.title}</h3>
                <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-muted">{t.body}</p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-sm font-medium ring-1 ring-ink-line">
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-success text-ink">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {t.result}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button to={isAuthed ? "/app/tutor" : "/signup"} size="lg" rightIcon={ArrowRight}>
              {isAuthed ? "Open the tutor" : "Try the tutor free"}
            </Button>
            <span className="text-sm text-ink-muted">7 languages · text or voice</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <TutorChat lang={lang} />
        </Reveal>
      </div>
    </section>
  );
}
