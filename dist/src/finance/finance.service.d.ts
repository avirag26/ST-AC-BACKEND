import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeDto, RecordPaymentDto, RecordSalaryDto } from './finance.dto';
type Actor = {
    userId: string;
    role: string;
};
export declare class FinanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    fees(actor: Actor): Promise<{
        paid: number;
        balance: number;
        student: {
            fullName: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            amount: number;
            reference: string;
            requestId: string;
            feeId: string;
            recordedBy: string;
        }[];
        id: string;
        createdAt: Date;
        studentId: string;
        title: string;
        amount: number;
        currency: string;
        dueAt: Date;
    }[]>;
    create(dto: CreateFeeDto): Promise<{
        id: string;
        createdAt: Date;
        studentId: string;
        title: string;
        amount: number;
        currency: string;
        dueAt: Date;
    }>;
    pay(actor: Actor, feeId: string, dto: RecordPaymentDto): Promise<{
        id: string;
        createdAt: Date;
        amount: number;
        reference: string;
        requestId: string;
        feeId: string;
        recordedBy: string;
    }>;
    salaries(actor: Actor): Prisma.PrismaPromise<({
        tutorProfile: {
            user: {
                fullName: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        tutorProfileId: string;
        amount: number;
        currency: string;
        reference: string;
        period: string;
        recordedBy: string;
    })[]>;
    salary(actor: Actor, dto: RecordSalaryDto): Promise<{
        id: string;
        createdAt: Date;
        tutorProfileId: string;
        amount: number;
        currency: string;
        reference: string;
        period: string;
        recordedBy: string;
    }>;
}
export {};
