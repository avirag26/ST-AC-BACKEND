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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetModule = exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
class RequestOtpDto {
    email;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "email", void 0);
class ResetPasswordDto extends RequestOtpDto {
    code;
    password;
}
__decorate([
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
let PasswordResetService = class PasswordResetService {
    prisma;
    email;
    config;
    requests = new Map();
    constructor(prisma, email, config) {
        this.prisma = prisma;
        this.email = email;
        this.config = config;
    }
    throttle(ip) {
        const now = Date.now();
        for (const [key, value] of this.requests)
            if (value.until < now)
                this.requests.delete(key);
        const row = this.requests.get(ip) ?? { count: 0, until: now + 15 * 60000 };
        if (row.count >= 15)
            throw new common_1.HttpException('Too many attempts. Please try again in 15 minutes.', 429);
        row.count++;
        this.requests.set(ip, row);
    }
    hash(email, code) {
        const secret = this.config.get('JWT_ACCESS_SECRET') || this.config.get('JWT_SECRET');
        if (!secret)
            throw new common_1.ServiceUnavailableException('Password reset is not configured.');
        return (0, crypto_1.createHmac)('sha256', secret).update(email + ':' + code).digest('hex');
    }
    async request(dto) {
        if (!this.email.configured)
            throw new common_1.ServiceUnavailableException('Email delivery is not configured. Contact the academy.');
        const email = dto.email.trim().toLowerCase();
        const response = { message: 'If the email is registered, a code will arrive shortly. It expires in 10 minutes.' };
        const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user)
            return response;
        const code = String((0, crypto_1.randomInt)(100000, 1000000));
        const tokenHash = this.hash(email, code);
        const token = await this.prisma.otpToken.findUnique({ where: { email } });
        const values = { tokenHash, expiresAt: new Date(Date.now() + 600000), requestedAt: new Date(), consumedAt: null, attempts: 0 };
        if (token) {
            const reserved = await this.prisma.otpToken.updateMany({ where: { email, requestedAt: { lt: new Date(Date.now() - 60000) } }, data: values });
            if (!reserved.count)
                return response;
        }
        else {
            try {
                await this.prisma.otpToken.create({ data: { email, ...values } });
            }
            catch {
                return response;
            }
        }
        try {
            await this.email.send(email, 'Your Straight Line Academy reset code', `Your password reset code is ${code}. It expires in 10 minutes. Do not share it. If you did not request it, ignore this email.`);
        }
        catch {
            await this.prisma.otpToken.updateMany({ where: { email, tokenHash }, data: { consumedAt: new Date() } });
            throw new common_1.ServiceUnavailableException('Email could not be sent. Try again later.');
        }
        return response;
    }
    async reset(dto) {
        const email = dto.email.trim().toLowerCase();
        const token = await this.prisma.otpToken.findUnique({ where: { email } });
        const invalid = () => new common_1.BadRequestException('Invalid or expired code. Request a new code.');
        if (!token)
            throw invalid();
        const reserved = await this.prisma.otpToken.updateMany({ where: { email, tokenHash: token.tokenHash, attempts: { lt: 5 }, expiresAt: { gt: new Date() }, consumedAt: null }, data: { attempts: { increment: 1 } } });
        if (!reserved.count)
            throw invalid();
        const candidate = this.hash(email, dto.code);
        if (!(0, crypto_1.timingSafeEqual)(Buffer.from(candidate), Buffer.from(token.tokenHash)))
            throw invalid();
        const passwordHash = await bcrypt.hash(dto.password, 12);
        await this.prisma.$transaction(async (tx) => {
            const used = await tx.otpToken.updateMany({ where: { email, tokenHash: token.tokenHash, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
            if (!used.count)
                throw invalid();
            const user = await tx.user.update({ where: { email }, data: { passwordHash, mustChangePassword: false } });
            await tx.refreshToken.deleteMany({ where: { userId: user.id } });
        });
        return { message: 'Password updated. Sign in with your new password.' };
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, email_service_1.EmailService, config_1.ConfigService])
], PasswordResetService);
let PasswordResetController = class PasswordResetController {
    service;
    constructor(service) {
        this.service = service;
    }
    request(req, dto) { this.service.throttle(req.ip); return this.service.request(dto); }
    reset(req, dto) { this.service.throttle(req.ip); return this.service.reset(dto); }
};
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RequestOtpDto]),
    __metadata("design:returntype", void 0)
], PasswordResetController.prototype, "request", null);
__decorate([
    (0, common_1.Post)('reset'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], PasswordResetController.prototype, "reset", null);
PasswordResetController = __decorate([
    (0, common_1.Controller)('auth/password'),
    __metadata("design:paramtypes", [PasswordResetService])
], PasswordResetController);
let PasswordResetModule = class PasswordResetModule {
};
exports.PasswordResetModule = PasswordResetModule;
exports.PasswordResetModule = PasswordResetModule = __decorate([
    (0, common_1.Module)({ controllers: [PasswordResetController], providers: [PasswordResetService] })
], PasswordResetModule);
//# sourceMappingURL=password-reset.module.js.map