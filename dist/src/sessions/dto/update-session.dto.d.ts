import { SessionStatus } from '@prisma/client';
export declare class UpdateSessionDto {
    title?: string;
    subjectName?: string | null;
    startsAt?: string;
    endsAt?: string;
    tutorProfileId?: string;
    batchId?: string | null;
    studentId?: string | null;
    notes?: string | null;
    status?: SessionStatus;
}
