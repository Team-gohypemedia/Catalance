import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, Lock, LogIn, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/shared/context/NotificationContext";
import { getSession } from "@/shared/lib/auth-storage";
import { request as apiRequest } from "@/shared/lib/api-client";
import { createMarketplaceChatRequest, readMarketplaceChatRequests, MARKETPLACE_CHAT_UPDATED_EVENT } from "@/shared/lib/marketplace-chat-requests";
import { resolveUserDisplayName } from "@/shared/lib/user-display";

const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();
const asArray = (value) => (Array.isArray(value) ? value : []);

const formatPrice = (serviceDetails = {}) => {
  const raw = serviceDetails.startingPrice || serviceDetails.minBudget || serviceDetails.price;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `Rs. ${numeric.toLocaleString("en-IN")}`;
  }

  const range = normalizeText(serviceDetails.averageProjectPriceRange || serviceDetails.priceRange || "");
  if (!range) return "Contact for pricing";
  return /rs\.?|inr|â‚¹/i.test(range) ? range : `Rs. ${range}`;
};

const DELIVERY_LABELS = {
  less_than_2_weeks: "Less than 2 weeks",
  two_weeks: "2 weeks",
  "2_4_weeks": "2-4 weeks",
  "1_3_months": "1-3 months",
  "3_plus_months": "3+ months",
  rush: "Rush (< 1 week)",
};

const EXPERIENCE_LEVEL_LABELS = {
  entry: "Entry Level (0-1 years)",
  intermediate: "Intermediate (1-3 years)",
  experienced: "Experienced (3-5 years)",
  expert: "Expert (5-10 years)",
  veteran: "Veteran (10+ years)",
};

const formatDelivery = (serviceDetails = {}) => {
  const value = normalizeText(serviceDetails.deliveryTime || "");
  if (!value) return "Not specified";
  return DELIVERY_LABELS[value] || value.replace(/_/g, " ");
};

const getExperienceLabel = (serviceDetails = {}, freelancer = {}) => {
  const token = normalizeText(serviceDetails.workingLevel || serviceDetails.experienceYears || "").toLowerCase();
  if (EXPERIENCE_LEVEL_LABELS[token]) return EXPERIENCE_LEVEL_LABELS[token];

  const years = Number(
    serviceDetails.experienceYears ||
      freelancer?.freelancerProfile?.experienceYears ||
      freelancer?.experienceYears
  );
  if (Number.isFinite(years) && years > 0) return `${years}+ years`;
  return "Not specified";
};

const getServiceLocationLabel = (serviceDetails = {}, freelancer = {}) => {
  const direct =
    normalizeText(serviceDetails.industryFocus) ||
    normalizeText(serviceDetails.preferOnlyIndustries) ||
    normalizeText(freelancer?.freelancerProfile?.location) ||
    normalizeText(freelancer?.freelancerProfile?.city);
  if (direct) return direct;
  return "Remote / Global";
};

const getPositiveKeywords = (serviceDetails = {}, freelancer = {}) => {
  const candidates = [
    ...asArray(serviceDetails.skillsAndTechnologies),
    ...asArray(serviceDetails.techStack),
    ...asArray(serviceDetails.tools),
    ...asArray(serviceDetails.serviceSpecializations),
    ...asArray(freelancer?.freelancerProfile?.skills),
  ];

  const seen = new Set();
  const result = [];

  candidates.forEach((entry) => {
    const label = normalizeText(entry);
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(label);
  });

  return result.slice(0, 8);
};

const getDisplayName = (user = {}) => resolveUserDisplayName(user, "Client");

const getClientBusinessName = (user = {}) =>
  user?.companyName || user?.businessName || user?.brandName || "";

const resolveUserId = (user = {}) => {
  const id = normalizeText(user?.id || user?.userId || user?.sub || user?._id || "");
  return id || null;
};

const resolveFreelancerId = (service = {}, freelancer = {}) => {
  const id = normalizeText(
    freelancer?.id ||
      freelancer?.userId ||
      freelancer?.sub ||
      freelancer?._id ||
      service?.freelancerId ||
      service?.freelancer?.id ||
      service?.freelancer?.userId ||
      ""
  );
  return id || null;
};

const LoginPrompt = ({ onLogin, onClose }) => (
  <div className="flex flex-col items-center gap-5 py-4 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
      <Lock className="h-7 w-7 text-primary" />
    </div>
    <div className="space-y-1.5">
      <p className="text-base font-bold text-foreground">Sign in to contact this freelancer</p>
      <p className="max-w-[260px] text-sm text-muted-foreground">
        Please log in to send a message. You&apos;ll be brought back here after signing in.
      </p>
    </div>
    <div className="flex w-full flex-col gap-2.5">
      <Button className="h-11 w-full gap-2 rounded-xl font-semibold" onClick={onLogin}>
        <LogIn className="h-4 w-4" />
        Log in to continue
      </Button>
      <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={onClose}>
        Maybe later
      </Button>
    </div>
  </div>
);

const StickySidebar = ({
  service,
  isAuthenticated = false,
  onLoginRequired,
  modalOpen = false,
  onModalOpenChange,
}) => {
  const { serviceDetails = {}, freelancer } = service;
  const { notifications = [] } = useNotifications();
  const priceValue = formatPrice(serviceDetails);
  const deliveryTime = formatDelivery(serviceDetails);
  const serviceSummary = normalizeText(
    serviceDetails.description || serviceDetails.serviceDescription || serviceDetails.bio || ""
  );

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isOpen = onModalOpenChange ? modalOpen : internalModalOpen;
  const setIsOpen = onModalOpenChange ?? setInternalModalOpen;

  const [message, setMessage] = useState(
    `Hi, I am interested in your "${service.service || "service"}" service. Could you tell me more about your process and availability?`
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [requestState, setRequestState] = useState(null);

  const currentUser = getSession()?.user || null;
  const clientId = resolveUserId(currentUser);
  const freelancerId = resolveFreelancerId(service, freelancer);

  const serverRequestStatus = useMemo(() => {
    if (!clientId || !freelancerId) return "";
    const notification = (Array.isArray(notifications) ? notifications : []).find((item) => {
      const type = String(item?.type || "");
      if (
        type !== "marketplace_request" &&
        type !== "marketplace_request_accepted" &&
        type !== "marketplace_request_declined"
      ) {
        return false;
      }
      const data = item?.data || {};
      return (
        String(data.clientId || "") === String(clientId) &&
        String(data.freelancerId || "") === String(freelancerId) &&
        String(data.serviceId || "") === String(service?.id || "")
      );
    });

    if (!notification) return "";
    
    if (notification.type === "marketplace_request_accepted") return "accepted";
    if (notification.type === "marketplace_request_declined") return "declined";

    return String(notification?.data?.requestStatus || notification?.status || "")
      .trim()
      .toLowerCase();
  }, [clientId, freelancerId, notifications, service?.id]);

  useEffect(() => {
    const syncRequestState = () => {
      if (!clientId || !freelancerId) {
        setRequestState(null);
        return;
      }

      const requests = readMarketplaceChatRequests();
      const matched = requests.find(
        (req) =>
          String(req.clientId) === String(clientId) &&
          String(req.freelancerId) === String(freelancerId) &&
          String(req.serviceId || "") === String(service?.id || "")
      );
      setRequestState(matched || null);
    };

    syncRequestState();
    window.addEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, syncRequestState);
    window.addEventListener("storage", syncRequestState);

    return () => {
      window.removeEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, syncRequestState);
      window.removeEventListener("storage", syncRequestState);
    };
  }, [clientId, freelancerId, service?.id]);

  const currentRequestStatus = String(
    requestState?.status || serverRequestStatus || "",
  )
    .trim()
    .toLowerCase();
  const hasExistingRequest = ["pending", "accepted"].includes(currentRequestStatus);
  const isOwnService = useMemo(() => {
    if (!clientId || !freelancerId) return false;
    return String(clientId) === String(freelancerId);
  }, [clientId, freelancerId]);
  const requestButtonLabel = isOwnService
    ? "Your Service"
    : currentRequestStatus === "accepted"
      ? "Inquiry Accepted - Go to Chat"
      : currentRequestStatus === "declined"
        ? "Send Again"
        : hasExistingRequest
          ? "Request Sent"
          : `Continue (${priceValue})`;
  const experienceLevel = useMemo(
    () => getExperienceLabel(serviceDetails, freelancer),
    [serviceDetails, freelancer]
  );
  const serviceLocation = useMemo(
    () => getServiceLocationLabel(serviceDetails, freelancer),
    [serviceDetails, freelancer]
  );
  const positiveKeywords = useMemo(
    () => getPositiveKeywords(serviceDetails, freelancer),
    [serviceDetails, freelancer]
  );

  const handleCTAClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      setIsOpen(true);
      return;
    }
    
    if (currentRequestStatus === "accepted") {
      const chatRequestId = requestState?.requestId || requestState?.id;
      
      if (chatRequestId) {
        window.location.href = `/client/messages?requestId=${encodeURIComponent(chatRequestId)}`;
      } else {
        window.location.href = `/client/messages`;
      }
      return;
    }

    setShowAuthPrompt(false);
    setIsOpen(true);
  };

  const handleModalClose = (open) => {
    setIsOpen(open);
    if (!open) {
      setSendError(null);
      setShowAuthPrompt(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);

    try {
      const clientId = resolveUserId(currentUser);
      const freelancerId = resolveFreelancerId(service, freelancer);

      if (!isAuthenticated || !clientId) {
        setShowAuthPrompt(true);
        return;
      }

      if (!freelancerId) {
        throw new Error("Unable to resolve freelancer id for this service.");
      }

      const response = await apiRequest("/notifications/marketplace-request", {
        method: "POST",
        body: JSON.stringify({
          freelancerId,
          serviceId: service?.id || null,
          serviceTitle: service?.service || service?.serviceName || "Marketplace Request",
          serviceType: serviceDetails?.category || service?.category || service?.service || "Marketplace Request",
          requestMessage: message,
          clientName: getDisplayName(currentUser),
          clientAvatar: currentUser?.avatar || currentUser?.profilePicture || "",
          clientBusinessName: getClientBusinessName(currentUser),
          freelancerName: freelancer?.fullName || freelancer?.name || "Freelancer",
          freelancerAvatar: freelancer?.avatar || "",
        }),
      });

      const requestPayload = response?.data?.request || null;
      if (requestPayload) {
        createMarketplaceChatRequest({
          ...requestPayload,
          id: requestPayload.requestId,
          requestId: requestPayload.requestId,
          freelancerId,
          requestedFreelancerId: freelancerId,
          freelancerName: requestPayload.freelancerName || freelancer?.fullName || freelancer?.name || "Freelancer",
          requestedFreelancerName: requestPayload.freelancerName || freelancer?.fullName || freelancer?.name || "Freelancer",
          freelancerAvatar: requestPayload.freelancerAvatar || freelancer?.avatar || "",
          clientId,
          clientName: requestPayload.clientName || getDisplayName(currentUser),
          clientAvatar: requestPayload.clientAvatar || currentUser?.avatar || currentUser?.profilePicture || "",
          clientBusinessName: requestPayload.clientBusinessName || getClientBusinessName(currentUser),
          requestMessage: requestPayload.requestMessage || message,
          previewText: requestPayload.previewText || message,
          requestSource: "marketplace",
          status: "pending",
        });
      }

      handleModalClose(false);
    } catch (error) {
      console.error("Chat error:", error);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden rounded-2xl border border-border bg-white dark:border-white/10 dark:bg-[#111113] shadow-[0_20px_40px_-28px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-28px_rgba(0,0,0,0.85)]">
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Starting Price
              </p>
              <p className="mt-1 text-[28px] font-bold leading-none text-foreground dark:text-white">{priceValue}</p>
            </div>
          </div>

          {serviceSummary ? (
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{serviceSummary}</p>
          ) : null}

          <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 dark:text-[#e4e4e7]">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{deliveryTime}</span>
          </div>

          <Button
            className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleCTAClick}
            disabled={isOwnService || currentRequestStatus === "pending"}
          >
            {requestButtonLabel}
          </Button>
        </div>
      </Card>

      <div className="space-y-4 rounded-2xl border border-border bg-white p-4 dark:border-white/8 dark:bg-[#0d0d10]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Experience Level
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground dark:text-[#f4f4f5]">{experienceLevel}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Service Location
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground dark:text-[#f4f4f5]">{serviceLocation}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Positive Keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {positiveKeywords.length > 0 ? (
              positiveKeywords.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d4d4d8]"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No keywords available</span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          {showAuthPrompt ? (
            <>
              <DialogHeader className="pb-1">
                <DialogTitle className="text-lg">Send Request</DialogTitle>
              </DialogHeader>
              <LoginPrompt
                onLogin={() => {
                  handleModalClose(false);
                  if (onLoginRequired) onLoginRequired();
                }}
                onClose={() => handleModalClose(false)}
              />
            </>
          ) : (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-lg">Request {freelancer?.fullName || "Freelancer"}</DialogTitle>
                <DialogDescription className="text-sm">
                  Regarding &ldquo;{service.service}&rdquo;
                </DialogDescription>
              </DialogHeader>

              <div className="py-3">
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[130px] resize-none rounded-xl border-border/50 bg-muted/20 text-sm focus-visible:ring-primary/30"
                  placeholder="Type your message..."
                  aria-label="Message to freelancer"
                />
                {sendError ? (
                  <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-500">
                    {sendError}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleModalClose(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="min-w-[120px] gap-2 rounded-xl"
                >
                  {sending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StickySidebar;







