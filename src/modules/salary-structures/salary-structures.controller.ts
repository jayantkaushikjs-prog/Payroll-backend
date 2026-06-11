import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/role.enum';

@Controller('salary-structures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalaryStructuresController {
  constructor(private readonly salaryStructuresService: SalaryStructuresService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_SALARY_STRUCTURES)
  create(@Body() createSalaryStructureDto: CreateSalaryStructureDto) {
    return this.salaryStructuresService.create(createSalaryStructureDto);
  }

  @Post('import')
  @RequirePermissions(Permission.MANAGE_SALARY_STRUCTURES)
  importCsv(@Body('csvContent') csvContent: string) {
    return this.salaryStructuresService.importCsv(csvContent);
  }

  // IMPORTANT: static routes must come before parameterized routes
  @Get('active')
  @RequirePermissions(Permission.MANAGE_SALARY_STRUCTURES)
  findAllActive() {
    return this.salaryStructuresService.findAllActive();
  }

  @Get('active/:employeeId')
  @RequirePermissions(Permission.MANAGE_SALARY_STRUCTURES)
  findActiveByEmployee(@Param('employeeId') employeeId: string) {
    return this.salaryStructuresService.findActiveByEmployee(+employeeId);
  }

  @Get('history/:employeeId')
  @RequirePermissions(Permission.MANAGE_SALARY_STRUCTURES)
  findHistoryByEmployee(@Param('employeeId') employeeId: string) {
    return this.salaryStructuresService.findHistoryByEmployee(+employeeId);
  }
}
