import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
declare class RequestOtpDto {
    email: string;
}
declare class ResetPasswordDto extends RequestOtpDto {
    code: string;
    password: string;
}
export declare class PasswordResetService {
    private readonly prisma;
    private readonly email;
    private readonly config;
    private readonly requests;
    constructor(prisma: PrismaService, email: EmailService, config: ConfigService);
    throttle(ip: string): void;
    private hash;
    request(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    reset(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
export declare class PasswordResetModule {
}
export {};
