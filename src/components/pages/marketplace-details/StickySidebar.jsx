import { useState } from "react";
import { Clock, Send, Share2, Copy, CheckCheck, Zap, LogIn, Lock } from "lucide-react";
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
const formatPrice = (serviceDetails = {}) => {
    const raw = serviceDetails.minBudget || serviceDetails.price || serviceDetails.startingPrice;
    if (raw) {
        const num = Number(raw);
        if (!isNaN(num) && num > 0) return { label: "Starts at", value: `₹${num.toLocaleString("en-IN")}` };
    }
    const rangeStr = serviceDetails.averageProjectPriceRange || serviceDetails.priceRange || "";
    if (rangeStr) return { label: "From", value: String(rangeStr) };
    return { label: null, value: "Contact for pricing" };
};

const formatDelivery = (serviceDetails = {}) => {
    const val = serviceDetails.deliveryTime || serviceDetails.turnaround || serviceDetails.timeline;
    return val ? String(val) : "Flexible";
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
    const price = formatPrice(serviceDetails);
    const deliveryTime = formatDelivery(serviceDetails);

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
        <div>
            <Card className="overflow-hidden rounded-3xl border border-border/40 bg-card/70 backdrop-blur-xl shadow-2xl shadow-black/10">
                {/* Price header strip */}
                <div className="px-6 pt-6 pb-5 border-b border-border/40">
                    {price.label && (
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">
                            {price.label}
                        </p>
                    )}
                    <p className="text-3xl font-extrabold tracking-tight text-foreground">{price.value}</p>

                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground font-medium">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <span>{deliveryTime} delivery</span>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="p-5 space-y-3">
                    <Button
                        size="lg"
                        className="w-full h-13 rounded-2xl text-base font-bold tracking-tight shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 gap-2"
                        onClick={handleCTAClick}
                        aria-label="Contact freelancer about this service"
                    >
                        <Zap className="w-4 h-4" />
                        Contact Freelancer
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                            "w-full h-11 rounded-2xl text-sm font-semibold border border-border/50 gap-2 transition-all",
                            copied && "border-emerald-500/50 text-emerald-600 bg-emerald-500/5"
                        )}
                        onClick={handleShare}
                        aria-label="Share this service link"
                    >
                        {copied ? <CheckCheck className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        {copied ? "Copied!" : "Share Service"}
                    </Button>
                </div>

                {/* Trust indicators */}
                <div className="px-5 pb-5">
                    <div className="w-full bg-muted/30 rounded-2xl p-4 space-y-2.5">
                        {[
                            "✓ Response within 24 hours",
                            "✓ 100% satisfaction guarantee",
                            "✓ Secure payments",
                        ].map((point, i) => (
                            <p key={i} className="text-xs text-muted-foreground font-medium">
                                {point}
                            </p>
                        ))}
                    </div>
                </div>
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
