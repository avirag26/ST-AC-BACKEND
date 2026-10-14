import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeDto, RecordPaymentDto, RecordSalaryDto } from './finance.dto';
type Actor = { userId: string; role: string };
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}
  async fees(actor: Actor) {
    const rows = await this.prisma.fee.findMany({
      where: actor.role === UserRole.PARENT ? { student: { parent: { userId: actor.userId } } } : {},
      orderBy: { dueAt: 'desc' },
      include: { student: { select: { fullName: true } }, payments: { orderBy: { createdAt: 'desc' } } },
    });
    return rows.map((fee) => ({ ...fee, paid: fee.payments.reduce((sum, p) => sum + p.amount, 0), balance: fee.amount - fee.payments.reduce((sum, p) => sum + p.amount, 0) }));
  }
  async create(dto: CreateFeeDto) {
    if (!dto.title.trim()) throw new BadRequestException('Enter a fee description.');
    if (!await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { id: true } })) throw new NotFoundException('Student not found.');
    return this.prisma.fee.create({ data: { ...dto, title: dto.title.trim(), dueAt: new Date(dto.dueAt) } });
  }
  async pay(actor: Actor, feeId: string, dto: RecordPaymentDto) {
    if (!dto.reference.trim()) throw new BadRequestException('Enter a payment reference.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.payment.findUnique({ where: { requestId: dto.requestId } });
        if (existing) {
          if (existing.feeId !== feeId || existing.amount !== dto.amount || existing.recordedBy !== actor.userId) throw new ConflictException('Payment request already used.');
          return existing;
        }
        const fee = await tx.fee.findUnique({ where: { id: feeId }, include: { payments: true } });
        if (!fee) throw new NotFoundException('Fee not found.');
        const balance = fee.amount - fee.payments.reduce((sum, p) => sum + p.amount, 0);
        if (dto.amount > balance) throw new BadRequestException('Payment exceeds the remaining balance.');
        return tx.payment.create({ data: { feeId, ...dto, reference: dto.reference.trim(), recordedBy: actor.userId } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(e.code)) throw new ConflictException('Another payment was recorded. Refresh and retry.');
      throw e;
    }
  }
  salaries(actor: Actor) {
    return this.prisma.salaryPayment.findMany({
      where: [UserRole.CEO as string, UserRole.ADMIN as string].includes(actor.role) ? {} : { tutorProfile: { userId: actor.userId } },
      include: { tutorProfile: { select: { user: { select: { fullName: true } } } } },
      orderBy: { period: 'desc' },
    });
  }
  async salary(actor: Actor, dto: RecordSalaryDto) {
    if (!dto.reference.trim()) throw new BadRequestException('Enter a salary payment reference.');
    if (!await this.prisma.tutorProfile.findUnique({ where: { id: dto.tutorProfileId }, select: { id: true } })) throw new NotFoundException('Tutor not found.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const result = await tx.salaryPayment.create({ data: { ...dto, reference: dto.reference.trim(), recordedBy: actor.userId } });
        await tx.tutorProfile.update({ where: { id: dto.tutorProfileId }, data: { salaryStatus: 'CREDITED' } });
        return result;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Salary is already recorded for this tutor and month.');
      throw e;
    }
  }
}
