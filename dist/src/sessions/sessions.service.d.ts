import { SessionMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
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
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
    }[]>;
    listForTutor(userId: string): Promise<{
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
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
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
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
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
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
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
        } | null;
        student: {
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        } | null;
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
