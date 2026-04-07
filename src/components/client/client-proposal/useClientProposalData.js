import { useContext } from "react";
import { ClientProposalDataContext } from "./client-proposal-data-context.js";

export const useClientProposalData = () => {
  const context = useContext(ClientProposalDataContext);

  if (!context) {
    throw new Error(
      "useClientProposalData must be used within ClientProposalDataProvider",
    );
  }

  return context;
};
