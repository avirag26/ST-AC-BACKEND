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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizzesModule = exports.QuizzesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const quizzes_dto_1 = require("./quizzes.dto");
const manager = (actor) => ['CEO', 'ADMIN'].includes(actor.role);
let QuizzesService = class QuizzesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    studentsWhere(actor) {
        if (manager(actor))
            return {};
        return { OR: [
                { sessions: { some: { tutorProfile: { userId: actor.userId } } } },
                { batches: { some: { batch: { isActive: true, tutorProfile: { userId: actor.userId } } } } },
            ] };
    }
    options(actor) {
        return this.prisma.student.findMany({ where: this.studentsWhere(actor), select: { id: true, fullName: true, className: true }, orderBy: { fullName: 'asc' } });
    }
    async create(actor, dto) {
        if (new Date(dto.dueAt) <= new Date())
            throw new common_1.BadRequestException('Choose a future deadline.');
        if (!dto.title.trim() || dto.questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()) || q.correct >= q.options.length))
            throw new common_1.BadRequestException('Complete each question, answer choice, and correct answer.');
        const count = await this.prisma.student.count({ where: { AND: [this.studentsWhere(actor), { id: { in: dto.studentIds } }] } });
        if (count !== dto.studentIds.length)
            throw new common_1.BadRequestException('Choose only students assigned to you.');
        return this.prisma.quiz.create({ data: { title: dto.title.trim(), dueAt: new Date(dto.dueAt), createdBy: actor.userId,
                questions: dto.questions.map((q) => ({ prompt: q.prompt.trim(), options: q.options.map((s) => s.trim()), correct: q.correct })),
                assignments: { create: dto.studentIds.map((studentId) => ({ studentId, answers: [] })) },
            }, select: { id: true } });
    }
    async list(actor) {
        const parent = actor.role === 'PARENT';
        const own = { student: { parent: { userId: actor.userId } } };
        const rows = await this.prisma.quiz.findMany({
            where: parent ? { assignments: { some: own } } : manager(actor) ? {} : { createdBy: actor.userId },
            orderBy: { dueAt: 'desc' },
            include: { assignments: { where: parent ? own : undefined, include: { student: { select: { fullName: true } } } } },
        });
        return rows.map((quiz) => ({ ...quiz, questions: quiz.questions.map((q) => parent ? { prompt: q.prompt, options: q.options } : q) }));
    }
    async submit(actor, id, dto) {
        const assignment = await this.prisma.quizAssignment.findFirst({ where: { id, student: { parent: { userId: actor.userId } } }, include: { quiz: true } });
        if (!assignment)
            throw new common_1.NotFoundException('Quiz not found.');
        if (assignment.quiz.dueAt < new Date())
            throw new common_1.BadRequestException('The quiz deadline has passed.');
        const questions = assignment.quiz.questions;
        if (dto.answers.length !== questions.length || dto.answers.some((answer, i) => answer >= questions[i].options.length))
            throw new common_1.BadRequestException('Answer every question with a valid option.');
        const score = dto.answers.reduce((sum, answer, i) => sum + Number(answer === questions[i].correct), 0);
        const result = await this.prisma.quizAssignment.updateMany({ where: { id, submittedAt: null }, data: { answers: dto.answers, score, submittedAt: new Date() } });
        if (!result.count)
            throw new common_1.ConflictException('This quiz has already been submitted.');
        return { score, total: questions.length };
    }
};
exports.QuizzesService = QuizzesService;
exports.QuizzesService = QuizzesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuizzesService);
let QuizzesController = class QuizzesController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(req) { return this.service.list(req.user); }
    students(req) { return this.service.options(req.user); }
    create(req, dto) { return this.service.create(req.user, dto); }
    submit(req, id, dto) { return this.service.submit(req.user, id, dto); }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('students'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN, client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "students", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN, client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, quizzes_dto_1.CreateQuizDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.PARENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quizzes_dto_1.SubmitQuizDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "submit", null);
QuizzesController = __decorate([
    (0, common_1.Controller)('quizzes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN, client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR, client_1.UserRole.PARENT),
    __metadata("design:paramtypes", [QuizzesService])
], QuizzesController);
let QuizzesModule = class QuizzesModule {
};
exports.QuizzesModule = QuizzesModule;
exports.QuizzesModule = QuizzesModule = __decorate([
    (0, common_1.Module)({ controllers: [QuizzesController], providers: [QuizzesService] })
], QuizzesModule);
//# sourceMappingURL=quizzes.module.js.map