-- RenameTable
ALTER TABLE "projects" RENAME TO "OnGoingProjects";

-- RenameIndexesAndConstraints
ALTER INDEX "projects_pkey" RENAME TO "OnGoingProjects_pkey";
ALTER INDEX "projects_freelancerId_idx" RENAME TO "OnGoingProjects_freelancerId_idx";
ALTER INDEX "projects_freelancerId_serviceKey_idx" RENAME TO "OnGoingProjects_freelancerId_serviceKey_idx";
ALTER TABLE "OnGoingProjects" RENAME CONSTRAINT "projects_freelancerId_fkey" TO "OnGoingProjects_freelancerId_fkey";