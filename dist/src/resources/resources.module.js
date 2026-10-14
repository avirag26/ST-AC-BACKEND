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
exports.ResourcesModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_module_1 = require("../storage/storage.module");
const storage_service_1 = require("../storage/storage.service");
class ResourceDto {
    title;
    subject;
    className;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], ResourceDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ResourceDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ResourceDto.prototype, "className", void 0);
let ResourcesController = class ResourcesController {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async scope(req) {
        if (req.user.role !== 'PARENT')
            return {};
        const children = await this.prisma.student.findMany({ where: { parent: { userId: req.user.userId } }, select: { className: true } });
        return { className: { in: children.map((s) => s.className).filter((s) => Boolean(s)) } };
    }
    async list(req) {
        return this.prisma.resource.findMany({ where: await this.scope(req), orderBy: { createdAt: 'desc' }, select: { id: true, title: true, subject: true, className: true, createdAt: true } });
    }
    async download(req, id) {
        const resource = await this.prisma.resource.findFirst({ where: { id, ...await this.scope(req) } });
        if (!resource)
            throw new common_1.NotFoundException('Resource not found.');
        return { url: await this.storage.getDownloadUrl(resource.storageKey, 300) };
    }
    async create(req, dto, file) {
        if (!file || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-')
            throw new common_1.BadRequestException('Upload a PDF up to 10 MB.');
        if (!dto.title.trim())
            throw new common_1.BadRequestException('Enter a resource title.');
        const [subject, grade] = await Promise.all([
            this.prisma.subject.findFirst({ where: { name: dto.subject, isActive: true } }),
            this.prisma.classGrade.findFirst({ where: { name: dto.className, isActive: true } }),
        ]);
        if (!subject || !grade)
            throw new common_1.BadRequestException('Select an active subject and class.');
        const storageKey = 'resources/' + (0, crypto_1.randomUUID)() + '.pdf';
        try {
            await this.storage.uploadPdf(storageKey, file.buffer);
        }
        catch {
            throw new common_1.ServiceUnavailableException('File storage is unavailable. No resource was published.');
        }
        try {
            return await this.prisma.resource.create({ data: { ...dto, title: dto.title.trim(), storageKey, createdBy: req.user.userId }, select: { id: true } });
        }
        catch (e) {
            await this.storage.deleteObject(storageKey).catch(() => undefined);
            throw e;
        }
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "download", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ResourceDto, Object]),
    __metadata("design:returntype", Promise)
], ResourcesController.prototype, "create", null);
ResourcesController = __decorate([
    (0, common_1.Controller)('resources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN, client_1.UserRole.PARENT),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, storage_service_1.StorageService])
], ResourcesController);
let ResourcesModule = class ResourcesModule {
};
exports.ResourcesModule = ResourcesModule;
exports.ResourcesModule = ResourcesModule = __decorate([
    (0, common_1.Module)({ imports: [storage_module_1.StorageModule], controllers: [ResourcesController] })
], ResourcesModule);
//# sourceMappingURL=resources.module.js.map