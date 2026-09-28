-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('HOOK', 'TALKING_HEAD', 'DIALOGUE', 'SCREEN_CAPTURE', 'BROLL', 'PRODUCT', 'VOICE_OVER', 'CTA', 'OTHER');

-- CreateEnum
CREATE TYPE "SceneStatus" AS ENUM ('PLANNED', 'READY', 'RECORDING', 'RECORDED', 'NEEDS_RETAKE', 'DISCARDED');

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SceneType" NOT NULL,
    "speakerId" TEXT,
    "dialogue" TEXT,
    "action" TEXT,
    "estimatedDurationSeconds" INTEGER,
    "cameraInstructions" TEXT,
    "editingInstructions" TEXT,
    "continuityNotes" TEXT,
    "status" "SceneStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_videoProjectId_status_idx" ON "Scene"("videoProjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_videoProjectId_order_key" ON "Scene"("videoProjectId", "order");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
