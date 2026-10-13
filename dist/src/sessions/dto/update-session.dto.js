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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSessionDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class UpdateSessionDto {
    title;
    subjectName;
    startsAt;
    endsAt;
    tutorProfileId;
    batchId;
    studentId;
    notes;
    status;
}
exports.UpdateSessionDto = UpdateSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== '' && value != null),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== '' && value != null),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateSessionDto.prototype, "subjectName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "tutorProfileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== '' && value != null),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateSessionDto.prototype, "batchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== '' && value != null),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateSessionDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, value) => value !== '' && value != null),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateSessionDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SessionStatus),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "status", void 0);
//# sourceMappingURL=update-session.dto.js.map