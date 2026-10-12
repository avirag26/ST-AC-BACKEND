import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('subjects')
  listSubjects() {
    return this.catalogService.listSubjects();
  }

  @Get('classes')
  listClasses() {
    return this.catalogService.listClasses();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Post('subjects')
  createSubject(@Body() dto: CreateCatalogItemDto) {
    return this.catalogService.createSubject(dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Post('classes')
  createClass(@Body() dto: CreateCatalogItemDto) {
    return this.catalogService.createClass(dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Patch('subjects/:id')
  updateSubject(@Param('id') id: string, @Body() dto: CreateCatalogItemDto) {
    return this.catalogService.updateSubject(id, dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Patch('classes/:id')
  updateClass(@Param('id') id: string, @Body() dto: CreateCatalogItemDto) {
    return this.catalogService.updateClass(id, dto.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Delete('subjects/:id')
  deleteSubject(@Param('id') id: string) {
    return this.catalogService.deleteSubject(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CEO, UserRole.ADMIN)
  @Delete('classes/:id')
  deleteClass(@Param('id') id: string) {
    return this.catalogService.deleteClass(id);
  }
}
