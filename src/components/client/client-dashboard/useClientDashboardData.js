import { useContext } from "react";
import { ClientDashboardDataContext } from "./client-dashboard-data-context.js";

export const useClientDashboardData = () => {
  const context = useContext(ClientDashboardDataContext);

  if (!context) {
    throw new Error(
      "useClientDashboardData must be used within ClientDashboardDataProvider",
    );
  }

  return context;
};

export const useOptionalClientDashboardData = () =>
  useContext(ClientDashboardDataContext);
