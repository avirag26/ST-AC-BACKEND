import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: UserStatus) {
    const tutors = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR] },
        ...(status ? { status } : {}),
      },
      include: { tutorProfile: true },
      orderBy: { createdAt: 'desc' },
    });

    return tutors.map((tutor) => this.toTutorCard(tutor));
  }

  async getOne(id: string) {
    const tutor = await this.findTutorOrThrow(id);
    return this.toTutorCard(tutor);
  }

  async approve(id: string) {
    const tutor = await this.findTutorOrThrow(id);

    if (tutor.status === UserStatus.APPROVED) {
      return this.toTutorCard(tutor);
    }

    if (tutor.status === UserStatus.REJECTED) {
      // Allow re-approval after rejection
    } else if (tutor.status !== UserStatus.PENDING) {
      throw new BadRequestException('Only pending tutors can be approved.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.APPROVED,
        rejectionReason: null,
      },
      include: { tutorProfile: true },
    });

    return this.toTutorCard(updated);
  }

  async reject(id: string, reason?: string) {
    const tutor = await this.findTutorOrThrow(id);

    if (tutor.status === UserStatus.REJECTED) {
      return this.toTutorCard(tutor);
    }

    if (
      tutor.status !== UserStatus.PENDING &&
      tutor.status !== UserStatus.APPROVED
    ) {
      throw new BadRequestException('This tutor cannot be rejected.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.REJECTED,
        rejectionReason: reason?.trim() || null,
      },
      include: { tutorProfile: true },
    });

    return this.toTutorCard(updated);
  }

  private async findTutorOrThrow(id: string) {
    const tutor = await this.prisma.user.findFirst({
      where: {
        id,
        role: { in: [UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR] },
      },
      include: { tutorProfile: true },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found.');
    }

    return tutor;
  }

  private toTutorCard(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    dob: Date | null;
    role: UserRole;
    status: UserStatus;
    rejectionReason: string | null;
    createdAt: Date;
    tutorProfile: {
      subjects: string[];
      classes: string[];
      documentsNote: string | null;
      salaryStatus: string;
    } | null;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      role: user.role,
      status: user.status,
      rejectionReason: user.rejectionReason,
      createdAt: user.createdAt,
      subjects: user.tutorProfile?.subjects ?? [],
      classes: user.tutorProfile?.classes ?? [],
      documentsNote: user.tutorProfile?.documentsNote ?? null,
      salaryStatus: user.tutorProfile?.salaryStatus ?? null,
    };
  }
}
