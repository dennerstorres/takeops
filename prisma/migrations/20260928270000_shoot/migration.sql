-- CreateEnum
CREATE TYPE "ShootStatus" AS ENUM ('PLANNED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "Shoot" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "title" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "status" "ShootStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shoot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shoot_videoProjectId_scheduledAt_idx" ON "Shoot"("videoProjectId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Shoot_videoProjectId_status_idx" ON "Shoot"("videoProjectId", "status");

-- AddForeignKey
ALTER TABLE "Shoot" ADD CONSTRAINT "Shoot_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
