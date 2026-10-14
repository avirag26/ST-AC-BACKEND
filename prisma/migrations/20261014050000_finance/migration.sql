CREATE TABLE "Fee" (
  "id" TEXT NOT NULL, "studentId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "amount" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR',
  "dueAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Fee_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Fee_positive_amount" CHECK ("amount" > 0)
);
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL, "feeId" TEXT NOT NULL, "amount" INTEGER NOT NULL,
  "reference" TEXT NOT NULL, "recordedBy" TEXT NOT NULL, "requestId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_positive_amount" CHECK ("amount" > 0)
);
CREATE TABLE "SalaryPayment" (
  "id" TEXT NOT NULL, "tutorProfileId" TEXT NOT NULL, "period" TEXT NOT NULL,
  "amount" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR',
  "reference" TEXT NOT NULL, "recordedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SalaryPayment_positive_amount" CHECK ("amount" > 0)
);
CREATE INDEX "Fee_studentId_dueAt_idx" ON "Fee"("studentId", "dueAt");
CREATE INDEX "Payment_feeId_idx" ON "Payment"("feeId");
CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");
CREATE UNIQUE INDEX "SalaryPayment_tutorProfileId_period_key" ON "SalaryPayment"("tutorProfileId", "period");
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
