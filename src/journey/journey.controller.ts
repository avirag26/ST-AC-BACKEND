import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JourneyLocationDto } from './dto/journey-location.dto';
import { LiveLocationDto } from './dto/live-location.dto';
import { JourneyService } from './journey.service';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get('tracking/live')
  @Roles(UserRole.CEO, UserRole.ADMIN)
  listLive() {
    return this.journeyService.listLiveForCeo();
  }

  @Get('tracking/history')
  @Roles(UserRole.CEO, UserRole.ADMIN)
  listHistory() {
    return this.journeyService.listHistoryForCeo();
  }

  @Get('tracking/:sessionId')
  @Roles(UserRole.CEO, UserRole.ADMIN)
  getDetail(@Param('sessionId') sessionId: string) {
    return this.journeyService.getTrackingDetailForCeo(sessionId);
  }

  @Get('sessions/:id/journey')
  @Roles(UserRole.HOME_TUTOR)
  get(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.journeyService.getForTutor(id, req.user.userId);
  }

  @Post('sessions/:id/journey/leave')
  @Roles(UserRole.HOME_TUTOR)
  leave(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: JourneyLocationDto,
  ) {
    return this.journeyService.leaveHome(id, req.user.userId, dto);
  }

  @Post('sessions/:id/journey/reach')
  @Roles(UserRole.HOME_TUTOR)
  reach(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: JourneyLocationDto,
  ) {
    return this.journeyService.reach(id, req.user.userId, dto);
  }

  @Post('sessions/:id/journey/start')
  @Roles(UserRole.HOME_TUTOR)
  start(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: JourneyLocationDto,
  ) {
    return this.journeyService.startClass(id, req.user.userId, dto);
  }

  @Post('sessions/:id/journey/stop')
  @Roles(UserRole.HOME_TUTOR)
  stop(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: JourneyLocationDto,
  ) {
    return this.journeyService.stop(id, req.user.userId, dto);
  }

  @Post('sessions/:id/journey/ping')
  @Roles(UserRole.HOME_TUTOR)
  ping(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: LiveLocationDto,
  ) {
    return this.journeyService.pingLive(id, req.user.userId, dto);
  }
}
