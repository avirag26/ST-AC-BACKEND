import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentParentDto } from './dto/create-student-parent.dto';

function normalizePhone(phone?: string) {
  if (!phone?.trim()) return null;
  return phone.replace(/[\s\-()]/g, '');
}

function generateTempPassword() {
  return `Parent@${randomInt(100000, 999999)}`;
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async list() {
    const students = await this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        parent: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
                mustChangePassword: true,
              },
            },
          },
        },
        batches: {
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                isActive: true,
                classGrade: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      className: student.className,
      createdAt: student.createdAt,
      batches: student.batches.map((row) => ({
        id: row.batch.id,
        name: row.batch.name,
        isActive: row.batch.isActive,
        className: row.batch.classGrade.name,
      })),
      parent: {
        profileId: student.parent.id,
        userId: student.parent.user.id,
        fullName: student.parent.user.fullName,
        email: student.parent.user.email,
        phone: student.parent.phone ?? student.parent.user.phone,
        status: student.parent.user.status,
        mustChangePassword: student.parent.user.mustChangePassword,
      },
    }));
  }

  async create(dto: CreateStudentParentDto) {
    const parentEmail = dto.parentEmail.trim().toLowerCase();
    const parentPhone = normalizePhone(dto.parentPhone);
    const studentFullName = dto.studentFullName.trim();
    let className = dto.className?.trim() || null;
    const batchId = dto.batchId?.trim() || null;

    if (parentPhone && !/^\+?[0-9]{10,15}$/.test(parentPhone)) {
      throw new BadRequestException(
        'Enter a valid parent phone number (10–15 digits), or leave it blank.',
      );
    }

    let batch: {
      id: string;
      name: string;
      isActive: boolean;
      classGrade: { name: string };
    } | null = null;

    if (batchId) {
      batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          name: true,
          isActive: true,
          classGrade: { select: { name: true } },
        },
      });
      if (!batch || !batch.isActive) {
        throw new BadRequestException('Select an active batch for this class.');
      }
      if (className && className !== batch.classGrade.name) {
        throw new BadRequestException(
          `Batch “${batch.name}” belongs to ${batch.classGrade.name}, not ${className}.`,
        );
      }
      className = batch.classGrade.name;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: parentEmail },
          ...(parentPhone ? [{ phone: parentPhone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email or parent phone already exists.',
      );
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const parentUser = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: dto.parentFullName.trim(),
          email: parentEmail,
          phone: parentPhone,
          passwordHash,
          role: UserRole.PARENT,
          status: UserStatus.ACTIVE,
          mustChangePassword: true,
          parentProfile: {
            create: {
              phone: parentPhone,
              students: {
                create: {
                  fullName: studentFullName,
                  className,
                },
              },
            },
          },
        },
        include: {
          parentProfile: {
            include: { students: true },
          },
        },
      });

      const student = created.parentProfile?.students[0];
      if (!created.parentProfile || !student) {
        throw new BadRequestException('Could not create parent and student.');
      }

      if (batch) {
        await tx.batchStudent.create({
          data: { batchId: batch.id, studentId: student.id },
        });
      }

      return created;
    });

    const student = parentUser.parentProfile?.students[0];
    if (!parentUser.parentProfile || !student) {
      throw new BadRequestException('Could not create parent and student.');
    }

    const mail = await this.email.sendWelcomeWithPassword({
      to: parentEmail,
      fullName: parentUser.fullName,
      roleLabel: 'Parent',
      temporaryPassword,
    });

    return {
      message: batch
        ? `Parent account and student created, and enrolled in batch “${batch.name}”.`
        : 'Parent account and student created. One email login for the family — share the temporary password until email delivery is configured.',
      emailDelivery: mail,
      credentials: {
        email: parentEmail,
        temporaryPassword,
      },
      student: {
        id: student.id,
        fullName: student.fullName,
        className: student.className,
        batch: batch
          ? {
              id: batch.id,
              name: batch.name,
              className: batch.classGrade.name,
            }
          : null,
      },
      parent: {
        profileId: parentUser.parentProfile.id,
        userId: parentUser.id,
        fullName: parentUser.fullName,
        email: parentUser.email,
        phone: parentPhone,
      },
    };
  }
}
