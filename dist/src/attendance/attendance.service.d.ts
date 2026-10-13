import { PrismaService } from '../prisma/prisma.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';
export declare class AttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRosterForTutor(sessionId: string, userId: string): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
        };
        note: string;
        emptyHelp: string | null;
        students: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
            status: import("@prisma/client").$Enums.AttendanceStatus | null;
            effectiveStatus: import("@prisma/client").$Enums.AttendanceStatus;
            markedAt: Date | null;
        }[];
    }>;
    saveForTutor(sessionId: string, userId: string, dto: SaveAttendanceDto): Promise<{
        session: {
            id: string;
            title: string | null;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            status: import("@prisma/client").$Enums.SessionStatus;
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
        };
        note: string;
        emptyHelp: string | null;
        students: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
            status: import("@prisma/client").$Enums.AttendanceStatus | null;
            effectiveStatus: import("@prisma/client").$Enums.AttendanceStatus;
            markedAt: Date | null;
        }[];
    }>;
    private loadOfflineSessionForTutor;
}
