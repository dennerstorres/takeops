-- AlterTable
ALTER TABLE "VideoProject" ADD COLUMN     "lastEditVersionNumber" INTEGER NOT NULL DEFAULT 0;

-- Produção que já tem versões continua a partir do maior número.
UPDATE "VideoProject" AS p
SET "lastEditVersionNumber" = v.max_number
FROM (
  SELECT "videoProjectId", MAX("versionNumber") AS max_number
  FROM "EditVersion"
  GROUP BY "videoProjectId"
) AS v
WHERE v."videoProjectId" = p."id";
