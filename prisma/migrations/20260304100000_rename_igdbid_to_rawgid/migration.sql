-- DropIndex
DROP INDEX "Game_igdbId_key";

-- DropIndex
DROP INDEX "Game_igdbId_idx";

-- AlterTable
ALTER TABLE "Game" RENAME COLUMN "igdbId" TO "rawgId";

-- CreateIndex
CREATE UNIQUE INDEX "Game_rawgId_key" ON "Game"("rawgId");

-- CreateIndex
CREATE INDEX "Game_rawgId_idx" ON "Game"("rawgId");
