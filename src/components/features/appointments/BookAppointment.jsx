import React, { useEffect, useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import User from "lucide-react/dist/esm/icons/user";
import Check from "lucide-react/dist/esm/icons/check";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import format from "date-fns/format";
import { cn } from "@/shared/lib/utils";

const formatTime = (hour) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
};

const BookAppointment = ({
    isOpen,
    onClose,
    projectId = null,
    projectTitle = null,
    onSuccess = () => { }
}) => {
    const { authFetch, user } = useAuth();
    const [step, setStep] = useState(1);
    const [managers, setManagers] = useState([]);
    const [selectedManager, setSelectedManager] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedManager(null);
            setSelectedDate(null);
            setSelectedSlot(null);
            setTitle("");
            setDescription("");
            setAvailableSlots([]);
            fetchManagers();
        }
    }, [isOpen]);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/appointments/managers");
            const data = await res.json();
            if (res.ok) {
                setManagers(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedManager || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await authFetch(`/appointments/slots?managerId=${selectedManager.id}&date=${dateStr}`);
            const data = await res.json();
            if (res.ok) {
                setAvailableSlots(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (selectedManager && selectedDate) {
            fetchAvailableSlots();
            setSelectedSlot(null);
        }
    }, [selectedManager, selectedDate]);

    const handleSubmit = async () => {
        if (!selectedManager || !selectedDate || !selectedSlot || !title.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const res = await authFetch("/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    managerId: selectedManager.id,
                    date: format(selectedDate, "yyyy-MM-dd"),
                    startHour: selectedSlot.startHour,
                    endHour: selectedSlot.endHour,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    projectId: projectId || undefined
                })
            });

            if (res.ok) {
                toast.success("Appointment request sent! Waiting for manager approval.");
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to book appointment");
            }
        } catch (e) {
            toast.error("Error booking appointment");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return selectedManager;
        if (step === 2) return selectedDate && selectedSlot;
        if (step === 3) return title.trim();
        return false;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Book an Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a meeting with a project manager
                        {projectTitle && <span className="block mt-1 text-primary">Project: {projectTitle}</span>}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 py-2">
                    {[1, 2, 3].map((s) => (
                        <React.Fragment key={s}>
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <Check className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={cn(
                                    "flex-1 h-0.5",
                                    step > s ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="py-4 space-y-4">
                    {/* Step 1: Select Manager */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <Label>Select a Project Manager</Label>
                            {loading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin h-6 w-6" />
                                </div>
                            ) : managers.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                                    <p>No managers available</p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {managers.map(manager => (
                                        <Card
                                            key={manager.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:border-primary",
                                                selectedManager?.id === manager.id && "border-primary bg-primary/5"
                                            )}
                                            onClick={() => setSelectedManager(manager)}
                                        >
                                            <CardContent className="flex items-center gap-3 p-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{manager.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                                                </div>
                                                {selectedManager?.id === manager.id && (
                                                    <Check className="h-5 w-5 text-primary" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Select Date & Time */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Select Date</Label>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        className="rounded-md border"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Available Time Slots</Label>
                                    {!selectedDate ? (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            Please select a date first
                                        </div>
                                    ) : loadingSlots ? (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="animate-spin h-6 w-6" />
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                                            <p>No available slots for this date</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                            {availableSlots.map(slot => (
                                                <Button
                                                    key={slot.id}
                                                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                                    className="w-full justify-start gap-2"
                                                    onClick={() => setSelectedSlot(slot)}
                                                >
                                                    <Clock className="h-4 w-4" />
                                                    {formatTime(slot.startHour)} - {formatTime(slot.endHour)}
                                                    {selectedSlot?.id === slot.id && <Check className="ml-auto h-4 w-4" />}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enter Details */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                                <p><strong>Manager:</strong> {selectedManager?.fullName}</p>
                                <p><strong>Date:</strong> {format(selectedDate, "EEEE, MMM d, yyyy")}</p>
                                <p><strong>Time:</strong> {formatTime(selectedSlot?.startHour)} - {formatTime(selectedSlot?.endHour)}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Meeting Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Project Discussion, Dispute Resolution"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe the purpose of this meeting..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step > 1 && (
                        <Button variant="outline" onClick={() => setStep(step - 1)}>
                            Back
                        </Button>
                    )}
                    {step < 3 ? (
                        <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BookAppointment;
