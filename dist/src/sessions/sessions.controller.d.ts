import type { Request } from 'express';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    list(mode?: string): Promise<{
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
    }[]>;
    listMine(req: AuthRequest): Promise<{
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
    }[]>;
    listTutors(mode?: string): Promise<{
        tutorProfileId: string;
        userId: string;
        fullName: string;
        phone: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        role: import("@prisma/client").$Enums.UserRole;
    }[]>;
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
    }>;
}
export {};
