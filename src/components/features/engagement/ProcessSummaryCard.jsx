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
      <div className="rounded-[28px] border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <Target className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Learning Insights</p>
            <h3 className="text-lg font-black text-foreground">Process Summary</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete a few quests to see your strong and weak areas here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
          <Target className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Learning Insights</p>
          <h3 className="text-lg font-black text-foreground">Process Summary</h3>
        </div>
        {accuracy !== null && (
          <span className="ml-auto rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-foreground">
            {accuracy}% accuracy
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {strong && (
          <div className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <TrendingUp className="size-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-wider text-emerald-500">Strength</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {TOPIC_LABELS[strong] || strong}
              </p>
            </div>
          </div>
        )}
        {weak && (
          <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <TrendingDown className="size-5 shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-wider text-destructive">Focus Area</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {TOPIC_LABELS[weak] || weak}
              </p>
            </div>
          </div>
        )}
        {next && (
          <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <BookOpen className="size-5 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-wider text-primary">Next Focus</p>
              <p className="mt-1 text-sm font-bold text-foreground">
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
