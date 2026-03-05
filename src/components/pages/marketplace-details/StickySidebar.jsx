import { useState } from "react";
import { Clock, Send, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const StickySidebar = ({ service, onShare }) => {
    const { serviceDetails = {} } = service;

    const startingPrice = service.startingPrice || serviceDetails.minBudget || serviceDetails.price || 0;
    const deliveryTime = service.deliveryTime || serviceDetails.deliveryTime || "3-5 Days";

    // Derived states
    const priceDisplay = startingPrice > 0 ? `Starts at ₹${startingPrice.toLocaleString('en-IN')}` : "Contact for Pricing";

    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [message, setMessage] = useState(`Hi, I am interested in your ${service.service || "service"}...`);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            // Using standard app chat integration endpoint. (We assume the user is logged in if they click this)
            // Or this will just redirect them to login implicitly through an app error/interceptor.
            const { API_BASE_URL } = await import("@/shared/lib/api-client");
            // The chat payload expects service reference (as PRD required)
            const payload = {
                content: message,
                service: `CHAT:${service.id}:${service.freelancerId}`, // Appended custom relation if standard chat endpoint handles it. 
                projectTitle: `Inquiry: ${service.service}`
            };

            // Using existing POST /api/chat route to initiate or add 
            const token = localStorage.getItem("freelancer-auth-token"); // standard fallback

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                if (response.status === 401) {
                    alert("Please login first to send a message.");
                } else {
                    throw new Error(err.message || "Failed to send message");
                }
            } else {
                alert("Message sent successfully! The freelancer will reach out to you shortly.");
                setIsChatModalOpen(false);
            }
        } catch (error) {
            console.error("Chat Send Error:", error);
            alert("Unable to send message. Please ensure you are logged in.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="sticky top-24">
            <Card className="p-6 shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-xl border border-primary/10 rounded-3xl space-y-6">
                <div>
                    <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{priceDisplay}</h3>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-muted-foreground font-medium bg-muted/30 p-3 rounded-2xl">
                        <Clock className="w-5 h-5 text-primary/70" />
                        <span>{deliveryTime} Delivery</span>
                    </div>
                </div>

                <div className="pt-2 space-y-3">
                    <Button
                        size="lg"
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform"
                        onClick={() => setIsChatModalOpen(true)}
                        aria-label="Contact Freelancer"
                    >
                        Contact Freelancer
                    </Button>

                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full h-12 rounded-2xl text-base font-semibold border border-transparent hover:border-border/50 bg-secondary/50"
                        onClick={onShare}
                        aria-label="Share Link"
                    >
                        <Share2 className="w-4 h-4 mr-2" /> Share Link
                    </Button>
                </div>
            </Card>

            <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Contact {service.freelancer?.fullName || "Freelancer"}</DialogTitle>
                        <DialogDescription>
                            Send a direct message regarding "{service.service}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none"
                            placeholder="Type your message here..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsChatModalOpen(false)}
                            disabled={sending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                        >
                            {sending ? "Sending..." : "Send Message"} <Send className="w-4 h-4 ml-2" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StickySidebar;
