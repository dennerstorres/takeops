-- AlterTable
ALTER TABLE "ProductionTemplate" ADD COLUMN     "checklistTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "ProductionTemplate" ADD CONSTRAINT "ProductionTemplate_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
