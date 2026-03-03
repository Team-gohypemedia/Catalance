import React, { useState } from "react";
import { UserMinus, Pause, Send, CheckCircle2, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FreelancerReassignStepper = ({
    open,
    onOpenChange,
    onPauseProject,
    onRemoveFreelancer,
    onInviteReplacement,
    currentFreelancer,
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    const handlePause = async () => {
        setLoading(true);
        await onPauseProject();
        setLoading(false);
        setStep(2);
    };

    const handleRemove = async () => {
        setLoading(true);
        await onRemoveFreelancer();
        setLoading(false);
        setStep(3);
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setLoading(true);
        await onInviteReplacement(inviteEmail);
        setLoading(false);
        setStep(4);
    };

    const resetAndClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep(1);
            setInviteEmail("");
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reassign Freelancer</DialogTitle>
                    <DialogDescription>
                        Safely transition this project to a new freelancer while keeping history.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Pause Project */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                                <Pause className="h-8 w-8 text-orange-500" />
                                <div>
                                    <h4 className="font-semibold text-sm">Step 1: Pause Project</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Stop new work to safely transition the project.
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handlePause} disabled={loading} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Pause Project
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Remove Freelancer */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <UserMinus className="h-8 w-8 text-red-500" />
                                <div>
                                    <h4 className="font-semibold text-sm text-red-500">
                                        Step 2: Unassign Current Freelancer
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        {currentFreelancer?.fullName || "The current freelancer"} will be removed from this project. Chat and tasks will remain intact.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={handleRemove}
                                disabled={loading}
                                className="w-full"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Remove Freelancer
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Invite Replacement */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <Send className="h-8 w-8 text-blue-500" />
                                <div>
                                    <h4 className="font-semibold text-sm text-blue-500">Step 3: Invite Replacement</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Send an invitation to a new freelancer to take over this project.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inviteEmail">Freelancer Email</Label>
                                <Input
                                    id="inviteEmail"
                                    placeholder="freelancer@example.com"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleInvite}
                                disabled={loading || !inviteEmail.trim()}
                                className="w-full"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Success Component */}
                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-6 animate-in zoom-in-95 duration-300">
                            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Reassignment Complete</h3>
                                <p className="text-sm text-muted-foreground">
                                    Invitation sent. The project is awaiting the new freelancer.
                                </p>
                            </div>
                            <Button onClick={resetAndClose} className="w-full mt-4">
                                Done
                            </Button>
                        </div>
                    )}
                </div>

                {step < 4 && (
                    <div className="flex justify-center gap-1 mt-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 w-6 rounded-full transition-colors ${s === step ? "bg-primary" : s < step ? "bg-primary/40" : "bg-border"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
