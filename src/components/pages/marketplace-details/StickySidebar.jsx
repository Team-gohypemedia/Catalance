import { useState } from "react";
import { Clock, Send, Share2, Copy, CheckCheck, Zap, LogIn, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

// ─── Price formatter ──────────────────────────────────────────────────────────
const formatPrice = (serviceDetails = {}, titleLabel = "Service Plan") => {
    const raw = serviceDetails.startingPrice || serviceDetails.minBudget || serviceDetails.price;
    if (raw) {
        const num = Number(raw);
        if (!isNaN(num) && num > 0) return { label: titleLabel, value: `₹${num.toLocaleString("en-IN")}` };
    }
    return { label: titleLabel, value: "Contact for pricing" };
};

const formatDelivery = (serviceDetails = {}) => {
    const val = serviceDetails.deliveryTime;
    return val ? String(val) : "Delivery time not specified";
};

// ─── Unauthenticated in-modal prompt ─────────────────────────────────────────
const LoginPrompt = ({ onLogin, onClose }) => (
    <div className="flex flex-col items-center text-center gap-5 py-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-1.5">
            <p className="font-bold text-base text-foreground">Sign in to contact this freelancer</p>
            <p className="text-sm text-muted-foreground max-w-[260px]">
                Please log in to send a message. You'll be brought right back here after signing in.
            </p>
        </div>
        <div className="flex flex-col w-full gap-2.5">
            <Button
                className="w-full rounded-xl gap-2 h-11 font-semibold"
                onClick={onLogin}
                aria-label="Log in and return to this page"
            >
                <LogIn className="w-4 h-4" />
                Log in to continue
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground rounded-xl"
                onClick={onClose}
            >
                Maybe later
            </Button>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const StickySidebar = ({
    service,
    onShare,
    isAuthenticated = false,
    onLoginRequired,
    modalOpen = false,
    onModalOpenChange,
}) => {
    const { serviceDetails = {}, freelancer } = service;
    const planTitle = service.service || service.serviceName || "Service Plan";
    const price = formatPrice(serviceDetails, planTitle.length > 25 ? `${planTitle.substring(0, 25)}...` : planTitle);
    const deliveryTime = formatDelivery(serviceDetails);

    // Normalize deliverables (to use in the sidebar similar to revisions/source files)
    const normalizeDeliverables = (sd = {}) => {
        const candidates = [sd.deliverables, sd.whatsIncluded, sd.includes, sd.features];
        for (const c of candidates) {
            if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
        }
        return [];
    };
    const deliverables = normalizeDeliverables(serviceDetails);

    // Internal state — used if modal is NOT lifted (fallback), overridden by props when lifted
    const [internalModalOpen, setInternalModalOpen] = useState(false);
    const isOpen = onModalOpenChange ? modalOpen : internalModalOpen;
    const setIsOpen = onModalOpenChange ?? setInternalModalOpen;

    const [message, setMessage] = useState(
        `Hi, I am interested in your "${service.service || "service"}" service. Could you tell me more about your process and availability?`
    );
    const [sending, setSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [copied, setCopied] = useState(false);

    // The "showAuth=true" state triggers the login prompt within the modal
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);

    const handleCTAClick = () => {
        if (!isAuthenticated) {
            // Show auth-prompt inline in modal — no alert
            setShowAuthPrompt(true);
            setIsOpen(true);
        } else {
            setShowAuthPrompt(false);
            setIsOpen(true);
        }
    };

    const handleModalClose = (open) => {
        setIsOpen(open);
        if (!open) {
            // Reset modal state on close
            setSendSuccess(false);
            setSendError(null);
            setShowAuthPrompt(false);
        }
    };

    const handleShare = () => {
        if (onShare) onShare();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = async () => {
        setSending(true);
        setSendError(null);
        try {
            const { API_BASE_URL } = await import("@/shared/lib/api-client");
            const token =
                localStorage.getItem("freelancer-auth-token") ||
                localStorage.getItem("auth-token");

            const payload = {
                content: message,
                service: `CHAT:${service.id}:${service.freelancerId}`,
                projectTitle: `Inquiry: ${service.service}`,
            };

            const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    service: payload.service,
                    projectTitle: payload.projectTitle
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    setShowAuthPrompt(true);
                    return;
                }
                throw new Error(err.message || "Failed to create conversation");
            }

            const convoRaw = await response.json();
            const convoId = convoRaw?.data?.id;

            if (!convoId) {
                throw new Error("Invalid response from chat service");
            }

            // Step 2: Send the actual message
            const msgResponse = await fetch(`${API_BASE_URL}/chat/conversations/${convoId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    content: message,
                    service: payload.service,
                    projectTitle: payload.projectTitle
                }),
            });

            if (!msgResponse.ok) {
                const err = await msgResponse.json().catch(() => ({}));
                throw new Error(err.message || "Failed to send message");
            }

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
        <div className="flex flex-col gap-3">
            <Card className="rounded-2xl border border-white/5 bg-[#171717] overflow-hidden">
                <div className="p-4 pb-3">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white leading-tight">{price.label}</h3>
                        <span className="text-xl font-bold text-white leading-tight pl-2">{price.value}</span>
                    </div>

                    {serviceDetails.description || serviceDetails.bio ? (
                        <p className="text-[#a1a1aa] text-sm leading-relaxed mb-3 line-clamp-2">
                            {serviceDetails.description || serviceDetails.bio}
                        </p>
                    ) : (
                        <p className="text-[#a1a1aa] text-sm leading-relaxed mb-3 italic">
                            No summary provided
                        </p>
                    )}

                    <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-[13px] text-[#e4e4e7]">
                            <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                            <span className="font-medium">{deliveryTime}</span>
                        </div>
                        {deliverables.length > 0 && deliverables.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-[13px] text-[#e4e4e7]">
                                <CheckCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="font-medium line-clamp-1">{item}</span>
                            </div>
                        ))}
                        {deliverables.length > 3 && (
                            <div className="text-xs text-[#a1a1aa] pl-6">
                                + {deliverables.length - 3} more items
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Button
                            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-full transition-colors text-sm"
                            onClick={handleCTAClick}
                        >
                            Continue ({price.value})
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full h-9 text-[#a1a1aa] hover:text-white hover:bg-white/5 rounded-full font-medium text-sm"
                            onClick={() => {
                                handleCTAClick();
                            }}
                        >
                            Contact {freelancer?.fullName?.split(' ')[0] || "Freelancer"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* About the Seller Card - Moved from main content directly to sidebar */}
            <Card className="rounded-2xl border border-white/5 bg-[#171717] overflow-hidden p-4">
                <h3 className="text-base font-bold text-white mb-3">About the Seller</h3>

                <div className="flex items-center gap-3 mb-2">
                    {freelancer?.avatar ? (
                        <img src={freelancer.avatar} alt={freelancer.fullName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center shrink-0">
                            <span className="text-base font-bold text-[#a1a1aa]">{freelancer?.fullName?.charAt(0) || 'U'}</span>
                        </div>
                    )}
                    <div>
                        <div className="font-bold text-white">{freelancer?.fullName || "Anonymous Freelancer"}</div>
                        {freelancer?.freelancerProfile?.jobTitle && (
                            <div className="text-xs text-[#a1a1aa] mb-1">{freelancer.freelancerProfile.jobTitle}</div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-amber-500">{Number(service?.averageRating || 0) > 0 ? Number(service.averageRating).toFixed(1) : "New"}</span>
                            {service?.reviewCount > 0 && <span className="text-[#a1a1aa]">({service.reviewCount} reviews)</span>}
                        </div>
                    </div>
                </div>

                <div className="text-[13px] text-[#a1a1aa] leading-snug mb-3 line-clamp-2">
                    {freelancer?.freelancerProfile?.bio ? (
                        <p>{freelancer.freelancerProfile.bio}</p>
                    ) : (
                        <p className="italic">No biography provided.</p>
                    )}
                </div>

                <Button variant="outline" className="w-full h-8 text-[13px] rounded-full border-white/10 bg-transparent text-white hover:bg-white/5">
                    View Profile
                </Button>
            </Card>

            {/* ── Chat / Auth Modal ──────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={handleModalClose}>
                <DialogContent className="sm:max-w-[440px] rounded-2xl">

                    {/* SUCCESS state */}
                    {sendSuccess ? (
                        <div className="py-8 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCheck className="w-7 h-7 text-emerald-500" />
                            </div>
                            <p className="font-semibold text-foreground">Message Sent!</p>
                            <p className="text-sm text-muted-foreground">
                                The freelancer will get back to you soon.
                            </p>
                        </div>

                    ) : showAuthPrompt ? (
                        /* AUTH PROMPT state — no alert, clean in-modal UX */
                        <>
                            <DialogHeader className="pb-1">
                                <DialogTitle className="text-lg">Contact Freelancer</DialogTitle>
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
                        /* COMPOSE MESSAGE state */
                        <>
                            <DialogHeader className="pb-2">
                                <DialogTitle className="text-lg">
                                    Message {freelancer?.fullName || "Freelancer"}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    Regarding &ldquo;{service.service}&rdquo;
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-3">
                                <Textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="min-h-[130px] resize-none rounded-xl border-border/50 bg-muted/20 focus-visible:ring-primary/30 text-sm"
                                    placeholder="Type your message..."
                                    aria-label="Message to freelancer"
                                />
                                {sendError && (
                                    <p className="text-xs text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 mt-2">
                                        {sendError}
                                    </p>
                                )}
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
                                    className="rounded-xl gap-2 min-w-[120px]"
                                    aria-label="Send message to freelancer"
                                >
                                    {sending ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            Sending…
                                        </span>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Send</>
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
