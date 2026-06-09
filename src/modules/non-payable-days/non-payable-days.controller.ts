import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { NonPayableDaysService } from './non-payable-days.service';
import { CreateNonPayableDaysDto } from './dto/create-non-payable-days.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('non-payable-days')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NonPayableDaysController {
  constructor(private readonly nonPayableDaysService: NonPayableDaysService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_NON_PAYABLE_DAYS)
  createOrUpdate(@Body() createDto: CreateNonPayableDaysDto) {
    return this.nonPayableDaysService.createOrUpdate(createDto);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_NON_PAYABLE_DAYS)
  findAll() {
    return this.nonPayableDaysService.findAll();
  }

  @Get('employee/:employeeId')
  @RequirePermissions(Permission.MANAGE_NON_PAYABLE_DAYS)
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.nonPayableDaysService.findByEmployee(+employeeId);
  }

  @Get('filter')
  @RequirePermissions(Permission.MANAGE_NON_PAYABLE_DAYS)
  findByMonthAndYear(@Query('month') month: string, @Query('year') year: string) {
    return this.nonPayableDaysService.findByMonthAndYear(+month, +year);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_NON_PAYABLE_DAYS)
  remove(@Param('id') id: string) {
    return this.nonPayableDaysService.remove(+id);
  }
}
