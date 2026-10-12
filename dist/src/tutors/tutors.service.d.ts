import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class TutorsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(status?: UserStatus): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        dob: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        rejectionReason: string | null;
        createdAt: Date;
        subjects: string[];
        classes: string[];
        documentsNote: string | null;
        salaryStatus: string | null;
    }[]>;
    getOne(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        dob: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        rejectionReason: string | null;
        createdAt: Date;
        subjects: string[];
        classes: string[];
        documentsNote: string | null;
        salaryStatus: string | null;
    }>;
    approve(id: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        dob: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        rejectionReason: string | null;
        createdAt: Date;
        subjects: string[];
        classes: string[];
        documentsNote: string | null;
        salaryStatus: string | null;
    }>;
    reject(id: string, reason?: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        dob: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        rejectionReason: string | null;
        createdAt: Date;
        subjects: string[];
        classes: string[];
        documentsNote: string | null;
        salaryStatus: string | null;
    }>;
    private findTutorOrThrow;
    private toTutorCard;
}
