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
exports.TutorsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const reject_tutor_dto_1 = require("./dto/reject-tutor.dto");
const tutors_service_1 = require("./tutors.service");
let TutorsController = class TutorsController {
    tutorsService;
    constructor(tutorsService) {
        this.tutorsService = tutorsService;
    }
    list(status) {
        const normalized = status?.toUpperCase();
        const allowed = Object.values(client_1.UserStatus);
        const filter = normalized && allowed.includes(normalized)
            ? normalized
            : undefined;
        return this.tutorsService.list(filter);
    }
    getOne(id) {
        return this.tutorsService.getOne(id);
    }
    approve(id) {
        return this.tutorsService.approve(id);
    }
    reject(id, dto) {
        return this.tutorsService.reject(id, dto.reason);
    }
};
exports.TutorsController = TutorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TutorsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TutorsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TutorsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_tutor_dto_1.RejectTutorDto]),
    __metadata("design:returntype", void 0)
], TutorsController.prototype, "reject", null);
exports.TutorsController = TutorsController = __decorate([
    (0, common_1.Controller)('tutors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [tutors_service_1.TutorsService])
], TutorsController);
//# sourceMappingURL=tutors.controller.js.map