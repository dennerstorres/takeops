-- CreateEnum
CREATE TYPE "IdeaFormat" AS ENUM ('TUTORIAL', 'SKETCH', 'DEMO', 'FEATURE', 'INSTITUTIONAL', 'EDUCATIONAL', 'BEHIND_THE_SCENES', 'OTHER');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'APPROVED', 'DISCARDED', 'CONVERTED');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "format" "IdeaFormat",
    "objective" TEXT,
    "product" TEXT,
    "audience" TEXT,
    "referenceUrl" TEXT,
    "notes" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "IdeaStatus" NOT NULL DEFAULT 'NEW',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Idea_workspaceId_createdAt_idx" ON "Idea"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
