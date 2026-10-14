import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Param, Post, Req, ServiceUnavailableException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
class ResourceDto {
  @IsString() @MinLength(2) @MaxLength(150) title!: string;
  @IsString() @MinLength(1) @MaxLength(100) subject!: string;
  @IsString() @MinLength(1) @MaxLength(100) className!: string;
}
type Request = { user: { userId: string; role: string } };
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN, UserRole.PARENT)
class ResourcesController {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}
  private async scope(req: Request) {
    if (req.user.role !== 'PARENT') return {};
    const children = await this.prisma.student.findMany({ where: { parent: { userId: req.user.userId } }, select: { className: true } });
    return { className: { in: children.map((s) => s.className).filter((s): s is string => Boolean(s)) } };
  }
  @Get() async list(@Req() req: Request) {
    return this.prisma.resource.findMany({ where: await this.scope(req), orderBy: { createdAt: 'desc' }, select: { id: true, title: true, subject: true, className: true, createdAt: true } });
  }
  @Get(':id/download') async download(@Req() req: Request, @Param('id') id: string) {
    const resource = await this.prisma.resource.findFirst({ where: { id, ...await this.scope(req) } });
    if (!resource) throw new NotFoundException('Resource not found.');
    return { url: await this.storage.getDownloadUrl(resource.storageKey, 300) };
  }
  @Post() @Roles(UserRole.CEO, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async create(@Req() req: Request, @Body() dto: ResourceDto, @UploadedFile() file?: { buffer: Buffer; mimetype: string }) {
    if (!file || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') throw new BadRequestException('Upload a PDF up to 10 MB.');
    if (!dto.title.trim()) throw new BadRequestException('Enter a resource title.');
    const [subject, grade] = await Promise.all([
      this.prisma.subject.findFirst({ where: { name: dto.subject, isActive: true } }),
      this.prisma.classGrade.findFirst({ where: { name: dto.className, isActive: true } }),
    ]);
    if (!subject || !grade) throw new BadRequestException('Select an active subject and class.');
    const storageKey = 'resources/' + randomUUID() + '.pdf';
    try { await this.storage.uploadPdf(storageKey, file.buffer); }
    catch { throw new ServiceUnavailableException('File storage is unavailable. No resource was published.'); }
    try {
      return await this.prisma.resource.create({ data: { ...dto, title: dto.title.trim(), storageKey, createdBy: req.user.userId }, select: { id: true } });
    } catch (e) {
      await this.storage.deleteObject(storageKey).catch(() => undefined);
      throw e;
    }
  }
}
@Module({ imports: [StorageModule], controllers: [ResourcesController] })
export class ResourcesModule {}
