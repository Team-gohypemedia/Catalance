import React from "react";
import { RoleAwareSidebar } from "@/components/layout/RoleAwareSidebar";

const AdminLayout = ({ children }) => {
  return (
    <RoleAwareSidebar>
      {children}
    </RoleAwareSidebar>
  );
};

export default AdminLayout;
