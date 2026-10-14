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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const sessionInclude = {
    tutorProfile: {
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    status: true,
                },
            },
        },
    },
    batch: {
        select: {
            id: true,
            name: true,
            classGrade: { select: { id: true, name: true } },
            _count: { select: { students: true } },
        },
    },
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
    journey: {
        select: {
            step: true,
            leftHomeAt: true,
            reachedAt: true,
            classStartedAt: true,
            stoppedAt: true,
        },
    },
};
let SessionsService = class SessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(mode) {
        const sessions = await this.prisma.session.findMany({
            where: mode ? { mode } : undefined,
            orderBy: { startsAt: 'desc' },
            include: sessionInclude,
        });
        return sessions.map((session) => this.toPublic(session));
    }
    async listForTutor(userId, filters = {}) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Tutor profile not found.');
        }
        const where = {
            tutorProfileId: profile.id,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.studentId?.trim()
                ? { studentId: filters.studentId.trim() }
                : {}),
            ...this.dateRangeWhere(filters.from, filters.to),
        };
        const sessions = await this.prisma.session.findMany({
            where,
            orderBy: { startsAt: 'asc' },
            include: sessionInclude,
        });
        return sessions.map((session) => this.toPublic(session));
    }
    async hoursSummaryForTutor(userId, filters = {}) {
        const sessions = await this.listForTutor(userId, {
            ...filters,
            status: client_1.SessionStatus.COMPLETED,
        });
        let classMinutes = 0;
        let travelMinutes = 0;
        let totalMinutes = 0;
        let withClassHours = 0;
        for (const session of sessions) {
            const hours = session.hours;
            if (hours.classMinutes != null) {
                classMinutes += hours.classMinutes;
                withClassHours += 1;
            }
            if (hours.travelMinutes != null) {
                travelMinutes += hours.travelMinutes;
            }
            if (hours.totalMinutes != null) {
                totalMinutes += hours.totalMinutes;
            }
        }
        return {
            from: filters.from ?? null,
            to: filters.to ?? null,
            completedSessions: sessions.length,
            sessionsWithClassHours: withClassHours,
            totals: {
                classMinutes,
                travelMinutes,
                totalMinutes,
                classHours: Number((classMinutes / 60).toFixed(2)),
                travelHours: Number((travelMinutes / 60).toFixed(2)),
                totalHours: Number((totalMinutes / 60).toFixed(2)),
            },
            sessions,
        };
    }
    dateRangeWhere(from, to) {
        const startsAt = {};
        if (from?.trim()) {
            const start = new Date(from);
            if (!Number.isNaN(start.getTime())) {
                startsAt.gte = start;
            }
        }
        if (to?.trim()) {
            const end = new Date(to);
            if (!Number.isNaN(end.getTime())) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(to.trim())) {
                    end.setHours(23, 59, 59, 999);
                }
                startsAt.lte = end;
            }
        }
        return Object.keys(startsAt).length > 0 ? { startsAt } : {};
    }
    minutesBetween(start, end) {
        if (!start || !end)
            return null;
        const ms = end.getTime() - start.getTime();
        if (ms < 0)
            return null;
        return Math.round(ms / 60000);
    }
    computeHours(journey) {
        if (!journey) {
            return {
                travelMinutes: null,
                classMinutes: null,
                totalMinutes: null,
            };
        }
        return {
            travelMinutes: this.minutesBetween(journey.leftHomeAt, journey.reachedAt),
            classMinutes: this.minutesBetween(journey.classStartedAt, journey.stoppedAt),
            totalMinutes: this.minutesBetween(journey.leftHomeAt, journey.stoppedAt),
        };
    }
    async getOne(id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            include: sessionInclude,
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found.');
        }
        return this.toPublic(session);
    }
    async create(dto) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        this.assertTimeRange(startsAt, endsAt);
        const batchId = dto.batchId?.trim() || null;
        const studentId = dto.studentId?.trim() || null;
        if (dto.mode === client_1.SessionMode.OFFLINE) {
            if (!batchId) {
                throw new common_1.BadRequestException('Offline sessions require a batch.');
            }
            await this.assertActiveBatch(batchId);
            if (studentId) {
                throw new common_1.BadRequestException('Offline sessions are for a batch, not a single student field.');
            }
        }
        if (dto.mode === client_1.SessionMode.ONLINE) {
            if (batchId) {
                throw new common_1.BadRequestException('Online sessions cannot be linked to an offline batch.');
            }
            if (!studentId) {
                throw new common_1.BadRequestException('Online sessions require a student.');
            }
            await this.assertStudent(studentId);
        }
        const expectedRole = dto.mode === client_1.SessionMode.ONLINE
            ? client_1.UserRole.HOME_TUTOR
            : client_1.UserRole.OFFLINE_TUTOR;
        await this.assertTutor(dto.tutorProfileId, expectedRole);
        const session = await this.prisma.session.create({
            data: {
                mode: dto.mode,
                tutorProfileId: dto.tutorProfileId,
                startsAt,
                endsAt,
                title: dto.title?.trim() || null,
                subjectName: dto.subjectName?.trim() || null,
                batchId,
                studentId: dto.mode === client_1.SessionMode.ONLINE ? studentId : null,
                notes: dto.notes?.trim() || null,
                status: client_1.SessionStatus.SCHEDULED,
            },
            include: sessionInclude,
        });
        return this.toPublic(session);
    }
    async update(id, dto) {
        const existing = await this.prisma.session.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Session not found.');
        }
        const startsAt = dto.startsAt
            ? new Date(dto.startsAt)
            : existing.startsAt;
        const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
        this.assertTimeRange(startsAt, endsAt);
        const data = {};
        if (dto.title !== undefined) {
            data.title = dto.title?.trim() || null;
        }
        if (dto.subjectName !== undefined) {
            data.subjectName =
                dto.subjectName === null || dto.subjectName === ''
                    ? null
                    : dto.subjectName.trim();
        }
        if (dto.startsAt)
            data.startsAt = startsAt;
        if (dto.endsAt)
            data.endsAt = endsAt;
        if (dto.notes !== undefined) {
            data.notes =
                dto.notes === null || dto.notes === '' ? null : dto.notes.trim();
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
        }
        if (dto.tutorProfileId) {
            const expectedRole = existing.mode === client_1.SessionMode.ONLINE
                ? client_1.UserRole.HOME_TUTOR
                : client_1.UserRole.OFFLINE_TUTOR;
            await this.assertTutor(dto.tutorProfileId, expectedRole);
            data.tutorProfileId = dto.tutorProfileId;
        }
        if (dto.batchId !== undefined) {
            if (existing.mode !== client_1.SessionMode.OFFLINE) {
                throw new common_1.BadRequestException('Only offline sessions can have a batch.');
            }
            const batchId = dto.batchId === null || dto.batchId === ''
                ? null
                : dto.batchId.trim();
            if (!batchId) {
                throw new common_1.BadRequestException('Offline sessions require a batch.');
            }
            await this.assertActiveBatch(batchId);
            data.batchId = batchId;
        }
        if (dto.studentId !== undefined) {
            if (existing.mode !== client_1.SessionMode.ONLINE) {
                throw new common_1.BadRequestException('Only online sessions can link a single student.');
            }
            const studentId = dto.studentId === null || dto.studentId === ''
                ? null
                : dto.studentId.trim();
            if (!studentId) {
                throw new common_1.BadRequestException('Online sessions require a student.');
            }
            await this.assertStudent(studentId);
            data.studentId = studentId;
        }
        const session = await this.prisma.session.update({
            where: { id },
            data,
            include: sessionInclude,
        });
        return this.toPublic(session);
    }
    async listTutors(mode) {
        const role = mode === client_1.SessionMode.ONLINE
            ? client_1.UserRole.HOME_TUTOR
            : client_1.UserRole.OFFLINE_TUTOR;
        const tutors = await this.prisma.tutorProfile.findMany({
            where: {
                user: {
                    role,
                    status: { in: [client_1.UserStatus.APPROVED, client_1.UserStatus.ACTIVE] },
                },
            },
            orderBy: { user: { fullName: 'asc' } },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        status: true,
                        role: true,
                    },
                },
            },
        });
        return tutors.map((tutor) => ({
            tutorProfileId: tutor.id,
            userId: tutor.user.id,
            fullName: tutor.user.fullName,
            phone: tutor.user.phone,
            status: tutor.user.status,
            role: tutor.user.role,
        }));
    }
    assertTimeRange(startsAt, endsAt) {
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
            throw new common_1.BadRequestException('Enter valid start and end times.');
        }
        if (endsAt.getTime() <= startsAt.getTime()) {
            throw new common_1.BadRequestException('End time must be after start time.');
        }
    }
    async assertTutor(tutorProfileId, role) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { id: tutorProfileId },
            include: { user: true },
        });
        if (!profile) {
            throw new common_1.BadRequestException('Selected tutor was not found.');
        }
        if (profile.user.role !== role) {
            throw new common_1.BadRequestException(role === client_1.UserRole.HOME_TUTOR
                ? 'Online sessions need an approved home tutor.'
                : 'Offline sessions need an approved offline tutor.');
        }
        if (profile.user.status !== client_1.UserStatus.APPROVED &&
            profile.user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.BadRequestException('Assign only an approved tutor.');
        }
    }
    async assertActiveBatch(batchId) {
        const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch || !batch.isActive) {
            throw new common_1.BadRequestException('Select an active offline batch.');
        }
    }
    async assertStudent(studentId) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.BadRequestException('Selected student was not found.');
        }
    }
    toPublic(session) {
        return {
            id: session.id,
            title: session.title,
            mode: session.mode,
            status: session.status,
            subjectName: session.subjectName,
            startsAt: session.startsAt,
            endsAt: session.endsAt,
            notes: session.notes,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            tutor: {
                tutorProfileId: session.tutorProfile.id,
                userId: session.tutorProfile.user.id,
                fullName: session.tutorProfile.user.fullName,
                phone: session.tutorProfile.user.phone,
                role: session.tutorProfile.user.role,
                status: session.tutorProfile.user.status,
            },
            batch: session.batch
                ? {
                    id: session.batch.id,
                    name: session.batch.name,
                    className: session.batch.classGrade.name,
                    studentCount: session.batch._count.students,
                }
                : null,
            student: session.student
                ? {
                    id: session.student.id,
                    fullName: session.student.fullName,
                    className: session.student.className,
                    parentName: session.student.parent.user.fullName,
                    parentEmail: session.student.parent.user.email,
                }
                : null,
            journey: session.journey
                ? {
                    step: session.journey.step,
                    leftHomeAt: session.journey.leftHomeAt,
                    reachedAt: session.journey.reachedAt,
                    classStartedAt: session.journey.classStartedAt,
                    stoppedAt: session.journey.stoppedAt,
                }
                : null,
            hours: this.computeHours(session.journey),
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map