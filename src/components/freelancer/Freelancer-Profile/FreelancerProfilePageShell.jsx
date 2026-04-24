import FreelancerWorkspaceHeader from "@/components/features/freelancer/FreelancerWorkspaceHeader";

const FreelancerProfilePageShell = ({
  children,
  headerProfile,
  notifications,
  unreadCount,
  markAllAsRead,
  onNotificationClick,
}) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
      <FreelancerWorkspaceHeader
        profile={headerProfile}
        activeWorkspaceKey="profile"
        primaryActionTo="/freelancer/proposals"
        notifications={notifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        onNotificationClick={onNotificationClick}
      />
      <main className="flex-1 pb-20">{children}</main>
    </div>
  </div>
);

export default FreelancerProfilePageShell;
