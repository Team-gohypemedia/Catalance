import React from "react";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useClientProposalData } from "./useClientProposalData.js";
import { getDisplayName, getInitials } from "./proposal-utils.js";

const ClientProposalHeader = () => {
  const { unreadCount, user } = useClientProposalData();
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

export default ClientProposalHeader;
