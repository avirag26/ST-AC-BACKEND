import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, SubmitQuizDto } from './quizzes.dto';
import type { QuestionDto } from './quizzes.dto';
type Actor = {
    userId: string;
    role: string;
};
export declare class QuizzesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private studentsWhere;
    options(actor: Actor): Prisma.PrismaPromise<{
        id: string;
        fullName: string;
        className: string | null;
    }[]>;
    create(actor: Actor, dto: CreateQuizDto): Promise<{
        id: string;
    }>;
    list(actor: Actor): Promise<{
        questions: (QuestionDto | {
            prompt: string;
            options: string[];
        })[];
        assignments: ({
            student: {
                fullName: string;
            };
        } & {
            id: string;
            studentId: string;
            score: number | null;
            answers: number[];
            submittedAt: Date | null;
            quizId: string;
        })[];
        id: string;
        createdAt: Date;
        title: string;
        dueAt: Date;
        createdBy: string;
    }[]>;
    submit(actor: Actor, id: string, dto: SubmitQuizDto): Promise<{
        score: number;
        total: number;
    }>;
}
export declare class QuizzesModule {
}
export {};
