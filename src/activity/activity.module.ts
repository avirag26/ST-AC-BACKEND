import { CallHandler, Controller, ExecutionContext, Get, Injectable, Logger, Module, NestInterceptor, Req, UseGuards } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { mergeMap } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
type Request = { user?: { userId: string; role: string }; method: string; path: string };
@Injectable()
class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  constructor(private readonly prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.path.includes('/journey/ping')) return next.handle();
    return next.handle().pipe(mergeMap(async (result: unknown) => {
      try { await this.prisma.auditLog.create({ data: { actorId: req.user!.userId, action: req.method, path: req.path } }); }
      catch { this.logger.error('Audit record could not be persisted.'); }
      return result;
    }));
  }
}
@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR, UserRole.PARENT)
class ActivityController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('audit') @Roles(UserRole.CEO, UserRole.ADMIN)
  audit() { return this.prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }); }
  @Get('notifications') async notifications(@Req() req: Request) {
    const actor = req.user!;
    const manager = ['CEO', 'ADMIN'].includes(actor.role);
    const parent = actor.role === 'PARENT';
    const notices: { id: string; title: string; description: string; href: string }[] = [];
    if (manager) {
      const pending = await this.prisma.user.count({ where: { role: { in: ['HOME_TUTOR', 'OFFLINE_TUTOR'] }, status: 'PENDING' } });
      if (pending) notices.push({ id: 'approvals', title: pending + ' tutor applications', description: 'Review tutors waiting for approval.', href: '/tutors' });
    }
    const exams = await this.prisma.exam.count({ where: { startsAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
      ...(manager ? {} : parent ? { marks: { some: { student: { parent: { userId: actor.userId } } } } } : { tutorProfile: { userId: actor.userId } }) } });
    if (exams) notices.push({ id: 'exams', title: exams + ' exams this week', description: 'Check the timetable and prepare for upcoming exams.', href: '/exams' });
    if (parent || manager) {
      const fees = await this.prisma.fee.findMany({ where: { dueAt: { lte: new Date() }, ...(parent ? { student: { parent: { userId: actor.userId } } } : {}) }, select: { amount: true, payments: { select: { amount: true } } } });
      const overdue = fees.filter((f) => f.payments.reduce((sum, p) => sum + p.amount, 0) < f.amount).length;
      if (overdue) notices.push({ id: 'fees', title: overdue + ' outstanding fees', description: 'Review due dates and remaining balances.', href: '/finance' });
    }
    if (parent) {
      const quizzes = await this.prisma.quizAssignment.count({ where: { student: { parent: { userId: actor.userId } }, submittedAt: null, quiz: { dueAt: { gte: new Date() } } } });
      if (quizzes) notices.push({ id: 'quizzes', title: quizzes + ' quizzes to complete', description: 'Set aside a little time for practice.', href: '/quizzes' });
    }
    return notices;
  }
}
@Module({ controllers: [ActivityController], providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }] })
export class ActivityModule {}
