import PropTypes from "prop-types";
import Video from "lucide-react/dist/esm/icons/video";
import Users from "lucide-react/dist/esm/icons/users";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const iconMap = {
  video: Video,
  group: Users,
  calendar: Calendar,
};

export const MeetingCard = ({
  type = "video",
  status,
  title,
  project,
  participants = [],
  time,
  highlight,
  onOpen,
}) => {
  const Icon = iconMap[type] || Video;
  const interactive = typeof onOpen === "function";

  return (
    <Card
      className={`relative w-full min-w-0 overflow-hidden rounded-3xl border transition-all duration-300 ${
        interactive ? "cursor-pointer hover:-translate-y-1 hover:shadow-md focus-within:-translate-y-1 focus-within:shadow-md" : ""
      } ${
        highlight
          ? "border-primary/30 bg-primary/10 text-foreground shadow-sm dark:bg-primary/15"
          : "border-border/60 bg-card text-card-foreground shadow-xs"
      }`}
    >
      <CardContent className="p-5 sm:p-6 relative z-10">
        <button
          type="button"
          className="block w-full appearance-none border-0 bg-transparent p-0 text-left outline-none"
          onClick={onOpen}
          disabled={!interactive}
          aria-label={interactive ? `Open ${project} project details` : undefined}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              highlight ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary"
            }`}>
              <Icon className="h-5.5 w-5.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                highlight
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {status}
              </span>
            </div>
          </div>
          
          <div className="mb-5">
            <h4 className="text-lg sm:text-xl font-semibold leading-snug text-foreground mb-1 line-clamp-1">{title}</h4>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              {project}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Participants</span>
              <div className="flex -space-x-2 overflow-hidden">
                {participants.slice(0, 3).map((p, i) => (
                  <Avatar key={i} className="h-7 w-7 border-2 border-background ring-1 ring-border">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold uppercase">{p.initials}</AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 3 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground text-[10px] font-bold">
                    +{participants.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 rounded-2xl bg-muted/50 px-3.5 py-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Time</span>
              <span className="text-sm font-semibold text-foreground">{time}</span>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
};

MeetingCard.propTypes = {
  type: PropTypes.oneOf(["video", "group", "calendar"]),
  status: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  project: PropTypes.string.isRequired,
  participants: PropTypes.arrayOf(PropTypes.shape({
    avatar: PropTypes.string,
    initials: PropTypes.string
  })),
  time: PropTypes.string.isRequired,
  highlight: PropTypes.bool,
  onOpen: PropTypes.func,
};
