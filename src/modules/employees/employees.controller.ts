import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Controller, Req, Put, ForbiddenException, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
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

  private assertPreviewRole(role: Role, allowedRoles: Role[]) {
    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException('You do not have permission to access this preview review action');
    }
  }

  private assertPreviewMonth(month?: string) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new ForbiddenException('Preview month is required in YYYY-MM format');
    }
  }

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

  @Get('next-code')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  getNextCode() {
    return this.employeesService.generateNextEmployeeCode();
  }

  @Post()
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Post('import')
  @RequirePermissions(Permission.CREATE_EMPLOYEE)
  importCsv(@Body() body: any) {
    if (body.employees) {
      return this.employeesService.importEmployeesJson(body.employees);
    }
    return this.employeesService.importCsv(body.csvContent);
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
      if (req.query.status === 'archived') {
        return this.employeesService.findArchived();
      }
      return this.employeesService.findAll();
    }
    const rolePermissions = getRolePermissions(user.role as Role);
    if (
      rolePermissions.includes(Permission.VIEW_EMPLOYEE) ||
      rolePermissions.includes(Permission.MANAGE_SALARY_STRUCTURES)
    ) {
      if (req.query.status === 'archived') {
        return this.employeesService.findArchived();
      }
      return this.employeesService.findAll();
    }
    throw new ForbiddenException('You do not have permission to view employees');
  }

  @Get('preview-review')
  getPreviewReview(@Req() req, @Query('month') month: string) {
    this.assertPreviewMonth(month);
    this.assertPreviewRole(req.user.role as Role, [Role.SUPER_ADMIN, Role.HR, Role.FINANCE]);
    return this.employeesService.getPreviewReview(month);
  }

  @Put('preview-review/status')
  updatePreviewStatus(
    @Req() req,
    @Body('month') month: string,
    @Body('status') status: 'done' | 'undone',
  ) {
    this.assertPreviewMonth(month);
    const role = req.user.role as Role;
    // Finance can only mark undone; HR/Admin can toggle both
    if (role === Role.FINANCE) {
      if (status !== 'undone') {
        throw new ForbiddenException('Finance can only mark preview as undone');
      }
    } else {
      this.assertPreviewRole(role, [Role.SUPER_ADMIN, Role.HR]);
    }
    if (status !== 'done' && status !== 'undone') {
      throw new ForbiddenException('Status must be done or undone');
    }
    return this.employeesService.updatePreviewReviewStatus(month, status, req.user?.email);
  }

  @Put('preview-review/finance-remarks')
  updatePreviewFinanceRemarks(
    @Req() req,
    @Body('month') month: string,
    @Body('finance_remarks') financeRemarks: string,
  ) {
    this.assertPreviewMonth(month);
    this.assertPreviewRole(req.user.role as Role, [Role.SUPER_ADMIN, Role.FINANCE]);
    return this.employeesService.updatePreviewFinanceRemarks(month, financeRemarks || '', req.user?.email);
  }

  @Get('preview/:month')
  @RequirePermissions(Permission.VIEW_EMPLOYEE)
  getPreviewForMonth(@Param('month') month: string) {
    this.assertPreviewMonth(month);
    return this.employeesService.getPreviewForMonth(month);
  }

  @Patch(':id/preview/:month')
  @RequirePermissions(Permission.UPDATE_EMPLOYEE)
  updateMonthlyInput(
    @Param('id') id: string,
    @Param('month') month: string,
    @Body() data: any,
  ) {
    return this.employeesService.updateMonthlyInput(+id, month, data);
  }

  @Get('preview-csv-sample')
  async downloadPreviewCsvSample(@Res() res: Response) {
    const csvContent = this.employeesService.generatePreviewCsvSample();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=monthly_preview_sample.csv`);
    return res.status(200).send(csvContent);
  }

  @Post('preview-csv-import')
  @UseInterceptors(FileInterceptor('file'))
  async importPreviewCsv(@UploadedFile() file: any, @Body() body: { month: string }) {
    if (!file) throw new BadRequestException('No file uploaded');
    const csvData = file.buffer.toString('utf8');
    return this.employeesService.importPreviewCsv(csvData, body.month);
  }

  @Get('preview-csv-export')
  async downloadPreviewCsvExport(@Query('month') month: string, @Res() res: Response) {
    // Validate preview month format
    this.assertPreviewMonth(month);
    const csvContent = await this.employeesService.generatePreviewCsvExport(month);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=monthly_preview_${month}.csv`);
    return res.status(200).send(csvContent);
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
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
    @Query('startYear') startYear?: string,
    @Query('endYear') endYear?: string,
  ) {
    const sYr = startYear ? parseInt(startYear, 10) : new Date().getFullYear() - 1;
    const eYr = endYear ? parseInt(endYear, 10) : new Date().getFullYear();
    const sDate = startDate || `${sYr}-04-01`;
    const eDate = endDate || `${eYr + 1}-03-31`;
    const csvContent = await this.employeesService.generateFinancialsCsv(+id, sDate, eDate);
    const employee = await this.employeesService.findOne(+id);
    const filename = `${employee.name.replace(/\s+/g, '_')}_financials_${sDate}_to_${eDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_EMPLOYEE)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(+id, updateEmployeeDto);
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

  @Delete('archived/hard-delete-all')
  @RequirePermissions(Permission.DELETE_EMPLOYEE)
  hardDeleteAllArchived() {
    return this.employeesService.hardDeleteAllArchived();
  }

  @Delete(':id/hard')
  @RequirePermissions(Permission.DELETE_EMPLOYEE)
  hardDelete(@Param('id') id: string) {
    return this.employeesService.hardDelete(+id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_EMPLOYEE)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(+id);
  }

  @Post(':id/restore')
  @RequirePermissions(Permission.UPDATE_EMPLOYEE)
  restore(@Param('id') id: string) {
    return this.employeesService.restore(+id);
  }


}
