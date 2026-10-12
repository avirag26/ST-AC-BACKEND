import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTutorDto } from './dto/register-tutor.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly accessExpiresIn;
    private readonly refreshExpiresIn;
    private readonly accessSecret;
    private readonly refreshSecret;
    readonly refreshCookieMaxAgeMs: number;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            phone: string | null;
            email: string;
            fullName: string;
            dob: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            mustChangePassword: boolean;
            tutorProfile: {
                subjects: string[];
                classes: string[];
                documentsNote: string | null;
                salaryStatus: string;
            } | null;
            parentProfile: {
                phone: string | null;
                students: {
                    id: string;
                    fullName: string;
                    className: string | null;
                }[];
            } | null;
        };
    }>;
    loginWithEmail(dto: LoginEmailDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            phone: string | null;
            email: string;
            fullName: string;
            dob: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            mustChangePassword: boolean;
            tutorProfile: {
                subjects: string[];
                classes: string[];
                documentsNote: string | null;
                salaryStatus: string;
            } | null;
            parentProfile: {
                phone: string | null;
                students: {
                    id: string;
                    fullName: string;
                    className: string | null;
                }[];
            } | null;
        };
    }>;
    refresh(refreshToken?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            phone: string | null;
            email: string;
            fullName: string;
            dob: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            mustChangePassword: boolean;
            tutorProfile: {
                subjects: string[];
                classes: string[];
                documentsNote: string | null;
                salaryStatus: string;
            } | null;
            parentProfile: {
                phone: string | null;
                students: {
                    id: string;
                    fullName: string;
                    className: string | null;
                }[];
            } | null;
        };
    }>;
    logout(refreshToken?: string): Promise<{
        message: string;
    }>;
    registerTutor(dto: RegisterTutorDto): Promise<{
        message: string;
        user: {
            id: string;
            phone: string | null;
            email: string;
            fullName: string;
            dob: Date | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            mustChangePassword: boolean;
            tutorProfile: {
                subjects: string[];
                classes: string[];
                documentsNote: string | null;
                salaryStatus: string;
            } | null;
            parentProfile: {
                phone: string | null;
                students: {
                    id: string;
                    fullName: string;
                    className: string | null;
                }[];
            } | null;
        };
    }>;
    me(userId: string): Promise<{
        id: string;
        phone: string | null;
        email: string;
        fullName: string;
        dob: Date | null;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        mustChangePassword: boolean;
        tutorProfile: {
            subjects: string[];
            classes: string[];
            documentsNote: string | null;
            salaryStatus: string;
        } | null;
        parentProfile: {
            phone: string | null;
            students: {
                id: string;
                fullName: string;
                className: string | null;
            }[];
        } | null;
    }>;
    private assertCanLogin;
    private issueTokenPair;
    private parseDurationToMs;
    private toPublicUser;
}
