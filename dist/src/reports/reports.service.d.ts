import { PrismaService } from '../prisma/prisma.service';
import { UpsertClassReportDto } from './dto/upsert-class-report.dto';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getForTutor(sessionId: string, userId: string): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            journeyStep: import("@prisma/client").$Enums.JourneyStep | null;
            stoppedAt: Date | null;
            tutor: {
                tutorProfileId: string;
                fullName: string;
                phone: string | null;
            };
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        report: {
            id: string;
            topicsCovered: string;
            homework: string | null;
            studentNotes: string | null;
            performance: string | null;
            nextPlan: string | null;
            filledAt: Date;
            updatedAt: Date;
        } | null;
        canEdit: boolean;
    }>;
    upsertForTutor(sessionId: string, userId: string, dto: UpsertClassReportDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            journeyStep: import("@prisma/client").$Enums.JourneyStep | null;
            stoppedAt: Date | null;
            tutor: {
                tutorProfileId: string;
                fullName: string;
                phone: string | null;
            };
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        report: {
            id: string;
            topicsCovered: string;
            homework: string | null;
            studentNotes: string | null;
            performance: string | null;
            nextPlan: string | null;
            filledAt: Date;
            updatedAt: Date;
        } | null;
        canEdit: boolean;
    }>;
    getPdfForTutor(sessionId: string, userId: string): Promise<{
        filename: string;
        buffer: Buffer<ArrayBufferLike>;
    }>;
    getForCeo(sessionId: string): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            notes: string | null;
            journeyStep: import("@prisma/client").$Enums.JourneyStep | null;
            stoppedAt: Date | null;
            tutor: {
                tutorProfileId: string;
                fullName: string;
                phone: string | null;
            };
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
            } | null;
        };
        report: {
            id: string;
            topicsCovered: string;
            homework: string | null;
            studentNotes: string | null;
            performance: string | null;
            nextPlan: string | null;
            filledAt: Date;
            updatedAt: Date;
        } | null;
        canEdit: boolean;
    }>;
    getPdfForCeo(sessionId: string): Promise<{
        filename: string;
        buffer: Buffer<ArrayBufferLike>;
    }>;
    private buildPdfBuffer;
    private assertCanWriteReport;
    private loadOnlineSessionForTutor;
    private loadOnlineSession;
    private toPublic;
}
