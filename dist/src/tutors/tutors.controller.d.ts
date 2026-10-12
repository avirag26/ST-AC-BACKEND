import { RejectTutorDto } from './dto/reject-tutor.dto';
import { TutorsService } from './tutors.service';
export declare class TutorsController {
    private readonly tutorsService;
    constructor(tutorsService: TutorsService);
    list(status?: string): Promise<{
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
    reject(id: string, dto: RejectTutorDto): Promise<{
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
}
