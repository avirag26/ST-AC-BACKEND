import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, SaveExamMarkDto } from './exams.dto';

export type ExamActor = { userId: string; role: string };
const managers = [UserRole.CEO as string, UserRole.ADMIN as string];

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async options() {
    const [students, tutors, subjects] = await Promise.all([
      this.prisma.student.findMany({ select: { id: true, fullName: true, className: true }, orderBy: { fullName: 'asc' } }),
      this.prisma.tutorProfile.findMany({ where: { user: { role: { in: [UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR] }, status: { in: [UserStatus.APPROVED, UserStatus.ACTIVE] } } }, select: { id: true, user: { select: { fullName: true } } } }),
      this.prisma.subject.findMany({ where: { isActive: true }, select: { name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { students, tutors, subjects };
  }

  async create(dto: CreateExamDto) {
    const names = dto.subjects.map((s) => s.name.trim());
    if (!dto.title.trim() || names.some((s) => !s) || new Set(names.map((s) => s.toLowerCase())).size !== names.length) {
      throw new BadRequestException('Use a title and unique, non-empty subjects.');
    }
    return this.prisma.$transaction(async (tx) => {
      const tutor = await tx.tutorProfile.findFirst({ where: { id: dto.tutorProfileId, user: { role: { in: [UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR] }, status: { in: [UserStatus.APPROVED, UserStatus.ACTIVE] } } } });
      if (!tutor) throw new BadRequestException('Choose an approved tutor.');
      const count = await tx.student.count({ where: { id: { in: dto.studentIds } } });
      if (count !== dto.studentIds.length) throw new BadRequestException('One or more students no longer exist.');
      const subjects = await tx.subject.count({ where: { name: { in: names }, isActive: true } });
      if (subjects !== names.length) throw new BadRequestException('Choose active catalog subjects.');
      return tx.exam.create({ data: {
        title: dto.title.trim(), startsAt: new Date(dto.startsAt), tutorProfileId: tutor.id,
        subjects: { create: dto.subjects.map((s) => ({ name: s.name.trim(), maxMarks: s.maxMarks })) },
        marks: { create: dto.studentIds.flatMap((studentId) => names.map((subject) => ({ studentId, subject }))) },
      } });
    });
  }

  async list(actor: ExamActor) {
    const parent = actor.role === UserRole.PARENT;
    const ownChildren: Prisma.ExamMarkWhereInput = { student: { parent: { userId: actor.userId } } };
    const where: Prisma.ExamWhereInput = managers.includes(actor.role) ? {} : parent
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

  async mark(actor: ExamActor, id: string, dto: SaveExamMarkDto) {
    const mark = await this.prisma.examMark.findFirst({ where: {
      id, ...(managers.includes(actor.role) ? {} : { exam: { tutorProfile: { userId: actor.userId } } }),
    }, include: { exam: { include: { subjects: true } } } });
    if (!mark) throw new NotFoundException('Exam result not found.');
    const subject = mark.exam.subjects.find((s) => s.name === mark.subject)!;
    if (dto.attendance === 'PRESENT' && (dto.score == null || dto.score > subject.maxMarks)) {
      throw new BadRequestException(`Enter a score between 0 and ${subject.maxMarks}.`);
    }
    if (dto.attendance === 'ABSENT' && dto.score != null) throw new BadRequestException('An absent student cannot have a score.');
    if (mark.exam.startsAt > new Date()) throw new BadRequestException('Marks can be recorded after the exam starts.');
    return this.prisma.examMark.update({ where: { id }, data: {
      attendance: dto.attendance, score: dto.attendance === 'ABSENT' ? null : dto.score,
      feedback: dto.feedback?.trim() || null,
    } });
  }
}
