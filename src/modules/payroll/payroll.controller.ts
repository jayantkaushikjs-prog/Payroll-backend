import { Controller, Get, Post, Put, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { UpdatePayrollStatusDto } from './dto/update-payroll-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @RequirePermissions(Permission.GENERATE_PAYROLL)
  generate(@Body() generateDto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(generateDto.month, generateDto.year);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_PAYROLL)
  findByMonthAndYear(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.getPayrollForMonthAndYear(+month, +year);
  }

  @Put('status')
  @RequirePermissions(Permission.UPDATE_PAYROLL)
  updateStatus(
    @Query('month') month: string,
    @Query('year') year: string,
    @Body() statusDto: UpdatePayrollStatusDto,
  ) {
    return this.payrollService.updatePayrollStatus(+month, +year, statusDto.status);
  }

  @Delete('drafts')
  @RequirePermissions(Permission.UPDATE_PAYROLL)
  removeDrafts(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.removeDrafts(+month, +year);
  }
}
