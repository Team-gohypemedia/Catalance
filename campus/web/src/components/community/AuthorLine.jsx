import { Avatar } from "@/components/ui/overlays";
import { DivisionBadge } from "@/components/ui/campus";
import { cn, timeAgo } from "@/lib/utils";

/** Small role tag, used next to names. */
export function RoleTag({ role }) {
  if (role === "MENTOR")
    return <span className="rounded-full bg-success-soft px-1.5 py-px text-[10px] font-medium text-success">Mentor</span>;
  if (role === "ADMIN")
    return <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10px] font-medium text-muted">Campus team</span>;
  return null;
}

/** Avatar + name + division / mentor tag + college + time. */
export function AuthorLine({ author, createdAt, size = "sm", prefix, className }) {
  if (!author) return null;
  const isMentor = author.role === "MENTOR";
  const isStaff = isMentor || author.role === "ADMIN";
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar name={author.name} src={author.avatarUrl} size={size} />
      <div className="min-w-0 text-sm leading-tight">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {prefix && <span className="text-muted">{prefix}</span>}
          <span className="truncate font-medium text-fg">{author.name}</span>
          {isStaff ? <RoleTag role={author.role} /> : <DivisionBadge division={author.division} size="sm" showLabel={false} />}
        </div>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {author.college?.shortName ? `${author.college.shortName}, ${author.college.city}` : isMentor ? "Working freelancer" : "Campus"}
          {createdAt && <> · {timeAgo(createdAt)}</>}
        </p>
      </div>
    </div>
  );
}
