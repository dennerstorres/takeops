-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "videoProjectId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_workspaceId_readAt_idx" ON "Notification"("userId", "workspaceId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_workspaceId_createdAt_idx" ON "Notification"("userId", "workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_videoProjectId_fkey" FOREIGN KEY ("videoProjectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
