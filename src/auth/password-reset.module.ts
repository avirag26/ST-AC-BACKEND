import { BadRequestException, Body, Controller, HttpException, Injectable, Module, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
class RequestOtpDto {
  @IsEmail() @MaxLength(254) email!: string;
}
class ResetPasswordDto extends RequestOtpDto {
  @Matches(/^\d{6}$/) code!: string;
  @IsString() @MinLength(10) @MaxLength(72) password!: string;
}
@Injectable()
export class PasswordResetService {
  private readonly requests = new Map<string, { count: number; until: number }>();
  constructor(private readonly prisma: PrismaService, private readonly email: EmailService, private readonly config: ConfigService) {}
  throttle(ip: string) {
    const now = Date.now();
    for (const [key, value] of this.requests) if (value.until < now) this.requests.delete(key);
    const row = this.requests.get(ip) ?? { count: 0, until: now + 15 * 60000 };
    if (row.count >= 15) throw new HttpException('Too many attempts. Please try again in 15 minutes.', 429);
    row.count++; this.requests.set(ip, row);
  }
  private hash(email: string, code: string) {
    const secret = this.config.get<string>('JWT_ACCESS_SECRET') || this.config.get<string>('JWT_SECRET');
    if (!secret) throw new ServiceUnavailableException('Password reset is not configured.');
    return createHmac('sha256', secret).update(email + ':' + code).digest('hex');
  }
  async request(dto: RequestOtpDto) {
    if (!this.email.configured) throw new ServiceUnavailableException('Email delivery is not configured. Contact the academy.');
    const email = dto.email.trim().toLowerCase();
    const response = { message: 'If the email is registered, a code will arrive shortly. It expires in 10 minutes.' };
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return response;
    const code = String(randomInt(100000, 1000000));
    const tokenHash = this.hash(email, code);
    const token = await this.prisma.otpToken.findUnique({ where: { email } });
    const values = { tokenHash, expiresAt: new Date(Date.now() + 600000), requestedAt: new Date(), consumedAt: null, attempts: 0 };
    if (token) {
      const reserved = await this.prisma.otpToken.updateMany({ where: { email, requestedAt: { lt: new Date(Date.now() - 60000) } }, data: values });
      if (!reserved.count) return response;
    } else {
      try { await this.prisma.otpToken.create({ data: { email, ...values } }); } catch { return response; }
    }
    try { await this.email.send(email, 'Your Straight Line Academy reset code', `Your password reset code is ${code}. It expires in 10 minutes. Do not share it. If you did not request it, ignore this email.`); }
    catch { await this.prisma.otpToken.updateMany({ where: { email, tokenHash }, data: { consumedAt: new Date() } }); throw new ServiceUnavailableException('Email could not be sent. Try again later.'); }
    return response;
  }
  async reset(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const token = await this.prisma.otpToken.findUnique({ where: { email } });
    const invalid = () => new BadRequestException('Invalid or expired code. Request a new code.');
    if (!token) throw invalid();
    const reserved = await this.prisma.otpToken.updateMany({ where: { email, tokenHash: token.tokenHash, attempts: { lt: 5 }, expiresAt: { gt: new Date() }, consumedAt: null }, data: { attempts: { increment: 1 } } });
    if (!reserved.count) throw invalid();
    const candidate = this.hash(email, dto.code);
    if (!timingSafeEqual(Buffer.from(candidate), Buffer.from(token.tokenHash))) throw invalid();
    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction(async (tx) => {
      const used = await tx.otpToken.updateMany({ where: { email, tokenHash: token.tokenHash, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
      if (!used.count) throw invalid();
      const user = await tx.user.update({ where: { email }, data: { passwordHash, mustChangePassword: false } });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    });
    return { message: 'Password updated. Sign in with your new password.' };
  }
}
@Controller('auth/password')
class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}
  @Post('request') request(@Req() req: { ip: string }, @Body() dto: RequestOtpDto) { this.service.throttle(req.ip); return this.service.request(dto); }
  @Post('reset') reset(@Req() req: { ip: string }, @Body() dto: ResetPasswordDto) { this.service.throttle(req.ip); return this.service.reset(dto); }
}
@Module({ controllers: [PasswordResetController], providers: [PasswordResetService] })
export class PasswordResetModule {}
