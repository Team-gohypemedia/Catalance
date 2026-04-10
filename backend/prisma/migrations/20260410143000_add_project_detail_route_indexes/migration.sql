-- Add indexes for client project detail and chat query paths.
-- Use IF NOT EXISTS for non-destructive compatibility across environments.

CREATE INDEX IF NOT EXISTS "OnGoingProjects_ownerId_idx"
ON "OnGoingProjects"("ownerId");

CREATE INDEX IF NOT EXISTS "OnGoingProjects_managerId_idx"
ON "OnGoingProjects"("managerId");

CREATE INDEX IF NOT EXISTS "OnGoingProjects_managerId_status_idx"
ON "OnGoingProjects"("managerId", "status");

CREATE INDEX IF NOT EXISTS "Proposal_freelancerId_idx"
ON "Proposal"("freelancerId");

CREATE INDEX IF NOT EXISTS "Proposal_projectId_createdAt_idx"
ON "Proposal"("projectId", "createdAt");

CREATE INDEX IF NOT EXISTS "Proposal_projectId_status_createdAt_idx"
ON "Proposal"("projectId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "Dispute_projectId_idx"
ON "Dispute"("projectId");

CREATE INDEX IF NOT EXISTS "ChatConversation_service_idx"
ON "ChatConversation"("service");

CREATE INDEX IF NOT EXISTS "Review_serviceId_clientId_createdAt_idx"
ON "Review"("serviceId", "clientId", "createdAt");
