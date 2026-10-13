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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
function normalizePhone(phone) {
    if (!phone?.trim())
        return null;
    return phone.replace(/[\s\-()]/g, '');
}
function generateTempPassword() {
    return `Parent@${(0, crypto_1.randomInt)(100000, 999999)}`;
}
let StudentsService = class StudentsService {
    prisma;
    email;
    constructor(prisma, email) {
        this.prisma = prisma;
        this.email = email;
    }
    async list() {
        const students = await this.prisma.student.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                parent: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                                status: true,
                                mustChangePassword: true,
                            },
                        },
                    },
                },
                batches: {
                    include: {
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                isActive: true,
                                classGrade: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });
        return students.map((student) => ({
            id: student.id,
            fullName: student.fullName,
            className: student.className,
            createdAt: student.createdAt,
            batches: student.batches.map((row) => ({
                id: row.batch.id,
                name: row.batch.name,
                isActive: row.batch.isActive,
                className: row.batch.classGrade.name,
            })),
            parent: {
                profileId: student.parent.id,
                userId: student.parent.user.id,
                fullName: student.parent.user.fullName,
                email: student.parent.user.email,
                phone: student.parent.phone ?? student.parent.user.phone,
                status: student.parent.user.status,
                mustChangePassword: student.parent.user.mustChangePassword,
            },
        }));
    }
    async create(dto) {
        const parentEmail = dto.parentEmail.trim().toLowerCase();
        const parentPhone = normalizePhone(dto.parentPhone);
        const studentFullName = dto.studentFullName.trim();
        let className = dto.className?.trim() || null;
        const batchId = dto.batchId?.trim() || null;
        if (parentPhone && !/^\+?[0-9]{10,15}$/.test(parentPhone)) {
            throw new common_1.BadRequestException('Enter a valid parent phone number (10–15 digits), or leave it blank.');
        }
        let batch = null;
        if (batchId) {
            batch = await this.prisma.batch.findUnique({
                where: { id: batchId },
                select: {
                    id: true,
                    name: true,
                    isActive: true,
                    classGrade: { select: { name: true } },
                },
            });
            if (!batch || !batch.isActive) {
                throw new common_1.BadRequestException('Select an active batch for this class.');
            }
            if (className && className !== batch.classGrade.name) {
                throw new common_1.BadRequestException(`Batch “${batch.name}” belongs to ${batch.classGrade.name}, not ${className}.`);
            }
            className = batch.classGrade.name;
        }
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: parentEmail },
                    ...(parentPhone ? [{ phone: parentPhone }] : []),
                ],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('An account with this email or parent phone already exists.');
        }
        const temporaryPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);
        const parentUser = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    fullName: dto.parentFullName.trim(),
                    email: parentEmail,
                    phone: parentPhone,
                    passwordHash,
                    role: client_1.UserRole.PARENT,
                    status: client_1.UserStatus.ACTIVE,
                    mustChangePassword: true,
                    parentProfile: {
                        create: {
                            phone: parentPhone,
                            students: {
                                create: {
                                    fullName: studentFullName,
                                    className,
                                },
                            },
                        },
                    },
                },
                include: {
                    parentProfile: {
                        include: { students: true },
                    },
                },
            });
            const student = created.parentProfile?.students[0];
            if (!created.parentProfile || !student) {
                throw new common_1.BadRequestException('Could not create parent and student.');
            }
            if (batch) {
                await tx.batchStudent.create({
                    data: { batchId: batch.id, studentId: student.id },
                });
            }
            return created;
        });
        const student = parentUser.parentProfile?.students[0];
        if (!parentUser.parentProfile || !student) {
            throw new common_1.BadRequestException('Could not create parent and student.');
        }
        const mail = await this.email.sendWelcomeWithPassword({
            to: parentEmail,
            fullName: parentUser.fullName,
            roleLabel: 'Parent',
            temporaryPassword,
        });
        return {
            message: batch
                ? `Parent account and student created, and enrolled in batch “${batch.name}”.`
                : 'Parent account and student created. One email login for the family — share the temporary password until email delivery is configured.',
            emailDelivery: mail,
            credentials: {
                email: parentEmail,
                temporaryPassword,
            },
            student: {
                id: student.id,
                fullName: student.fullName,
                className: student.className,
                batch: batch
                    ? {
                        id: batch.id,
                        name: batch.name,
                        className: batch.classGrade.name,
                    }
                    : null,
            },
            parent: {
                profileId: parentUser.parentProfile.id,
                userId: parentUser.id,
                fullName: parentUser.fullName,
                email: parentUser.email,
                phone: parentPhone,
            },
        };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], StudentsService);
//# sourceMappingURL=students.service.js.map