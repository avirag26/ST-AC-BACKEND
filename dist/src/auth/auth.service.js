"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
function normalizePhone(phone) {
    return phone.replace(/[\s\-()]/g, '');
}
function hashToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
const userAuthInclude = {
    tutorProfile: true,
    parentProfile: {
        include: {
            students: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    fullName: true,
                    className: true,
                },
            },
        },
    },
};
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    accessExpiresIn;
    refreshExpiresIn;
    accessSecret;
    refreshSecret;
    refreshCookieMaxAgeMs;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.accessExpiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN', '15m');
        this.refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
        this.accessSecret = this.config.get('JWT_ACCESS_SECRET', this.config.get('JWT_SECRET', 'stac-dev-secret-change-me'));
        this.refreshSecret = this.config.get('JWT_REFRESH_SECRET', `${this.accessSecret}-refresh`);
        this.refreshCookieMaxAgeMs = this.parseDurationToMs(this.refreshExpiresIn);
    }
    async login(dto) {
        const phone = normalizePhone(dto.phone);
        const user = await this.prisma.user.findUnique({
            where: { phone },
            include: userAuthInclude,
        });
        if (!user || !user.phone) {
            throw new common_1.UnauthorizedException('Invalid phone number or password.');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid phone number or password.');
        }
        this.assertCanLogin(user.status);
        const tokens = await this.issueTokenPair(user.id, user.role, user.phone);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.toPublicUser(user),
        };
    }
    async loginWithEmail(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: userAuthInclude,
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.role !== client_1.UserRole.PARENT) {
            throw new common_1.ForbiddenException('This portal is for parents. Use the tutor or CEO app for other accounts.');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        this.assertCanLogin(user.status);
        const tokens = await this.issueTokenPair(user.id, user.role, user.phone);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.toPublicUser(user),
        };
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token missing.');
        }
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired.');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
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
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired.');
        }
        const user = stored.user;
        this.assertCanLogin(user.status);
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        const tokens = await this.issueTokenPair(user.id, user.role, user.phone);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.toPublicUser(user),
        };
    }
    async logout(refreshToken) {
        if (!refreshToken) {
            return { message: 'Signed out.' };
        }
        const tokenHash = hashToken(refreshToken);
        await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
        return { message: 'Signed out.' };
    }
    async registerTutor(dto) {
        if (dto.role !== client_1.UserRole.HOME_TUTOR &&
            dto.role !== client_1.UserRole.OFFLINE_TUTOR) {
            throw new common_1.BadRequestException('Invalid tutor role.');
        }
        const phone = normalizePhone(dto.phone);
        if (!/^\+?[0-9]{10,15}$/.test(phone)) {
            throw new common_1.BadRequestException('Enter a valid phone number (10–15 digits).');
        }
        const email = dto.email.trim().toLowerCase();
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ phone }, { email }],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('An account with this phone or email already exists.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName.trim(),
                dob: new Date(dto.dob),
                email,
                phone,
                passwordHash,
                role: dto.role,
                status: client_1.UserStatus.PENDING,
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
            message: 'Registration submitted. You can sign in after the CEO approves your account.',
            user: this.toPublicUser(user),
        };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: userAuthInclude,
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found.');
        }
        return this.toPublicUser(user);
    }
    assertCanLogin(status) {
        if (status === client_1.UserStatus.PENDING) {
            throw new common_1.ForbiddenException('Your account is waiting for CEO approval. Please try again later.');
        }
        if (status === client_1.UserStatus.REJECTED) {
            throw new common_1.ForbiddenException('Your registration was not approved. Contact the academy CEO.');
        }
        if (status !== client_1.UserStatus.APPROVED && status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Your account cannot sign in right now.');
        }
    }
    async issueTokenPair(userId, role, phone) {
        const accessToken = await this.jwt.signAsync({ sub: userId, role, phone, type: 'access' }, { secret: this.accessSecret, expiresIn: this.accessExpiresIn });
        const refreshToken = await this.jwt.signAsync({
            sub: userId,
            role,
            type: 'refresh',
            jti: (0, crypto_1.randomBytes)(16).toString('hex'),
        }, {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn,
        });
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: hashToken(refreshToken),
                expiresAt: new Date(Date.now() + this.refreshCookieMaxAgeMs),
            },
        });
        return { accessToken, refreshToken };
    }
    parseDurationToMs(value) {
        const match = /^(\d+)([smhd])$/.exec(value.trim());
        if (!match) {
            return 7 * 24 * 60 * 60 * 1000;
        }
        const amount = Number(match[1]);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return amount * multipliers[unit];
    }
    toPublicUser(user) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map