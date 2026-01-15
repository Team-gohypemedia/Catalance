import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useNotifications } from "@/shared/context/NotificationContext";

export function NavMain({
  items
}) {
  const { chatUnreadCount, markChatAsRead, proposalUnreadCount, markProposalsAsRead } = useNotifications();
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = Array.isArray(item.items) && item.items.length > 0;

          // Show badge on Messages item when there are unread chat notifications
          const showMessageBadge = item.title === "Messages" && chatUnreadCount > 0;

          // Show badge on Proposals items
          const isProposalsItem = item.title === "Proposals" || item.title === "Proposal";
          const showProposalBadge = isProposalsItem && proposalUnreadCount > 0;

          if (!hasChildren) {
            const currentPath = location.pathname + location.search;
            let isActive = currentPath === item.url;

            if (!isActive && !item.url.includes("?")) {
              isActive = location.pathname === item.url && !location.search.includes("view=");
            }

            // When clicking Messages, mark chat as read
            const handleClick = () => {
              if (item.title === "Messages") {
                markChatAsRead();
              }
            };

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link to={item.url ?? "#"} className={`relative ${isActive ? "text-primary font-medium" : ""}`} onClick={handleClick}>
                    {Icon && <Icon className={isActive ? "text-primary" : ""} />}
                    <span>{item.title}</span>
                    {showMessageBadge && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} onClick={() => {
                    // Optional: Clear badge on expand? Maybe not, better on click specific sub-item
                  }}>
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                    {showProposalBadge && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse mr-2">
                        {proposalUnreadCount > 99 ? "99+" : proposalUnreadCount}
                      </span>
                    )}
                    <ChevronRight
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isReceived = subItem.title === "Received";
                      const showSubBadge = isReceived && showProposalBadge;

                      const handleSubClick = () => {
                        if (isReceived) {
                          markProposalsAsRead();
                        }
                      };

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url} onClick={handleSubClick} className="flex justify-between items-center">
                              <span>{subItem.title}</span>
                              {showSubBadge && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                                  {proposalUnreadCount > 99 ? "99+" : proposalUnreadCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
