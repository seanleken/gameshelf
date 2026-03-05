-- CreateEnum
CREATE TYPE "LibraryStatus" AS ENUM ('PLAYING', 'COMPLETED', 'BACKLOG', 'DROPPED', 'WISHLIST');

-- CreateTable
CREATE TABLE "LibraryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "status" "LibraryStatus" NOT NULL,
    "rating" DOUBLE PRECISION,
    "hoursPlayed" DOUBLE PRECISION,
    "platform" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryEntry_userId_status_idx" ON "LibraryEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "LibraryEntry_gameId_idx" ON "LibraryEntry"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryEntry_userId_gameId_key" ON "LibraryEntry"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "LibraryEntry" ADD CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEntry" ADD CONSTRAINT "LibraryEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
