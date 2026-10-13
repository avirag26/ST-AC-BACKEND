import { CreateStudentParentDto } from './dto/create-student-parent.dto';
import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    list(): Promise<{
        id: string;
        fullName: string;
        className: string | null;
        createdAt: Date;
        batches: {
            id: string;
            name: string;
            isActive: boolean;
            className: string;
        }[];
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
            batch: {
                id: string;
                name: string;
                className: string;
            } | null;
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
