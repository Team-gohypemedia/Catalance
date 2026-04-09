"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { processProjectInstallmentPayment } from "@/shared/lib/project-payment";
import { toast } from "sonner";
import { normalizeClientProjects } from "@/components/features/client/ClientProjects";

export const useClientProjectsData = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingProjectId, setProcessingProjectId] = useState(null);

  const loadProjects = useCallback(async () => {
    if (!authFetch) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authFetch("/projects");
      const payload = await response.json().catch(() => null);
      const remote = Array.isArray(payload?.data) ? payload.data : [];
      setProjects(normalizeClientProjects(remote));
    } catch (error) {
      console.error("Failed to load projects from API:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    void loadProjects();
  }, [isAuthenticated, loadProjects]);

  const handleApproveAndPay = useCallback(
    async (project) => {
      if (!project?.id || !authFetch) return;

      setProcessingProjectId(project.id);

      try {
        const paymentResult = await processProjectInstallmentPayment({
          authFetch,
          projectId: project.id,
          description: `${project.dueInstallment?.label || "Project payment"} for ${
            project.title || "project"
          }`,
        });

        toast.success(paymentResult?.message || "Payment completed successfully.");
        await loadProjects();
      } catch (error) {
        console.error("Project payment failed:", error);
        toast.error(error?.message || "Failed to process payment");
      } finally {
        setProcessingProjectId(null);
      }
    },
    [authFetch, loadProjects],
  );

  return {
    projects,
    isLoading,
    processingProjectId,
    refreshProjects: loadProjects,
    handleApproveAndPay,
  };
};
