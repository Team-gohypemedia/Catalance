import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Zap from "lucide-react/dist/esm/icons/zap";
import { cn } from "@/shared/lib/utils";
import {
  CARD_CLASS,
  EYEBROW_CLASS,
  LABELS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SUBTLE_CARD_CLASS,
} from "./shared";

const GrowthQuestQuizView = ({
  questions,
  activeIndex,
  setActiveIndex,
  selectedAnswers,
  handleSelectAnswer,
  onSubmit,
  submitting,
  canSubmit,
  error,
  revealedQuestions,
  handleRevealAnswer,
}) => {
  const question = questions[activeIndex];

  if (!question) return null;

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={EYEBROW_CLASS}>Daily Growth Quest</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Question {activeIndex + 1}
              <span className="text-muted-foreground"> of {questions.length}</span>
            </h2>
          </div>
          <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
            <p className={LABEL_CLASS}>
              {question.questionVariant === "personalized" ? "Personalized Focus" : "Category"}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {question.questionVariant === "personalized"
                ? question.focusReason || "Tailored to your current Growth Quest level."
                : question.categoryLabel || "Client Readiness"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2.5">
          {questions.map((entry, index) => {
            const active = index === activeIndex;
            const answered = Boolean(selectedAnswers[entry.id]);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group relative flex-1"
              >
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full transition-all duration-500",
                    active
                      ? "bg-primary shadow-[0_0_12px_rgba(255,193,7,0.4)]"
                      : answered
                        ? "bg-primary/40"
                        : "bg-white/10 group-hover:bg-white/20"
                  )}
                />
                <span
                  className={cn(
                    "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase transition-opacity duration-300",
                    active ? "opacity-100 text-primary" : "opacity-0"
                  )}
                >
                  Q{index + 1}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-10">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <Sparkles className="size-32" />
            </div>

            <p className="relative z-10 text-xl font-semibold leading-relaxed text-foreground">
              {question.questionText}
            </p>

            <div className="relative z-10 mt-10 grid gap-4">
              {(question.options || []).map((option, index) => {
                const selected = selectedAnswers[question.id] === option.id;
                const isRevealed = revealedQuestions[question.id];
                const isCorrect = option.id === question.correctOptionId;
                const label = LABELS[index] || option.id.toUpperCase();

                const getStatusStyles = () => {
                  if (!isRevealed) {
                    return selected
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(255,193,7,0.05)]"
                      : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]";
                  }
                  if (isCorrect)
                    return "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                  if (selected && !isCorrect) return "border-rose-500/40 bg-rose-500/10";
                  return "border-white/5 bg-white/[0.01] opacity-40";
                };

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (!isRevealed) {
                        handleSelectAnswer(question.id, option.id);
                        handleRevealAnswer(question.id, option.id === question.correctOptionId);
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300",
                      getStatusStyles()
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-all duration-300",
                        isRevealed
                          ? isCorrect
                            ? "bg-emerald-500 text-white"
                            : selected
                              ? "bg-rose-500 text-white"
                              : "bg-white/5 text-white/20"
                          : selected
                            ? "scale-110 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"
                      )}
                    >
                      {isRevealed && isCorrect ? <CheckCircle2 className="size-5" /> : label}
                    </span>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "block text-[0.95rem] font-medium leading-relaxed transition-colors",
                          isRevealed
                            ? isCorrect
                              ? "text-white"
                              : "text-white/40"
                            : selected
                              ? "text-white"
                              : "text-white/60 group-hover:text-white/80"
                        )}
                      >
                        {option.text}
                      </span>
                      {isRevealed && isCorrect ? (
                        <div className="animate-in fade-in slide-in-from-left-2 mt-2 flex items-center gap-3 duration-500">
                          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5">
                            <Star className="size-3 text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500">+10 COINS</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5">
                            <Zap className="size-3 text-violet-400" />
                            <span className="text-[10px] font-black text-violet-400">+15 XP</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[6px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              disabled={activeIndex === 0}
              className={SECONDARY_BUTTON_CLASS}
            >
              <ArrowLeft className="size-4" />
              Previous
            </button>

            {activeIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveIndex((index) => Math.min(questions.length - 1, index + 1))}
                className={PRIMARY_BUTTON_CLASS}
              >
                Next
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || submitting}
                className={PRIMARY_BUTTON_CLASS}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit Quest"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthQuestQuizView;
