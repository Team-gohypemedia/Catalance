-- Revert main table name back to OnGoingProjects
ALTER TABLE "Projects" RENAME TO "OnGoingProjects";
ALTER INDEX "Projects_pkey" RENAME TO "OnGoingProjects_pkey";

-- Remove completed projects archive table
DROP TABLE IF EXISTS "CompletedProjects";