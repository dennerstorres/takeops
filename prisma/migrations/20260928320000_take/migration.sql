-- CreateEnum
CREATE TYPE "TakeStatus" AS ENUM ('OK', 'RETAKE', 'DISCARDED');

-- CreateTable
CREATE TABLE "Take" (
    "id" TEXT NOT NULL,
    "shotId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "TakeStatus" NOT NULL,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "recordedById" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Take_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Take_shotId_status_idx" ON "Take"("shotId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Take_shotId_number_key" ON "Take"("shotId", "number");

-- AddForeignKey
ALTER TABLE "Take" ADD CONSTRAINT "Take_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Take" ADD CONSTRAINT "Take_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
