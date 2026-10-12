-- Student uses parent login only: add fullName, make userId optional

ALTER TABLE "Student" ADD COLUMN "fullName" TEXT;

UPDATE "Student" AS s
SET "fullName" = u."fullName"
FROM "User" AS u
WHERE s."userId" = u."id";

UPDATE "Student" SET "fullName" = 'Student' WHERE "fullName" IS NULL;

ALTER TABLE "Student" ALTER COLUMN "fullName" SET NOT NULL;

ALTER TABLE "Student" DROP CONSTRAINT "Student_userId_fkey";

ALTER TABLE "Student" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
