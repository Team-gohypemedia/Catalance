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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const FreelancerReassignStepper = ({
    open,
    onOpenChange,
    onPauseProject,
    onRemoveFreelancer,
    onAssignReplacement,
    currentFreelancer,
    freelancers = [],
    loadingFreelancers = false,
    requestContext = null,
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedFreelancerId, setSelectedFreelancerId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [skillFilter, setSkillFilter] = useState("");
    const [minRating, setMinRating] = useState("0");
    const [minExperience, setMinExperience] = useState("0");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");

    const handlePause = async () => {
        setLoading(true);
        try {
            await onPauseProject();
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            await onRemoveFreelancer();
            setStep(3);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedFreelancerId) return;
        setLoading(true);
        try {
            await onAssignReplacement(selectedFreelancerId);
            setStep(4);
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setStep(1);
            setSelectedFreelancerId("");
            setSearchTerm("");
            setSkillFilter("");
            setMinRating("0");
            setMinExperience("0");
            setAvailabilityFilter("all");
        }, 300);
    };

    const availableFreelancers = Array.isArray(freelancers)
        ? freelancers
            .filter((freelancer) => freelancer?.id !== currentFreelancer?.id)
            .filter((freelancer) => {
                const name = String(freelancer?.fullName || "").toLowerCase();
                const email = String(freelancer?.email || "").toLowerCase();
                const search = searchTerm.trim().toLowerCase();
                if (search && !name.includes(search) && !email.includes(search)) {
                    return false;
                }

                const requiredSkill = skillFilter.trim().toLowerCase();
                if (requiredSkill) {
                    const skills = Array.isArray(freelancer?.skills)
                        ? freelancer.skills
                        : [];
                    const hasSkill = skills.some((skill) =>
                        String(skill || "").toLowerCase().includes(requiredSkill)
                    );
                    if (!hasSkill) return false;
                }

                const ratingValue = Number(freelancer?.rating || 0);
                const experienceValue = Number(freelancer?.experienceYears || 0);
                if (ratingValue < Number(minRating || 0)) return false;
                if (experienceValue < Number(minExperience || 0)) return false;

                if (availabilityFilter === "available" && freelancer?.available === false) {
                    return false;
                }

                return true;
            })
        : [];

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
                    {requestContext?.reason && (
                        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                                Client Request
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                                {requestContext.reason}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Request {requestContext.requestNumber || 1} of {requestContext.maxRequests || 2}
                            </p>
                        </div>
                    )}

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
                                    <h4 className="font-semibold text-sm text-blue-500">Step 3: Assign Replacement</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Assign a suitable freelancer to take over this project.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Select Freelancer</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Search by name/email"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                    <Input
                                        placeholder="Filter by skill"
                                        value={skillFilter}
                                        onChange={(event) => setSkillFilter(event.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Select value={minRating} onValueChange={setMinRating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Min rating" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Any Rating</SelectItem>
                                            <SelectItem value="3">3+ Rating</SelectItem>
                                            <SelectItem value="4">4+ Rating</SelectItem>
                                            <SelectItem value="4.5">4.5+ Rating</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={minExperience} onValueChange={setMinExperience}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Any Exp</SelectItem>
                                            <SelectItem value="1">1+ Years</SelectItem>
                                            <SelectItem value="3">3+ Years</SelectItem>
                                            <SelectItem value="5">5+ Years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Availability" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="available">Available Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Select
                                    value={selectedFreelancerId}
                                    onValueChange={setSelectedFreelancerId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                loadingFreelancers ? "Loading freelancers..." : "Choose a freelancer"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableFreelancers.map((freelancer) => (
                                            <SelectItem key={freelancer.id} value={freelancer.id}>
                                                {freelancer.fullName} ({freelancer.email}) | Rating {Number(freelancer.rating || 0).toFixed(1)} | {Number(freelancer.experienceYears || 0)}y
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!loadingFreelancers && availableFreelancers.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No replacement freelancers are available right now.
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleAssign}
                                disabled={loading || loadingFreelancers || !selectedFreelancerId}
                                className="w-full"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Assign Freelancer
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
                                    The replacement freelancer has been assigned and the project team has been notified.
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
