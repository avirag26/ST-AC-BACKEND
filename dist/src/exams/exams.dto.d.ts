import { AttendanceStatus } from '@prisma/client';
export declare class ExamSubjectDto {
    name: string;
    maxMarks: number;
}
export declare class CreateExamDto {
    title: string;
    startsAt: string;
    tutorProfileId: string;
    subjects: ExamSubjectDto[];
    studentIds: string[];
}
export declare class SaveExamMarkDto {
    attendance: AttendanceStatus;
    score?: number;
    feedback?: string;
}
