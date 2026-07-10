CREATE TABLE "service_tools" (
    "id" SERIAL NOT NULL,
    "service_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_tools_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_tools_service_id_name_key" ON "service_tools"("service_id", "name");
CREATE INDEX "service_tools_service_id_sort_order_idx" ON "service_tools"("service_id", "sort_order");

ALTER TABLE "service_tools"
ADD CONSTRAINT "service_tools_service_id_fkey"
FOREIGN KEY ("service_id") REFERENCES "Service"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
