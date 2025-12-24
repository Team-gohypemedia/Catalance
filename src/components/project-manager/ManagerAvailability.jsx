import React, { useEffect, useState } from "react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CalendarIcon, Clock, Trash2, Check, CalendarDays } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

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
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [existingSlots, setExistingSlots] = useState([]);
    const [allAvailability, setAllAvailability] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch availability for the selected date
    const fetchAvailability = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await authFetch(`/appointments/availability?managerId=${user.id}&startDate=${dateStr}&endDate=${dateStr}`);
            const data = await res.json();
            if (res.ok) {
                setExistingSlots(data.data || []);
                setSelectedSlots(data.data?.map(s => s.startHour) || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch ALL availability for the next 30 days
    const fetchAllAvailability = async () => {
        if (!user?.id) {
            console.log("No user ID available yet");
            return;
        }
        setLoadingAll(true);
        try {
            const today = format(startOfDay(new Date()), "yyyy-MM-dd");
            const futureDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
            const url = `/appointments/availability?managerId=${user.id}&startDate=${today}&endDate=${futureDate}`;
            console.log("Fetching all availability:", url);
            const res = await authFetch(url);
            const data = await res.json();
            console.log("All availability response:", res.ok, data);
            if (res.ok) {
                setAllAvailability(data.data || []);
            }
        } catch (e) {
            console.error("Error fetching all availability:", e);
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

    const toggleSlot = (startHour) => {
        // Check if this slot is already booked
        const existingSlot = existingSlots.find(s => s.startHour === startHour);
        if (existingSlot?.isBooked) {
            toast.error("This slot is already booked and cannot be modified");
            return;
        }

        setSelectedSlots(prev =>
            prev.includes(startHour)
                ? prev.filter(h => h !== startHour)
                : [...prev, startHour]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const slots = selectedSlots.map(startHour => ({
                startHour,
                endHour: startHour + 1
            }));

            console.log("Saving availability:", { date: format(selectedDate, "yyyy-MM-dd"), slots });

            const res = await authFetch("/appointments/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(selectedDate, "yyyy-MM-dd"),
                    slots
                })
            });

            const responseData = await res.json();
            console.log("Save response:", res.ok, responseData);

            if (res.ok) {
                toast.success("Availability saved successfully");
                fetchAvailability();
                fetchAllAvailability(); // Refresh the all availability view
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

    const isSlotBooked = (startHour) => {
        return existingSlots.find(s => s.startHour === startHour)?.isBooked || false;
    };

    // Group all availability by date
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

    // Count stats
    const totalSlots = allAvailability.length;
    const bookedSlots = allAvailability.filter(s => s.isBooked).length;
    const availableSlots = totalSlots - bookedSlots;

    return (
        <div className="flex flex-col min-h-screen w-full">
            <ManagerTopBar />
            <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
                    <p className="text-muted-foreground mt-1">Set your available time slots for appointments</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-primary">{totalSlots}</div>
                            <p className="text-sm text-muted-foreground">Total Slots Set</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{availableSlots}</div>
                            <p className="text-sm text-muted-foreground">Available</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-amber-600">{bookedSlots}</div>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Slots for {format(selectedDate, "MMM d, yyyy")}
                            </CardTitle>
                            <CardDescription>
                                Click on a time slot to toggle availability
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {TIME_SLOTS.map((slot) => {
                                            const isSelected = selectedSlots.includes(slot.start);
                                            const isBooked = isSlotBooked(slot.start);

                                            return (
                                                <Button
                                                    key={slot.start}
                                                    variant={isSelected ? "default" : "outline"}
                                                    size="sm"
                                                    disabled={isBooked}
                                                    onClick={() => toggleSlot(slot.start)}
                                                    className={cn(
                                                        "justify-start gap-2 h-auto py-3",
                                                        isBooked && "opacity-50 cursor-not-allowed bg-muted",
                                                        isSelected && !isBooked && "bg-primary text-primary-foreground"
                                                    )}
                                                >
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                    <span className="text-xs">{slot.label}</span>
                                                    {isBooked && (
                                                        <Badge variant="secondary" className="ml-auto text-[10px]">
                                                            Booked
                                                        </Badge>
                                                    )}
                                                </Button>
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
                                                                    : "bg-green-50 text-green-700 border-green-200"
                                                            )}
                                                        >
                                                            {formatTime(slot.startHour)}
                                                            {slot.isBooked && " (Booked)"}
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
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                            Booked
                        </Badge>
                    </div>
                </div>
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

