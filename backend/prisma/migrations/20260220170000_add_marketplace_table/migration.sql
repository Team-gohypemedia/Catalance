-- CreateTable
CREATE TABLE "Marketplace" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marketplace_freelancerId_key" ON "Marketplace"("freelancerId");

-- CreateIndex
CREATE INDEX "Marketplace_isFeatured_idx" ON "Marketplace"("isFeatured");

-- AddForeignKey
ALTER TABLE "Marketplace" ADD CONSTRAINT "Marketplace_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
