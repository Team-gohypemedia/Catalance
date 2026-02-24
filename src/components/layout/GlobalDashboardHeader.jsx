import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import Sun from "lucide-react/dist/esm/icons/sun";
import Moon from "lucide-react/dist/esm/icons/moon";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const DashboardHeader = ({
  userName,
  title,
  tabLabel,
  notifications = [],
  unreadCount = 0,
  markAllAsRead = () => {},
  handleNotificationClick = () => {},
  proposalLabel = "Proposals",
  proposalPath = "/freelancer/proposals",
  ProposalIcon = FileText,
  showProposalButton = true,
}) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const dashboardLabel = userName ? `${userName}'s Dashboard` : "Dashboard";
  const normalizedTabLabel = String(tabLabel || title || "").trim();
  const hasTabCrumb =
    normalizedTabLabel.length > 0 &&
    normalizedTabLabel.toLowerCase() !== "dashboard" &&
    normalizedTabLabel.toLowerCase() !== dashboardLabel.toLowerCase();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-1">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage
                className={
                  hasTabCrumb
                    ? "text-sm font-medium text-muted-foreground"
                    : "text-sm font-semibold text-foreground"
                }
              >
                {dashboardLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
            {hasTabCrumb ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold text-foreground">
                    {normalizedTabLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Bell className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.slice(0, 20).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          !notification.read ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />

        {showProposalButton ? (
          <Button
            className="hidden h-11 rounded-xl px-5 text-sm font-bold bg-primary text-primary-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/90 sm:flex"
            onClick={() => navigate(proposalPath)}
          >
            {ProposalIcon ? <ProposalIcon className="mr-2 h-4 w-4" /> : null}
            {proposalLabel}
          </Button>
        ) : null}
      </div>
    </header>
  );
};
