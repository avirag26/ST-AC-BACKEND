import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTutorDto } from './dto/register-tutor.dto';

function normalizePhone(phone: string) {
  return phone.replace(/[\s\-()]/g, '');
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

const userAuthInclude = {
  tutorProfile: true,
  parentProfile: {
    include: {
      students: {
        orderBy: { createdAt: 'asc' as const },
        select: {
          id: true,
          fullName: true,
          className: true,
        },
      },
    },
  },
};

type PublicUserShape = {
  id: string;
  phone: string | null;
  email: string;
  fullName: string;
  dob: Date | null;
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  tutorProfile?: {
    subjects: string[];
    classes: string[];
    documentsNote: string | null;
    salaryStatus: string;
  } | null;
  parentProfile?: {
    phone: string | null;
    students: {
      id: string;
      fullName: string;
      className: string | null;
    }[];
  } | null;
};

@Injectable()
export class AuthService {
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  readonly refreshCookieMaxAgeMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessExpiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    this.accessSecret = this.config.get(
      'JWT_ACCESS_SECRET',
      this.config.get('JWT_SECRET', 'stac-dev-secret-change-me'),
    );
    this.refreshSecret = this.config.get(
      'JWT_REFRESH_SECRET',
      `${this.accessSecret}-refresh`,
    );
    this.refreshCookieMaxAgeMs = this.parseDurationToMs(this.refreshExpiresIn);
  }

  async login(dto: LoginDto) {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: userAuthInclude,
    });

    if (!user || !user.phone) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    this.assertCanLogin(user.status);

    const tokens = await this.issueTokenPair(user.id, user.role, user.phone);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toPublicUser(user),
    };
  }

  async loginWithEmail(dto: LoginEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: userAuthInclude,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException(
        'This portal is for parents. Use the tutor or CEO app for other accounts.',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.assertCanLogin(user.status);

    const tokens = await this.issueTokenPair(user.id, user.role, user.phone);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toPublicUser(user),
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    let payload: { sub: string; role: UserRole; type?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: userAuthInclude } },
    });

    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const user = stored.user;
    this.assertCanLogin(user.status);

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.issueTokenPair(user.id, user.role, user.phone);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.toPublicUser(user),
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { message: 'Signed out.' };
    }

    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    return { message: 'Signed out.' };
  }

  async registerTutor(dto: RegisterTutorDto) {
    if (
      dto.role !== UserRole.HOME_TUTOR &&
      dto.role !== UserRole.OFFLINE_TUTOR
    ) {
      throw new BadRequestException('Invalid tutor role.');
    }

    const phone = normalizePhone(dto.phone);
    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      throw new BadRequestException('Enter a valid phone number (10–15 digits).');
    }

    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email }],
      },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this phone or email already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        dob: new Date(dto.dob),
        email,
        phone,
        passwordHash,
        role: dto.role as UserRole,
        status: UserStatus.PENDING,
        tutorProfile: {
          create: {
            subjects: dto.subjects,
            classes: dto.classes,
            documentsNote: dto.documentsNote?.trim() || null,
          },
        },
      },
      include: { tutorProfile: true },
    });

    return {
      message:
        'Registration submitted. You can sign in after the CEO approves your account.',
      user: this.toPublicUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userAuthInclude,
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return this.toPublicUser(user);
  }

  private assertCanLogin(status: UserStatus) {
    if (status === UserStatus.PENDING) {
      throw new ForbiddenException(
        'Your account is waiting for CEO approval. Please try again later.',
      );
    }

    if (status === UserStatus.REJECTED) {
      throw new ForbiddenException(
        'Your registration was not approved. Contact the academy CEO.',
      );
    }

    if (status !== UserStatus.APPROVED && status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your account cannot sign in right now.');
    }
  }

  private async issueTokenPair(
    userId: string,
    role: UserRole,
    phone: string | null,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role, phone, type: 'access' },
      { secret: this.accessSecret, expiresIn: this.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: userId,
        role,
        type: 'refresh',
        jti: randomBytes(16).toString('hex'),
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshCookieMaxAgeMs),
      },
    });

    return { accessToken, refreshToken };
  }

  private parseDurationToMs(value: string) {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * multipliers[unit];
  }

  private toPublicUser(user: PublicUserShape) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      dob: user.dob,
      role: user.role,
      status: user.status,
      mustChangePassword: Boolean(user.mustChangePassword),
      tutorProfile: user.tutorProfile
        ? {
            subjects: user.tutorProfile.subjects,
            classes: user.tutorProfile.classes,
            documentsNote: user.tutorProfile.documentsNote,
            salaryStatus: user.tutorProfile.salaryStatus,
          }
        : null,
      parentProfile: user.parentProfile
        ? {
            phone: user.parentProfile.phone,
            students: user.parentProfile.students.map((student) => ({
              id: student.id,
              fullName: student.fullName,
              className: student.className,
            })),
          }
        : null,
    };
  }
}
