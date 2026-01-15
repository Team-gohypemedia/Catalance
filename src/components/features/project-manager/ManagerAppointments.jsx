import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";
import { ManagerTopBar } from "./ManagerTopBar";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import User from "lucide-react/dist/esm/icons/user";
import Video from "lucide-react/dist/esm/icons/video";
import Check from "lucide-react/dist/esm/icons/check";
import X from "lucide-react/dist/esm/icons/x";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import format from "date-fns/format";

const formatTime = (hour) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
};

const ManagerAppointmentsContent = () => {
    const { authFetch } = useAuth();
    const [searchParams] = useSearchParams();
    const statusFilter = searchParams.get("status") || "all";

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [meetingLink, setMeetingLink] = useState("");

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            let url = "/appointments";
            if (statusFilter !== "all") {
                url += `?status=${statusFilter.toUpperCase()}`;
            }
            const res = await authFetch(url);
            const data = await res.json();
            if (res.ok) {
                setAppointments(data.data || []);
            } else {
                toast.error("Failed to load appointments");
            }
        } catch (e) {
            toast.error("Error loading appointments");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [statusFilter]);

    const handleAction = async (action) => {
        if (!selectedAppointment) return;
        setActionLoading(true);
        try {
            const res = await authFetch(`/appointments/${selectedAppointment.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: action,
                    meetingLink: action === "APPROVED" ? meetingLink : undefined
                })
            });

            if (res.ok) {
                toast.success(`Appointment ${action.toLowerCase()} successfully`);
                setSelectedAppointment(null);
                setMeetingLink("");
                fetchAppointments();
            } else {
                toast.error(`Failed to ${action.toLowerCase()} appointment`);
            }
        } catch (e) {
            toast.error("Error updating appointment");
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            PENDING: "secondary",
            APPROVED: "default",
            REJECTED: "destructive",
            CANCELLED: "outline"
        };
        return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
    };

    const getRoleBadge = (role) => {
        return role === "CLIENT" ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>
        ) : (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Freelancer</Badge>
        );
    };

    const pendingAppointments = appointments.filter(a => a.status === "PENDING");
    const approvedAppointments = appointments.filter(a => a.status === "APPROVED");
    const otherAppointments = appointments.filter(a => !["PENDING", "APPROVED"].includes(a.status));

    return (
        <div className="flex flex-col min-h-screen w-full">
            <ManagerTopBar />
            <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                        <p className="text-muted-foreground mt-1">Manage appointment requests from clients and freelancers</p>
                    </div>
                    <Button onClick={fetchAppointments} variant="outline" size="sm">
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="pending" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="pending" className="gap-2">
                                Pending
                                {pendingAppointments.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">{pendingAppointments.length}</Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="other">Rejected/Cancelled</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-4">
                            {pendingAppointments.length === 0 ? (
                                <Card className="p-10 text-center text-muted-foreground">
                                    <p>No pending appointment requests</p>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {pendingAppointments.map(apt => (
                                        <AppointmentCard
                                            key={apt.id}
                                            appointment={apt}
                                            onSelect={() => {
                                                setSelectedAppointment(apt);
                                                setMeetingLink(apt.meetingLink || "");
                                            }}
                                            getStatusBadge={getStatusBadge}
                                            getRoleBadge={getRoleBadge}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="approved" className="space-y-4">
                            {approvedAppointments.length === 0 ? (
                                <Card className="p-10 text-center text-muted-foreground">
                                    <p>No approved appointments</p>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {approvedAppointments.map(apt => (
                                        <AppointmentCard
                                            key={apt.id}
                                            appointment={apt}
                                            getStatusBadge={getStatusBadge}
                                            getRoleBadge={getRoleBadge}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="other" className="space-y-4">
                            {otherAppointments.length === 0 ? (
                                <Card className="p-10 text-center text-muted-foreground">
                                    <p>No rejected or cancelled appointments</p>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 opacity-70">
                                    {otherAppointments.map(apt => (
                                        <AppointmentCard
                                            key={apt.id}
                                            appointment={apt}
                                            getStatusBadge={getStatusBadge}
                                            getRoleBadge={getRoleBadge}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Approval Dialog */}
                <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Review Appointment Request</DialogTitle>
                            <DialogDescription>
                                Approve or reject this appointment request
                            </DialogDescription>
                        </DialogHeader>

                        {selectedAppointment && (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium">{selectedAppointment.title}</h4>
                                    {selectedAppointment.description && (
                                        <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{format(new Date(selectedAppointment.date), "MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatTime(selectedAppointment.startHour)} - {formatTime(selectedAppointment.endHour)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{selectedAppointment.bookedBy?.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{selectedAppointment.bookedBy?.email}</p>
                                    </div>
                                    {getRoleBadge(selectedAppointment.bookedBy?.role)}
                                </div>

                                {selectedAppointment.project && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <span>Project: {selectedAppointment.project.title}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="meetingLink"
                                            placeholder="https://meet.google.com/... or leave empty to auto-generate"
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.open("https://meet.google.com/new", "_blank")}
                                        >
                                            <Video className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        If empty, a Jitsi link will be auto-generated
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleAction("REJECTED")}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                                Reject
                            </Button>
                            <Button
                                onClick={() => handleAction("APPROVED")}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

const AppointmentCard = ({ appointment, onSelect, getStatusBadge, getRoleBadge }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
                {getStatusBadge(appointment.status)}
                {getRoleBadge(appointment.bookedBy?.role)}
            </div>
            <CardTitle className="text-base line-clamp-1">
                {appointment.title}
            </CardTitle>
            <CardDescription className="text-xs">
                Booked by {appointment.bookedBy?.fullName}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(appointment.date), "EEEE, MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(appointment.startHour)} - {formatTime(appointment.endHour)}</span>
            </div>
            {appointment.meetingLink && (
                <a
                    href={appointment.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-xs"
                >
                    <Video className="h-4 w-4" />
                    Join Meeting
                </a>
            )}
        </CardContent>
        {onSelect && appointment.status === "PENDING" && (
            <CardFooter className="pt-0">
                <Button size="sm" className="w-full" onClick={onSelect}>
                    Review Request
                </Button>
            </CardFooter>
        )}
    </Card>
);

const ManagerAppointments = () => (
    <RoleAwareSidebar>
        <ManagerAppointmentsContent />
    </RoleAwareSidebar>
);

export default ManagerAppointments;
