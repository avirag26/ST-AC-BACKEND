import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpsertClassReportDto } from './dto/upsert-class-report.dto';
import { ReportsService } from './reports.service';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sessions/:id/report')
  @Roles(UserRole.HOME_TUTOR)
  getForTutor(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.reportsService.getForTutor(id, req.user.userId);
  }

  @Put('sessions/:id/report')
  @Roles(UserRole.HOME_TUTOR)
  upsertForTutor(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: UpsertClassReportDto,
  ) {
    return this.reportsService.upsertForTutor(id, req.user.userId, dto);
  }

  @Get('sessions/:id/report/pdf')
  @Roles(UserRole.HOME_TUTOR)
  async pdfForTutor(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reportsService.getPdfForTutor(id, req.user.userId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.buffer);
  }

  @Get('ceo/sessions/:id/report')
  @Roles(UserRole.CEO, UserRole.ADMIN)
  getForCeo(@Param('id') id: string) {
    return this.reportsService.getForCeo(id);
  }

  @Get('ceo/sessions/:id/report/pdf')
  @Roles(UserRole.CEO, UserRole.ADMIN)
  async pdfForCeo(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.reportsService.getPdfForCeo(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    return new StreamableFile(file.buffer);
  }
}
