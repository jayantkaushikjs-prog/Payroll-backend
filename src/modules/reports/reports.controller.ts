import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission, Role } from '../../common/enums/role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private getRole(req: Request): Role {
    return (req as any).user.role;
  }

  @Get('dashboard')
  getDashboardData(@Req() req: Request, @Query('excludeSalaries') excludeSalaries?: string) {
    return this.reportsService.getDashboardData(this.getRole(req), excludeSalaries === 'true');
  }

  @Get('payroll/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadPayrollCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generatePayrollCsv(+month, +year, this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('payroll')}`);
    return res.status(200).send(csvContent);
  }

  @Get('bank-transfer/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadBankTransferCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateBankTransferCsv(+month, +year, this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('bank-transfer')}`);
    return res.status(200).send(csvContent);
  }

  @Get('pf/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadPFCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generatePFCsv(+month, +year, this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('pf-report')}`);
    return res.status(200).send(csvContent);
  }

  @Get('tax/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadTaxCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateTaxCsv(+month, +year, this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('tax-report')}`);
    return res.status(200).send(csvContent);
  }

  @Get('advances/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadAdvancesCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateAdvancesCsv(
      this.getRole(req),
      month ? +month : undefined,
      year ? +year : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('advances-report')}`);
    return res.status(200).send(csvContent);
  }

  @Get('salary-components/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadSalaryComponentsCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateSalaryComponentsCsv(
      this.getRole(req),
      month ? +month : undefined,
      year ? +year : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('salary-components')}`);
    return res.status(200).send(csvContent);
  }

  @Get('payroll-summary/csv')
  @RequirePermissions(Permission.VIEW_PAYROLL_REPORTS)
  async downloadPayrollSummaryCsv(@Req() req: Request, @Res() res: Response) {
    const csvContent = await this.reportsService.generatePayrollSummaryCsv(this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('payroll-summary')}`);
    return res.status(200).send(csvContent);
  }

  @Get('employee-master/csv')
  @RequirePermissions(Permission.VIEW_HR_REPORTS)
  async downloadEmployeeMasterCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateEmployeeMasterCsv(
      this.getRole(req),
      month ? +month : undefined,
      year ? +year : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('employee-master')}`);
    return res.status(200).send(csvContent);
  }

  @Get('non-payable-days/csv')
  @RequirePermissions(Permission.VIEW_HR_REPORTS)
  async downloadNonPayableDaysCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateNonPayableDaysCsv(
      this.getRole(req),
      month ? +month : undefined,
      year ? +year : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('non-payable-days')}`);
    return res.status(200).send(csvContent);
  }

  @Get('joining-exit/csv')
  @RequirePermissions(Permission.VIEW_HR_REPORTS)
  async downloadJoiningExitCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generateJoiningExitCsv(
      this.getRole(req),
      month ? +month : undefined,
      year ? +year : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('joining-exit-records')}`);
    return res.status(200).send(csvContent);
  }

  @Get('preview-sheet/csv')
  @RequirePermissions(Permission.VIEW_HR_REPORTS)
  async downloadPreviewSheetCsv(
    @Query('month') month: string,
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.generatePreviewSheetCsv(+month, +year, this.getRole(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('preview-sheet')}`);
    return res.status(200).send(csvContent);
  }
}
