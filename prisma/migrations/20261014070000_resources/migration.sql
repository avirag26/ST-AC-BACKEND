CREATE TABLE "Resource" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "subject" TEXT NOT NULL,
  "className" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Resource_storageKey_key" ON "Resource"("storageKey");
CREATE INDEX "Resource_className_subject_idx" ON "Resource"("className", "subject");
