import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateExamDto, SaveExamMarkDto } from './exams.dto';
import { ExamsService } from './exams.service';
import type { ExamActor } from './exams.service';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR, UserRole.PARENT)
export class ExamsController {
  constructor(private readonly service: ExamsService) {}
  @Get() list(@Req() req: { user: ExamActor }) { return this.service.list(req.user); }
  @Get('options') @Roles(UserRole.CEO, UserRole.ADMIN)
  options() { return this.service.options(); }
  @Post() @Roles(UserRole.CEO, UserRole.ADMIN)
  create(@Body() dto: CreateExamDto) { return this.service.create(dto); }
  @Put('marks/:id') @Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR)
  mark(@Req() req: { user: ExamActor }, @Param('id') id: string, @Body() dto: SaveExamMarkDto) { return this.service.mark(req.user, id, dto); }
}
