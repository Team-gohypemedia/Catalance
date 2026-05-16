import React from "react";
import { cn } from "@/shared/lib/utils";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import Target from "lucide-react/dist/esm/icons/target";
import BookOpen from "lucide-react/dist/esm/icons/book-open";

const TOPIC_LABELS = {
  client_communication: "Client Communication",
  scope_management: "Scope Management",
  delivery: "Delivery",
  quality_control: "Quality Control",
  platform_rules: "Platform Rules",
  business_basics: "Business Basics",
};

const ProcessSummaryCard = ({ processSummary = {} }) => {
  const strong = processSummary?.strongTopics?.[0];
  const weak = processSummary?.weakTopics?.[0];
  const next = processSummary?.recommendedNextTopic;
  const accuracy = processSummary?.rollingAccuracy ?? null;
  const hasData = strong || weak || next || accuracy !== null;

  if (!hasData) {
    return (
      <div className="rounded-[6px] border border-white/[0.08] bg-card p-6 shadow-[0_20px_45px_-35px_rgba(0,0,0,0.95)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[6px] bg-primary/10">
            <Target className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Learning Summary</p>
            <h3 className="text-lg font-semibold text-foreground">Best &amp; Weak Topics</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete a few practice quizzes to see your strong topics, weak topics, and next focus here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-black/40 p-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-[10px] bg-primary/10 transition-transform duration-300 hover:scale-110 hover:bg-primary/20">
          <Target className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">Learning Summary</p>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-foreground">Best &amp; Weak Topics</h3>
        </div>
        {accuracy !== null && (
          <span className="ml-auto rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-foreground shadow-sm backdrop-blur-md">
            {accuracy}% accuracy
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {strong && (
          <div className="flex gap-3 rounded-[12px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-5px_rgba(16,185,129,0.15)]">
            <TrendingUp className="size-5 shrink-0 text-emerald-500 mt-0.5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-500 drop-shadow-sm">Strength</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {TOPIC_LABELS[strong] || strong}
              </p>
            </div>
          </div>
        )}
        {weak && (
          <div className="flex gap-3 rounded-[12px] border border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)]">
            <TrendingDown className="size-5 shrink-0 text-destructive mt-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-destructive drop-shadow-sm">Focus Area</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {TOPIC_LABELS[weak] || weak}
              </p>
            </div>
          </div>
        )}
        {next && (
          <div className="flex gap-3 rounded-[12px] border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-5px_rgba(255,193,7,0.15)]">
            <BookOpen className="size-5 shrink-0 text-primary mt-0.5 drop-shadow-[0_0_8px_rgba(255,193,7,0.5)]" />
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary drop-shadow-sm">Next Focus</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {next?.label || TOPIC_LABELS[next] || next}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessSummaryCard;
