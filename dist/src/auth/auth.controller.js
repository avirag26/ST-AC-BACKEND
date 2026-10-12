"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_cookies_1 = require("./auth-cookies");
const auth_service_1 = require("./auth.service");
const login_email_dto_1 = require("./dto/login-email.dto");
const login_dto_1 = require("./dto/login.dto");
const register_tutor_dto_1 = require("./dto/register-tutor.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        (0, auth_cookies_1.setRefreshCookie)(res, result.refreshToken, this.authService.refreshCookieMaxAgeMs);
        return {
            accessToken: result.accessToken,
            user: result.user,
        };
    }
    async loginWithEmail(dto, res) {
        const result = await this.authService.loginWithEmail(dto);
        (0, auth_cookies_1.setRefreshCookie)(res, result.refreshToken, this.authService.refreshCookieMaxAgeMs);
        return {
            accessToken: result.accessToken,
            user: result.user,
        };
    }
    async refresh(req, res) {
        const refreshToken = req.cookies?.[auth_cookies_1.REFRESH_COOKIE_NAME];
        const result = await this.authService.refresh(refreshToken);
        (0, auth_cookies_1.setRefreshCookie)(res, result.refreshToken, this.authService.refreshCookieMaxAgeMs);
        return {
            accessToken: result.accessToken,
            user: result.user,
        };
    }
    async logout(req, res) {
        const refreshToken = req.cookies?.[auth_cookies_1.REFRESH_COOKIE_NAME];
        await this.authService.logout(refreshToken);
        (0, auth_cookies_1.clearRefreshCookie)(res);
        return { message: 'Signed out.' };
    }
    registerTutor(dto) {
        return this.authService.registerTutor(dto);
    }
    me(req) {
        return this.authService.me(req.user.userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('login/email'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_email_dto_1.LoginEmailDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithEmail", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('register/tutor'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_tutor_dto_1.RegisterTutorDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerTutor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map