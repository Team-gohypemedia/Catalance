import React, { memo } from "react";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { proposalPanelClassName } from "./proposal-utils.js";

export const EmptyStateCard = memo(function EmptyStateCard({ title, description }) {
  return (
    <Card className={cn("shadow-none", proposalPanelClassName)}>
      <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="rounded-xl bg-[#ffc107]/10 p-3 text-[#ffc107]">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-[#f1f5f9]">{title}</h3>
          <p className="max-w-md text-sm leading-6 text-[#94a3b8]">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
});

export const ProposalLoadingState = memo(function ProposalLoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[28rem] w-full rounded-[32px]" />
      ))}
    </div>
  );
});
