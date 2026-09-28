-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('CAMERA', 'SMARTPHONE', 'MICROPHONE', 'TRIPOD', 'LIGHTING', 'POWER', 'LAPTOP', 'OTHER');

-- CreateTable
CREATE TABLE "EquipmentItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentItem_workspaceId_active_idx" ON "EquipmentItem"("workspaceId", "active");

-- CreateIndex
CREATE INDEX "EquipmentItem_workspaceId_category_idx" ON "EquipmentItem"("workspaceId", "category");

-- AddForeignKey
ALTER TABLE "EquipmentItem" ADD CONSTRAINT "EquipmentItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
