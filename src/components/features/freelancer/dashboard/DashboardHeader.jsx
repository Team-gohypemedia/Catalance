import React from "react";
import Bell from "lucide-react/dist/esm/icons/bell";
import { Button } from "@/components/ui/button";
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
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const DashboardHeader = ({
    userName,
    notifications,
    unreadCount,
    markAllAsRead,
    handleNotificationClick,
}) => {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{userName ? `${userName}'s Dashboard` : "Dashboard"}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full ring-2 ring-background"></span>
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
                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${!notification.read ? "bg-primary/5" : ""
                                                }`}
                                        >
                                            <div
                                                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notification.read ? "bg-primary" : "bg-transparent"
                                                    }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
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
            </div>
        </header>
    );
};
