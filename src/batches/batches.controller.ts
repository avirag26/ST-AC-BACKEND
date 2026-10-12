import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { EnrollStudentsDto } from './dto/enroll-students.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

type AuthRequest = Request & {
  user: { userId: string; role: string };
};

@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  list() {
    return this.batchesService.list();
  }

  @Get('mine')
  @Roles(UserRole.OFFLINE_TUTOR)
  listMine(@Req() req: AuthRequest) {
    return this.batchesService.listForTutor(req.user.userId);
  }

  @Get('offline-tutors')
  listOfflineTutors() {
    return this.batchesService.listOfflineTutors();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.batchesService.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }

  @Post(':id/students')
  enroll(@Param('id') id: string, @Body() dto: EnrollStudentsDto) {
    return this.batchesService.enroll(id, dto);
  }

  @Delete(':id/students/:studentId')
  unenroll(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.batchesService.unenroll(id, studentId);
  }
}
