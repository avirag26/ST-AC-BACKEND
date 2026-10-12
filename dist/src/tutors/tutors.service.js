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
exports.TutorsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let TutorsService = class TutorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(status) {
        const tutors = await this.prisma.user.findMany({
            where: {
                role: { in: [client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR] },
                ...(status ? { status } : {}),
            },
            include: { tutorProfile: true },
            orderBy: { createdAt: 'desc' },
        });
        return tutors.map((tutor) => this.toTutorCard(tutor));
    }
    async getOne(id) {
        const tutor = await this.findTutorOrThrow(id);
        return this.toTutorCard(tutor);
    }
    async approve(id) {
        const tutor = await this.findTutorOrThrow(id);
        if (tutor.status === client_1.UserStatus.APPROVED) {
            return this.toTutorCard(tutor);
        }
        if (tutor.status === client_1.UserStatus.REJECTED) {
        }
        else if (tutor.status !== client_1.UserStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending tutors can be approved.');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.APPROVED,
                rejectionReason: null,
            },
            include: { tutorProfile: true },
        });
        return this.toTutorCard(updated);
    }
    async reject(id, reason) {
        const tutor = await this.findTutorOrThrow(id);
        if (tutor.status === client_1.UserStatus.REJECTED) {
            return this.toTutorCard(tutor);
        }
        if (tutor.status !== client_1.UserStatus.PENDING &&
            tutor.status !== client_1.UserStatus.APPROVED) {
            throw new common_1.BadRequestException('This tutor cannot be rejected.');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.REJECTED,
                rejectionReason: reason?.trim() || null,
            },
            include: { tutorProfile: true },
        });
        return this.toTutorCard(updated);
    }
    async findTutorOrThrow(id) {
        const tutor = await this.prisma.user.findFirst({
            where: {
                id,
                role: { in: [client_1.UserRole.HOME_TUTOR, client_1.UserRole.OFFLINE_TUTOR] },
            },
            include: { tutorProfile: true },
        });
        if (!tutor) {
            throw new common_1.NotFoundException('Tutor not found.');
        }
        return tutor;
    }
    toTutorCard(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            dob: user.dob,
            role: user.role,
            status: user.status,
            rejectionReason: user.rejectionReason,
            createdAt: user.createdAt,
            subjects: user.tutorProfile?.subjects ?? [],
            classes: user.tutorProfile?.classes ?? [],
            documentsNote: user.tutorProfile?.documentsNote ?? null,
            salaryStatus: user.tutorProfile?.salaryStatus ?? null,
        };
    }
};
exports.TutorsService = TutorsService;
exports.TutorsService = TutorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TutorsService);
//# sourceMappingURL=tutors.service.js.map