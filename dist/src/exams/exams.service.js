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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const managers = [client_1.UserRole.CEO, client_1.UserRole.ADMIN];
let ExamsService = class ExamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async options() {
        const [students, tutors, subjects] = await Promise.all([
            this.prisma.student.findMany({ select: { id: true, fullName: true, className: true }, orderBy: { fullName: 'asc' } }),
            this.prisma.tutorProfile.findMany({ where: { user: { role: { in: [client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR] }, status: { in: [client_1.UserStatus.APPROVED, client_1.UserStatus.ACTIVE] } } }, select: { id: true, user: { select: { fullName: true } } } }),
            this.prisma.subject.findMany({ where: { isActive: true }, select: { name: true }, orderBy: { name: 'asc' } }),
        ]);
        return { students, tutors, subjects };
    }
    async create(dto) {
        const names = dto.subjects.map((s) => s.name.trim());
        if (!dto.title.trim() || names.some((s) => !s) || new Set(names.map((s) => s.toLowerCase())).size !== names.length) {
            throw new common_1.BadRequestException('Use a title and unique, non-empty subjects.');
        }
        return this.prisma.$transaction(async (tx) => {
            const tutor = await tx.tutorProfile.findFirst({ where: { id: dto.tutorProfileId, user: { role: { in: [client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR] }, status: { in: [client_1.UserStatus.APPROVED, client_1.UserStatus.ACTIVE] } } } });
            if (!tutor)
                throw new common_1.BadRequestException('Choose an approved tutor.');
            const count = await tx.student.count({ where: { id: { in: dto.studentIds } } });
            if (count !== dto.studentIds.length)
                throw new common_1.BadRequestException('One or more students no longer exist.');
            const subjects = await tx.subject.count({ where: { name: { in: names }, isActive: true } });
            if (subjects !== names.length)
                throw new common_1.BadRequestException('Choose active catalog subjects.');
            return tx.exam.create({ data: {
                    title: dto.title.trim(), startsAt: new Date(dto.startsAt), tutorProfileId: tutor.id,
                    subjects: { create: dto.subjects.map((s) => ({ name: s.name.trim(), maxMarks: s.maxMarks })) },
                    marks: { create: dto.studentIds.flatMap((studentId) => names.map((subject) => ({ studentId, subject }))) },
                } });
        });
    }
    async list(actor) {
        const parent = actor.role === client_1.UserRole.PARENT;
        const ownChildren = { student: { parent: { userId: actor.userId } } };
        const where = managers.includes(actor.role) ? {} : parent
            ? { marks: { some: ownChildren } } : { tutorProfile: { userId: actor.userId } };
        return this.prisma.exam.findMany({
            where, orderBy: { startsAt: 'desc' },
            include: {
                subjects: true,
                tutorProfile: { select: { user: { select: { fullName: true } } } },
                marks: { where: parent ? ownChildren : undefined, orderBy: [{ studentId: 'asc' }, { subject: 'asc' }],
                    include: { student: { select: { fullName: true } } } },
            },
        });
    }
    async mark(actor, id, dto) {
        const mark = await this.prisma.examMark.findFirst({ where: {
                id, ...(managers.includes(actor.role) ? {} : { exam: { tutorProfile: { userId: actor.userId } } }),
            }, include: { exam: { include: { subjects: true } } } });
        if (!mark)
            throw new common_1.NotFoundException('Exam result not found.');
        const subject = mark.exam.subjects.find((s) => s.name === mark.subject);
        if (dto.attendance === 'PRESENT' && (dto.score == null || dto.score > subject.maxMarks)) {
            throw new common_1.BadRequestException(`Enter a score between 0 and ${subject.maxMarks}.`);
        }
        if (dto.attendance === 'ABSENT' && dto.score != null)
            throw new common_1.BadRequestException('An absent student cannot have a score.');
        if (mark.exam.startsAt > new Date())
            throw new common_1.BadRequestException('Marks can be recorded after the exam starts.');
        return this.prisma.examMark.update({ where: { id }, data: {
                attendance: dto.attendance, score: dto.attendance === 'ABSENT' ? null : dto.score,
                feedback: dto.feedback?.trim() || null,
            } });
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map