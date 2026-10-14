import { StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UpsertClassReportDto } from './dto/upsert-class-report.dto';
import { ReportsService } from './reports.service';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getForTutor(id: string, req: AuthRequest): Promise<{
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
    upsertForTutor(id: string, req: AuthRequest, dto: UpsertClassReportDto): Promise<{
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
    pdfForTutor(id: string, req: AuthRequest, res: Response): Promise<StreamableFile>;
    getForCeo(id: string): Promise<{
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
    pdfForCeo(id: string, res: Response): Promise<StreamableFile>;
}
export {};
