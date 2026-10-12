import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentParentDto } from './dto/create-student-parent.dto';
export declare class StudentsService {
    private readonly prisma;
    private readonly email;
    constructor(prisma: PrismaService, email: EmailService);
    list(): Promise<{
        id: string;
        fullName: string;
        className: string | null;
        createdAt: Date;
        parent: {
            profileId: string;
            userId: string;
            fullName: string;
            email: string;
            phone: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            mustChangePassword: boolean;
        };
    }[]>;
    create(dto: CreateStudentParentDto): Promise<{
        message: string;
        emailDelivery: {
            emailed: boolean;
            reason: string;
        };
        credentials: {
            email: string;
            temporaryPassword: string;
        };
        student: {
            id: string;
            fullName: string;
            className: string | null;
        };
        parent: {
            profileId: string;
            userId: string;
            fullName: string;
            email: string;
            phone: string | null;
        };
    }>;
}
