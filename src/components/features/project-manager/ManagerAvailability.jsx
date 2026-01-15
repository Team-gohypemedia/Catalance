import React, { useEffect, useState } from "react";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Check from "lucide-react/dist/esm/icons/check";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import format from "date-fns/format";
import addDays from "date-fns/addDays";
import startOfDay from "date-fns/startOfDay";
import { cn } from "@/shared/lib/utils";

const TIME_SLOTS = [
    { start: 9, end: 10, label: "9:00 AM - 10:00 AM" },
    { start: 10, end: 11, label: "10:00 AM - 11:00 AM" },
    { start: 11, end: 12, label: "11:00 AM - 12:00 PM" },
    { start: 12, end: 13, label: "12:00 PM - 1:00 PM" },
    { start: 13, end: 14, label: "1:00 PM - 2:00 PM" },
    { start: 14, end: 15, label: "2:00 PM - 3:00 PM" },
    { start: 15, end: 16, label: "3:00 PM - 4:00 PM" },
    { start: 16, end: 17, label: "4:00 PM - 5:00 PM" },
    { start: 17, end: 18, label: "5:00 PM - 6:00 PM" },
    { start: 18, end: 19, label: "6:00 PM - 7:00 PM" },
];

const formatTime = (hour) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
};

const ManagerAvailabilityContent = () => {
    const { authFetch, user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlots, setSelectedSlots] = useState([]); // Array of startHours
    const [slotConfig, setSlotConfig] = useState({}); // { [hour]: { isEnabled, remark, isBooked } }
    const [existingSlots, setExistingSlots] = useState([]);
    const [allAvailability, setAllAvailability] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dialog state for disabling
    const [disableDialog, setDisableDialog] = useState({ open: false, hour: null });
    const [remarkText, setRemarkText] = useState("");

    // Fetch availability for the selected date
    const fetchAvailability = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await authFetch(`/appointments/availability?managerId=${user.id}&startDate=${dateStr}&endDate=${dateStr}`);
            const data = await res.json();
            if (res.ok) {
                const slots = data.data || [];
                setExistingSlots(slots);

                // Merge DB slots with Default slots to ensure all are shown
                const hours = [];
                const config = {};

                // 1. Initialize with all standard slots as ENABLED
                TIME_SLOTS.forEach(slot => {
                    hours.push(slot.start);
                    config[slot.start] = { isEnabled: true, remark: "", isBooked: false };
                });

                // 2. Override with DB data
                slots.forEach(s => {
                    // Check if this DB slot corresponds to one of our standard slots (or if we want to show non-std ones too)
                    if (!hours.includes(s.startHour)) {
                        hours.push(s.startHour);
                    }

                    config[s.startHour] = {
                        isEnabled: s.isEnabled ?? true,
                        remark: s.remark || "",
                        isBooked: s.isBooked
                    };
                });

                // Sort hours to keep UI tidy
                hours.sort((a, b) => a - b);

                setSelectedSlots(hours);
                setSlotConfig(config);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch ALL availability for the next 30 days
    const fetchAllAvailability = async () => {
        if (!user?.id) return;
        setLoadingAll(true);
        try {
            const today = format(startOfDay(new Date()), "yyyy-MM-dd");
            const futureDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
            const res = await authFetch(`/appointments/availability?managerId=${user.id}&startDate=${today}&endDate=${futureDate}`);
            const data = await res.json();
            if (res.ok) {
                setAllAvailability(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAll(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, [selectedDate, user?.id]);

    useEffect(() => {
        fetchAllAvailability();
    }, [user?.id]);

    const handleSlotClick = (startHour) => {
        const isSelected = selectedSlots.includes(startHour);
        const config = slotConfig[startHour] || {};

        // If booked, do nothing or show toast
        if (config.isBooked) {
            toast.error("This slot is already booked and cannot be modified");
            return;
        }

        // It is always selected now basically.
        // If Enabled -> Click to Disable
        if (config.isEnabled !== false) {
            setRemarkText(config.remark || "");
            setDisableDialog({ open: true, hour: startHour });
        } else {
            // If Disabled -> Click to Enable
            setSlotConfig(prev => ({
                ...prev,
                [startHour]: { ...prev[startHour], isEnabled: true, remark: "" }
            }));
        }
    };

    const confirmDisable = () => {
        if (disableDialog.hour === null) return;

        setSlotConfig(prev => ({
            ...prev,
            [disableDialog.hour]: {
                ...prev[disableDialog.hour],
                isEnabled: false,
                remark: remarkText
            }
        }));
        setDisableDialog({ open: false, hour: null });
        setRemarkText("");
        toast.info("Slot marked as unavailable. Don't forget to Save.");
    };

    const applyStandardSchedule = () => {
        const standardHours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9 to 5 (17:00 end)
        const newSlots = [...selectedSlots];
        const newConfig = { ...slotConfig };

        standardHours.forEach(h => {
            // Only add if not booked
            const isBooked = existingSlots.find(s => s.startHour === h)?.isBooked;
            if (!isBooked) {
                if (!newSlots.includes(h)) newSlots.push(h);
                newConfig[h] = { isEnabled: true, remark: "", isBooked: false };
            }
        });

        setSelectedSlots(newSlots);
        setSlotConfig(newConfig);
        toast.success("Applied 9 AM - 5 PM schedule");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const slots = selectedSlots.map(startHour => ({
                startHour,
                endHour: startHour + 1,
                isEnabled: slotConfig[startHour]?.isEnabled ?? true,
                remark: slotConfig[startHour]?.remark || ""
            }));

            const res = await authFetch("/appointments/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(selectedDate, "yyyy-MM-dd"),
                    slots
                })
            });

            if (res.ok) {
                toast.success("Availability saved successfully");
                fetchAvailability();
                fetchAllAvailability();
            } else {
                toast.error("Failed to save availability");
            }
        } catch (e) {
            toast.error("Error saving availability");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    // Group all availability by date for summary
    const groupedAvailability = allAvailability.reduce((acc, slot) => {
        const dateKey = format(new Date(slot.date), "yyyy-MM-dd");
        if (!acc[dateKey]) {
            acc[dateKey] = { date: new Date(slot.date), slots: [] };
        }
        acc[dateKey].slots.push(slot);
        return acc;
    }, {});

    // Convert to array and sort by date
    const sortedAvailability = Object.values(groupedAvailability)
        .sort((a, b) => a.date - b.date);

    // Calculate stats based on CURRENT selection/view
    const currentTotalSlots = selectedSlots.length;
    const currentBookedSlots = selectedSlots.filter(h => slotConfig[h]?.isBooked).length;
    const currentAvailableSlots = selectedSlots.filter(h => slotConfig[h]?.isEnabled !== false && !slotConfig[h]?.isBooked).length;

    return (
        <div className="flex flex-col min-h-screen w-full">
            <ManagerTopBar />
            <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
                    <p className="text-muted-foreground mt-1">Manage your appointment slots and exceptions.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-primary">{currentTotalSlots}</div>
                            <p className="text-sm text-muted-foreground">Slots for {format(selectedDate, 'MMM d')}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{currentAvailableSlots}</div>
                            <p className="text-sm text-muted-foreground">Active & Available</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-amber-600">{currentBookedSlots}</div>
                            <p className="text-sm text-muted-foreground">Booked</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Select Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    {/* Time Slots for Selected Date */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Slots for {format(selectedDate, "MMM d, yyyy")}
                                </CardTitle>
                                <CardDescription>
                                    Click a standard slot to add/disable it.
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={applyStandardSchedule}>
                                <Check className="w-4 h-4 mr-2" />
                                Apply 9-5
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {TIME_SLOTS.map((slot) => {
                                            const isSelected = selectedSlots.includes(slot.start);
                                            const config = slotConfig[slot.start] || {};
                                            const isBooked = config.isBooked;
                                            const isEnabled = config.isEnabled !== false;
                                            // If not in config (but selected), default enabled.

                                            let variant = "outline";
                                            if (isSelected) {
                                                if (isBooked) variant = "secondary"; // booked
                                                else if (!isEnabled) variant = "destructive"; // disabled
                                                else variant = "default"; // available
                                            }

                                            return (
                                                <div key={slot.start} className="relative group">
                                                    <Button
                                                        variant={variant === 'default' ? 'default' : 'outline'}
                                                        className={cn(
                                                            "w-full justify-between h-auto py-3 px-3 relative",
                                                            variant === 'destructive' && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                                                            variant === 'secondary' && "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 opacity-80 cursor-not-allowed",
                                                            // !isSelected && "opacity-70 hover:opacity-100" // No longer needed
                                                        )}
                                                        onClick={() => handleSlotClick(slot.start)}
                                                        disabled={isBooked}
                                                    >
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="text-xs font-bold">{slot.label.split(' - ')[0]}</span>
                                                            <span className="text-[10px] font-normal opacity-90">{slot.label.split(' - ')[1]}</span>
                                                        </div>
                                                        {isSelected && !isEnabled && !isBooked && (
                                                            <Badge variant="outline" className="text-[10px] border-red-300 bg-red-100 text-red-800">
                                                                Off
                                                            </Badge>
                                                        )}
                                                        {isSelected && isEnabled && !isBooked && (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                    </Button>

                                                    {isSelected && !isEnabled && config.remark && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 z-10 w-48 z-20">
                                                            <div className="bg-popover text-popover-foreground text-[10px] p-2 rounded border shadow-lg truncate">
                                                                Note: {config.remark}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button onClick={handleSave} disabled={saving}>
                                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Availability
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Saved Availability Summary */}
                    <Card className="lg:row-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                My Saved Availability
                            </CardTitle>
                            <CardDescription>
                                Your availability for the next 30 days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingAll ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            ) : sortedAvailability.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No availability set yet</p>
                                    <p className="text-xs mt-1">Select a date and add time slots</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {sortedAvailability.map(({ date, slots }) => (
                                        <div
                                            key={format(date, "yyyy-MM-dd")}
                                            className={cn(
                                                "p-3 rounded-lg border transition-colors",
                                                format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium text-sm">
                                                    {format(date, "EEEE, MMM d")}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => setSelectedDate(date)}
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {slots
                                                    .sort((a, b) => a.startHour - b.startHour)
                                                    .map((slot) => (
                                                        <Badge
                                                            key={slot.id}
                                                            variant={slot.isBooked ? "secondary" : "outline"}
                                                            className={cn(
                                                                "text-[10px]",
                                                                slot.isBooked
                                                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                                                    : (slot.isEnabled === false
                                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                                        : "bg-green-50 text-green-700 border-green-200")
                                                            )}
                                                        >
                                                            {formatTime(slot.startHour)}
                                                            {slot.isBooked && " (Booked)"}
                                                            {slot.isEnabled === false && " (Off)"}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground justify-center pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-primary" />
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border" />
                        <span>Not Set</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            Available
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                            Disabled (Remark)
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                            Booked
                        </Badge>
                    </div>
                </div>

                {disableDialog.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <Card className="w-full max-w-md mx-4 shadow-lg">
                            <CardHeader>
                                <CardTitle>Disable Time Slot</CardTitle>
                                <CardDescription>
                                    Why are you unavailable at {formatTime(disableDialog.hour)}?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. Lunch break, Meeting, Personal time..."
                                    value={remarkText}
                                    onChange={(e) => setRemarkText(e.target.value)}
                                    autoFocus
                                />
                            </CardContent>
                            <div className="flex items-center p-6 pt-0 gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setDisableDialog({ open: false, hour: null })}>
                                    Cancel
                                </Button>
                                <Button onClick={confirmDisable} disabled={!remarkText.trim()}>
                                    Confirm Disable
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManagerAvailability = () => (
    <RoleAwareSidebar>
        <ManagerAvailabilityContent />
    </RoleAwareSidebar>
);

export default ManagerAvailability;
