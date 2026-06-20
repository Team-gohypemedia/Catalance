import React from "react";
import Star from "lucide-react/dist/esm/icons/star";
import { cn } from "@/shared/lib/utils";
import Loader from "@/components/common/Loader";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "./shared.jsx";

const formatReviewDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const FreelancerClientReviewsSkeleton = () => (
  <section className="w-full min-w-0">
    <div className="mb-6 flex items-center justify-between gap-3">
      <FreelancerDashboardSkeletonBlock className="h-8 w-40 rounded-full" />
      <FreelancerDashboardSkeletonBlock className="h-6 w-16 rounded-full" />
    </div>
    <FreelancerDashboardPanel className="p-4 sm:p-5">
      <div className="space-y-3.5">
        {[0, 1].map((item) => (
          <div
            key={`freelancer-review-skeleton-${item}`}
            className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <FreelancerDashboardSkeletonBlock className="h-4 w-28 rounded-full" />
              <FreelancerDashboardSkeletonBlock className="h-3 w-16 rounded-full" />
            </div>
            <FreelancerDashboardSkeletonBlock className="mt-2 h-3 w-32 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-3 h-3 w-24 rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-3 h-4 w-full rounded-full" />
            <FreelancerDashboardSkeletonBlock className="mt-2 h-4 w-4/5 rounded-full" />
          </div>
        ))}
      </div>
    </FreelancerDashboardPanel>
  </section>
);

const ClientReviewsPanel = ({ reviews = [], meta = {}, isLoading = false }) => {
  const reviewCount = Number(meta?.reviewCount) || 0;
  const averageRating = Number(meta?.averageRating) || 0;

  return (
    <section className="w-full min-w-0">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
          Client Reviews
        </h2>
        {reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
            <Star className="size-3.5 fill-[var(--primary)] text-[var(--primary)]" />
            {averageRating.toFixed(1)}
            <span className="text-zinc-400">({reviewCount})</span>
          </span>
        ) : null}
      </div>

      <FreelancerDashboardPanel className="h-fit self-start p-4 sm:p-5">
        {isLoading ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <Loader size="sm" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground">
              <Star className="size-6" />
            </div>
            <p className="mt-4 text-sm dark:text-white text-[#1C1B1F]">No client reviews yet</p>
            <p className="mt-2 max-w-[240px] text-xs text-[#8f8f8f]">
              Reviews from clients who worked with you will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-[16px] border dark:border-white/[0.08] border-black/[0.04] dark:bg-white/[0.03] bg-black/[0.03] p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold dark:text-white text-[#1C1B1F]">
                      {review.clientName || "Client"}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                      {review.serviceLabel || "Freelancer Service"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-400">
                    {formatReviewDate(review.createdAt)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((ratingIndex) => (
                    <Star
                      key={`${review.id}-${ratingIndex}`}
                      className={cn(
                        "size-3.5",
                        Number(review.rating) >= ratingIndex
                          ? "fill-[var(--primary)] text-[var(--primary)]"
                          : "dark:text-white text-[#1C1B1F]/20",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2.5 text-sm leading-5 dark:text-zinc-200 text-muted-foreground">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </FreelancerDashboardPanel>
    </section>
  );
};

export default ClientReviewsPanel;
