import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionMode, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@Query('mode') mode?: string) {
    const normalized = mode?.toUpperCase();
    const filter =
      normalized === SessionMode.ONLINE || normalized === SessionMode.OFFLINE
        ? (normalized as SessionMode)
        : undefined;
    return this.sessionsService.list(filter);
  }

  @Get('mine')
  @Roles(UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR)
  listMine(@Req() req: AuthRequest) {
    return this.sessionsService.listForTutor(req.user.userId);
  }

  @Get('tutors')
  listTutors(@Query('mode') mode?: string) {
    const normalized = mode?.toUpperCase();
    if (
      normalized !== SessionMode.ONLINE &&
      normalized !== SessionMode.OFFLINE
    ) {
      return this.sessionsService.listTutors(SessionMode.ONLINE);
    }
    return this.sessionsService.listTutors(normalized as SessionMode);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.sessionsService.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }
}
