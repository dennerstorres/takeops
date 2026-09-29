-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM_REELS', 'TIKTOK', 'YOUTUBE_SHORTS', 'YOUTUBE', 'LINKEDIN', 'FACEBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "url" TEXT,
    "caption" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Publication_videoProjectId_status_idx" ON "Publication"("videoProjectId", "status");

-- CreateIndex
CREATE INDEX "Publication_scheduledAt_idx" ON "Publication"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
