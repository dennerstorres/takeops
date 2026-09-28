-- CreateEnum
CREATE TYPE "ShotType" AS ENUM ('CAMERA', 'SCREEN_CAPTURE', 'BROLL', 'INSERT', 'VOICE_ONLY', 'OTHER');

-- CreateEnum
CREATE TYPE "ShotStatus" AS ENUM ('PLANNED', 'RECORDED', 'NEEDS_RETAKE', 'DISCARDED');

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT,
    "cameraLabel" TEXT,
    "shotType" "ShotType" NOT NULL DEFAULT 'CAMERA',
    "framing" TEXT,
    "angle" TEXT,
    "subject" TEXT,
    "movement" TEXT,
    "description" TEXT,
    "requiredTakes" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "ShotStatus" NOT NULL DEFAULT 'PLANNED',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shot_sceneId_status_idx" ON "Shot"("sceneId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_sceneId_order_key" ON "Shot"("sceneId", "order");

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
