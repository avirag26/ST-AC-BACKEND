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
exports.JourneyController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const journey_location_dto_1 = require("./dto/journey-location.dto");
const live_location_dto_1 = require("./dto/live-location.dto");
const journey_service_1 = require("./journey.service");
let JourneyController = class JourneyController {
    journeyService;
    constructor(journeyService) {
        this.journeyService = journeyService;
    }
    listLive() {
        return this.journeyService.listLiveForCeo();
    }
    listHistory() {
        return this.journeyService.listHistoryForCeo();
    }
    getDetail(sessionId) {
        return this.journeyService.getTrackingDetailForCeo(sessionId);
    }
    get(id, req) {
        return this.journeyService.getForTutor(id, req.user.userId);
    }
    leave(id, req, dto) {
        return this.journeyService.leaveHome(id, req.user.userId, dto);
    }
    reach(id, req, dto) {
        return this.journeyService.reach(id, req.user.userId, dto);
    }
    start(id, req, dto) {
        return this.journeyService.startClass(id, req.user.userId, dto);
    }
    stop(id, req, dto) {
        return this.journeyService.stop(id, req.user.userId, dto);
    }
    ping(id, req, dto) {
        return this.journeyService.pingLive(id, req.user.userId, dto);
    }
};
exports.JourneyController = JourneyController;
__decorate([
    (0, common_1.Get)('tracking/live'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "listLive", null);
__decorate([
    (0, common_1.Get)('tracking/history'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "listHistory", null);
__decorate([
    (0, common_1.Get)('tracking/:sessionId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CEO, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Get)('sessions/:id/journey'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('sessions/:id/journey/leave'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, journey_location_dto_1.JourneyLocationDto]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)('sessions/:id/journey/reach'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, journey_location_dto_1.JourneyLocationDto]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "reach", null);
__decorate([
    (0, common_1.Post)('sessions/:id/journey/start'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, journey_location_dto_1.JourneyLocationDto]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('sessions/:id/journey/stop'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, journey_location_dto_1.JourneyLocationDto]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "stop", null);
__decorate([
    (0, common_1.Post)('sessions/:id/journey/ping'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.HOME_TUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, live_location_dto_1.LiveLocationDto]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "ping", null);
exports.JourneyController = JourneyController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [journey_service_1.JourneyService])
], JourneyController);
//# sourceMappingURL=journey.controller.js.map