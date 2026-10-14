CREATE TABLE "Quiz" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "createdBy" TEXT NOT NULL,
  "questions" JSONB NOT NULL, "dueAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QuizAssignment" (
  "id" TEXT NOT NULL, "quizId" TEXT NOT NULL, "studentId" TEXT NOT NULL,
  "answers" INTEGER[], "score" INTEGER, "submittedAt" TIMESTAMP(3),
  CONSTRAINT "QuizAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Quiz_createdBy_idx" ON "Quiz"("createdBy");
CREATE UNIQUE INDEX "QuizAssignment_quizId_studentId_key" ON "QuizAssignment"("quizId", "studentId");
CREATE INDEX "QuizAssignment_studentId_idx" ON "QuizAssignment"("studentId");
ALTER TABLE "QuizAssignment" ADD CONSTRAINT "QuizAssignment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAssignment" ADD CONSTRAINT "QuizAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
