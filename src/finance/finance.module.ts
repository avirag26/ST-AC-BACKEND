import { Body, Controller, Get, Module, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateFeeDto, RecordPaymentDto, RecordSalaryDto } from './finance.dto';
import { FinanceService } from './finance.service';
type Request = { user: { userId: string; role: string } };
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CEO, UserRole.ADMIN)
class FinanceController {
  constructor(private readonly service: FinanceService) {}
  @Get('fees') @Roles(UserRole.CEO, UserRole.ADMIN, UserRole.PARENT)
  fees(@Req() req: Request) { return this.service.fees(req.user); }
  @Post('fees') create(@Body() dto: CreateFeeDto) { return this.service.create(dto); }
  @Post('fees/:id/payments') pay(@Req() req: Request, @Param('id') id: string, @Body() dto: RecordPaymentDto) { return this.service.pay(req.user, id, dto); }
  @Get('salaries') @Roles(UserRole.CEO, UserRole.ADMIN, UserRole.HOME_TUTOR, UserRole.OFFLINE_TUTOR)
  salaries(@Req() req: Request) { return this.service.salaries(req.user); }
  @Post('salaries') salary(@Req() req: Request, @Body() dto: RecordSalaryDto) { return this.service.salary(req.user, dto); }
}
@Module({ controllers: [FinanceController], providers: [FinanceService] })
export class FinanceModule {}
