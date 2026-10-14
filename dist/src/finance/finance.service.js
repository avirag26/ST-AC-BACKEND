"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fees(actor) {
        const rows = await this.prisma.fee.findMany({
            where: actor.role === client_1.UserRole.PARENT ? { student: { parent: { userId: actor.userId } } } : {},
            orderBy: { dueAt: 'desc' },
            include: { student: { select: { fullName: true } }, payments: { orderBy: { createdAt: 'desc' } } },
        });
        return rows.map((fee) => ({ ...fee, paid: fee.payments.reduce((sum, p) => sum + p.amount, 0), balance: fee.amount - fee.payments.reduce((sum, p) => sum + p.amount, 0) }));
    }
    async create(dto) {
        if (!dto.title.trim())
            throw new common_1.BadRequestException('Enter a fee description.');
        if (!await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { id: true } }))
            throw new common_1.NotFoundException('Student not found.');
        return this.prisma.fee.create({ data: { ...dto, title: dto.title.trim(), dueAt: new Date(dto.dueAt) } });
    }
    async pay(actor, feeId, dto) {
        if (!dto.reference.trim())
            throw new common_1.BadRequestException('Enter a payment reference.');
        try {
            return await this.prisma.$transaction(async (tx) => {
                const existing = await tx.payment.findUnique({ where: { requestId: dto.requestId } });
                if (existing) {
                    if (existing.feeId !== feeId || existing.amount !== dto.amount || existing.recordedBy !== actor.userId)
                        throw new common_1.ConflictException('Payment request already used.');
                    return existing;
                }
                const fee = await tx.fee.findUnique({ where: { id: feeId }, include: { payments: true } });
                if (!fee)
                    throw new common_1.NotFoundException('Fee not found.');
                const balance = fee.amount - fee.payments.reduce((sum, p) => sum + p.amount, 0);
                if (dto.amount > balance)
                    throw new common_1.BadRequestException('Payment exceeds the remaining balance.');
                return tx.payment.create({ data: { feeId, ...dto, reference: dto.reference.trim(), recordedBy: actor.userId } });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(e.code))
                throw new common_1.ConflictException('Another payment was recorded. Refresh and retry.');
            throw e;
        }
    }
    salaries(actor) {
        return this.prisma.salaryPayment.findMany({
            where: [client_1.UserRole.CEO, client_1.UserRole.ADMIN].includes(actor.role) ? {} : { tutorProfile: { userId: actor.userId } },
            include: { tutorProfile: { select: { user: { select: { fullName: true } } } } },
            orderBy: { period: 'desc' },
        });
    }
    async salary(actor, dto) {
        if (!dto.reference.trim())
            throw new common_1.BadRequestException('Enter a salary payment reference.');
        if (!await this.prisma.tutorProfile.findUnique({ where: { id: dto.tutorProfileId }, select: { id: true } }))
            throw new common_1.NotFoundException('Tutor not found.');
        try {
            return await this.prisma.$transaction(async (tx) => {
                const result = await tx.salaryPayment.create({ data: { ...dto, reference: dto.reference.trim(), recordedBy: actor.userId } });
                await tx.tutorProfile.update({ where: { id: dto.tutorProfileId }, data: { salaryStatus: 'CREDITED' } });
                return result;
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
                throw new common_1.ConflictException('Salary is already recorded for this tutor and month.');
            throw e;
        }
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map