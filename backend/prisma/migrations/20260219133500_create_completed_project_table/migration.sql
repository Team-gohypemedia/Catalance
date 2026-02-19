-- CreateTable
CREATE TABLE "CompletedProject" (
  "id" TEXT NOT NULL,
  "ongoingProjectId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "budget" INTEGER,
  "spent" INTEGER NOT NULL DEFAULT 0,
  "ownerId" TEXT,
  "managerId" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedData" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompletedProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompletedProject_ongoingProjectId_idx" ON "CompletedProject"("ongoingProjectId");
CREATE INDEX "CompletedProject_ownerId_idx" ON "CompletedProject"("ownerId");
CREATE INDEX "CompletedProject_managerId_idx" ON "CompletedProject"("managerId");