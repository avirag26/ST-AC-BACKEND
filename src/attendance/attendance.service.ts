import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceStatus,
  SessionMode,
  SessionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getRosterForTutor(sessionId: string, userId: string) {
    const session = await this.loadOfflineSessionForTutor(sessionId, userId);

    const enrolled = await this.prisma.batchStudent.findMany({
      where: { batchId: session.batchId! },
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
    const markByStudent = new Map(
      marks.map((m) => [m.studentId, m] as const),
    );

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
      emptyHelp:
        enrolled.length === 0
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
          effectiveStatus: mark?.status ?? AttendanceStatus.ABSENT,
          markedAt: mark?.markedAt ?? null,
        };
      }),
    };
  }

  async saveForTutor(
    sessionId: string,
    userId: string,
    dto: SaveAttendanceDto,
  ) {
    const session = await this.loadOfflineSessionForTutor(sessionId, userId);

    const enrolledIds = new Set(
      (
        await this.prisma.batchStudent.findMany({
          where: { batchId: session.batchId! },
          select: { studentId: true },
        })
      ).map((r) => r.studentId),
    );

    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot mark attendance on a cancelled session.',
      );
    }

    if (enrolledIds.size === 0) {
      throw new BadRequestException(
        'This batch has no enrolled students. Enroll students before marking attendance.',
      );
    }

    for (const mark of dto.marks) {
      if (!enrolledIds.has(mark.studentId)) {
        throw new BadRequestException(
          'One or more students are not in this session batch.',
        );
      }
    }

    await this.prisma.$transaction([
      ...dto.marks.map((mark) =>
        this.prisma.attendance.upsert({
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
        }),
      ),
      this.prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.COMPLETED },
      }),
    ]);

    return this.getRosterForTutor(sessionId, userId);
  }

  private async loadOfflineSessionForTutor(sessionId: string, userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { user: { select: { role: true } } },
    });

    if (!profile || profile.user.role !== UserRole.OFFLINE_TUTOR) {
      throw new ForbiddenException('Only offline tutors can mark attendance.');
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
      throw new NotFoundException('Session not found.');
    }

    if (session.tutorProfileId !== profile.id) {
      throw new ForbiddenException('This session is not assigned to you.');
    }

    if (session.mode !== SessionMode.OFFLINE || !session.batchId) {
      throw new BadRequestException(
        'Attendance is only for offline batch sessions.',
      );
    }

    return session;
  }
}
