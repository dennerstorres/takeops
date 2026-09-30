-- AlterTable
ALTER TABLE "Shoot" ADD COLUMN     "upcomingNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Shoot_scheduledAt_idx" ON "Shoot"("scheduledAt");

