import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ManagerTopBar } from "./ManagerTopBar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Video from "lucide-react/dist/esm/icons/video";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import { Separator } from "@/components/ui/separator";

export const ProjectManagerDashboardContent = () => {
    const { authFetch, user } = useAuth();
    const [searchParams] = useSearchParams();
    const view = searchParams.get("view");
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Auto-collapse sidebar on smaller screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/disputes");
            const data = await res.json();
            if (res.ok) {
                setDisputes(data.data || []);
            } else {
                toast.error("Failed to load disputes");
            }
        } catch (e) {
            toast.error("Error loading disputes");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, [authFetch]);

    // Group disputes by status
    const openDisputes = disputes.filter(d => d.status === 'OPEN');
    const inProgressDisputes = disputes.filter(d => d.status === 'IN_PROGRESS');
    const resolvedDisputes = disputes.filter(d => d.status === 'RESOLVED');

    return (
        <div className="flex flex-col min-h-screen w-full">
            <ManagerTopBar />


            <div className="p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
                {/* Main Content Column */}
                <div className="flex-1 space-y-8 min-w-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Project Manager Dashboard</h1>
                            <p className="text-muted-foreground mt-1">overview of project resolutions</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden lg:flex"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            >
                                <Video className="w-4 h-4 mr-2" />
                                {isSidebarOpen ? "Hide Meetings" : "Show Meetings"}
                            </Button>
                            <Button onClick={fetchDisputes} variant="outline" size="sm" className="gap-2">
                                <Clock className="w-4 h-4" />
                                Refresh Data
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Overview Section */}
                            {!view && (
                                <>
                                    <PMOverview disputes={disputes} />
                                    <Separator />
                                </>
                            )}

                            {(!view || view === 'active-disputes') && (
                                <>
                                    {disputes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 rounded-xl bg-muted/30">
                                            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-medium">All Clear</h3>
                                            <p className="text-muted-foreground">No active projects found.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            <h2 id="active-disputes" className="text-xl font-semibold scroll-mt-20">Active Projects</h2>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {[...openDisputes, ...inProgressDisputes].length > 0 ? (
                                                    [...openDisputes, ...inProgressDisputes].map(dispute => (
                                                        <DisputeCard
                                                            key={dispute.id}
                                                            dispute={dispute}
                                                            onUpdate={fetchDisputes}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="col-span-full text-center p-10 text-muted-foreground bg-muted/20 rounded-lg">
                                                        No active projects.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {resolvedDisputes.length > 0 && (!view || view === 'resolved-history') && (
                                <div className="grid gap-6 mt-6">
                                    <h2 id="resolved-history" className="text-xl font-semibold mt-4 scroll-mt-20">Resolved Projects</h2>
                                    <div className="grid gap-4 md:grid-cols-2 opacity-80">
                                        {resolvedDisputes.map(dispute => (
                                            <DisputeCard
                                                key={dispute.id}
                                                dispute={dispute}
                                                onUpdate={fetchDisputes}
                                                readOnly={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column - Upcoming Meetings */}
                <div
                    className={`
                        transition-all duration-300 ease-in-out border-l
                        ${isSidebarOpen ? 'w-80 opacity-100 p-6' : 'w-0 opacity-0 p-0 overflow-hidden border-none'}
                        hidden lg:block
                    `}
                >
                    <div className="w-72"> {/* Fixed width container to prevent content squashing during transition */}
                        <UpcomingMeetingsSidebar disputes={disputes} />
                    </div>
                </div>

                {/* Mobile/Tablet View for Upcoming Meetings (always shown at bottom if enabled, or handle via separate UI) */}
                <div className="lg:hidden w-full space-y-6">
                    <Separator />
                    <UpcomingMeetingsSidebar disputes={disputes} />
                </div>
            </div>
        </div>
    );
};

const PMOverview = ({ disputes }) => {


    const resolvedCount = disputes.filter(d => d.status === 'RESOLVED').length;
    const pendingCount = disputes.filter(d => ['OPEN', 'IN_PROGRESS'].includes(d.status)).length;
    const totalCount = disputes.length;


    const metrics = [
        {
            label: "Active Projects",
            value: String(pendingCount),
            trend: "Requires attention",
            icon: AlertCircle,
        },

        {
            label: "Resolved Projects",
            value: String(resolvedCount),
            trend: "Successfully closed",
            icon: CheckCircle2,
        },

    ];

    return (
        <section className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                    <Card key={metric.label} className="border-dashed">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Icon className="size-4 text-primary" />
                                {metric.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-3xl font-semibold">{metric.value}</p>
                            <p className="text-sm text-muted-foreground">
                                {metric.trend}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";

const UpcomingMeetingsSidebar = ({ disputes }) => {
    const { authFetch } = useAuth();
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [loading, setLoading] = useState(false);
    const [meetingDate, setMeetingDate] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [platform, setPlatform] = useState("google");

    // Appointment State
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const res = await authFetch("/appointments");
            const data = await res.json();
            if (res.ok) {
                setAppointments(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAppointments(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Combine Disputes (meetings) and Approved Appointments
    const upcomingDisputeMeetings = disputes
        .filter(d => d.meetingDate && new Date(d.meetingDate) > new Date())
        .map(d => ({
            id: d.id,
            title: d.project?.title || "Dispute Resolution",
            date: d.meetingDate,
            link: d.meetingLink,
            type: 'dispute',
            original: d
        }));

    const upcomingAppointments = appointments
        .filter(a => a.status === 'APPROVED' && new Date(a.date) > new Date()) // Note: appointment.date usually is 00:00:00, need to combine with startHour
        .map(a => {
            const date = new Date(a.date);
            date.setHours(a.startHour, 0, 0, 0); // Approx start time
            // Only show if actual start time is in future
            if (date < new Date()) return null;

            return {
                id: a.id,
                title: a.title,
                date: date.toISOString(),
                link: a.meetingLink,
                type: 'appointment',
                original: a
            };
        })
        .filter(Boolean);

    const allUpcoming = [...upcomingDisputeMeetings, ...upcomingAppointments]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const pendingAppointments = appointments
        .filter(a => a.status === 'PENDING')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first

    const handleMeetingClick = (meeting) => {
        if (meeting.type === 'dispute') {
            setSelectedDispute(meeting.original);
            setOpenDialog(true);
            setShowSchedule(false);
            if (meeting.original.meetingDate) {
                // ... (date parsing logic same as before)
                const date = new Date(meeting.original.meetingDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                setMeetingDate(`${year}-${month}-${day}T${hours}:${minutes}`);
            } else {
                setMeetingDate("");
            }
            setMeetingLink(meeting.original.meetingLink || "");
            setPlatform("google");
        } else {
            // For now, maybe just show a toast or nothing for appointments as they are managed in /appointments
            // Or allow editing link? Leaving simple for now.
        }
    };

    const handleAppointmentAction = async (id, status) => {
        try {
            const res = await authFetch(`/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Appointment ${status.toLowerCase()}`);
                fetchAppointments(); // Refresh list
            } else {
                toast.error("Failed to update appointment");
            }
        } catch (e) {
            toast.error("Error updating appointment");
        }
    };

    // ... existing dispute handlers (handleCancelMeeting, handleScheduleMeeting, etc.) ...

    const handleCancelMeeting = async () => {
        if (!selectedDispute) return;
        setLoading(true);
        try {
            const res = await authFetch(`/disputes/${selectedDispute.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "RESOLVED",
                    resolutionNotes: "Meeting cancelled by Project Manager"
                })
            });

            if (res.ok) {
                toast.success("Meeting cancelled successfully");
                setOpenDialog(false);
                setSelectedDispute(null);
                window.location.reload();
            } else {
                toast.error("Failed to cancel meeting");
            }
        } catch (e) {
            toast.error("Error cancelling meeting");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!selectedDispute || !meetingDate || !meetingLink) {
            toast.error("Please fill in all meeting details");
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(`/disputes/${selectedDispute.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "IN_PROGRESS",
                    meetingDate: new Date(meetingDate).toISOString(),
                    meetingLink: meetingLink
                })
            });

            if (res.ok) {
                const updatedDispute = await res.json();
                setSelectedDispute(prev => ({
                    ...prev,
                    ...updatedDispute.data,
                    meetingDate: new Date(meetingDate).toISOString(),
                    meetingLink: meetingLink
                }));
                setShowSchedule(false);
                toast.success("Meeting scheduled and notifications sent!");
            } else {
                toast.error("Failed to schedule meeting");
            }
        } catch (e) {
            toast.error("Error scheduling meeting");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const dateObj = meetingDate ? new Date(meetingDate) : undefined;
    const timeString = meetingDate && meetingDate.includes('T') ? meetingDate.split('T')[1] : "10:00";

    const handleDateSelect = (newDate) => {
        if (!newDate) {
            setMeetingDate("");
            return;
        }
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, "0");
        const day = String(newDate.getDate()).padStart(2, "0");
        const timePart = meetingDate && meetingDate.includes('T') ? meetingDate.split('T')[1] : "10:00";
        setMeetingDate(`${year}-${month}-${day}T${timePart}`);
    };

    const handleTimeSelect = (newTime) => {
        if (dateObj) {
            const datePart = meetingDate.split('T')[0];
            setMeetingDate(`${datePart}T${newTime}`);
        }
    };

    const timeOptions = Array.from({ length: 48 }).map((_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });

    return (
        <div className="space-y-4">
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending" className="relative">
                        Pending
                        {pendingAppointments.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                                {pendingAppointments.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4 space-y-3">
                    {loadingAppointments ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-primary" /></div>
                    ) : pendingAppointments.length === 0 ? (
                        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                            No pending approvals
                        </div>
                    ) : (
                        pendingAppointments.map(app => (
                            <Card key={app.id} className="p-3 shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-sm line-clamp-1" title={app.title}>{app.title}</div>
                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            <UserPlus className="h-3 w-3" />
                                            {app.bookedBy?.fullName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(app.date).toLocaleDateString()} • {app.startHour}:00 - {app.endHour}:00
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <Button size="icon" variant="outline" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAppointmentAction(app.id, "REJECTED")} title="Reject">
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={() => handleAppointmentAction(app.id, "APPROVED")} title="Approve">
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="mt-4">
                    <Card className="border-none shadow-none bg-transparent p-0">
                        <CardContent className="p-0 space-y-3">
                            {allUpcoming.length === 0 ? (
                                <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
                                    No upcoming meetings
                                </div>
                            ) : (
                                allUpcoming.map(meeting => (
                                    <div
                                        key={meeting.id}
                                        onClick={() => handleMeetingClick(meeting)}
                                        className={`p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all ${meeting.type === 'dispute' ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meeting.type === 'dispute' ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700'}`}>
                                                {new Date(meeting.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h4 className="font-medium text-sm line-clamp-1 mb-1">{meeting.title}</h4>
                                        <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                                            {meeting.type === 'dispute' ? 'Dispute' : 'Appointment'}
                                        </p>
                                        {meeting.link && (
                                            <a
                                                href={meeting.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                            >
                                                <Video size={12} />
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ... Dialog implementation ... */}

            {selectedDispute && (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
                        <DialogHeader>
                            <DialogTitle>Meeting - {selectedDispute.project?.title}</DialogTitle>
                            <DialogDescription>
                                {showSchedule ? "Schedule meeting date & time" : `Scheduled for ${new Date(selectedDispute.meetingDate).toLocaleString()}`}
                            </DialogDescription>
                        </DialogHeader>

                        {!showSchedule ? (
                            <>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Meeting Details</h4>
                                        <div className="p-3 bg-muted rounded-md text-sm">
                                            <p className="mb-2"><strong>Date & Time:</strong> {new Date(selectedDispute.meetingDate).toLocaleString()}</p>
                                            {selectedDispute.meetingLink && (
                                                <p className="mb-2"><strong>Link:</strong> <a href={selectedDispute.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all text-xs">{selectedDispute.meetingLink}</a></p>
                                            )}
                                            <p><strong>Status:</strong> <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{selectedDispute.status}</span></p>
                                            {selectedDispute.status === 'IN_PROGRESS' && (
                                                <p className="mt-2 text-xs text-green-600">✓ Meeting confirmed & notifications sent to freelancer and client</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Issue</h4>
                                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                                            {selectedDispute.description}
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter className="flex gap-2">
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelMeeting}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Cancel Meeting
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => setShowSchedule(true)}
                                        disabled={loading}
                                    >
                                        Approve & Schedule
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-xs font-medium text-blue-900">
                                            ℹ️ <strong>Time slot selected by Client & Freelancer:</strong>
                                        </p>
                                        <p className="text-sm text-blue-800">
                                            {meetingDate ? new Date(meetingDate).toLocaleString() : "No date selected yet"}
                                        </p>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Meeting Schedule</label>
                                        <div className="flex gap-4 pt-1">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="date-picker" className="px-1 text-xs text-muted-foreground font-normal">
                                                    Date
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            id="date-picker"
                                                            className={`w-[180px] justify-between text-left font-normal ${!dateObj && "text-muted-foreground"}`}
                                                        >
                                                            {dateObj ? dateObj.toLocaleDateString() : "Select date"}
                                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={dateObj}
                                                            onSelect={handleDateSelect}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="time-picker" className="px-1 text-xs text-muted-foreground font-normal">
                                                    Time
                                                </Label>
                                                <Select
                                                    value={timeString}
                                                    onValueChange={handleTimeSelect}
                                                    disabled={!meetingDate}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue placeholder="Time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="h-48">
                                                        {timeOptions.map((time) => (
                                                            <SelectItem key={time} value={time}>
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Meeting Link</label>
                                            <Select value={platform} onValueChange={(val) => {
                                                setPlatform(val);
                                                setMeetingLink("");
                                            }}>
                                                <SelectTrigger className="h-7 w-[140px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="google">Google Meet</SelectItem>
                                                    <SelectItem value="zoom">Zoom</SelectItem>
                                                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder={
                                                    platform === 'zoom' ? "https://zoom.us/j/..." :
                                                        platform === 'teams' ? "https://teams.microsoft.com/..." :
                                                            "https://meet.google.com/..."
                                                }
                                                value={meetingLink}
                                                onChange={(e) => setMeetingLink(e.target.value)}
                                            />
                                            <Button size="icon" variant="ghost" type="button" onClick={() => {
                                                const urls = {
                                                    google: 'https://meet.google.com/new',
                                                    zoom: 'https://zoom.us/meeting/schedule',
                                                    teams: 'https://teams.microsoft.com/v2/'
                                                };
                                                window.open(urls[platform], '_blank');
                                            }} title={`Create/Schedule ${platform} meeting`}>
                                                <Video className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowSchedule(false)}
                                        disabled={loading}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleScheduleMeeting}
                                        disabled={loading || !meetingDate || !meetingLink}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Confirm & Send Notifications
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

const ProposalInfo = ({ project, proposal }) => {
    if (!project || !proposal) return null;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Client</h4>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 min-w-[2rem] rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {project.owner?.fullName?.[0] || "C"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                                {project.owner?.fullName || "Unknown Client"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                {project.owner?.email}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Freelancer</h4>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 min-w-[2rem] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {proposal.freelancer?.fullName?.[0] || "F"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                                {proposal.freelancer?.fullName || "Unknown Freelancer"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                {proposal.freelancer?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Project Description</h4>
                <div className="text-sm p-4 bg-muted/50 rounded-lg border max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {project.description}
                </div>
            </div>
        </div>
    );
};

const DisputeCard = ({ dispute, onUpdate, readOnly = false }) => {
    const { authFetch } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [meetingLink, setMeetingLink] = useState(dispute.meetingLink || "");
    const [meetingDate, setMeetingDate] = useState(dispute.meetingDate ? new Date(dispute.meetingDate).toISOString().slice(0, 16) : "");
    const [resolution, setResolution] = useState(dispute.resolutionNotes || "");
    const [status, setStatus] = useState(dispute.status);
    const [showProposal, setShowProposal] = useState(false);
    const [platform, setPlatform] = useState(() => {
        if (!dispute.meetingLink) return "google";
        if (dispute.meetingLink.includes("zoom")) return "zoom";
        if (dispute.meetingLink.includes("teams") || dispute.meetingLink.includes("microsoft")) return "teams";
        return "google";
    });

    // Reassign state
    const [showReassign, setShowReassign] = useState(false);
    const [freelancers, setFreelancers] = useState([]);
    const [selectedFreelancer, setSelectedFreelancer] = useState("");
    const [loadingFreelancers, setLoadingFreelancers] = useState(false);

    useEffect(() => {
        if (showReassign && freelancers.length === 0) {
            setLoadingFreelancers(true);
            authFetch("/users?role=FREELANCER")
                .then(res => res.json())
                .then(data => {
                    if (data.data) setFreelancers(data.data);
                })
                .catch(console.error)
                .finally(() => setLoadingFreelancers(false));
        }
    }, [showReassign, authFetch]); // freelancers.length dependency removed to avoid loops, handled by if check

    const handleReassign = async () => {
        if (!selectedFreelancer) return;
        setLoading(true);
        try {
            const res = await authFetch(`/disputes/${dispute.id}/reassign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newFreelancerId: selectedFreelancer })
            });

            if (res.ok) {
                toast.success("Project reassigned successfully");
                setOpen(false);
                onUpdate();
            } else {
                toast.error("Failed to reassign project");
            }
        } catch (e) {
            toast.error("Error reassigning project");
        } finally {
            setLoading(false);
        }
    };

    const dateObj = meetingDate ? new Date(meetingDate) : undefined;
    const timeString = meetingDate && meetingDate.includes('T') ? meetingDate.split('T')[1] : "10:00";

    const handleDateSelect = (newDate) => {
        if (!newDate) {
            setMeetingDate("");
            return;
        }
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, "0");
        const day = String(newDate.getDate()).padStart(2, "0");
        const timePart = meetingDate && meetingDate.includes('T') ? meetingDate.split('T')[1] : "10:00";
        setMeetingDate(`${year}-${month}-${day}T${timePart}`);
    };

    const handleTimeSelect = (newTime) => {
        if (dateObj) {
            const datePart = meetingDate.split('T')[0];
            setMeetingDate(`${datePart}T${newTime}`);
        }
    };

    // Generate time options (every 30 mins)
    const timeOptions = Array.from({ length: 48 }).map((_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/disputes/${dispute.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    meetingLink,
                    meetingDate: meetingDate ? new Date(meetingDate).toISOString() : null,
                    resolutionNotes: resolution,
                    status
                })
            });

            if (res.ok) {
                toast.success("Project updated successfully");
                setOpen(false);
                onUpdate();
            } else {
                toast.error("Failed to update project");
            }
        } catch (e) {
            toast.error("Error updating project");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (s) => {
        switch (s) {
            case 'RESOLVED': return 'default'; // often dark/primary
            case 'IN_PROGRESS': return 'secondary'; // often grey/muted
            case 'OPEN': return 'destructive'; // red
            default: return 'outline';
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <Badge variant={getStatusVariant(dispute.status)}>
                        {dispute.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <CardTitle className="text-base leading-tight line-clamp-1">
                    {dispute.project?.title || "Unknown Project"}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-2 flex-wrap">
                    <span>Raised by</span>
                    <span className="font-semibold text-foreground">{dispute.raisedBy?.fullName}</span>
                    {dispute.raisedBy?.role === 'CLIENT' && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                            Client
                        </span>
                    )}
                    {dispute.raisedBy?.role === 'FREELANCER' && (
                        <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">
                            Freelancer
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 text-sm">
                <div className="bg-muted/30 p-2 rounded-md">
                    <p className="text-muted-foreground line-clamp-3 text-xs italic">
                        "{dispute.description}"
                    </p>
                </div>

                {dispute.meetingLink && (
                    <div className="p-2 bg-primary/5 border border-primary/20 rounded flex items-center gap-2">
                        <Video size={14} className="text-primary" />
                        <div className="flex flex-col">
                            <a href={dispute.meetingLink} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline truncate text-xs">
                                Join Meeting
                            </a>
                            {dispute.meetingDate && (
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(dispute.meetingDate).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0 mt-auto">
                {dispute.project?.proposals?.[0] && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full" variant="outline" size="sm">
                                View Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Project: {dispute.project?.title}</DialogTitle>
                                <DialogDescription className="text-xs">
                                    Project Budget: ${dispute.project?.budget?.toLocaleString()}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <ProposalInfo project={dispute.project} proposal={dispute.project.proposals[0]} />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant={readOnly ? "outline" : "default"} size="sm">
                            {readOnly ? "View Details" : "Manage Project"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
                        <DialogHeader>
                            <DialogTitle>Manage Project</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">


                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Issue Description</h4>
                                <div className="text-sm text-foreground/90 p-3 bg-muted rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap">
                                    {dispute.description}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={status} onValueChange={setStatus} disabled={readOnly && status === 'RESOLVED'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Meeting Schedule (Optional)</label>
                                    <div className="flex gap-4 pt-1">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="date-picker" className="px-1 text-xs text-muted-foreground font-normal">
                                                Date
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        id="date-picker"
                                                        className={`w-[180px] justify-between text-left font-normal ${!dateObj && "text-muted-foreground"}`}
                                                        disabled={readOnly}
                                                    >
                                                        {dateObj ? dateObj.toLocaleDateString() : "Select date"}
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={dateObj}
                                                        onSelect={handleDateSelect}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="time-picker" className="px-1 text-xs text-muted-foreground font-normal">
                                                Time
                                            </Label>
                                            <Select
                                                value={timeString}
                                                onValueChange={handleTimeSelect}
                                                disabled={readOnly || !meetingDate}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="Time" />
                                                </SelectTrigger>
                                                <SelectContent className="h-48">
                                                    {timeOptions.map((time) => (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Meeting Link</label>
                                        {!readOnly && (
                                            <Select value={platform} onValueChange={(val) => {
                                                setPlatform(val);
                                                setMeetingLink(""); // Clear link on platform change to allow new input
                                            }}>
                                                <SelectTrigger className="h-7 w-[140px] text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="google">Google Meet</SelectItem>
                                                    <SelectItem value="zoom">Zoom</SelectItem>
                                                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={
                                                platform === 'zoom' ? "https://zoom.us/j/..." :
                                                    platform === 'teams' ? "https://teams.microsoft.com/..." :
                                                        "https://meet.google.com/..."
                                            }
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            readOnly={readOnly}
                                        />
                                        {!readOnly && (
                                            <Button size="icon" variant="ghost" type="button" onClick={() => {
                                                const urls = {
                                                    google: 'https://meet.google.com/new',
                                                    zoom: 'https://zoom.us/meeting/schedule',
                                                    teams: 'https://teams.microsoft.com/v2/'
                                                };
                                                window.open(urls[platform], '_blank');
                                            }} title={`Create/Schedule ${platform} meeting`}>
                                                <Video className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                    placeholder="Enter details about the resolution..."
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    rows={4}
                                    readOnly={readOnly}
                                />
                            </div>

                            {!readOnly && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <UserPlus size={16} />
                                            Reassign Freelancer
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowReassign(!showReassign)}
                                            className="h-8 text-xs"
                                        >
                                            {showReassign ? "Cancel" : "Reassign"}
                                        </Button>
                                    </div>

                                    {showReassign && (
                                        <div className="space-y-3 bg-muted/30 p-3 rounded-md border">
                                            <p className="text-xs text-muted-foreground">
                                                This will remove the current freelancer and assign a new one to this project. The dispute will be marked as resolved.
                                            </p>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium">Select New Freelancer</label>
                                                <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingFreelancers ? "Loading..." : "Select freelancer"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {freelancers.map(f => (
                                                            <SelectItem key={f.id} value={f.id}>
                                                                {f.fullName} ({f.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                className="w-full"
                                                variant="secondary"
                                                onClick={handleReassign}
                                                disabled={!selectedFreelancer || loading}
                                            >
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Confirm Reassignment
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>
                                {readOnly ? "Close" : "Cancel"}
                            </Button>
                            {!readOnly && (
                                <Button onClick={handleUpdate} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    );
};

const ProjectManagerDashboard = () => (
    <RoleAwareSidebar>
        <ProjectManagerDashboardContent />
    </RoleAwareSidebar>
);

export default ProjectManagerDashboard;
