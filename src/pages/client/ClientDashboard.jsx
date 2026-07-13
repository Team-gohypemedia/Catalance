import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActiveChats,
  ActiveProjects,
  ClientDashboardDialogs,
  ClientDashboardDataProvider,
  ClientDashboardHeader,
  HeroGreetingBlock,
  useOptionalClientDashboardData,
  ProjectProgress,
  RecentActivity,
  Proposals,
} from "@/components/client/client-dashboard";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const getMarketplaceRequestKey = (request = {}) => {
  const requestId = String(request?.requestId || request?.id || "").trim();
  const requestStatus = String(request?.status || request?.requestStatus || "").trim().toLowerCase();
  const requestType = String(request?.type || request?.requestSource || "").trim().toLowerCase();

  if (requestId) {
    return [requestId, requestStatus || requestType || "unknown"].join("|");
  }

  return [
    request?.clientId,
    request?.freelancerId,
    request?.serviceId,
    request?.createdAt,
    requestStatus,
    requestType,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("|");
};

const getRequestSortValue = (request = {}) => {
  const updatedAt = new Date(request?.updatedAt || request?.createdAt || 0).getTime();
  return Number.isFinite(updatedAt) ? updatedAt : 0;
};

const mapMarketplaceRequestNotification = (notification = {}) => {
  const data = notification?.data || {};

  return {
    id: data.requestId || notification.id,
    requestId: data.requestId || notification.id,
    status: String(data.requestStatus || "pending").toLowerCase(),
    createdAt:
      notification.createdAt ||
      data.createdAt ||
      notification.updatedAt ||
      new Date().toISOString(),
    updatedAt:
      notification.updatedAt ||
      notification.createdAt ||
      data.updatedAt ||
      new Date().toISOString(),
    freelancerId: data.freelancerId || null,
    freelancerName: data.freelancerName || "Freelancer",
    freelancerAvatar: data.freelancerAvatar || "",
    serviceId: data.serviceId || null,
    serviceTitle: data.serviceTitle || "Marketplace Request",
    serviceType: data.serviceType || data.serviceTitle || "Marketplace Request",
    requestMessage: data.requestMessage || notification.message || "",
    previewText: data.previewText || notification.message || "",
    clientName: data.clientName || "Client",
    clientAvatar: data.clientAvatar || "",
    clientBusinessName: data.clientBusinessName || "",
    requestSource: data.requestSource || "marketplace",
    requestedFreelancerId: data.freelancerId || null,
    requestedFreelancerName: data.freelancerName || "Freelancer",
    audience: String(data.audience || data.recipientRole || notification.audience || "")
      .trim()
      .toLowerCase(),
  };
};
const ClientDashboardContent = () => {
  const dashboardData = useOptionalClientDashboardData();
  const { user } = useAuth();
  const { notifications = [] } = useNotifications();
  const navigate = useNavigate();
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    const nextSentRequests = new Map();

    (Array.isArray(notifications) ? notifications : [])
      .filter((notification) => ["marketplace_request", "marketplace_request_accepted"].includes(String(notification?.type || "").toLowerCase()))
      .map(mapMarketplaceRequestNotification)
      .filter((request) => ["pending", "accepted"].includes(request.status))
      .filter((request) => {
        if (request.audience === "client" || request.audience === "freelancer") {
          return request.audience === "client";
        }

        return true;
      })
      .forEach((request) => {
        const key = getMarketplaceRequestKey(request);
        if (!key) return;

        const existing = nextSentRequests.get(key);
        if (!existing || getRequestSortValue(request) >= getRequestSortValue(existing)) {
          nextSentRequests.set(key, request);
        }
      });

    setSentRequests(
      Array.from(nextSentRequests.values()).sort(
        (left, right) => getRequestSortValue(right) - getRequestSortValue(left),
      ),
    );
  }, [notifications, user]);
  const isLoading = Boolean(dashboardData?.isLoading);
  const activeProjectCount = Number(dashboardData?.activeProjectCount || 0);
  const useEmptyWorkspaceLayout = !isLoading && activeProjectCount === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[94%] xl:max-w-none">
        <ClientDashboardHeader />

        <main className="flex-1 pb-12">
          <HeroGreetingBlock />
          <ActiveProjects />

          {sentRequests.length > 0 && (
            <section className="w-full mt-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[#1C1B1F] dark:text-white">
                    Sent Inquiry Requests
                  </h2>
                  <span className="relative inline-flex size-[15px] shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-[#f59e0b]/10" />
                    <span className="absolute inset-0 rounded-full bg-[#f59e0b]/20 animate-ping" />
                    <span className="relative block size-[6px] rounded-full bg-[#f59e0b]" />
                  </span>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sentRequests.map((req) => (
                  <div key={req.id} className="flex flex-col justify-between rounded-3xl border border-black/5 bg-[#FDF7F0]/60 dark:bg-[#18130d]/40 dark:border-white/5 p-5 shadow-sm">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={req.freelancerAvatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {String(req.freelancerName || "F").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{req.freelancerName}</h4>
                          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                            {req.serviceTitle}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed italic bg-white/40 dark:bg-black/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                        "{req.requestMessage}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status:</span>
                      <Badge
                        className={
                          req.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none rounded-full px-3 py-1 text-[11px] font-bold"
                            : "bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border-none rounded-full px-3 py-1 text-[11px] font-bold"
                        }
                      >
                        {req.status === "accepted" ? "Inquiry Accepted" : "Pending Approval"}
                      </Badge>
                    </div>
                    {req.status === "accepted" ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/client/messages?requestId=${encodeURIComponent(req.requestId || req.id)}`)}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        Go to Chat
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={useEmptyWorkspaceLayout ? "mt-6 md:mt-10 lg:mt-14" : "mt-6 md:mt-10 lg:mt-14 grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7 xl:grid-cols-[minmax(0,1fr)_420px]"}>
            <div className={useEmptyWorkspaceLayout ? "" : "min-w-0 flex flex-col gap-5 sm:gap-6 xl:gap-7"}>
              <Proposals isWide={useEmptyWorkspaceLayout} />
            </div>

            {!useEmptyWorkspaceLayout && (
              <div className="grid gap-5 sm:gap-6 xl:gap-7">
                <ActiveChats />
              </div>
            )}
          </section>

          <ProjectProgress />
          <RecentActivity className="mt-6 md:mt-10 lg:mt-14 sm:mt-16" />
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>

      <ClientDashboardDialogs />
    </div>
  );
};

const ClientDashboard = () => (
  <ClientDashboardDataProvider>
    <ClientDashboardContent />
  </ClientDashboardDataProvider>
);

export default ClientDashboard;









