import type { Request } from 'express';
import { AttendanceService } from './attendance.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    getRoster(id: string, req: AuthRequest): Promise<{
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
    save(id: string, req: AuthRequest, dto: SaveAttendanceDto): Promise<{
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
}
export {};
