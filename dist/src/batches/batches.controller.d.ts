import type { Request } from 'express';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
};
export declare class BatchesController {
    private readonly batchesService;
    constructor(batchesService: BatchesService);
    list(): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        studentCount: number;
    }[]>;
    listMine(req: AuthRequest): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }[]>;
    listOfflineTutors(): Promise<{
        tutorProfileId: string;
        userId: string;
        fullName: string;
        phone: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
    }[]>;
    getOne(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }>;
    create(dto: CreateBatchDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }>;
    update(id: string, dto: UpdateBatchDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }>;
    enroll(id: string, dto: EnrollStudentsDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }>;
    unenroll(id: string, studentId: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        classGrade: {
            id: string;
            name: string;
            isActive: boolean;
        };
        tutor: {
            tutorProfileId: string;
            userId: string;
            fullName: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
        } | null;
        students: {
            enrollmentId: string;
            enrolledAt: Date;
            id: string;
            fullName: string;
            className: string | null;
            parentName: string;
            parentEmail: string;
        }[];
        studentCount: number;
    }>;
}
export {};
