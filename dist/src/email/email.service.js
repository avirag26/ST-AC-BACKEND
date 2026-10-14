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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    config;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(config) {
        this.config = config;
    }
    get configured() { return Boolean(this.config.get('SMTP_HOST') && this.config.get('SMTP_FROM')); }
    async send(to, subject, text) {
        if (!this.configured)
            throw new common_1.ServiceUnavailableException('Email delivery is not configured. Contact the academy.');
        const user = this.config.get('SMTP_USER');
        const transport = nodemailer_1.default.createTransport({
            host: this.config.get('SMTP_HOST'), port: Number(this.config.get('SMTP_PORT', '587')),
            secure: this.config.get('SMTP_SECURE', 'false') === 'true',
            requireTLS: this.config.get('SMTP_SECURE', 'false') !== 'true',
            auth: user ? { user, pass: this.config.get('SMTP_PASSWORD') } : undefined,
            connectionTimeout: 10000, socketTimeout: 15000, disableFileAccess: true, disableUrlAccess: true,
        });
        try {
            const result = await transport.sendMail({ from: this.config.get('SMTP_FROM'), to, subject, text });
            if (!result.accepted.length)
                throw new Error('Recipient not accepted');
        }
        catch {
            this.logger.warn('Email delivery failed; check SMTP configuration.');
            throw new common_1.ServiceUnavailableException('Email could not be sent. Please try again later.');
        }
        finally {
            transport.close();
        }
    }
    async sendWelcomeWithPassword(payload) {
        try {
            await this.send(payload.to, 'Welcome to Straight Line Academy', `Hello ${payload.fullName},\nYour ${payload.roleLabel} account is ready.\nEmail: ${payload.to}\nTemporary password: ${payload.temporaryPassword}\nPlease change your password after signing in.`);
            return { emailed: true, reason: 'Welcome email accepted by the mail server.' };
        }
        catch {
            return { emailed: false, reason: 'Email could not be delivered. Share the temporary password shown in the CEO portal securely.' };
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map