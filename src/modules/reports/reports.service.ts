import { ForbiddenException, Injectable } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service';
import { PayrollService } from '../payroll/payroll.service';
import { AdvancesService } from '../advances/advances.service';
import { SalaryStructuresService } from '../salary-structures/salary-structures.service';
import { NonPayableDaysService } from '../non-payable-days/non-payable-days.service';
import { ExpensesService } from '../expenses/expenses.service';
import { Role } from '../../common/enums/role.enum';
import { formatCurrency } from '../../config/currency.config';
import { escapeCsv } from '../../common/utils/csv.util';

@Injectable()
export class ReportsService {
  constructor(
    private employeesService: EmployeesService,
    private payrollService: PayrollService,
    private advancesService: AdvancesService,
    private salaryStructuresService: SalaryStructuresService,
    private nonPayableDaysService: NonPayableDaysService,
    private expensesService: ExpensesService,
  ) {}

  filename(reportType: string): string {
    return `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
  }

  private assertRole(role: Role, allowedRoles: Role[]) {
    if (role === Role.SUPER_ADMIN || allowedRoles.includes(role)) {
      return;
    }

    throw new ForbiddenException('You do not have permission to export this report');
  }

  private escapeCsv(value: unknown): string {
    return escapeCsv(value);
  }

  private escapeCurrency(value: number | string | null | undefined): string {
    return this.escapeCsv(formatCurrency(value));
  }

  private canViewHr(role: Role): boolean {
    return role === Role.SUPER_ADMIN || role === Role.HR;
  }

  private canViewFinance(role: Role): boolean {
    return role === Role.SUPER_ADMIN || role === Role.FINANCE;
  }

  async getDashboardData(role: Role, excludeSalaries?: boolean) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dashboard: any = {
      role,
      generatedFor: { month, year },
      access: {
        hr: this.canViewHr(role),
        finance: this.canViewFinance(role),
        admin: role === Role.SUPER_ADMIN,
      },
      stats: {},
      summaries: {},
      charts: {},
      activities: [],
      notices: [],
    };

    if (!dashboard.access.hr && !dashboard.access.finance) {
      throw new ForbiddenException('You do not have permission to view dashboard data');
    }

    if (dashboard.access.hr) {
      const [employeeCounts, newJoinees, nonPayableSummary, departmentDistribution, employeeActivities] = await Promise.all([
        this.employeesService.countEmployees(),
        this.employeesService.countNewJoinees(month, year),
        this.nonPayableDaysService.getMonthSummary(month, year),
        this.employeesService.getDepartmentDistribution(),
        this.employeesService.getRecentEmployeeActivities(),
      ]);

      dashboard.stats.totalEmployees = employeeCounts.total;
      dashboard.stats.activeEmployees = employeeCounts.active;
      dashboard.stats.newJoineesThisMonth = newJoinees;
      dashboard.stats.employeesOnLeaveToday = 0;
      dashboard.stats.pendingLeaveRequests = 0;
      dashboard.stats.pendingApprovals = 0;
      dashboard.summaries.attendance = {
        presentToday: employeeCounts.active,
        absentToday: 0,
        onLeaveToday: 0,
        configured: false,
      };
      dashboard.summaries.nonPayableDays = nonPayableSummary;
      dashboard.summaries.upcomingMilestones = {
        birthdays: [],
        workAnniversaries: [],
        configured: false,
      };
      dashboard.charts.departmentDistribution = departmentDistribution;
      dashboard.activities.push(...employeeActivities);
      dashboard.notices.push('Leave, attendance, birthday, and anniversary modules are not configured yet.');
    }

    if (dashboard.access.finance) {
      const [
        financeSummary,
        totalAdvancesOutstanding,
        deductionTotals,
        payrollTrends,
        payrollActivities,
        expensesSummary,
        expensesTrend,
      ] = await Promise.all([
        this.payrollService.getCurrentMonthFinanceSummary(month, year),
        this.advancesService.countTotalOutstanding(),
        this.payrollService.getSumDeductions(),
        this.payrollService.getPayrollTrends(),
        this.payrollService.getRecentPayrollActivities(),
        this.expensesService.getCategorySummary(month, year, excludeSalaries),
        this.expensesService.getExpensesTrend(6, excludeSalaries),
      ]);

      dashboard.stats.currentMonthPayroll = financeSummary.payrollTotal;
      dashboard.stats.pendingPayrollProcessing = financeSummary.pendingPayrollCount;
      dashboard.stats.totalAdvancesOutstanding = totalAdvancesOutstanding;
      dashboard.stats.taxDeductions = financeSummary.taxDeductions;
      dashboard.stats.pfContributions = financeSummary.pfContributions;
      dashboard.stats.esiContributions = financeSummary.esiContributions;
      dashboard.stats.totalPayrollThisMonth = financeSummary.payrollTotal;
      dashboard.stats.totalExpensesThisMonth = expensesSummary.total;
      dashboard.summaries.taxPfEsi = {
        tax: deductionTotals.tax,
        pf: deductionTotals.pf,
        esi: deductionTotals.esi,
        esiConfigured: true,
      };
      dashboard.summaries.salaryProcessing = {
        nextProcessingDate: new Date(year, month, 0).toISOString().split('T')[0],
        processedCount: financeSummary.processedCount,
        pendingCount: financeSummary.pendingPayrollCount,
      };
      dashboard.charts.payrollTrends = payrollTrends;
      dashboard.charts.expensesTrend = expensesTrend;
      dashboard.charts.expensesCategoryDistribution = expensesSummary.breakdown;
      dashboard.activities.push(...payrollActivities);
      dashboard.notices.push('ESI tracking is not configured yet.');
    }

    dashboard.activities = dashboard.activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    return dashboard;
  }

  async generatePayrollCsv(month: number, year: number, role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const payrolls = await this.payrollService.getPayrollForMonthAndYear(month, year);
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Gross Salary',
      'Bonus / Incentives',
      'Leave Encashment',
      'ESI (Employee)',
      'PF Deduction',
      'Late Arrival Deduction',
      'Damages Recovery',
      'Other Deductions',
      'Tax Deduction',
      'Advance Recovery',
      'Net Salary',
      'Status',
    ];

    const rows = payrolls.map(pr => {
      const tb = (pr.tax_breakdown_json || {}) as any;
      return [
        this.escapeCsv(pr.employee?.employee_code),
        this.escapeCsv(pr.employee?.name),
        this.escapeCsv(pr.employee?.department),
        this.escapeCsv(pr.employee?.designation),
        this.escapeCurrency(pr.gross_salary),
        this.escapeCurrency(pr.employee?.bonus_incentives ?? 0),
        this.escapeCurrency(pr.employee?.leave_encashment ?? 0),
        this.escapeCurrency(tb.employeeEsi ?? 0),
        this.escapeCurrency(pr.pf_deduction),
        this.escapeCurrency(pr.employee?.late_arrival_deduction ?? 0),
        this.escapeCurrency(pr.employee?.damages_recovery ?? 0),
        this.escapeCurrency(pr.employee?.other_deductions ?? 0),
        this.escapeCurrency(pr.tax_deduction),
        this.escapeCurrency(pr.advance_recovery),
        this.escapeCurrency(pr.net_salary),
        pr.status,
      ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateBankTransferCsv(month: number, year: number, role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const payrolls = await this.payrollService.getPayrollForMonthAndYear(month, year);
    const headers = ['Employee Name', 'Account Number', 'IFSC', 'Transfer Amount'];

    const rows = payrolls.map(pr => [
      this.escapeCsv(pr.employee?.name),
      this.escapeCsv(pr.employee?.account_number),
      this.escapeCsv(pr.employee?.ifsc),
      this.escapeCurrency(pr.net_salary),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generatePFCsv(month: number, year: number, role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const payrolls = await this.payrollService.getPayrollForMonthAndYear(month, year);
    const headers = ['Employee Code', 'Employee Name', 'Gross Salary', 'PF Deduction'];

    const rows = payrolls.map(pr => [
      this.escapeCsv(pr.employee?.employee_code),
      this.escapeCsv(pr.employee?.name),
      this.escapeCurrency(pr.gross_salary),
      this.escapeCurrency(pr.pf_deduction),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateTaxCsv(month: number, year: number, role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const payrolls = await this.payrollService.getPayrollForMonthAndYear(month, year);
    const headers = ['Employee Code', 'Employee Name', 'Gross Salary', 'Tax Deduction'];

    const rows = payrolls.map(pr => [
      this.escapeCsv(pr.employee?.employee_code),
      this.escapeCsv(pr.employee?.name),
      this.escapeCurrency(pr.gross_salary),
      this.escapeCurrency(pr.tax_deduction),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateAdvancesCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const advances = await this.advancesService.findAll();
    const headers = [
      'Employee Code',
      'Employee Name',
      'Date',
      'Total Advance',
      'Recovery Type',
      'Installment Amount',
      'Recovered Amount',
      'Remaining Amount',
      'Start Month/Year',
      'Fully Recovered',
    ];

    const rows = advances.map(adv => [
      this.escapeCsv(adv.employee?.employee_code),
      this.escapeCsv(adv.employee?.name),
      this.escapeCsv(adv.date),
      this.escapeCurrency(adv.amount),
      adv.recovery_type,
      adv.installment_amount ? this.escapeCurrency(adv.installment_amount) : '',
      this.escapeCurrency(adv.total_recovered),
      this.escapeCurrency(adv.remaining_amount),
      this.escapeCsv(`${adv.start_month}/${adv.start_year}`),
      adv.is_fully_recovered ? 'Yes' : 'No',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateSalaryComponentsCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const structures = await this.salaryStructuresService.findAllActive();
    const headers = [
      'Employee Code',
      'Employee Name',
      'Basic Salary',
      'HRA',
      'Special Allowance',
      'Other Allowance',
      'Gross Salary',
      'Effective From',
    ];

    const rows = structures.map(s => [
      this.escapeCsv(s.employee?.employee_code),
      this.escapeCsv(s.employee?.name),
      this.escapeCurrency(s.basic_salary),
      this.escapeCurrency(s.hra),
      this.escapeCurrency(s.special_allowance),
      this.escapeCurrency(s.other_allowance),
      this.escapeCurrency(s.gross_salary),
      this.escapeCsv(s.effective_from),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generatePayrollSummaryCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.FINANCE]);
    const trends = await this.payrollService.getPayrollTrends();
    const headers = ['Period', 'Payroll Cost', 'PF Deduction', 'Tax Deduction'];
    const rows = trends.map(t => [
      this.escapeCsv(t.name),
      this.escapeCurrency(t.payrollCost),
      this.escapeCurrency(t.pf),
      this.escapeCurrency(t.tax),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateEmployeeMasterCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.HR]);
    const employees = await this.employeesService.findAll();
    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Joining Date',
      'Relieving Date',
      'Active Status',
    ];

    const rows = employees.map(emp => [
      this.escapeCsv(emp.employee_code),
      this.escapeCsv(emp.name),
      this.escapeCsv(emp.email),
      this.escapeCsv(emp.phone),
      this.escapeCsv(emp.department),
      this.escapeCsv(emp.designation),
      this.escapeCsv(emp.joining_date),
      this.escapeCsv(emp.relieving_date || ''),
      emp.active_status ? 'Active' : 'Inactive',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateNonPayableDaysCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.HR]);
    const logs = await this.nonPayableDaysService.findAll();
    const headers = ['Employee Code', 'Employee Name', 'Department', 'Month', 'Year', 'Non-Payable Days', 'Remarks'];
    const rows = logs.map(log => [
      this.escapeCsv(log.employee?.employee_code),
      this.escapeCsv(log.employee?.name),
      this.escapeCsv(log.employee?.department),
      log.month,
      log.year,
      log.days,
      this.escapeCsv(log.remarks),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generateJoiningExitCsv(role: Role): Promise<string> {
    this.assertRole(role, [Role.HR]);
    const employees = await this.employeesService.findAll();
    const headers = ['Employee Code', 'Name', 'Department', 'Designation', 'Joining Date', 'Relieving Date', 'Record Type', 'Status'];
    const rows = employees.map(emp => [
      this.escapeCsv(emp.employee_code),
      this.escapeCsv(emp.name),
      this.escapeCsv(emp.department),
      this.escapeCsv(emp.designation),
      this.escapeCsv(emp.joining_date),
      this.escapeCsv(emp.relieving_date || ''),
      emp.active_status ? 'Joining' : 'Exit',
      emp.active_status ? 'Active' : 'Inactive',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async generatePreviewSheetCsv(month: number, year: number, role: Role): Promise<string> {
    this.assertRole(role, [Role.HR]);
    const employees = await this.employeesService.findAll();
    const active = employees.filter(e => e.active_status);
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      'Days Present',
      'Appraisal',
      'Appraisal Effective Date',
      'Bonus / Incentives',
      'Leave Encashment',
      'Late Arrival (days)',
      'Damages Recovery',
      'Other Deductions',
      'Remarks',
      'Joining Date',
      'Relieving Date',
    ];

    const rows = active.map(emp => [
      this.escapeCsv(emp.employee_code),
      this.escapeCsv(emp.name),
      this.escapeCsv(emp.department),
      this.escapeCsv(emp.designation),
      emp.no_of_days_present ?? 30,
      Number(emp.appraisal) || 0,
      this.escapeCsv(emp.appraisal_effective_date || ''),
      Number(emp.bonus_incentives) || 0,
      Number(emp.leave_encashment) || 0,
      Number(emp.late_arrival_deduction) || 0,
      Number(emp.damages_recovery) || 0,
      Number(emp.other_deductions) || 0,
      this.escapeCsv(emp.remarks || ''),
      this.escapeCsv(emp.joining_date),
      this.escapeCsv(emp.relieving_date || ''),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
