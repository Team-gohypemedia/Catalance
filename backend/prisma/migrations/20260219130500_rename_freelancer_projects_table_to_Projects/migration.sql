-- Rename freelancer projects table
ALTER TABLE "projects" RENAME TO "Projects";
ALTER INDEX "projects_pkey" RENAME TO "Projects_pkey";
ALTER INDEX "projects_freelancerId_idx" RENAME TO "Projects_freelancerId_idx";
ALTER INDEX "projects_freelancerId_serviceKey_idx" RENAME TO "Projects_freelancerId_serviceKey_idx";
ALTER TABLE "Projects" RENAME CONSTRAINT "projects_freelancerId_fkey" TO "Projects_freelancerId_fkey";