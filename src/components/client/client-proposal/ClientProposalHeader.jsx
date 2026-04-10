import React, { memo } from "react";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { getDisplayName, getInitials } from "./proposal-utils.js";

const ClientProposalHeader = ({ userState }) => {
  const headerDisplayName = getDisplayName(userState?.user);

  return (
    <ClientWorkspaceHeader
      profile={{
        avatar: userState?.user?.avatar,
        name: headerDisplayName,
        initial: getInitials(headerDisplayName),
      }}
      activeWorkspaceKey="proposals"
      unreadCount={userState?.unreadCount}
    />
  );
};

export default memo(ClientProposalHeader);
