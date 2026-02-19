-- Rename completed project table
ALTER TABLE "CompletedProject" RENAME TO "CompletedProjects";
ALTER INDEX "CompletedProject_pkey" RENAME TO "CompletedProjects_pkey";
ALTER INDEX "CompletedProject_ongoingProjectId_idx" RENAME TO "CompletedProjects_ongoingProjectId_idx";
ALTER INDEX "CompletedProject_ownerId_idx" RENAME TO "CompletedProjects_ownerId_idx";
ALTER INDEX "CompletedProject_managerId_idx" RENAME TO "CompletedProjects_managerId_idx";