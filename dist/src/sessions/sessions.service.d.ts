import { SessionMode, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
type TutorListFilters = {
    from?: string;
    to?: string;
    status?: SessionStatus;
    studentId?: string;
};
export declare class SessionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(mode?: SessionMode): Promise<{
        id: string;
        title: string | null;
        mode: import("@prisma/client").$Enums.SessionMode;
        status: import("@prisma/client").$Enums.SessionStatus;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        batch: {
            id: string;
            name: string;
            className: string;
            studentCount: number;
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
        journey: {
            step: string;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            stoppedAt: Date | null;
        } | null;
        hours: {
            travelMinutes: number | null;
            classMinutes: number | null;
            totalMinutes: number | null;
        };
    }[]>;
    listForTutor(userId: string, filters?: TutorListFilters): Promise<{
        id: string;
        title: string | null;
        mode: import("@prisma/client").$Enums.SessionMode;
        status: import("@prisma/client").$Enums.SessionStatus;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        batch: {
            id: string;
            name: string;
            className: string;
            studentCount: number;
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
        journey: {
            step: string;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            stoppedAt: Date | null;
        } | null;
        hours: {
            travelMinutes: number | null;
            classMinutes: number | null;
            totalMinutes: number | null;
        };
    }[]>;
    hoursSummaryForTutor(userId: string, filters?: Pick<TutorListFilters, 'from' | 'to'>): Promise<{
        from: string | null;
        to: string | null;
        completedSessions: number;
        sessionsWithClassHours: number;
        totals: {
            classMinutes: number;
            travelMinutes: number;
            totalMinutes: number;
            classHours: number;
            travelHours: number;
            totalHours: number;
        };
        sessions: {
            id: string;
            title: string | null;
            mode: import("@prisma/client").$Enums.SessionMode;
            status: import("@prisma/client").$Enums.SessionStatus;
            subjectName: string | null;
            startsAt: Date;
            endsAt: Date;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            tutor: {
                tutorProfileId: string;
                userId: string;
                fullName: string;
                phone: string | null;
                role: import("@prisma/client").$Enums.UserRole;
                status: import("@prisma/client").$Enums.UserStatus;
            };
            batch: {
                id: string;
                name: string;
                className: string;
                studentCount: number;
            } | null;
            student: {
                id: string;
                fullName: string;
                className: string | null;
                parentName: string;
                parentEmail: string;
            } | null;
            journey: {
                step: string;
                leftHomeAt: Date | null;
                reachedAt: Date | null;
                classStartedAt: Date | null;
                stoppedAt: Date | null;
            } | null;
            hours: {
                travelMinutes: number | null;
                classMinutes: number | null;
                totalMinutes: number | null;
            };
        }[];
    }>;
    private dateRangeWhere;
    private minutesBetween;
    private computeHours;
    getOne(id: string): Promise<{
        id: string;
        title: string | null;
        mode: import("@prisma/client").$Enums.SessionMode;
        status: import("@prisma/client").$Enums.SessionStatus;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        batch: {
            id: string;
            name: string;
            className: string;
            studentCount: number;
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
        journey: {
            step: string;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            stoppedAt: Date | null;
        } | null;
        hours: {
            travelMinutes: number | null;
            classMinutes: number | null;
            totalMinutes: number | null;
        };
    }>;
    create(dto: CreateSessionDto): Promise<{
        id: string;
        title: string | null;
        mode: import("@prisma/client").$Enums.SessionMode;
        status: import("@prisma/client").$Enums.SessionStatus;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        batch: {
            id: string;
            name: string;
            className: string;
            studentCount: number;
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
        journey: {
            step: string;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            stoppedAt: Date | null;
        } | null;
        hours: {
            travelMinutes: number | null;
            classMinutes: number | null;
            totalMinutes: number | null;
        };
    }>;
    update(id: string, dto: UpdateSessionDto): Promise<{
        id: string;
        title: string | null;
        mode: import("@prisma/client").$Enums.SessionMode;
        status: import("@prisma/client").$Enums.SessionStatus;
        subjectName: string | null;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
        batch: {
            id: string;
            name: string;
            className: string;
            studentCount: number;
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
        journey: {
            step: string;
            leftHomeAt: Date | null;
            reachedAt: Date | null;
            classStartedAt: Date | null;
            stoppedAt: Date | null;
        } | null;
        hours: {
            travelMinutes: number | null;
            classMinutes: number | null;
            totalMinutes: number | null;
        };
    }>;
    listTutors(mode: SessionMode): Promise<{
        tutorProfileId: string;
        userId: string;
        fullName: string;
        phone: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        role: import("@prisma/client").$Enums.UserRole;
    }[]>;
    private assertTimeRange;
    private assertTutor;
    private assertActiveBatch;
    private assertStudent;
    private toPublic;
}
export {};
