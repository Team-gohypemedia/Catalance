import { useMemo, useState } from "react";
import { CheckCheck, Clock, Lock, LogIn, Send } from "lucide-react";

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
import { getSession } from "@/shared/lib/auth-storage";
import { createMarketplaceChatRequest } from "@/shared/lib/marketplace-chat-requests";

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

const getDisplayName = (user = {}) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

const getClientBusinessName = (user = {}) =>
  user?.companyName || user?.businessName || user?.brandName || "";

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
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const currentUser = getSession()?.user || null;
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
    setShowAuthPrompt(false);
    setIsOpen(true);
  };

  const handleModalClose = (open) => {
    setIsOpen(open);
    if (!open) {
      setSendSuccess(false);
      setSendError(null);
      setShowAuthPrompt(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);

    try {
      if (!isAuthenticated || !currentUser?.id) {
        setShowAuthPrompt(true);
        return;
      }

      createMarketplaceChatRequest({
        clientId: currentUser.id,
        clientName: getDisplayName(currentUser),
        clientAvatar: currentUser.avatar || currentUser.profilePicture || "",
        clientBusinessName: getClientBusinessName(currentUser),
        freelancerId: freelancer?.id || service?.freelancerId || null,
        freelancerName: freelancer?.fullName || freelancer?.name || "Freelancer",
        freelancerAvatar: freelancer?.avatar || "",
        serviceId: service?.id || null,
        serviceTitle: service?.service || service?.serviceName || "Marketplace Request",
        serviceType: serviceDetails?.category || service?.category || service?.service || "Marketplace Request",
        requestMessage: message,
        previewText: message,
        requestSource: "marketplace",
      });

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        handleModalClose(false);
      }, 1800);
    } catch (error) {
      console.error("Chat error:", error);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_20px_40px_-28px_rgba(0,0,0,0.85)]">
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f8f95]">
                Starting Price
              </p>
              <p className="mt-1 text-[28px] font-bold leading-none text-white">{priceValue}</p>
            </div>
          </div>

          {serviceSummary ? (
            <p className="line-clamp-3 text-sm leading-6 text-[#a1a1aa]">{serviceSummary}</p>
          ) : null}

          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#e4e4e7]">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{deliveryTime}</span>
          </div>

          <Button
            className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-black hover:bg-primary/90"
            onClick={handleCTAClick}
          >
            Continue ({priceValue})
          </Button>
        </div>
      </Card>

      <div className="space-y-4 rounded-2xl border border-white/8 bg-[#0d0d10] p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8f95]">
            Experience Level
          </p>
          <p className="mt-1 text-sm font-semibold text-[#f4f4f5]">{experienceLevel}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8f95]">
            Service Location
          </p>
          <p className="mt-1 text-sm font-semibold text-[#f4f4f5]">{serviceLocation}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8f95]">
            Positive Keywords
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {positiveKeywords.length > 0 ? (
              positiveKeywords.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#d4d4d8]"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#8f8f95]">No keywords available</span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          {sendSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCheck className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-foreground">Request Sent!</p>
              <p className="text-sm text-muted-foreground">
                The freelancer can review it from their requests tab.
              </p>
            </div>
          ) : showAuthPrompt ? (
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
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
