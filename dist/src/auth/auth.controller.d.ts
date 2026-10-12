import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTutorDto } from './dto/register-tutor.dto';
type AuthRequest = Request & {
    user: {
        userId: string;
        role: string;
    };
    cookies?: Record<string, string>;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
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
    loginWithEmail(dto: LoginEmailDto, res: Response): Promise<{
        accessToken: string;
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
    refresh(req: AuthRequest, res: Response): Promise<{
        accessToken: string;
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
    logout(req: AuthRequest, res: Response): Promise<{
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
    me(req: AuthRequest): Promise<{
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
}
export {};
