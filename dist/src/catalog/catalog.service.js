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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listSubjects() {
        return this.prisma.subject.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    listClasses() {
        return this.prisma.classGrade.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async createSubject(name) {
        const trimmed = name.trim();
        const existing = await this.prisma.subject.findUnique({
            where: { name: trimmed },
        });
        if (existing?.isActive) {
            throw new common_1.ConflictException('This subject already exists.');
        }
        if (existing && !existing.isActive) {
            return this.prisma.subject.update({
                where: { id: existing.id },
                data: { isActive: true },
            });
        }
        return this.prisma.subject.create({
            data: { name: trimmed },
        });
    }
    async createClass(name) {
        const trimmed = name.trim();
        const existing = await this.prisma.classGrade.findUnique({
            where: { name: trimmed },
        });
        if (existing?.isActive) {
            throw new common_1.ConflictException('This class already exists.');
        }
        if (existing && !existing.isActive) {
            return this.prisma.classGrade.update({
                where: { id: existing.id },
                data: { isActive: true },
            });
        }
        return this.prisma.classGrade.create({
            data: { name: trimmed },
        });
    }
    async updateSubject(id, name) {
        const trimmed = name.trim();
        const existing = await this.prisma.subject.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            throw new common_1.NotFoundException('Subject not found.');
        }
        const duplicate = await this.prisma.subject.findFirst({
            where: {
                name: trimmed,
                NOT: { id },
            },
        });
        if (duplicate?.isActive) {
            throw new common_1.ConflictException('This subject already exists.');
        }
        if (duplicate && !duplicate.isActive) {
            await this.prisma.subject.delete({ where: { id: duplicate.id } });
        }
        return this.prisma.subject.update({
            where: { id },
            data: { name: trimmed },
        });
    }
    async updateClass(id, name) {
        const trimmed = name.trim();
        const existing = await this.prisma.classGrade.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            throw new common_1.NotFoundException('Class not found.');
        }
        const duplicate = await this.prisma.classGrade.findFirst({
            where: {
                name: trimmed,
                NOT: { id },
            },
        });
        if (duplicate?.isActive) {
            throw new common_1.ConflictException('This class already exists.');
        }
        if (duplicate && !duplicate.isActive) {
            await this.prisma.classGrade.delete({ where: { id: duplicate.id } });
        }
        return this.prisma.classGrade.update({
            where: { id },
            data: { name: trimmed },
        });
    }
    async deleteSubject(id) {
        const existing = await this.prisma.subject.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            throw new common_1.NotFoundException('Subject not found.');
        }
        return this.prisma.subject.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async deleteClass(id) {
        const existing = await this.prisma.classGrade.findUnique({ where: { id } });
        if (!existing || !existing.isActive) {
            throw new common_1.NotFoundException('Class not found.');
        }
        return this.prisma.classGrade.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map