-- CreateTable
CREATE TABLE "ClassReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "topicsCovered" TEXT NOT NULL,
    "homework" TEXT,
    "studentNotes" TEXT,
    "performance" TEXT,
    "nextPlan" TEXT,
    "filledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassReport_sessionId_key" ON "ClassReport"("sessionId");

-- AddForeignKey
ALTER TABLE "ClassReport" ADD CONSTRAINT "ClassReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
