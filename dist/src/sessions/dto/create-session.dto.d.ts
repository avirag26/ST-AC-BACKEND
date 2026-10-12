import { SessionMode } from '@prisma/client';
export declare class CreateSessionDto {
    mode: SessionMode;
    tutorProfileId: string;
    startsAt: string;
    endsAt: string;
    title?: string;
    subjectName?: string;
    batchId?: string;
    studentId?: string;
    notes?: string;
}
