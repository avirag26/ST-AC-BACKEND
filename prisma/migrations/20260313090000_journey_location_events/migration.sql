-- CreateEnum
CREATE TYPE "JourneyEventKind" AS ENUM ('CHECKPOINT', 'LIVE_PING');

-- CreateTable
CREATE TABLE "JourneyLocationEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "journeyId" TEXT,
    "kind" "JourneyEventKind" NOT NULL,
    "step" "JourneyStep" NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyLocationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JourneyLocationEvent_sessionId_recordedAt_idx" ON "JourneyLocationEvent"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "JourneyLocationEvent_journeyId_idx" ON "JourneyLocationEvent"("journeyId");

-- CreateIndex
CREATE INDEX "JourneyLocationEvent_kind_idx" ON "JourneyLocationEvent"("kind");

-- AddForeignKey
ALTER TABLE "JourneyLocationEvent" ADD CONSTRAINT "JourneyLocationEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyLocationEvent" ADD CONSTRAINT "JourneyLocationEvent_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "SessionJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;
