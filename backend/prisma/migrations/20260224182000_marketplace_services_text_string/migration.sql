-- AlterTable
ALTER TABLE "Marketplace"
ALTER COLUMN "services" DROP DEFAULT;

ALTER TABLE "Marketplace"
ALTER COLUMN "services" TYPE TEXT
USING COALESCE(array_to_string("services", ', '), '');

ALTER TABLE "Marketplace"
ALTER COLUMN "services" SET DEFAULT '';

ALTER TABLE "Marketplace"
ALTER COLUMN "services" SET NOT NULL;
