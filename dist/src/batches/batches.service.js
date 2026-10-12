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
exports.BatchesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const batchListInclude = {
    classGrade: { select: { id: true, name: true, isActive: true } },
    tutorProfile: {
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    status: true,
                    role: true,
                },
            },
        },
    },
    _count: { select: { students: true } },
};
const batchDetailInclude = {
    classGrade: { select: { id: true, name: true, isActive: true } },
    tutorProfile: {
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    status: true,
                    role: true,
                },
            },
        },
    },
    students: {
        orderBy: { createdAt: 'asc' },
        include: {
            student: {
                select: {
                    id: true,
                    fullName: true,
                    className: true,
                    parent: {
                        select: {
                            user: { select: { fullName: true, email: true } },
                        },
                    },
                },
            },
        },
    },
};
let BatchesService = class BatchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list() {
        const batches = await this.prisma.batch.findMany({
            orderBy: { createdAt: 'desc' },
            include: batchListInclude,
        });
        return batches.map((batch) => this.toListItem(batch));
    }
    async listForTutor(userId) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
            include: { user: { select: { role: true } } },
        });
        if (!profile || profile.user.role !== client_1.UserRole.OFFLINE_TUTOR) {
            throw new common_1.NotFoundException('Offline tutor profile not found.');
        }
        const batches = await this.prisma.batch.findMany({
            where: {
                tutorProfileId: profile.id,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
            include: batchDetailInclude,
        });
        return batches.map((batch) => this.toDetail(batch));
    }
    async getOne(id) {
        const batch = await this.prisma.batch.findUnique({
            where: { id },
            include: batchDetailInclude,
        });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found.');
        }
        return this.toDetail(batch);
    }
    async create(dto) {
        const classGrade = await this.prisma.classGrade.findUnique({
            where: { id: dto.classGradeId },
        });
        if (!classGrade || !classGrade.isActive) {
            throw new common_1.BadRequestException('Select an active class from the catalog.');
        }
        const tutorProfileId = dto.tutorProfileId?.trim() || null;
        if (tutorProfileId) {
            await this.assertOfflineTutor(tutorProfileId);
        }
        const batch = await this.prisma.batch.create({
            data: {
                name: dto.name.trim(),
                classGradeId: dto.classGradeId,
                tutorProfileId,
            },
            include: batchDetailInclude,
        });
        return this.toDetail(batch);
    }
    async update(id, dto) {
        await this.findBatchOrThrow(id);
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (dto.tutorProfileId !== undefined) {
            const tutorProfileId = dto.tutorProfileId === null || dto.tutorProfileId === ''
                ? null
                : dto.tutorProfileId.trim();
            if (tutorProfileId) {
                await this.assertOfflineTutor(tutorProfileId);
            }
            data.tutorProfileId = tutorProfileId;
        }
        const batch = await this.prisma.batch.update({
            where: { id },
            data,
            include: batchDetailInclude,
        });
        return this.toDetail(batch);
    }
    async enroll(id, dto) {
        await this.findBatchOrThrow(id);
        const uniqueIds = [...new Set(dto.studentIds.map((s) => s.trim()).filter(Boolean))];
        if (uniqueIds.length === 0) {
            throw new common_1.BadRequestException('Select at least one student.');
        }
        const students = await this.prisma.student.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true },
        });
        if (students.length !== uniqueIds.length) {
            throw new common_1.BadRequestException('One or more students were not found.');
        }
        await this.prisma.batchStudent.createMany({
            data: uniqueIds.map((studentId) => ({ batchId: id, studentId })),
            skipDuplicates: true,
        });
        return this.getOne(id);
    }
    async unenroll(id, studentId) {
        await this.findBatchOrThrow(id);
        const enrollment = await this.prisma.batchStudent.findUnique({
            where: {
                batchId_studentId: { batchId: id, studentId },
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Student is not enrolled in this batch.');
        }
        await this.prisma.batchStudent.delete({ where: { id: enrollment.id } });
        return this.getOne(id);
    }
    async listOfflineTutors() {
        const tutors = await this.prisma.tutorProfile.findMany({
            where: {
                user: {
                    role: client_1.UserRole.OFFLINE_TUTOR,
                    status: { in: [client_1.UserStatus.APPROVED, client_1.UserStatus.ACTIVE] },
                },
            },
            orderBy: { user: { fullName: 'asc' } },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        status: true,
                    },
                },
            },
        });
        return tutors.map((tutor) => ({
            tutorProfileId: tutor.id,
            userId: tutor.user.id,
            fullName: tutor.user.fullName,
            phone: tutor.user.phone,
            status: tutor.user.status,
        }));
    }
    async findBatchOrThrow(id) {
        const batch = await this.prisma.batch.findUnique({ where: { id } });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found.');
        }
        return batch;
    }
    async assertOfflineTutor(tutorProfileId) {
        const profile = await this.prisma.tutorProfile.findUnique({
            where: { id: tutorProfileId },
            include: { user: true },
        });
        if (!profile) {
            throw new common_1.BadRequestException('Selected tutor was not found.');
        }
        if (profile.user.role !== client_1.UserRole.OFFLINE_TUTOR) {
            throw new common_1.BadRequestException('Only an offline / center tutor can be assigned to a batch.');
        }
        if (profile.user.status !== client_1.UserStatus.APPROVED &&
            profile.user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.BadRequestException('Assign only an approved offline tutor to the batch.');
        }
    }
    toListItem(batch) {
        return {
            id: batch.id,
            name: batch.name,
            isActive: batch.isActive,
            createdAt: batch.createdAt,
            classGrade: batch.classGrade,
            tutor: batch.tutorProfile
                ? {
                    tutorProfileId: batch.tutorProfile.id,
                    userId: batch.tutorProfile.user.id,
                    fullName: batch.tutorProfile.user.fullName,
                    phone: batch.tutorProfile.user.phone,
                    status: batch.tutorProfile.user.status,
                }
                : null,
            studentCount: batch._count.students,
        };
    }
    toDetail(batch) {
        return {
            id: batch.id,
            name: batch.name,
            isActive: batch.isActive,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
            classGrade: batch.classGrade,
            tutor: batch.tutorProfile
                ? {
                    tutorProfileId: batch.tutorProfile.id,
                    userId: batch.tutorProfile.user.id,
                    fullName: batch.tutorProfile.user.fullName,
                    phone: batch.tutorProfile.user.phone,
                    status: batch.tutorProfile.user.status,
                }
                : null,
            students: batch.students.map((row) => ({
                enrollmentId: row.id,
                enrolledAt: row.createdAt,
                id: row.student.id,
                fullName: row.student.fullName,
                className: row.student.className,
                parentName: row.student.parent.user.fullName,
                parentEmail: row.student.parent.user.email,
            })),
            studentCount: batch.students.length,
        };
    }
};
exports.BatchesService = BatchesService;
exports.BatchesService = BatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BatchesService);
//# sourceMappingURL=batches.service.js.map