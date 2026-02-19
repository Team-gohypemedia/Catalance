-- Rename main project table
ALTER TABLE "OnGoingProjects" RENAME TO "Projects";
ALTER INDEX "OnGoingProjects_pkey" RENAME TO "Projects_pkey";

-- Create completed projects archive table
CREATE TABLE "CompletedProjects" (
  "id" TEXT NOT NULL,
  "sourceProjectId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "budget" INTEGER,
  "progress" INTEGER NOT NULL DEFAULT 100,
  "spent" INTEGER NOT NULL DEFAULT 0,
  "completedTasks" JSONB NOT NULL DEFAULT '[]',
  "verifiedTasks" JSONB NOT NULL DEFAULT '[]',
  "notes" TEXT,
  "ownerId" TEXT NOT NULL,
  "managerId" TEXT,
  "externalLink" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompletedProjects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompletedProjects_ownerId_idx" ON "CompletedProjects"("ownerId");
CREATE INDEX "CompletedProjects_managerId_idx" ON "CompletedProjects"("managerId");

ALTER TABLE "CompletedProjects"
  ADD CONSTRAINT "CompletedProjects_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompletedProjects"
  ADD CONSTRAINT "CompletedProjects_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;