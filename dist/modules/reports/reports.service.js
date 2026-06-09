"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const employees_service_1 = require("../employees/employees.service");
const payroll_service_1 = require("../payroll/payroll.service");
const advances_service_1 = require("../advances/advances.service");
const salary_structures_service_1 = require("../salary-structures/salary-structures.service");
const non_payable_days_service_1 = require("../non-payable-days/non-payable-days.service");
const role_enum_1 = require("../../common/enums/role.enum");
const currency_config_1 = require("../../config/currency.config");
let ReportsService = class ReportsService {
    constructor(employeesService, payrollService, advancesService, salaryStructuresService, nonPayableDaysService) {
        this.employeesService = employeesService;
        this.payrollService = payrollService;
        this.advancesService = advancesService;
        this.salaryStructuresService = salaryStructuresService;
        this.nonPayableDaysService = nonPayableDaysService;
    }
    filename(reportType) {
        return `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    assertRole(role, allowedRoles) {
        if (role === role_enum_1.Role.SUPER_ADMIN || allowedRoles.includes(role)) {
            return;
        }
        throw new common_1.ForbiddenException('You do not have permission to export this report');
    }
    escapeCsv(value) {
        const text = value === null || value === undefined ? '' : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    }
    escapeCurrency(value) {
        return this.escapeCsv((0, currency_config_1.formatCurrency)(value));
    }
    canViewHr(role) {
        return role === role_enum_1.Role.SUPER_ADMIN || role === role_enum_1.Role.HR;
    }
    canViewFinance(role) {
        return role === role_enum_1.Role.SUPER_ADMIN || role === role_enum_1.Role.FINANCE;
    }
    async getDashboardData(role) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const dashboard = {
            role,
            generatedFor: { month, year },
            access: {
                hr: this.canViewHr(role),
                finance: this.canViewFinance(role),
                admin: role === role_enum_1.Role.SUPER_ADMIN,
            },
            stats: {},
            summaries: {},
            charts: {},
            activities: [],
            notices: [],
        };
        if (!dashboard.access.hr && !dashboard.access.finance) {
            throw new common_1.ForbiddenException('You do not have permission to view dashboard data');
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
            const [financeSummary, totalAdvancesOutstanding, deductionTotals, payrollTrends, payrollActivities] = await Promise.all([
                this.payrollService.getCurrentMonthFinanceSummary(month, year),
                this.advancesService.countTotalOutstanding(),
                this.payrollService.getSumDeductions(),
                this.payrollService.getPayrollTrends(),
                this.payrollService.getRecentPayrollActivities(),
            ]);
            dashboard.stats.currentMonthPayroll = financeSummary.payrollTotal;
            dashboard.stats.pendingPayrollProcessing = financeSummary.pendingPayrollCount;
            dashboard.stats.totalAdvancesOutstanding = totalAdvancesOutstanding;
            dashboard.stats.taxDeductions = financeSummary.taxDeductions;
            dashboard.stats.pfContributions = financeSummary.pfContributions;
            dashboard.stats.esiContributions = 0;
            dashboard.stats.totalPayrollThisMonth = financeSummary.payrollTotal;
            dashboard.summaries.taxPfEsi = {
                tax: deductionTotals.tax,
                pf: deductionTotals.pf,
                esi: 0,
                esiConfigured: false,
            };
            dashboard.summaries.salaryProcessing = {
                nextProcessingDate: new Date(year, month, 0).toISOString().split('T')[0],
                processedCount: financeSummary.processedCount,
                pendingCount: financeSummary.pendingPayrollCount,
            };
            dashboard.charts.payrollTrends = payrollTrends;
            dashboard.activities.push(...payrollActivities);
            dashboard.notices.push('ESI tracking is not configured yet.');
        }
        dashboard.activities = dashboard.activities
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8);
        return dashboard;
    }
    async generatePayrollCsv(month, year, role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
        const payrolls = await this.payrollService.getPayrollForMonthAndYear(month, year);
        const headers = [
            'Employee Code',
            'Employee Name',
            'Department',
            'Designation',
            'Gross Salary',
            'Non Payable Deduction',
            'PF Deduction',
            'Tax Deduction',
            'Advance Recovery',
            'Net Salary',
            'Status',
        ];
        const rows = payrolls.map(pr => [
            this.escapeCsv(pr.employee?.employee_code),
            this.escapeCsv(pr.employee?.name),
            this.escapeCsv(pr.employee?.department),
            this.escapeCsv(pr.employee?.designation),
            this.escapeCurrency(pr.gross_salary),
            this.escapeCurrency(pr.non_payable_deduction),
            this.escapeCurrency(pr.pf_deduction),
            this.escapeCurrency(pr.tax_deduction),
            this.escapeCurrency(pr.advance_recovery),
            this.escapeCurrency(pr.net_salary),
            pr.status,
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    async generateBankTransferCsv(month, year, role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generatePFCsv(month, year, role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generateTaxCsv(month, year, role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generateAdvancesCsv(role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generateSalaryComponentsCsv(role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generatePayrollSummaryCsv(role) {
        this.assertRole(role, [role_enum_1.Role.FINANCE]);
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
    async generateEmployeeMasterCsv(role) {
        this.assertRole(role, [role_enum_1.Role.HR]);
        const employees = await this.employeesService.findAll();
        const headers = [
            'Employee Code',
            'Name',
            'Email',
            'Phone',
            'Department',
            'Designation',
            'Joining Date',
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
            emp.active_status ? 'Active' : 'Inactive',
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    async generateNonPayableDaysCsv(role) {
        this.assertRole(role, [role_enum_1.Role.HR]);
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
    async generateJoiningExitCsv(role) {
        this.assertRole(role, [role_enum_1.Role.HR]);
        const employees = await this.employeesService.findAll();
        const headers = ['Employee Code', 'Name', 'Department', 'Designation', 'Joining Date', 'Record Type', 'Status'];
        const rows = employees.map(emp => [
            this.escapeCsv(emp.employee_code),
            this.escapeCsv(emp.name),
            this.escapeCsv(emp.department),
            this.escapeCsv(emp.designation),
            this.escapeCsv(emp.joining_date),
            emp.active_status ? 'Joining' : 'Exit',
            emp.active_status ? 'Active' : 'Inactive',
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService,
        payroll_service_1.PayrollService,
        advances_service_1.AdvancesService,
        salary_structures_service_1.SalaryStructuresService,
        non_payable_days_service_1.NonPayableDaysService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map