CREATE TABLE "Exam" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "tutorProfileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExamSubject" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "maxMarks" INTEGER NOT NULL,
  CONSTRAINT "ExamSubject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExamSubject_positive_max" CHECK ("maxMarks" > 0)
);
CREATE TABLE "ExamMark" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "attendance" "AttendanceStatus",
  "feedback" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamMark_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExamMark_nonnegative_score" CHECK ("score" IS NULL OR "score" >= 0),
  CONSTRAINT "ExamMark_absent_score" CHECK ("attendance" IS DISTINCT FROM 'ABSENT' OR "score" IS NULL)
);
CREATE INDEX "Exam_tutorProfileId_startsAt_idx" ON "Exam"("tutorProfileId", "startsAt");
CREATE UNIQUE INDEX "ExamSubject_examId_name_key" ON "ExamSubject"("examId", "name");
CREATE UNIQUE INDEX "ExamMark_examId_studentId_subject_key" ON "ExamMark"("examId", "studentId", "subject");
CREATE INDEX "ExamMark_studentId_idx" ON "ExamMark"("studentId");
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
