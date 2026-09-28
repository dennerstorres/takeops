-- CreateEnum
CREATE TYPE "VideoProjectStatus" AS ENUM ('IDEA', 'PRE_PRODUCTION', 'SCRIPTING', 'READY_TO_RECORD', 'RECORDING', 'EDITING', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AspectRatio" AS ENUM ('NINE_SIXTEEN', 'SIXTEEN_NINE', 'ONE_ONE', 'FOUR_FIVE');

-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "objective" TEXT,
    "audience" TEXT,
    "product" TEXT,
    "format" "IdeaFormat" NOT NULL,
    "aspectRatio" "AspectRatio" NOT NULL DEFAULT 'NINE_SIXTEEN',
    "estimatedDurationSeconds" INTEGER,
    "status" "VideoProjectStatus" NOT NULL DEFAULT 'IDEA',
    "priority" "ProjectPriority" NOT NULL DEFAULT 'NORMAL',
    "thumbnailUrl" TEXT,
    "ownerId" TEXT,
    "plannedShootDate" TIMESTAMP(3),
    "plannedPublishDate" TIMESTAMP(3),
    "sourceIdeaId" TEXT,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProject_workspaceId_status_idx" ON "VideoProject"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "VideoProject_workspaceId_createdAt_idx" ON "VideoProject"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProject_workspaceId_slug_key" ON "VideoProject"("workspaceId", "slug");

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_sourceIdeaId_fkey" FOREIGN KEY ("sourceIdeaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
