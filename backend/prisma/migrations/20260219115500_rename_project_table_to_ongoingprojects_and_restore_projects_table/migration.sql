-- Step 1: restore freelancer projects table name
ALTER TABLE "OnGoingProjects" RENAME TO "projects";
ALTER INDEX "OnGoingProjects_pkey" RENAME TO "projects_pkey";
ALTER INDEX "OnGoingProjects_freelancerId_idx" RENAME TO "projects_freelancerId_idx";
ALTER INDEX "OnGoingProjects_freelancerId_serviceKey_idx" RENAME TO "projects_freelancerId_serviceKey_idx";
ALTER TABLE "projects" RENAME CONSTRAINT "OnGoingProjects_freelancerId_fkey" TO "projects_freelancerId_fkey";

-- Step 2: rename main Project table to OnGoingProjects
ALTER TABLE "Project" RENAME TO "OnGoingProjects";
ALTER INDEX "Project_pkey" RENAME TO "OnGoingProjects_pkey";