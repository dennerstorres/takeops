-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "videoProjectId" TEXT NOT NULL,
    "hook" TEXT,
    "mainMessage" TEXT,
    "cta" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Script_videoProjectId_key" ON "Script"("videoProjectId");

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
