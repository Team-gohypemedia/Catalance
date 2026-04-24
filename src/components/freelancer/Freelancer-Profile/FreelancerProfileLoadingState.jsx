import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import FreelancerProfilePageShell from "./FreelancerProfilePageShell";

const FreelancerProfileLoadingState = ({
  headerProfile,
  notifications,
  unreadCount,
  markAllAsRead,
  onNotificationClick,
}) => (
  <FreelancerProfilePageShell
    headerProfile={headerProfile}
    notifications={notifications}
    unreadCount={unreadCount}
    markAllAsRead={markAllAsRead}
    onNotificationClick={onNotificationClick}
  >
    <div className="w-full py-8">
      <div className="rounded-3xl border border-border/50 bg-card p-10">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    </div>
  </FreelancerProfilePageShell>
);

export default FreelancerProfileLoadingState;
