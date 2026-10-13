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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRosterForTutor(sessionId, userId) {
        const session = await this.loadOfflineSessionForTutor(sessionId, userId);
        const enrolled = await this.prisma.batchStudent.findMany({
            where: { batchId: session.batchId },
            orderBy: { createdAt: 'asc' },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: {
                                user: { select: { fullName: true, email: true } },
                            },
                        },
                    },
                },
            },
        });
        const marks = await this.prisma.attendance.findMany({
            where: { sessionId },
        });
        const markByStudent = new Map(marks.map((m) => [m.studentId, m]));
        return {
            session: {
                id: session.id,
                title: session.title,
                subjectName: session.subjectName,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                status: session.status,
                batch: session.batch
                    ? {
                        id: session.batch.id,
                        name: session.batch.name,
                        className: session.batch.classGrade.name,
                    }
                    : null,
            },
            note: 'Unmarked students count as Absent for parent view.',
            emptyHelp: enrolled.length === 0
                ? 'This batch has no enrolled students. In the CEO portal open Offline batches, select this batch, then Enroll students before marking attendance.'
                : null,
            students: enrolled.map((row) => {
                const mark = markByStudent.get(row.student.id);
                return {
                    id: row.student.id,
                    fullName: row.student.fullName,
                    className: row.student.className,
                    parentName: row.student.parent.user.fullName,
                    parentEmail: row.student.parent.user.email,
                    status: mark?.status ?? null,
                    effectiveStatus: mark?.status ?? client_1.AttendanceStatus.ABSENT,
                    markedAt: mark?.markedAt ?? null,
                };
            }),
        };
    }
    async saveForTutor(sessionId, userId, dto) {
        const session = await this.loadOfflineSessionForTutor(sessionId, userId);
        const enrolledIds = new Set((await this.prisma.batchStudent.findMany({
            where: { batchId: session.batchId },
            select: { studentId: true },
        })).map((r) => r.studentId));
        if (session.status === client_1.SessionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot mark attendance on a cancelled session.');
        }
        if (enrolledIds.size === 0) {
            throw new common_1.BadRequestException('This batch has no enrolled students. Enroll students before marking attendance.');
        }
        for (const mark of dto.marks) {
            if (!enrolledIds.has(mark.studentId)) {
                throw new common_1.BadRequestException('One or more students are not in this session batch.');
            }
        }
        await this.prisma.$transaction([
            ...dto.marks.map((mark) => this.prisma.attendance.upsert({
                where: {
                    sessionId_studentId: {
                        sessionId,
                        studentId: mark.studentId,
                    },
                },
                create: {
                    sessionId,
                    studentId: mark.studentId,
                    status: mark.status,
                    markedByUserId: userId,
                },
                update: {
                    status: mark.status,
                    markedByUserId: userId,
                    markedAt: new Date(),
                },
            })),
            this.prisma.session.update({
                where: { id: sessionId },
                data: { status: client_1.SessionStatus.COMPLETED },
            }),
        ]);
        return this.getRosterForTutor(sessionId, userId);
    }
    async loadOfflineSessionForTutor(sessionId, userId) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
            include: { user: { select: { role: true } } },
        });
        if (!profile || profile.user.role !== client_1.UserRole.OFFLINE_TUTOR) {
            throw new common_1.ForbiddenException('Only offline tutors can mark attendance.');
        }
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                        classGrade: { select: { name: true } },
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found.');
        }
        if (session.tutorProfileId !== profile.id) {
            throw new common_1.ForbiddenException('This session is not assigned to you.');
        }
        if (session.mode !== client_1.SessionMode.OFFLINE || !session.batchId) {
            throw new common_1.BadRequestException('Attendance is only for offline batch sessions.');
        }
        return session;
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map