ALTER TABLE "OnGoingProjects"
ADD COLUMN "freelancerChangeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "freelancerChangeRequests" JSONB NOT NULL DEFAULT '[]';
