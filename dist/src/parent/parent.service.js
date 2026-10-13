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
exports.ParentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ParentService = class ParentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClasses(userId) {
        const parent = await this.requireParent(userId);
        const studentIds = parent.students.map((s) => s.id);
        if (studentIds.length === 0) {
            return { students: [], upcoming: [], completed: [], cancelled: [] };
        }
        const now = new Date();
        const sessions = await this.findSessionsForStudents(studentIds);
        const mapped = sessions.flatMap((session) => {
            const relatedStudents = this.studentsForSession(session, studentIds);
            return relatedStudents.map((student) => {
                const attendance = this.effectiveAttendance(session, student.id, now);
                return {
                    sessionId: session.id,
                    studentId: student.id,
                    studentName: student.fullName,
                    title: session.title,
                    subjectName: session.subjectName,
                    mode: session.mode,
                    status: session.status,
                    startsAt: session.startsAt,
                    endsAt: session.endsAt,
                    notes: session.notes,
                    tutorName: session.tutorProfile.user.fullName,
                    batch: session.batch
                        ? {
                            id: session.batch.id,
                            name: session.batch.name,
                            className: session.batch.classGrade.name,
                        }
                        : null,
                    attendance,
                };
            });
        });
        const upcoming = mapped
            .filter((item) => item.status === client_1.SessionStatus.SCHEDULED &&
            new Date(item.startsAt).getTime() >= now.getTime())
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        const completed = mapped
            .filter((item) => {
            if (item.status === client_1.SessionStatus.CANCELLED)
                return false;
            if (item.status === client_1.SessionStatus.COMPLETED)
                return true;
            return new Date(item.endsAt).getTime() < now.getTime();
        })
            .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        const cancelled = mapped
            .filter((item) => item.status === client_1.SessionStatus.CANCELLED)
            .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        return {
            students: parent.students.map((s) => ({
                id: s.id,
                fullName: s.fullName,
                className: s.className,
            })),
            upcoming,
            completed,
            cancelled,
        };
    }
    async getAttendanceCalendar(userId, month) {
        const parent = await this.requireParent(userId);
        const studentIds = parent.students.map((s) => s.id);
        if (studentIds.length === 0) {
            return { month: this.monthKey(new Date()), days: [] };
        }
        const anchor = month ? this.parseMonth(month) : new Date();
        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
        const now = new Date();
        const sessions = await this.findSessionsForStudents(studentIds, start, end);
        const days = [];
        for (const session of sessions) {
            if (session.status === client_1.SessionStatus.CANCELLED)
                continue;
            const sessionEnded = session.status === client_1.SessionStatus.COMPLETED ||
                session.endsAt.getTime() < now.getTime();
            if (!sessionEnded && session.mode === client_1.SessionMode.OFFLINE) {
                const related = this.studentsForSession(session, studentIds);
                for (const student of related) {
                    const mark = session.attendance.find((a) => a.studentId === student.id);
                    if (!mark)
                        continue;
                    days.push({
                        date: this.dayKey(session.startsAt),
                        studentId: student.id,
                        studentName: student.fullName,
                        sessionId: session.id,
                        status: mark.status,
                        mode: session.mode,
                        title: session.title ?? session.subjectName,
                    });
                }
                continue;
            }
            if (!sessionEnded && session.mode === client_1.SessionMode.ONLINE) {
                continue;
            }
            for (const student of this.studentsForSession(session, studentIds)) {
                const attendance = this.effectiveAttendance(session, student.id, now);
                if (!attendance)
                    continue;
                days.push({
                    date: this.dayKey(session.startsAt),
                    studentId: student.id,
                    studentName: student.fullName,
                    sessionId: session.id,
                    status: attendance.status,
                    mode: session.mode,
                    title: session.title ?? session.subjectName,
                });
            }
        }
        days.sort((a, b) => a.date.localeCompare(b.date));
        return {
            month: this.monthKey(start),
            students: parent.students.map((s) => ({
                id: s.id,
                fullName: s.fullName,
                className: s.className,
            })),
            days,
        };
    }
    async requireParent(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                parentProfile: {
                    include: {
                        students: {
                            orderBy: { createdAt: 'asc' },
                            select: { id: true, fullName: true, className: true },
                        },
                    },
                },
            },
        });
        if (!user || user.role !== client_1.UserRole.PARENT || !user.parentProfile) {
            throw new common_1.ForbiddenException('Parent account required.');
        }
        return user.parentProfile;
    }
    async findSessionsForStudents(studentIds, rangeStart, rangeEnd) {
        const timeFilter = rangeStart && rangeEnd
            ? { startsAt: { gte: rangeStart, lte: rangeEnd } }
            : {};
        return this.prisma.session.findMany({
            where: {
                ...timeFilter,
                OR: [
                    {
                        mode: client_1.SessionMode.ONLINE,
                        studentId: { in: studentIds },
                    },
                    {
                        mode: client_1.SessionMode.OFFLINE,
                        batch: {
                            students: {
                                some: { studentId: { in: studentIds } },
                            },
                        },
                    },
                ],
            },
            orderBy: { startsAt: 'asc' },
            include: {
                tutorProfile: {
                    select: {
                        user: { select: { fullName: true } },
                    },
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        classGrade: { select: { name: true } },
                        students: {
                            where: { studentId: { in: studentIds } },
                            select: {
                                studentId: true,
                                student: {
                                    select: { id: true, fullName: true, className: true },
                                },
                            },
                        },
                    },
                },
                student: {
                    select: { id: true, fullName: true, className: true },
                },
                attendance: {
                    where: { studentId: { in: studentIds } },
                },
            },
        });
    }
    studentsForSession(session, allowedIds) {
        if (session.mode === client_1.SessionMode.ONLINE && session.student) {
            return allowedIds.includes(session.student.id) ? [session.student] : [];
        }
        if (session.mode === client_1.SessionMode.OFFLINE && session.batch) {
            return session.batch.students
                .map((row) => row.student)
                .filter((s) => allowedIds.includes(s.id));
        }
        return [];
    }
    effectiveAttendance(session, studentId, now) {
        const mark = session.attendance.find((a) => a.studentId === studentId);
        if (mark) {
            return { status: mark.status, source: 'marked' };
        }
        const ended = session.status === client_1.SessionStatus.COMPLETED ||
            session.endsAt.getTime() < now.getTime();
        if (session.mode === client_1.SessionMode.OFFLINE && ended) {
            return { status: client_1.AttendanceStatus.ABSENT, source: 'default_absent' };
        }
        return null;
    }
    dayKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    monthKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }
    parseMonth(value) {
        const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
        if (!match) {
            throw new common_1.BadRequestException('Use month as YYYY-MM.');
        }
        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        return new Date(year, month, 1);
    }
};
exports.ParentService = ParentService;
exports.ParentService = ParentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ParentService);
//# sourceMappingURL=parent.service.js.map