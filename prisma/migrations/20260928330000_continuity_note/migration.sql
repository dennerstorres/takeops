-- CreateTable
CREATE TABLE "ContinuityNote" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContinuityNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContinuityNote_videoProjectId_category_idx" ON "ContinuityNote"("videoProjectId", "category");

-- AddForeignKey
ALTER TABLE "ContinuityNote" ADD CONSTRAINT "ContinuityNote_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContinuityNote" ADD CONSTRAINT "ContinuityNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
