import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':id/attendance')
  @Roles(UserRole.OFFLINE_TUTOR)
  getRoster(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.attendanceService.getRosterForTutor(id, req.user.userId);
  }

  @Put(':id/attendance')
  @Roles(UserRole.OFFLINE_TUTOR)
  save(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: SaveAttendanceDto,
  ) {
    return this.attendanceService.saveForTutor(id, req.user.userId, dto);
  }
}
