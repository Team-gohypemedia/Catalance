import React, { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import Heart from "lucide-react/dist/esm/icons/heart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DashboardPanel,
  DashboardSkeletonBlock,
} from "@/components/client/client-dashboard/shared.jsx";
import { useOptionalClientDashboardData } from "./useClientDashboardData.js";
import { cn } from "@/shared/lib/utils";

const formatDeliveryLabel = (value) => {
  const token = String(value || "").trim();
  if (!token) return null;
  return token.replace(/_/g, " ");
};

const formatPriceLabel = (entry = {}) => {
  const numeric = Number(entry?.price);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `Rs. ${numeric.toLocaleString("en-IN")}`;
  }

  const range = String(entry?.priceLabel || "").trim();
  if (!range) return "Pricing on request";
  return /rs\.?/i.test(range) ? range : `Rs. ${range}`;
};

const getInitials = (name = "") =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "F";

const WishlistedFreelancers = memo(function WishlistedFreelancers({
  items,
  count,
  isLoading = false,
  className = "",
}) {
  const navigate = useNavigate();
  const dashboardData = useOptionalClientDashboardData();

  const resolvedItems = useMemo(
    () =>
      Array.isArray(items) ? items : dashboardData?.wishlistedFreelancers || [],
    [dashboardData?.wishlistedFreelancers, items],
  );
  const resolvedCount = Number.isFinite(count)
    ? count
    : Number.isFinite(dashboardData?.wishlistedFreelancersCount)
      ? dashboardData.wishlistedFreelancersCount
      : resolvedItems.length;
  const resolvedIsLoading = isLoading || dashboardData?.isLoading;

  const handleOpenItem = useCallback(
    (item) => {
      const id = String(item?.id || "").trim();
      if (!id) return;
      navigate(`/marketplace/service/${encodeURIComponent(id)}`);
    },
    [navigate],
  );

  const handleOpenMarketplace = useCallback(() => {
    navigate("/marketplace");
  }, [navigate]);

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <h2 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-white">
          Wishlisted Freelancers
        </h2>
      </div>

      <DashboardPanel
        className={cn(
          "w-full overflow-hidden bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          resolvedItems.length === 0
            ? "p-0"
            : "px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6",
        )}
      >
        {resolvedIsLoading ? (
          <div className="space-y-4 p-5 sm:p-6">
            <DashboardSkeletonBlock className="h-5 w-44 rounded-full" />
            <DashboardSkeletonBlock className="h-4 w-30 rounded-full" />
            {[0, 1].map((row) => (
              <div key={`wishlist-skeleton-${row}`} className="flex items-center gap-3">
                <DashboardSkeletonBlock className="size-11 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <DashboardSkeletonBlock className="h-4 w-32 rounded-full" />
                  <DashboardSkeletonBlock className="h-3 w-44 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : resolvedItems.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[260px] sm:px-6 sm:py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/6 text-muted-foreground sm:size-14">
              <Heart className="size-6" />
            </div>
            <p className="mt-5 text-sm text-white">No wishlisted freelancers yet</p>
            <p className="mt-2 max-w-60 text-xs text-[#8f8f8f]">
              Tap the heart icon in Marketplace to save freelancers here.
            </p>
            <button
              type="button"
              onClick={handleOpenMarketplace}
              className="mt-5 inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-[#f2f2f2]"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {resolvedItems.map((item, index) => {
                const delivery = formatDeliveryLabel(item?.deliveryTime);
                const price = formatPriceLabel(item);

                return (
                  <button
                    key={item.id || `wishlist-item-${index}`}
                    type="button"
                    onClick={() => handleOpenItem(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.05]",
                    )}
                  >
                    <Avatar className="size-11 shrink-0 border border-white/10">
                      <AvatarImage
                        src={item.freelancerAvatar}
                        alt={item.freelancerName || "Freelancer"}
                      />
                      <AvatarFallback className="bg-[#1e293b] text-sm text-white">
                        {getInitials(item.freelancerName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {item.freelancerName || "Freelancer"}
                      </p>
                      <p className="truncate text-xs text-primary">
                        {item.serviceTitle || "Service"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {delivery ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            {delivery}
                          </span>
                        ) : null}
                        <span className="font-medium text-white">{price}</span>
                      </div>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleOpenMarketplace}
              className="mt-5 flex w-full items-center justify-center gap-2 border-t border-white/8 pt-5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#d6d6d6] transition-colors hover:text-white"
            >
              <span>Open Marketplace ({resolvedCount})</span>
              <ChevronRight className="size-3.75 stroke-[1.75]" />
            </button>
          </>
        )}
      </DashboardPanel>
    </section>
  );
});

export default WishlistedFreelancers;
