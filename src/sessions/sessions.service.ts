import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SessionMode,
  SessionStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

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
} as const;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(mode?: SessionMode) {
    const sessions = await this.prisma.session.findMany({
      where: mode ? { mode } : undefined,
      orderBy: { startsAt: 'desc' },
      include: sessionInclude,
    });
    return sessions.map((session) => this.toPublic(session));
  }

  async listForTutor(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('Tutor profile not found.');
    }

    const sessions = await this.prisma.session.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: { startsAt: 'asc' },
      include: sessionInclude,
    });
    return sessions.map((session) => this.toPublic(session));
  }

  async getOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) {
      throw new NotFoundException('Session not found.');
    }
    return this.toPublic(session);
  }

  async create(dto: CreateSessionDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertTimeRange(startsAt, endsAt);

    const batchId = dto.batchId?.trim() || null;
    const studentId = dto.studentId?.trim() || null;

    if (dto.mode === SessionMode.OFFLINE) {
      if (!batchId) {
        throw new BadRequestException(
          'Offline sessions require a batch.',
        );
      }
      await this.assertActiveBatch(batchId);
      if (studentId) {
        throw new BadRequestException(
          'Offline sessions are for a batch, not a single student field.',
        );
      }
    }

    if (dto.mode === SessionMode.ONLINE) {
      if (batchId) {
        throw new BadRequestException(
          'Online sessions cannot be linked to an offline batch.',
        );
      }
      if (!studentId) {
        throw new BadRequestException(
          'Online sessions require a student.',
        );
      }
      await this.assertStudent(studentId);
    }

    const expectedRole =
      dto.mode === SessionMode.ONLINE
        ? UserRole.HOME_TUTOR
        : UserRole.OFFLINE_TUTOR;
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
        studentId: dto.mode === SessionMode.ONLINE ? studentId : null,
        notes: dto.notes?.trim() || null,
        status: SessionStatus.SCHEDULED,
      },
      include: sessionInclude,
    });

    return this.toPublic(session);
  }

  async update(id: string, dto: UpdateSessionDto) {
    const existing = await this.prisma.session.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Session not found.');
    }

    const startsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    this.assertTimeRange(startsAt, endsAt);

    const data: {
      title?: string | null;
      subjectName?: string | null;
      startsAt?: Date;
      endsAt?: Date;
      tutorProfileId?: string;
      batchId?: string | null;
      studentId?: string | null;
      notes?: string | null;
      status?: SessionStatus;
    } = {};

    if (dto.title !== undefined) {
      data.title = dto.title?.trim() || null;
    }
    if (dto.subjectName !== undefined) {
      data.subjectName =
        dto.subjectName === null || dto.subjectName === ''
          ? null
          : dto.subjectName.trim();
    }
    if (dto.startsAt) data.startsAt = startsAt;
    if (dto.endsAt) data.endsAt = endsAt;
    if (dto.notes !== undefined) {
      data.notes =
        dto.notes === null || dto.notes === '' ? null : dto.notes.trim();
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.tutorProfileId) {
      const expectedRole =
        existing.mode === SessionMode.ONLINE
          ? UserRole.HOME_TUTOR
          : UserRole.OFFLINE_TUTOR;
      await this.assertTutor(dto.tutorProfileId, expectedRole);
      data.tutorProfileId = dto.tutorProfileId;
    }

    if (dto.batchId !== undefined) {
      if (existing.mode !== SessionMode.OFFLINE) {
        throw new BadRequestException(
          'Only offline sessions can have a batch.',
        );
      }
      const batchId =
        dto.batchId === null || dto.batchId === ''
          ? null
          : dto.batchId.trim();
      if (!batchId) {
        throw new BadRequestException('Offline sessions require a batch.');
      }
      await this.assertActiveBatch(batchId);
      data.batchId = batchId;
    }

    if (dto.studentId !== undefined) {
      if (existing.mode !== SessionMode.ONLINE) {
        throw new BadRequestException(
          'Only online sessions can link a single student.',
        );
      }
      const studentId =
        dto.studentId === null || dto.studentId === ''
          ? null
          : dto.studentId.trim();
      if (!studentId) {
        throw new BadRequestException(
          'Online sessions require a student.',
        );
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

  async listTutors(mode: SessionMode) {
    const role =
      mode === SessionMode.ONLINE
        ? UserRole.HOME_TUTOR
        : UserRole.OFFLINE_TUTOR;

    const tutors = await this.prisma.tutorProfile.findMany({
      where: {
        user: {
          role,
          status: { in: [UserStatus.APPROVED, UserStatus.ACTIVE] },
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

  private assertTimeRange(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Enter valid start and end times.');
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('End time must be after start time.');
    }
  }

  private async assertTutor(tutorProfileId: string, role: UserRole) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new BadRequestException('Selected tutor was not found.');
    }

    if (profile.user.role !== role) {
      throw new BadRequestException(
        role === UserRole.HOME_TUTOR
          ? 'Online sessions need an approved home tutor.'
          : 'Offline sessions need an approved offline tutor.',
      );
    }

    if (
      profile.user.status !== UserStatus.APPROVED &&
      profile.user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException('Assign only an approved tutor.');
    }
  }

  private async assertActiveBatch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch || !batch.isActive) {
      throw new BadRequestException('Select an active offline batch.');
    }
  }

  private async assertStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new BadRequestException('Selected student was not found.');
    }
  }

  private toPublic(
    session: {
      id: string;
      title: string | null;
      mode: SessionMode;
      status: SessionStatus;
      subjectName: string | null;
      startsAt: Date;
      endsAt: Date;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      tutorProfile: {
        id: string;
        user: {
          id: string;
          fullName: string;
          phone: string | null;
          role: UserRole;
          status: UserStatus;
        };
      };
      batch: {
        id: string;
        name: string;
        classGrade: { id: string; name: string };
      } | null;
      student: {
        id: string;
        fullName: string;
        className: string | null;
        parent: { user: { fullName: string; email: string } };
      } | null;
    },
  ) {
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
    };
  }
}
