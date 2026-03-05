import { useState, useEffect } from "react";
import { Star, MessageCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ReviewsList = ({ serviceId, initialStats }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(initialStats || { averageRating: 0, reviewCount: 0 });
    const [loading, setLoading] = useState(true);

    const [newReview, setNewReview] = useState({ clientName: "", rating: 5, comment: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { API_BASE_URL } = await import("@/shared/lib/api-client");
            const res = await fetch(`${API_BASE_URL}/marketplace/${serviceId}/reviews?limit=10`);
            if (res.ok) {
                const json = await res.json();
                setReviews(json.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (serviceId) fetchReviews();
    }, [serviceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const { API_BASE_URL } = await import("@/shared/lib/api-client");
            const res = await fetch(`${API_BASE_URL}/marketplace/${serviceId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReview)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to submit review");
            }

            const json = await res.json();
            setReviews(prev => [json.data, ...prev]);

            // Recompute stats locally for instant feedback
            const totalRating = (stats.averageRating * stats.reviewCount) + json.data.rating;
            const newCount = stats.reviewCount + 1;
            setStats({
                averageRating: Number((totalRating / newCount).toFixed(1)),
                reviewCount: newCount
            });

            setNewReview({ clientName: "", rating: 5, comment: "" });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <section className="space-y-8 pt-8 border-t border-border/30">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Client Reviews</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 rounded-full text-sm font-semibold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{stats.averageRating} ({stats.reviewCount})</span>
                </div>
            </div>

            {/* Write a Review */}
            <form onSubmit={handleSubmit} className="bg-card/30 p-5 rounded-2xl border border-border/50 space-y-4">
                <h3 className="font-semibold mb-2">Leave a Review</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Name</label>
                        <Input
                            required
                            placeholder="John Doe"
                            value={newReview.clientName}
                            onChange={e => setNewReview(p => ({ ...p, clientName: e.target.value }))}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Rating (1-5)</label>
                        <div className="flex items-center h-10 gap-1 bg-background/50 px-3 rounded-md border border-input">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview(p => ({ ...p, rating: star }))}
                                    className="p-1 focus:outline-none hover:scale-110 transition-transform"
                                >
                                    <Star className={`w-5 h-5 ${newReview.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-border fill-transparent'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Review</label>
                    <Textarea
                        required
                        minLength={5}
                        placeholder="Share your experience..."
                        value={newReview.comment}
                        onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                        className="bg-background/50 min-h-[100px] resize-none"
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex justify-end">
                    <Button type="submit" disabled={submitting} className="rounded-full px-6">
                        {submitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Post Review
                    </Button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 border border-border/30 border-dashed rounded-2xl flex flex-col items-center">
                        <MessageCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
                        <h4 className="font-medium text-foreground">No reviews yet</h4>
                        <p className="text-sm text-muted-foreground">Be the first to share your experience!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reviews.map(review => (
                            <div key={review.id} className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner">
                                            {review.clientName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm leading-none">{review.clientName}</h4>
                                            <span className="text-[10px] text-muted-foreground font-medium">{formatDate(review.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-border fill-transparent'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-10">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ReviewsList;
