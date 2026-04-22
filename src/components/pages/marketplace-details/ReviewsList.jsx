import { useState, useEffect, useCallback } from "react";
import { Star, MessageCircle, Loader2, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/shared/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";


const StarSelector = ({ value, onChange }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="focus:outline-none p-0.5 hover:scale-110 transition-transform"
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
                <Star
                    className={cn(
                        "w-6 h-6 transition-colors",
                        value >= star ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-border"
                    )}
                />
            </button>
        ))}
    </div>
);

const ReviewCard = ({ review }) => {
    const formatDate = (d) =>
        new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const initials = review.clientName?.charAt(0)?.toUpperCase() || "?";

    return (
        <div className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center ring-2 ring-background shrink-0">
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-foreground leading-none">{review.clientName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                "w-3.5 h-3.5",
                                review.rating >= star ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-border"
                            )}
                        />
                    ))}
                </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
        </div>
    );
};

const ReviewsList = ({ serviceId, initialStats }) => {
    const { isAuthenticated, user, authFetch } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(initialStats || { averageRating: 0, reviewCount: 0 });
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ rating: 5, comment: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [reviewEligibility, setReviewEligibility] = useState({
        canReview: false,
        hasExistingReview: false,
        reason: null,
    });

    const isClientUser =
        String(user?.role || "").toUpperCase() === "CLIENT" ||
        (Array.isArray(user?.roles) && user.roles.some((role) => String(role || "").toUpperCase() === "CLIENT"));

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const { API_BASE_URL } = await import("@/shared/lib/api-client");
            const res = await fetch(`${API_BASE_URL}/marketplace/${serviceId}/reviews?limit=20`);
            if (res.ok) {
                const json = await res.json();
                setReviews(json.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        } finally {
            setLoading(false);
        }
    }, [serviceId]);

    const fetchReviewEligibility = useCallback(async () => {
        if (!isAuthenticated || !isClientUser || !authFetch || !serviceId) {
            setReviewEligibility({
                canReview: false,
                hasExistingReview: false,
                reason: !isAuthenticated
                    ? "Please log in as a client to post a review."
                    : !isClientUser
                        ? "Only clients can post reviews."
                        : "Authentication required",
            });
            return;
        }

        setEligibilityLoading(true);
        try {
            const response = await authFetch(`/marketplace/${serviceId}/reviews/eligibility`, {
                suppressToast: true,
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.message || "Failed to verify review eligibility.");
            }

            const data = payload?.data || {};
            setReviewEligibility({
                canReview: Boolean(data.canReview),
                hasExistingReview: Boolean(data.hasExistingReview),
                reason: data.reason || null,
            });
        } catch (err) {
            console.error("Failed to fetch review eligibility:", err);
            setReviewEligibility({
                canReview: false,
                hasExistingReview: false,
                reason: err?.message || "Unable to verify eligibility right now.",
            });
        } finally {
            setEligibilityLoading(false);
        }
    }, [authFetch, isAuthenticated, isClientUser, serviceId]);

    useEffect(() => {
        if (serviceId) fetchReviews();
    }, [fetchReviews, serviceId]);

    useEffect(() => {
        if (!serviceId) return;
        fetchReviewEligibility();
    }, [fetchReviewEligibility, serviceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            if (!authFetch) {
                throw new Error("Authentication required");
            }

            if (!reviewEligibility.canReview) {
                throw new Error(reviewEligibility.reason || "You are not eligible to post this review.");
            }

            const res = await authFetch(`/marketplace/${serviceId}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
                suppressToast: true,
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.message || "Failed to post review");
            }

            setReviews((prev) => {
                const incomingReview = json?.data;
                if (!incomingReview?.id) return prev;

                const existingIndex = prev.findIndex((review) => review.id === incomingReview.id);
                if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = incomingReview;
                    return next;
                }
                return [incomingReview, ...prev];
            });

            if (json?.meta) {
                setStats({
                    averageRating: Number(json.meta.averageRating) || 0,
                    reviewCount: Number(json.meta.reviewCount) || 0,
                });
            }

            setForm({ rating: 5, comment: "" });
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
            fetchReviewEligibility();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="reviews-section" className="space-y-6 bg-card/50 border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                        Client Reviews
                    </h2>
                </div>
                {stats.reviewCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {stats.averageRating}
                        <span className="text-muted-foreground font-normal">({stats.reviewCount})</span>
                    </div>
                )}
            </div>

            {/* Aggregate Rating Summary bar — only when reviews exist */}
            {stats.reviewCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-yellow-400/5 border border-yellow-400/15">
                    {/* Big score */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                        <span className="text-5xl font-extrabold text-foreground tracking-tight">{stats.averageRating}</span>
                        <div className="flex gap-0.5" aria-label={`Average rating: ${stats.averageRating} out of 5`}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={cn("w-4 h-4", stats.averageRating >= s ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-border")} />
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{stats.reviewCount} {stats.reviewCount === 1 ? "review" : "reviews"}</span>
                    </div>
                    {/* Bar breakdown per star (computed from current reviews array) */}
                    <div className="flex-1 w-full space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = reviews.filter(r => r.rating === star).length;
                            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-2 text-xs">
                                    <span className="w-4 text-right text-muted-foreground font-medium shrink-0">{star}</span>
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" aria-hidden="true" />
                                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-8 text-muted-foreground shrink-0">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-border/40 bg-muted/10 p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    Leave a Review
                </h3>

                {submitted ? (
                    <div className="py-6 text-center flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                            <Star className="w-6 h-6 text-emerald-500 fill-emerald-500" />
                        </div>
                        <p className="font-semibold text-sm">Thank you for your review!</p>
                        <p className="text-xs text-muted-foreground">Your feedback helps others discover great services.</p>
                    </div>
                ) : !isAuthenticated ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-3 bg-background/30 rounded-2xl border border-dashed border-border/50">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Members Only</p>
                            <p className="text-xs text-muted-foreground mt-1 px-4 text-balance">Please log in to share your experience and rate this service.</p>
                        </div>
                        <Button
                            className="mt-2 rounded-xl h-10 px-6 font-semibold"
                            onClick={() => {
                                const returnPath = location.pathname;
                                navigate(`/login?redirect=${encodeURIComponent(returnPath)}&openReview=1`);
                            }}
                        >
                            Log in to review
                        </Button>
                    </div>
                ) : eligibilityLoading ? (
                    <div className="py-8 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking review eligibility...
                    </div>
                ) : !isClientUser ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-3 bg-background/30 rounded-2xl border border-dashed border-border/50">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Client access required</p>
                            <p className="text-xs text-muted-foreground mt-1 px-4 text-balance">
                                Only logged-in clients can post freelancer reviews.
                            </p>
                        </div>
                    </div>
                ) : !reviewEligibility.canReview ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-3 bg-background/30 rounded-2xl border border-dashed border-border/50">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Review unavailable</p>
                            <p className="text-xs text-muted-foreground mt-1 px-4 text-balance">
                                {reviewEligibility.reason || "You can review this freelancer only after working with them."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your Name</label>
                                <Input
                                    readOnly
                                    value={user?.fullName || "Member"}
                                    className="bg-muted/40 h-10 rounded-xl border-border/50 text-muted-foreground cursor-not-allowed font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Rating</label>
                                <div className="flex items-center h-10">
                                    <StarSelector value={form.rating} onChange={(r) => setForm((p) => ({ ...p, rating: r }))} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your Review</label>
                            <Textarea
                                required
                                minLength={5}
                                placeholder="Describe your experience working with this freelancer..."
                                value={form.comment}
                                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                                className="bg-background/60 min-h-[100px] resize-none rounded-xl border-border/50"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={submitting || !form.comment.trim()}
                                className="rounded-xl gap-2 px-5"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
                                ) : (
                                    <><Send className="w-4 h-4" /> Post Review</>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Reviews List */}
            <div>
                {loading ? (
                    <div className="flex justify-center items-center py-10 gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-5 h-5 animate-spin" /> Loading reviews…
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/40 bg-muted/10 text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                            <Star className="w-7 h-7 text-yellow-400/60" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground">No reviews yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Be the first to share your experience with this service.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ReviewsList;
