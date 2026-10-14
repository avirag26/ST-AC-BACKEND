import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, SaveExamMarkDto } from './exams.dto';
export type ExamActor = {
    userId: string;
    role: string;
};
export declare class ExamsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    options(): Promise<{
        students: {
            id: string;
            fullName: string;
            className: string | null;
        }[];
        tutors: {
            id: string;
            user: {
                fullName: string;
            };
        }[];
        subjects: {
            name: string;
        }[];
    }>;
    create(dto: CreateExamDto): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        startsAt: Date;
        tutorProfileId: string;
    }>;
    list(actor: ExamActor): Promise<({
        tutorProfile: {
            user: {
                fullName: string;
            };
        };
        subjects: {
            id: string;
            name: string;
            maxMarks: number;
            examId: string;
        }[];
        marks: ({
            student: {
                fullName: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            subject: string;
            attendance: import("@prisma/client").$Enums.AttendanceStatus | null;
            studentId: string;
            score: number | null;
            feedback: string | null;
            examId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        startsAt: Date;
        tutorProfileId: string;
    })[]>;
    mark(actor: ExamActor, id: string, dto: SaveExamMarkDto): Promise<{
        id: string;
        updatedAt: Date;
        subject: string;
        attendance: import("@prisma/client").$Enums.AttendanceStatus | null;
        studentId: string;
        score: number | null;
        feedback: string | null;
        examId: string;
    }>;
}
