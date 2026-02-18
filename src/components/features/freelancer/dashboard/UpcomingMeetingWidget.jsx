import React from "react";
import Video from "lucide-react/dist/esm/icons/video";
import { Button } from "@/components/ui/button";

export const UpcomingMeetingWidget = ({ upcomingMeeting }) => {
    if (!upcomingMeeting) return null;

    const meetingDate = new Date(upcomingMeeting.date);
    const isToday = new Date().toDateString() === meetingDate.toDateString();
    const dateDisplay = isToday
        ? "Today"
        : meetingDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    const timeDisplay = `${upcomingMeeting.startHour}:00 – ${upcomingMeeting.endHour}:00`;

    return (
        <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Video className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                    Upcoming Meeting
                </h3>
                {isToday && (
                    <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        TODAY
                    </span>
                )}
            </div>
            <div className="mb-4">
                <p className="text-sm font-medium text-foreground">
                    {upcomingMeeting.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {dateDisplay} • {timeDisplay}
                </p>
                {upcomingMeeting.manager && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        with {upcomingMeeting.manager.fullName}
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() =>
                        window.open(
                            upcomingMeeting.meetingLink || "https://meet.google.com/",
                            "_blank"
                        )
                    }
                    disabled={
                        !upcomingMeeting.meetingLink &&
                        !upcomingMeeting.meetingLink?.startsWith("http")
                    }
                >
                    Join Meeting
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium"
                >
                    Details
                </Button>
            </div>
        </div>
    );
};
