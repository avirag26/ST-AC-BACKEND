-- CreateEnum
CREATE TYPE "JourneyStep" AS ENUM ('NOT_STARTED', 'LEFT_HOME', 'REACHED', 'CLASS_STARTED', 'STOPPED');

-- CreateTable
CREATE TABLE "SessionJourney" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "step" "JourneyStep" NOT NULL DEFAULT 'NOT_STARTED',
    "leftHomeAt" TIMESTAMP(3),
    "leftHomeLat" DOUBLE PRECISION,
    "leftHomeLng" DOUBLE PRECISION,
    "reachedAt" TIMESTAMP(3),
    "reachedLat" DOUBLE PRECISION,
    "reachedLng" DOUBLE PRECISION,
    "classStartedAt" TIMESTAMP(3),
    "classStartedLat" DOUBLE PRECISION,
    "classStartedLng" DOUBLE PRECISION,
    "stoppedAt" TIMESTAMP(3),
    "stoppedLat" DOUBLE PRECISION,
    "stoppedLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionJourney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionJourney_sessionId_key" ON "SessionJourney"("sessionId");

-- AddForeignKey
ALTER TABLE "SessionJourney" ADD CONSTRAINT "SessionJourney_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
