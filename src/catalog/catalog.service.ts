import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createSubject(name: string) {
    const trimmed = name.trim();
    const existing = await this.prisma.subject.findUnique({
      where: { name: trimmed },
    });

    if (existing?.isActive) {
      throw new ConflictException('This subject already exists.');
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

  async createClass(name: string) {
    const trimmed = name.trim();
    const existing = await this.prisma.classGrade.findUnique({
      where: { name: trimmed },
    });

    if (existing?.isActive) {
      throw new ConflictException('This class already exists.');
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

  async updateSubject(id: string, name: string) {
    const trimmed = name.trim();
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Subject not found.');
    }

    const duplicate = await this.prisma.subject.findFirst({
      where: {
        name: trimmed,
        NOT: { id },
      },
    });

    if (duplicate?.isActive) {
      throw new ConflictException('This subject already exists.');
    }

    if (duplicate && !duplicate.isActive) {
      await this.prisma.subject.delete({ where: { id: duplicate.id } });
    }

    return this.prisma.subject.update({
      where: { id },
      data: { name: trimmed },
    });
  }

  async updateClass(id: string, name: string) {
    const trimmed = name.trim();
    const existing = await this.prisma.classGrade.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Class not found.');
    }

    const duplicate = await this.prisma.classGrade.findFirst({
      where: {
        name: trimmed,
        NOT: { id },
      },
    });

    if (duplicate?.isActive) {
      throw new ConflictException('This class already exists.');
    }

    if (duplicate && !duplicate.isActive) {
      await this.prisma.classGrade.delete({ where: { id: duplicate.id } });
    }

    return this.prisma.classGrade.update({
      where: { id },
      data: { name: trimmed },
    });
  }

  async deleteSubject(id: string) {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Subject not found.');
    }

    return this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteClass(id: string) {
    const existing = await this.prisma.classGrade.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Class not found.');
    }

    return this.prisma.classGrade.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
