import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Res, Req, Query, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Role } from '../../common/enums/role.enum';
import { getRolePermissions } from '../../config/rbac.config';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('csv')
  @RequirePermissions(Permission.EXPORT_EMPLOYEES)
  async downloadCsv(@Res() res: Response) {
    const employees = await this.employeesService.findAll();
    const csvContent = this.employeesService.generateCsv(employees);
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=employee-master_${today}.csv`);
    return res.status(200).send(csvContent);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Post('import')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  importCsv(@Body('csvContent') csvContent: string) {
    return this.employeesService.importCsv(csvContent);
  }

  @Get('departments')
  findAllDepartments() {
    return this.employeesService.findAllDepartments();
  }

  @Post('departments')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  createDepartment(@Body('name') name: string) {
    return this.employeesService.createDepartment(name);
  }

  @Get('designations')
  findAllDesignations() {
    return this.employeesService.findAllDesignations();
  }

  @Post('designations')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  createDesignation(@Body('name') name: string) {
    return this.employeesService.createDesignation(name);
  }

  @Get()
  findAll(@Req() req) {
    const user = req.user;
    if (!user || !user.role) {
      throw new ForbiddenException('User role information is missing');
    }
    if (user.role === Role.SUPER_ADMIN) {
      return this.employeesService.findAll();
    }
    const rolePermissions = getRolePermissions(user.role as Role);
    if (
      rolePermissions.includes(Permission.VIEW_EMPLOYEE) ||
      rolePermissions.includes(Permission.MANAGE_SALARY_STRUCTURES)
    ) {
      return this.employeesService.findAll();
    }
    throw new ForbiddenException('You do not have permission to view employees');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const user = req.user;
    if (!user || !user.role) {
      throw new ForbiddenException('User role information is missing');
    }
    if (user.role === Role.SUPER_ADMIN) {
      return this.employeesService.findOne(+id);
    }
    const rolePermissions = getRolePermissions(user.role as Role);
    if (
      rolePermissions.includes(Permission.VIEW_EMPLOYEE) ||
      rolePermissions.includes(Permission.MANAGE_SALARY_STRUCTURES)
    ) {
      return this.employeesService.findOne(+id);
    }
    throw new ForbiddenException('You do not have permission to view this employee');
  }

  @Get(':id/financial-summary')
  getFinancialSummary(
    @Param('id') id: string,
    @Query('year') year?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.employeesService.getFinancialSummary(+id, year, startDate, endDate);
  }

  @Get(':id/export-financials')
  async exportFinancials(
    @Param('id') id: string,
    @Query('startYear') startYear: string,
    @Query('endYear') endYear: string,
    @Res() res: Response,
  ) {
    const sYr = startYear ? parseInt(startYear, 10) : new Date().getFullYear() - 1;
    const eYr = endYear ? parseInt(endYear, 10) : new Date().getFullYear();
    const csvContent = await this.employeesService.generateFinancialsCsv(+id, sYr, eYr);
    const employee = await this.employeesService.findOne(+id);
    const filename = `${employee.name.replace(/\s+/g, '_')}_financials_${sYr}_to_${eYr}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_EMPLOYEE)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(+id, updateEmployeeDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(+id);
  }

  @Delete('departments/:id')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  removeDepartment(@Param('id') id: string) {
    return this.employeesService.removeDepartment(+id);
  }

  @Delete('designations/:id')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  removeDesignation(@Param('id') id: string) {
    return this.employeesService.removeDesignation(+id);
  }
}
