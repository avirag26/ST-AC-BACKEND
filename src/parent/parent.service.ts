import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AttendanceStatus,
  SessionMode,
  SessionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async getClasses(userId: string) {
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
      .filter(
        (item) =>
          item.status === SessionStatus.SCHEDULED &&
          new Date(item.startsAt).getTime() >= now.getTime(),
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );

    const completed = mapped
      .filter((item) => {
        if (item.status === SessionStatus.CANCELLED) return false;
        if (item.status === SessionStatus.COMPLETED) return true;
        return new Date(item.endsAt).getTime() < now.getTime();
      })
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );

    const cancelled = mapped
      .filter((item) => item.status === SessionStatus.CANCELLED)
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );

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

  async getAttendanceCalendar(userId: string, month?: string) {
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

    const days: {
      date: string;
      studentId: string;
      studentName: string;
      sessionId: string;
      status: AttendanceStatus;
      mode: SessionMode;
      title: string | null;
    }[] = [];

    for (const session of sessions) {
      if (session.status === SessionStatus.CANCELLED) continue;
      const sessionEnded =
        session.status === SessionStatus.COMPLETED ||
        session.endsAt.getTime() < now.getTime();
      if (!sessionEnded && session.mode === SessionMode.OFFLINE) {
        // Only show attendance once the class time has passed (or marked).
        const related = this.studentsForSession(session, studentIds);
        for (const student of related) {
          const mark = session.attendance.find((a) => a.studentId === student.id);
          if (!mark) continue;
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

      if (!sessionEnded && session.mode === SessionMode.ONLINE) {
        continue;
      }

      for (const student of this.studentsForSession(session, studentIds)) {
        const attendance = this.effectiveAttendance(session, student.id, now);
        if (!attendance) continue;
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

  private async requireParent(userId: string) {
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

    if (!user || user.role !== UserRole.PARENT || !user.parentProfile) {
      throw new ForbiddenException('Parent account required.');
    }

    return user.parentProfile;
  }

  private async findSessionsForStudents(
    studentIds: string[],
    rangeStart?: Date,
    rangeEnd?: Date,
  ) {
    const timeFilter =
      rangeStart && rangeEnd
        ? { startsAt: { gte: rangeStart, lte: rangeEnd } }
        : {};

    return this.prisma.session.findMany({
      where: {
        ...timeFilter,
        OR: [
          {
            mode: SessionMode.ONLINE,
            studentId: { in: studentIds },
          },
          {
            mode: SessionMode.OFFLINE,
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

  private studentsForSession(
    session: {
      mode: SessionMode;
      student: { id: string; fullName: string; className: string | null } | null;
      batch: {
        students: {
          student: { id: string; fullName: string; className: string | null };
        }[];
      } | null;
    },
    allowedIds: string[],
  ) {
    if (session.mode === SessionMode.ONLINE && session.student) {
      return allowedIds.includes(session.student.id) ? [session.student] : [];
    }
    if (session.mode === SessionMode.OFFLINE && session.batch) {
      return session.batch.students
        .map((row) => row.student)
        .filter((s) => allowedIds.includes(s.id));
    }
    return [];
  }

  private effectiveAttendance(
    session: {
      mode: SessionMode;
      status: SessionStatus;
      endsAt: Date;
      attendance: { studentId: string; status: AttendanceStatus }[];
    },
    studentId: string,
    now: Date,
  ): { status: AttendanceStatus; source: 'marked' | 'default_absent' } | null {
    const mark = session.attendance.find((a) => a.studentId === studentId);
    if (mark) {
      return { status: mark.status, source: 'marked' };
    }

    const ended =
      session.status === SessionStatus.COMPLETED ||
      session.endsAt.getTime() < now.getTime();

    if (session.mode === SessionMode.OFFLINE && ended) {
      return { status: AttendanceStatus.ABSENT, source: 'default_absent' };
    }

    // Online: no attendance model yet — omit until journey/attendance exists
    return null;
  }

  private dayKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private monthKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private parseMonth(value: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!match) {
      throw new BadRequestException('Use month as YYYY-MM.');
    }
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    return new Date(year, month, 1);
  }
}
