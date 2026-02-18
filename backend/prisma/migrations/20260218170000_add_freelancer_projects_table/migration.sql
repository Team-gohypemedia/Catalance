-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "serviceKey" TEXT,
    "serviceName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "readme" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "role" TEXT,
    "timeline" TEXT,
    "budget" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_freelancerId_idx" ON "projects"("freelancerId");

-- CreateIndex
CREATE INDEX "projects_freelancerId_serviceKey_idx" ON "projects"("freelancerId", "serviceKey");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
