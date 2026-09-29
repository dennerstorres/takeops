-- CreateTable
CREATE TABLE "EditVersion" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT,
    "previewUrl" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditVersion_videoProjectId_versionNumber_key" ON "EditVersion"("videoProjectId", "versionNumber");

-- AddForeignKey
ALTER TABLE "EditVersion" ADD CONSTRAINT "EditVersion_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditVersion" ADD CONSTRAINT "EditVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
