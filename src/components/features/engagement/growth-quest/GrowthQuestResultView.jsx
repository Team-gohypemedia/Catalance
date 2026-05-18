import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import Flame from "lucide-react/dist/esm/icons/flame";
import Info from "lucide-react/dist/esm/icons/info";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import { cn } from "@/shared/lib/utils";
import {
  CARD_CLASS,
  EYEBROW_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SUBTLE_CARD_CLASS,
  formatReset,
} from "./shared";

const GrowthQuestResultView = ({ result, nextResetAt, onBack }) => {
  const score = result?.scoreSummary || result?.score || {};
  const rewards = result?.rewardsAwarded || result?.rewards || {};
  const answers = Array.isArray(result?.questionResults)
    ? result.questionResults
    : Array.isArray(result?.answers)
      ? result.answers
      : [];
  const questionCount = score.questionCount || answers.length || 6;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className={EYEBROW_CLASS}>Quest Completed</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {score.correctCount ?? 0}
              <span className="ml-2 text-2xl text-muted-foreground sm:text-3xl">
                / {questionCount}
              </span>
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-background/60 px-3 py-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              {score.accuracy ?? 0}% accuracy
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Quick summary of today&apos;s result.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>XP Earned</p>
              <p className="mt-2 text-2xl font-semibold text-primary">+{rewards.xpAwarded ?? 0}</p>
            </div>
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>Coins Earned</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                +{rewards.coinsAwarded ?? 0}
              </p>
            </div>
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>Current Streak</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-foreground">
                {result?.streak?.currentStreak ?? 0}
                <Flame className="size-4 text-primary" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {Array.isArray(result?.unlockedBadges) && result.unlockedBadges.length > 0 ? (
        <section className="rounded-[6px] border border-primary/20 bg-primary/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary/15">
              <Trophy className="size-4 text-primary" />
            </div>
            <div>
              <p className={LABEL_CLASS}>New Milestone</p>
              <p className="mt-1 text-base font-medium text-foreground">
                {result.unlockedBadges.map((badge) => badge.title || badge.key).join(", ")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The badge has been added to your profile.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={EYEBROW_CLASS}>Answer Review</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Review answers
            </h3>
          </div>
          <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-2 text-sm text-muted-foreground")}>
            {answers.filter((answer) => answer.isCorrect).length}/{answers.length} correct
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={cn(
                "rounded-[6px] border px-4 py-4",
                answer.isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-destructive/20 bg-destructive/[0.04]"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]",
                    answer.isCorrect
                      ? "bg-emerald-500/12 text-emerald-500"
                      : "bg-destructive/12 text-destructive"
                  )}
                >
                  {answer.isCorrect ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <span className="pt-0.5 text-sm text-muted-foreground">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {answer.questionVariant === "personalized" ? (
                          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                            Personalized
                          </span>
                        ) : null}
                        <p className="text-sm font-medium leading-6 text-foreground">
                          {answer.questionText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!answer.isCorrect ? (
                    <div className="mt-3 inline-flex rounded-[6px] border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                      Correct answer: {String(answer.correctOptionId).toUpperCase()}
                    </div>
                  ) : null}

                  {answer.explanation ? (
                    <div className={cn(SUBTLE_CARD_CLASS, "mt-4 px-4 py-3")}>
                      <div className="flex items-center gap-2">
                        <Info className="size-3.5 text-muted-foreground" />
                        <p className={LABEL_CLASS}>Why this matters</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {answer.explanation}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="mx-auto flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-card px-4 py-3 text-sm text-muted-foreground">
          <Clock className="size-4" />
          Next quest unlocks at <span className="font-medium text-foreground">{formatReset(nextResetAt)}</span>
        </div>

        <button type="button" onClick={onBack} className={cn(PRIMARY_BUTTON_CLASS, "w-full")}>
          Back to Growth Hub
          <ArrowRight className="size-4" />
        </button>
      </section>
    </div>
  );
};

export default GrowthQuestResultView;
