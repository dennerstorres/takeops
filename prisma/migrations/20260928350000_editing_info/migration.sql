-- CreateTable
CREATE TABLE "EditingInfo" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "editorId" TEXT,
    "software" TEXT,
    "projectFileUrl" TEXT,
    "notes" TEXT,
    "targetResolution" TEXT,
    "targetFps" DOUBLE PRECISION,
    "aspectRatio" "AspectRatio",
    "captionsRequired" BOOLEAN NOT NULL DEFAULT false,
    "musicRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditingInfo_videoProjectId_key" ON "EditingInfo"("videoProjectId");

-- CreateIndex
CREATE INDEX "EditingInfo_editorId_idx" ON "EditingInfo"("editorId");

-- AddForeignKey
ALTER TABLE "EditingInfo" ADD CONSTRAINT "EditingInfo_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditingInfo" ADD CONSTRAINT "EditingInfo_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
