import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

const batchListInclude = {
  classGrade: { select: { id: true, name: true, isActive: true } },
  tutorProfile: {
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
  },
  _count: { select: { students: true } },
} as const;

const batchDetailInclude = {
  classGrade: { select: { id: true, name: true, isActive: true } },
  tutorProfile: {
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
  },
  students: {
    orderBy: { createdAt: 'asc' as const },
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
  },
};

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const batches = await this.prisma.batch.findMany({
      orderBy: { createdAt: 'desc' },
      include: batchListInclude,
    });
    return batches.map((batch) => this.toListItem(batch));
  }

  async listForTutor(userId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      include: { user: { select: { role: true } } },
    });
    if (!profile || profile.user.role !== UserRole.OFFLINE_TUTOR) {
      throw new NotFoundException('Offline tutor profile not found.');
    }

    const batches = await this.prisma.batch.findMany({
      where: {
        tutorProfileId: profile.id,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: batchDetailInclude,
    });

    return batches.map((batch) => this.toDetail(batch));
  }

  async getOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: batchDetailInclude,
    });
    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }
    return this.toDetail(batch);
  }

  async create(dto: CreateBatchDto) {
    const classGrade = await this.prisma.classGrade.findUnique({
      where: { id: dto.classGradeId },
    });
    if (!classGrade || !classGrade.isActive) {
      throw new BadRequestException('Select an active class from the catalog.');
    }

    const tutorProfileId = dto.tutorProfileId?.trim() || null;
    if (tutorProfileId) {
      await this.assertOfflineTutor(tutorProfileId);
    }

    const batch = await this.prisma.batch.create({
      data: {
        name: dto.name.trim(),
        classGradeId: dto.classGradeId,
        tutorProfileId,
      },
      include: batchDetailInclude,
    });

    return this.toDetail(batch);
  }

  async update(id: string, dto: UpdateBatchDto) {
    await this.findBatchOrThrow(id);

    const data: {
      name?: string;
      tutorProfileId?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.tutorProfileId !== undefined) {
      const tutorProfileId =
        dto.tutorProfileId === null || dto.tutorProfileId === ''
          ? null
          : dto.tutorProfileId.trim();
      if (tutorProfileId) {
        await this.assertOfflineTutor(tutorProfileId);
      }
      data.tutorProfileId = tutorProfileId;
    }

    const batch = await this.prisma.batch.update({
      where: { id },
      data,
      include: batchDetailInclude,
    });

    return this.toDetail(batch);
  }

  async enroll(id: string, dto: EnrollStudentsDto) {
    await this.findBatchOrThrow(id);

    const uniqueIds = [...new Set(dto.studentIds.map((s) => s.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('Select at least one student.');
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (students.length !== uniqueIds.length) {
      throw new BadRequestException('One or more students were not found.');
    }

    await this.prisma.batchStudent.createMany({
      data: uniqueIds.map((studentId) => ({ batchId: id, studentId })),
      skipDuplicates: true,
    });

    return this.getOne(id);
  }

  async unenroll(id: string, studentId: string) {
    await this.findBatchOrThrow(id);

    const enrollment = await this.prisma.batchStudent.findUnique({
      where: {
        batchId_studentId: { batchId: id, studentId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this batch.');
    }

    await this.prisma.batchStudent.delete({ where: { id: enrollment.id } });
    return this.getOne(id);
  }

  async listOfflineTutors() {
    const tutors = await this.prisma.tutorProfile.findMany({
      where: {
        user: {
          role: UserRole.OFFLINE_TUTOR,
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
    }));
  }

  private async findBatchOrThrow(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }
    return batch;
  }

  private async assertOfflineTutor(tutorProfileId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new BadRequestException('Selected tutor was not found.');
    }

    if (profile.user.role !== UserRole.OFFLINE_TUTOR) {
      throw new BadRequestException(
        'Only an offline / center tutor can be assigned to a batch.',
      );
    }

    if (
      profile.user.status !== UserStatus.APPROVED &&
      profile.user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Assign only an approved offline tutor to the batch.',
      );
    }
  }

  private toListItem(
    batch: {
      id: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      classGrade: { id: string; name: string; isActive: boolean };
      tutorProfile: {
        id: string;
        user: {
          id: string;
          fullName: string;
          phone: string | null;
          status: UserStatus;
          role: UserRole;
        };
      } | null;
      _count: { students: number };
    },
  ) {
    return {
      id: batch.id,
      name: batch.name,
      isActive: batch.isActive,
      createdAt: batch.createdAt,
      classGrade: batch.classGrade,
      tutor: batch.tutorProfile
        ? {
            tutorProfileId: batch.tutorProfile.id,
            userId: batch.tutorProfile.user.id,
            fullName: batch.tutorProfile.user.fullName,
            phone: batch.tutorProfile.user.phone,
            status: batch.tutorProfile.user.status,
          }
        : null,
      studentCount: batch._count.students,
    };
  }

  private toDetail(
    batch: {
      id: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      classGrade: { id: string; name: string; isActive: boolean };
      tutorProfile: {
        id: string;
        user: {
          id: string;
          fullName: string;
          phone: string | null;
          status: UserStatus;
          role: UserRole;
        };
      } | null;
      students: {
        id: string;
        createdAt: Date;
        student: {
          id: string;
          fullName: string;
          className: string | null;
          parent: {
            user: { fullName: string; email: string };
          };
        };
      }[];
    },
  ) {
    return {
      id: batch.id,
      name: batch.name,
      isActive: batch.isActive,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      classGrade: batch.classGrade,
      tutor: batch.tutorProfile
        ? {
            tutorProfileId: batch.tutorProfile.id,
            userId: batch.tutorProfile.user.id,
            fullName: batch.tutorProfile.user.fullName,
            phone: batch.tutorProfile.user.phone,
            status: batch.tutorProfile.user.status,
          }
        : null,
      students: batch.students.map((row) => ({
        enrollmentId: row.id,
        enrolledAt: row.createdAt,
        id: row.student.id,
        fullName: row.student.fullName,
        className: row.student.className,
        parentName: row.student.parent.user.fullName,
        parentEmail: row.student.parent.user.email,
      })),
      studentCount: batch.students.length,
    };
  }
}
