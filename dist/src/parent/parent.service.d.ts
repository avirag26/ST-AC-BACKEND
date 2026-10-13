import { AttendanceStatus, SessionMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ParentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getClasses(userId: string): Promise<{
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
                status: AttendanceStatus;
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
                status: AttendanceStatus;
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
                status: AttendanceStatus;
                source: "marked" | "default_absent";
            } | null;
        }[];
    }>;
    getAttendanceCalendar(userId: string, month?: string): Promise<{
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
            status: AttendanceStatus;
            mode: SessionMode;
            title: string | null;
        }[];
    }>;
    private requireParent;
    private findSessionsForStudents;
    private studentsForSession;
    private effectiveAttendance;
    private dayKey;
    private monthKey;
    private parseMonth;
}
