-- CreateTable
CREATE TABLE "ProductionTemplateScene" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SceneType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionTemplateScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionTemplateScene_templateId_order_key" ON "ProductionTemplateScene"("templateId", "order");

-- AddForeignKey
ALTER TABLE "ProductionTemplateScene" ADD CONSTRAINT "ProductionTemplateScene_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProductionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
