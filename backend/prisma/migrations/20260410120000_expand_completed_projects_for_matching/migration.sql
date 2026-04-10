ALTER TABLE "CompletedProjects"
ADD COLUMN "budgetMin" INTEGER,
ADD COLUMN "budgetMax" INTEGER,
ADD COLUMN "clientSnapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "freelancerIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "freelancerSnapshots" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "serviceKey" TEXT,
ADD COLUMN "serviceType" TEXT,
ADD COLUMN "niche" TEXT,
ADD COLUMN "projectType" TEXT,
ADD COLUMN "timeline" TEXT,
ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "matchingSeed" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "CompletedProjects_serviceKey_idx" ON "CompletedProjects"("serviceKey");
CREATE INDEX "CompletedProjects_niche_idx" ON "CompletedProjects"("niche");
CREATE INDEX "CompletedProjects_projectType_idx" ON "CompletedProjects"("projectType");
CREATE INDEX "CompletedProjects_budgetMin_idx" ON "CompletedProjects"("budgetMin");
CREATE INDEX "CompletedProjects_budgetMax_idx" ON "CompletedProjects"("budgetMax");
CREATE INDEX "CompletedProjects_completedAt_idx" ON "CompletedProjects"("completedAt");
