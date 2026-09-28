-- CreateTable
CREATE TABLE "ShootEquipment" (
    "id" TEXT NOT NULL,
    "shootId" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShootEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShootEquipment_equipmentItemId_idx" ON "ShootEquipment"("equipmentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShootEquipment_shootId_equipmentItemId_key" ON "ShootEquipment"("shootId", "equipmentItemId");

-- AddForeignKey
ALTER TABLE "ShootEquipment" ADD CONSTRAINT "ShootEquipment_shootId_fkey" FOREIGN KEY ("shootId") REFERENCES "Shoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootEquipment" ADD CONSTRAINT "ShootEquipment_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "EquipmentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
