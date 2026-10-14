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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const pdf_util_1 = require("./pdf.util");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getForTutor(sessionId, userId) {
        const session = await this.loadOnlineSessionForTutor(sessionId, userId);
        const report = await this.prisma.classReport.findUnique({
            where: { sessionId: session.id },
        });
        return this.toPublic(session, report);
    }
    async upsertForTutor(sessionId, userId, dto) {
        const session = await this.loadOnlineSessionForTutor(sessionId, userId);
        this.assertCanWriteReport(session);
        const topicsCovered = dto.topicsCovered.trim();
        if (!topicsCovered) {
            throw new common_1.BadRequestException('Enter what was covered in class.');
        }
        const report = await this.prisma.classReport.upsert({
            where: { sessionId: session.id },
            create: {
                sessionId: session.id,
                topicsCovered,
                homework: dto.homework?.trim() || null,
                studentNotes: dto.studentNotes?.trim() || null,
                performance: dto.performance?.trim() || null,
                nextPlan: dto.nextPlan?.trim() || null,
            },
            update: {
                topicsCovered,
                homework: dto.homework?.trim() || null,
                studentNotes: dto.studentNotes?.trim() || null,
                performance: dto.performance?.trim() || null,
                nextPlan: dto.nextPlan?.trim() || null,
            },
        });
        return this.toPublic(session, report);
    }
    async getPdfForTutor(sessionId, userId) {
        const payload = await this.getForTutor(sessionId, userId);
        if (!payload.report) {
            throw new common_1.NotFoundException('No class report yet. Save the report before downloading a PDF.');
        }
        return this.buildPdfBuffer(payload);
    }
    async getForCeo(sessionId) {
        const session = await this.loadOnlineSession(sessionId);
        const report = await this.prisma.classReport.findUnique({
            where: { sessionId: session.id },
        });
        return this.toPublic(session, report);
    }
    async getPdfForCeo(sessionId) {
        const payload = await this.getForCeo(sessionId);
        if (!payload.report) {
            throw new common_1.NotFoundException('No class report for this session.');
        }
        return this.buildPdfBuffer(payload);
    }
    buildPdfBuffer(payload) {
        const report = payload.report;
        const studentLine = payload.session.student
            ? `${payload.session.student.fullName}${payload.session.student.className
                ? ` (${payload.session.student.className})`
                : ''}`
            : '—';
        const lines = [
            `Session: ${payload.session.title || payload.session.subjectName || 'Online class'}`,
            `Tutor: ${payload.session.tutor.fullName}`,
            `Student: ${studentLine}`,
            `When: ${new Date(payload.session.startsAt).toLocaleString()} - ${new Date(payload.session.endsAt).toLocaleTimeString()}`,
            `Filled: ${new Date(report.filledAt).toLocaleString()}`,
            '',
            'Topics covered:',
            report.topicsCovered,
            '',
            'Homework:',
            report.homework || '—',
            '',
            'Student notes:',
            report.studentNotes || '—',
            '',
            `Performance: ${report.performance || '—'}`,
            '',
            'Next plan:',
            report.nextPlan || '—',
        ];
        const filename = `class-report-${payload.session.id.slice(0, 8)}.pdf`;
        return {
            filename,
            buffer: (0, pdf_util_1.buildSimplePdf)('Straight Line Academy — Class Report', lines),
        };
    }
    assertCanWriteReport(session) {
        const stopped = session.status === client_1.SessionStatus.COMPLETED ||
            session.journey?.step === client_1.JourneyStep.STOPPED;
        if (!stopped) {
            throw new common_1.BadRequestException('Fill the class report after you stop the journey.');
        }
    }
    async loadOnlineSessionForTutor(sessionId, userId) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
            include: { user: { select: { role: true, fullName: true } } },
        });
        if (!profile || profile.user.role !== client_1.UserRole.HOME_TUTOR) {
            throw new common_1.ForbiddenException('Only home tutors can manage class reports.');
        }
        const session = await this.loadOnlineSession(sessionId);
        if (session.tutorProfileId !== profile.id) {
            throw new common_1.ForbiddenException('This session is not assigned to you.');
        }
        return session;
    }
    async loadOnlineSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                journey: { select: { step: true, stoppedAt: true } },
                tutorProfile: {
                    select: {
                        id: true,
                        user: { select: { fullName: true, phone: true } },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        className: true,
                        parent: {
                            select: { user: { select: { fullName: true } } },
                        },
                    },
                },
                classReport: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found.');
        }
        if (session.mode !== client_1.SessionMode.ONLINE) {
            throw new common_1.BadRequestException('Class reports are only for online home sessions.');
        }
        return session;
    }
    toPublic(session, report) {
        return {
            session: {
                id: session.id,
                title: session.title,
                subjectName: session.subjectName,
                startsAt: session.startsAt,
                endsAt: session.endsAt,
                status: session.status,
                notes: session.notes,
                journeyStep: session.journey?.step ?? null,
                stoppedAt: session.journey?.stoppedAt ?? null,
                tutor: {
                    tutorProfileId: session.tutorProfile.id,
                    fullName: session.tutorProfile.user.fullName,
                    phone: session.tutorProfile.user.phone,
                },
                student: session.student
                    ? {
                        id: session.student.id,
                        fullName: session.student.fullName,
                        className: session.student.className,
                        parentName: session.student.parent.user.fullName,
                    }
                    : null,
            },
            report: report
                ? {
                    id: report.id,
                    topicsCovered: report.topicsCovered,
                    homework: report.homework,
                    studentNotes: report.studentNotes,
                    performance: report.performance,
                    nextPlan: report.nextPlan,
                    filledAt: report.filledAt,
                    updatedAt: report.updatedAt,
                }
                : null,
            canEdit: session.status === client_1.SessionStatus.COMPLETED ||
                session.journey?.step === client_1.JourneyStep.STOPPED,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map