import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JourneyStep,
  SessionMode,
  SessionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertClassReportDto } from './dto/upsert-class-report.dto';
import { buildSimplePdf } from './pdf.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForTutor(sessionId: string, userId: string) {
    const session = await this.loadOnlineSessionForTutor(sessionId, userId);
    const report = await this.prisma.classReport.findUnique({
      where: { sessionId: session.id },
    });
    return this.toPublic(session, report);
  }

  async upsertForTutor(
    sessionId: string,
    userId: string,
    dto: UpsertClassReportDto,
  ) {
    const session = await this.loadOnlineSessionForTutor(sessionId, userId);
    this.assertCanWriteReport(session);

    const topicsCovered = dto.topicsCovered.trim();
    if (!topicsCovered) {
      throw new BadRequestException('Enter what was covered in class.');
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

  async getPdfForTutor(sessionId: string, userId: string) {
    const payload = await this.getForTutor(sessionId, userId);
    if (!payload.report) {
      throw new NotFoundException(
        'No class report yet. Save the report before downloading a PDF.',
      );
    }
    return this.buildPdfBuffer(payload);
  }

  async getForCeo(sessionId: string) {
    const session = await this.loadOnlineSession(sessionId);
    const report = await this.prisma.classReport.findUnique({
      where: { sessionId: session.id },
    });
    return this.toPublic(session, report);
  }

  async getPdfForCeo(sessionId: string) {
    const payload = await this.getForCeo(sessionId);
    if (!payload.report) {
      throw new NotFoundException('No class report for this session.');
    }
    return this.buildPdfBuffer(payload);
  }

  private buildPdfBuffer(payload: ReturnType<ReportsService['toPublic']>) {
    const report = payload.report!;
    const studentLine = payload.session.student
      ? `${payload.session.student.fullName}${
          payload.session.student.className
            ? ` (${payload.session.student.className})`
            : ''
        }`
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
      buffer: buildSimplePdf('Straight Line Academy — Class Report', lines),
    };
  }

  private assertCanWriteReport(session: {
    status: SessionStatus;
    journey: { step: JourneyStep } | null;
  }) {
    const stopped =
      session.status === SessionStatus.COMPLETED ||
      session.journey?.step === JourneyStep.STOPPED;
    if (!stopped) {
      throw new BadRequestException(
        'Fill the class report after you stop the journey.',
      );
    }
  }

  private async loadOnlineSessionForTutor(sessionId: string, userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { user: { select: { role: true, fullName: true } } },
    });
    if (!profile || profile.user.role !== UserRole.HOME_TUTOR) {
      throw new ForbiddenException('Only home tutors can manage class reports.');
    }

    const session = await this.loadOnlineSession(sessionId);
    if (session.tutorProfileId !== profile.id) {
      throw new ForbiddenException('This session is not assigned to you.');
    }
    return session;
  }

  private async loadOnlineSession(sessionId: string) {
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
      throw new NotFoundException('Session not found.');
    }
    if (session.mode !== SessionMode.ONLINE) {
      throw new BadRequestException(
        'Class reports are only for online home sessions.',
      );
    }
    return session;
  }

  private toPublic(
    session: {
      id: string;
      title: string | null;
      subjectName: string | null;
      startsAt: Date;
      endsAt: Date;
      status: SessionStatus;
      notes: string | null;
      tutorProfile: {
        id: string;
        user: { fullName: string; phone: string | null };
      };
      student: {
        id: string;
        fullName: string;
        className: string | null;
        parent: { user: { fullName: string } };
      } | null;
      journey: { step: JourneyStep; stoppedAt: Date | null } | null;
    },
    report: {
      id: string;
      topicsCovered: string;
      homework: string | null;
      studentNotes: string | null;
      performance: string | null;
      nextPlan: string | null;
      filledAt: Date;
      updatedAt: Date;
    } | null,
  ) {
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
      canEdit:
        session.status === SessionStatus.COMPLETED ||
        session.journey?.step === JourneyStep.STOPPED,
    };
  }
}
