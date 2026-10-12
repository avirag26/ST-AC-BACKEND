import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RejectTutorDto } from './dto/reject-tutor.dto';
import { TutorsService } from './tutors.service';

@Controller('tutors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN)
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  list(@Query('status') status?: string) {
    const normalized = status?.toUpperCase();
    const allowed = Object.values(UserStatus) as string[];
    const filter =
      normalized && allowed.includes(normalized)
        ? (normalized as UserStatus)
        : undefined;

    return this.tutorsService.list(filter);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.tutorsService.getOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.tutorsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectTutorDto) {
    return this.tutorsService.reject(id, dto.reason);
  }
}
