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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const rxjs_1 = require("rxjs");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    prisma;
    logger = new common_1.Logger(AuditInterceptor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        if (!req.user || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.path.includes('/journey/ping'))
            return next.handle();
        return next.handle().pipe((0, rxjs_1.mergeMap)(async (result) => {
            try {
                await this.prisma.auditLog.create({ data: { actorId: req.user.userId, action: req.method, path: req.path } });
            }
            catch {
                this.logger.error('Audit record could not be persisted.');
            }
            return result;
        }));
    }
};
AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditInterceptor);
let ActivityController = class ActivityController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    audit() { return this.prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }); }
    async notifications(req) {
        const actor = req.user;
        const manager = ['CEO', 'ADMIN'].includes(actor.role);
        const parent = actor.role === 'PARENT';
        const notices = [];
        if (manager) {
            const pending = await this.prisma.user.count({ where: { role: { in: ['HOME_TUTOR', 'OFFLINE_TUTOR'] }, status: 'PENDING' } });
            if (pending)
                notices.push({ id: 'approvals', title: pending + ' tutor applications', description: 'Review tutors waiting for approval.', href: '/tutors' });
        }
        const exams = await this.prisma.exam.count({ where: { startsAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
                ...(manager ? {} : parent ? { marks: { some: { student: { parent: { userId: actor.userId } } } } } : { tutorProfile: { userId: actor.userId } }) } });
        if (exams)
            notices.push({ id: 'exams', title: exams + ' exams this week', description: 'Check the timetable and prepare for upcoming exams.', href: '/exams' });
        if (parent || manager) {
            const fees = await this.prisma.fee.findMany({ where: { dueAt: { lte: new Date() }, ...(parent ? { student: { parent: { userId: actor.userId } } } : {}) }, select: { amount: true, payments: { select: { amount: true } } } });
            const overdue = fees.filter((f) => f.payments.reduce((sum, p) => sum + p.amount, 0) < f.amount).length;
            if (overdue)
                notices.push({ id: 'fees', title: overdue + ' outstanding fees', description: 'Review due dates and remaining balances.', href: '/finance' });
        }
        if (parent) {
            const quizzes = await this.prisma.quizAssignment.count({ where: { student: { parent: { userId: actor.userId } }, submittedAt: null, quiz: { dueAt: { gte: new Date() } } } });
            if (quizzes)
                notices.push({ id: 'quizzes', title: quizzes + ' quizzes to complete', description: 'Set aside a little time for practice.', href: '/quizzes' });
        }
        return notices;
    }
};
__decorate([
    (0, common_1.Get)('audit'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)('notifications'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "notifications", null);
ActivityController = __decorate([
    (0, common_1.Controller)('activity'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN, client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR, client_1.UserRole.PARENT),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityController);
let ActivityModule = class ActivityModule {
};
exports.ActivityModule = ActivityModule;
exports.ActivityModule = ActivityModule = __decorate([
    (0, common_1.Module)({ controllers: [ActivityController], providers: [{ provide: core_1.APP_INTERCEPTOR, useClass: AuditInterceptor }] })
], ActivityModule);
//# sourceMappingURL=activity.module.js.map