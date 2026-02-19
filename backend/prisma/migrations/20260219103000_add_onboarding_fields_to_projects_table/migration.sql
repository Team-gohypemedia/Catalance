-- AlterTable
ALTER TABLE "projects"
ADD COLUMN "professionalTitle" TEXT,
ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "industriesOrNiches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "yearsOfExperienceInService" TEXT,
ADD COLUMN "serviceSpecializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "activeTechnologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "averageProjectPriceRange" TEXT,
ADD COLUMN "projectComplexityLevel" TEXT,
ADD COLUMN "acceptInProgressProjects" TEXT;