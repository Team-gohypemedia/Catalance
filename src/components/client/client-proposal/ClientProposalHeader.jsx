import React, { memo } from "react";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { getDisplayName, getInitials } from "./proposal-utils.js";

const ClientProposalHeader = ({ unreadCount, user }) => {
  const headerDisplayName = getDisplayName(user);

  return (
    <ClientWorkspaceHeader
      profile={{
        avatar: user?.avatar,
        name: headerDisplayName,
        initial: getInitials(headerDisplayName),
      }}
      activeWorkspaceKey="proposals"
      unreadCount={unreadCount}
    />
  );
};

export default memo(ClientProposalHeader);
