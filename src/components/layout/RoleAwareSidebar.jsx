import PropTypes from "prop-types";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const RoleAwareSidebar = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-dvh flex-1 overflow-x-clip bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

RoleAwareSidebar.propTypes = {
  children: PropTypes.node.isRequired
};

export { RoleAwareSidebar };
