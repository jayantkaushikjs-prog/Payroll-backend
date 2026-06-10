import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_EXPENSES)
  create(@Body() createDto: CreateExpenseDto) {
    return this.expensesService.create(createDto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_EXPENSES)
  findAll(@Query('excludeSalaries') excludeSalaries?: string) {
    return this.expensesService.findAll(excludeSalaries === 'true');
  }

  @Get('monthly-summary')
  @RequirePermissions(Permission.VIEW_EXPENSES)
  getMonthlySummary(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('excludeSalaries') excludeSalaries?: string,
  ) {
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.expensesService.getCategorySummary(m, y, excludeSalaries === 'true');
  }

  @Get('trends')
  @RequirePermissions(Permission.VIEW_EXPENSES)
  getTrends(@Query('limit') limit?: string, @Query('excludeSalaries') excludeSalaries?: string) {
    const l = limit ? parseInt(limit, 10) : 6;
    return this.expensesService.getExpensesTrend(l, excludeSalaries === 'true');
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_EXPENSES)
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(+id);
  }

  @Put(':id')
  @RequirePermissions(Permission.MANAGE_EXPENSES)
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateExpenseDto>) {
    return this.expensesService.update(+id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_EXPENSES)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(+id);
  }
}
