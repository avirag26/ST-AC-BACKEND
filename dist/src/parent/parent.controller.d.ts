import type { Request } from 'express';
import { ParentService } from './parent.service';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class ParentController {
    private readonly parentService;
    constructor(parentService: ParentService);
    classes(req: AuthRequest): Promise<{
        students: {
            id: string;
            fullName: string;
            className: string | null;
        }[];
        upcoming: {
            sessionId: string;
            studentId: string;
            studentName: string;
            title: string | null;
            subjectName: string | null;
            mode: import("@prisma/client").$Enums.SessionMode;
            status: import("@prisma/client").$Enums.SessionStatus;
            startsAt: Date;
            endsAt: Date;
            notes: string | null;
            tutorName: string;
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
            attendance: {
                status: import("@prisma/client").AttendanceStatus;
                source: "marked" | "default_absent";
            } | null;
        }[];
        completed: {
            sessionId: string;
            studentId: string;
            studentName: string;
            title: string | null;
            subjectName: string | null;
            mode: import("@prisma/client").$Enums.SessionMode;
            status: import("@prisma/client").$Enums.SessionStatus;
            startsAt: Date;
            endsAt: Date;
            notes: string | null;
            tutorName: string;
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
            attendance: {
                status: import("@prisma/client").AttendanceStatus;
                source: "marked" | "default_absent";
            } | null;
        }[];
        cancelled: {
            sessionId: string;
            studentId: string;
            studentName: string;
            title: string | null;
            subjectName: string | null;
            mode: import("@prisma/client").$Enums.SessionMode;
            status: import("@prisma/client").$Enums.SessionStatus;
            startsAt: Date;
            endsAt: Date;
            notes: string | null;
            tutorName: string;
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
            attendance: {
                status: import("@prisma/client").AttendanceStatus;
                source: "marked" | "default_absent";
            } | null;
        }[];
    }>;
    attendance(req: AuthRequest, month?: string): Promise<{
        month: string;
        days: never[];
        students?: undefined;
    } | {
        month: string;
        students: {
            id: string;
            fullName: string;
            className: string | null;
        }[];
        days: {
            date: string;
            studentId: string;
            studentName: string;
            sessionId: string;
            status: import("@prisma/client").AttendanceStatus;
            mode: import("@prisma/client").SessionMode;
            title: string | null;
        }[];
    }>;
}
export {};
