import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParentService } from './parent.service';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('classes')
  classes(@Req() req: AuthRequest) {
    return this.parentService.getClasses(req.user.userId);
  }

  @Get('attendance')
  attendance(@Req() req: AuthRequest, @Query('month') month?: string) {
    return this.parentService.getAttendanceCalendar(req.user.userId, month);
  }
}
