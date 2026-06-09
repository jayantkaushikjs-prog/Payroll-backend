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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payroll_entity_1 = require("./payroll.entity");
const employees_service_1 = require("../employees/employees.service");
const salary_structures_service_1 = require("../salary-structures/salary-structures.service");
const non_payable_days_service_1 = require("../non-payable-days/non-payable-days.service");
const pf_service_1 = require("../pf/pf.service");
const tax_service_1 = require("../tax/tax.service");
const advances_service_1 = require("../advances/advances.service");
let PayrollService = class PayrollService {
    constructor(payrollRepository, employeesService, salaryStructuresService, nonPayableDaysService, pfService, taxService, advancesService) {
        this.payrollRepository = payrollRepository;
        this.employeesService = employeesService;
        this.salaryStructuresService = salaryStructuresService;
        this.nonPayableDaysService = nonPayableDaysService;
        this.pfService = pfService;
        this.taxService = taxService;
        this.advancesService = advancesService;
    }
    getFinancialYear(month, year) {
        return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }
    async calculateSingleEmployee(employeeId, month, year) {
        const employee = await this.employeesService.findOne(employeeId);
        if (!employee.active_status) {
            throw new common_1.BadRequestException(`Employee ${employee.name} is inactive`);
        }
        let structure;
        try {
            structure = await this.salaryStructuresService.findActiveByEmployee(employeeId);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Salary structure is missing for employee ${employee.name}`);
        }
        const grossSalary = Number(structure.gross_salary);
        const basicSalary = Number(structure.basic_salary);
        const daysInMonth = new Date(year, month, 0).getDate();
        const npdRecord = await this.nonPayableDaysService.findByEmployeeMonthAndYear(employeeId, month, year);
        const nonPayableDays = npdRecord ? Number(npdRecord.days) : 0;
        const nonPayableDeduction = Number(((grossSalary / daysInMonth) * nonPayableDays).toFixed(2));
        const payableGross = Math.max(0, grossSalary - nonPayableDeduction);
        const pfSettings = await this.pfService.findActiveAtDate(`${year}-${String(month).padStart(2, '0')}-01`);
        const payableBasic = Math.max(0, basicSalary - ((basicSalary / daysInMonth) * nonPayableDays));
        const pfDeduction = Number((payableBasic * (Number(pfSettings.employee_contribution_rate) / 100)).toFixed(2));
        const financialYear = this.getFinancialYear(month, year);
        const taxRegime = employee.tax_regime || 'new';
        const taxSlabs = await this.taxService.findByFinancialYearAndRegime(financialYear, taxRegime);
        const projectedAnnualIncome = payableGross * 12;
        let totalAnnualTax = 0;
        if (taxSlabs.length > 0) {
            for (const slab of taxSlabs) {
                const from = Number(slab.from_amount);
                const to = slab.to_amount ? Number(slab.to_amount) : Infinity;
                const rate = Number(slab.percentage) / 100;
                if (projectedAnnualIncome > from) {
                    const taxableInSlab = Math.min(projectedAnnualIncome, to) - from;
                    if (taxableInSlab > 0) {
                        totalAnnualTax += taxableInSlab * rate;
                    }
                }
            }
        }
        const taxDeduction = Number((totalAnnualTax / 12).toFixed(2));
        const activeAdvances = await this.advancesService.findActiveForEmployeeAtDate(employeeId, month, year);
        let advanceRecovery = 0;
        const advanceRecoveriesBreakdown = [];
        for (const adv of activeAdvances) {
            let recovery = 0;
            if (adv.recovery_type === 'one_time') {
                recovery = Number(adv.remaining_amount);
            }
            else {
                recovery = Math.min(Number(adv.installment_amount), Number(adv.remaining_amount));
            }
            advanceRecovery += recovery;
            advanceRecoveriesBreakdown.push({
                advanceId: adv.id,
                amount: recovery,
            });
        }
        advanceRecovery = Number(advanceRecovery.toFixed(2));
        const netSalary = Number(Math.max(0, payableGross - pfDeduction - taxDeduction - advanceRecovery).toFixed(2));
        return {
            employee,
            grossSalary,
            nonPayableDeduction,
            pfDeduction,
            taxDeduction,
            advanceRecovery,
            netSalary,
            advanceRecoveriesBreakdown,
        };
    }
    async generatePayroll(month, year) {
        const employees = await this.employeesService.findAll();
        const activeEmployees = employees.filter(emp => emp.active_status);
        const payrollsList = [];
        for (const emp of activeEmployees) {
            const existingCompleted = await this.payrollRepository.findOne({
                where: { employee_id: emp.id, month, year, status: 'completed' },
            });
            if (existingCompleted) {
                payrollsList.push(existingCompleted);
                continue;
            }
            try {
                const calc = await this.calculateSingleEmployee(emp.id, month, year);
                let payroll = await this.payrollRepository.findOne({
                    where: { employee_id: emp.id, month, year, status: 'draft' },
                });
                if (payroll) {
                    payroll.gross_salary = calc.grossSalary;
                    payroll.non_payable_deduction = calc.nonPayableDeduction;
                    payroll.pf_deduction = calc.pfDeduction;
                    payroll.tax_deduction = calc.taxDeduction;
                    payroll.advance_recovery = calc.advanceRecovery;
                    payroll.net_salary = calc.netSalary;
                    payroll.recoveries_json = calc.advanceRecoveriesBreakdown;
                }
                else {
                    payroll = this.payrollRepository.create({
                        employee_id: emp.id,
                        month,
                        year,
                        gross_salary: calc.grossSalary,
                        non_payable_deduction: calc.nonPayableDeduction,
                        pf_deduction: calc.pfDeduction,
                        tax_deduction: calc.taxDeduction,
                        advance_recovery: calc.advanceRecovery,
                        net_salary: calc.netSalary,
                        status: 'draft',
                        recoveries_json: calc.advanceRecoveriesBreakdown,
                    });
                }
                const saved = await this.payrollRepository.save(payroll);
                payrollsList.push(saved);
            }
            catch (err) {
                console.warn(`Skipping payroll for employee ID ${emp.id}: ${err.message}`);
            }
        }
        return this.getPayrollForMonthAndYear(month, year);
    }
    async getPayrollForMonthAndYear(month, year) {
        return this.payrollRepository.find({
            where: { month, year },
            relations: ['employee'],
            order: { employee_id: 'ASC' },
        });
    }
    async updatePayrollStatus(month, year, status) {
        const payrolls = await this.getPayrollForMonthAndYear(month, year);
        if (payrolls.length === 0) {
            throw new common_1.NotFoundException(`No payroll records found for ${month}/${year}`);
        }
        if (status === 'completed') {
            for (const pr of payrolls) {
                if (pr.status === 'completed')
                    continue;
                if (pr.recoveries_json && pr.recoveries_json.length > 0) {
                    for (const item of pr.recoveries_json) {
                        await this.advancesService.recordRecovery(item.advanceId, item.amount);
                    }
                }
                pr.status = 'completed';
                await this.payrollRepository.save(pr);
            }
        }
        else {
            for (const pr of payrolls) {
                if (pr.status === 'draft')
                    continue;
                if (pr.recoveries_json && pr.recoveries_json.length > 0) {
                    for (const item of pr.recoveries_json) {
                        await this.advancesService.revertRecovery(item.advanceId, item.amount);
                    }
                    pr.recoveries_json = null;
                }
                pr.status = 'draft';
                await this.payrollRepository.save(pr);
            }
        }
        return this.getPayrollForMonthAndYear(month, year);
    }
    async countTotalPayrollCost() {
        const latestPayroll = await this.payrollRepository.findOne({
            where: { status: 'completed' },
            order: { year: 'DESC', month: 'DESC' },
        });
        if (!latestPayroll)
            return 0;
        const result = await this.payrollRepository.createQueryBuilder('pr')
            .select('SUM(pr.net_salary)', 'total')
            .where('pr.month = :month AND pr.year = :year AND pr.status = :status', {
            month: latestPayroll.month,
            year: latestPayroll.year,
            status: 'completed',
        })
            .getRawOne();
        return Number(result?.total || 0);
    }
    async getCurrentMonthFinanceSummary(month, year) {
        const result = await this.payrollRepository.createQueryBuilder('pr')
            .select('SUM(pr.net_salary)', 'payrollTotal')
            .addSelect('SUM(pr.tax_deduction)', 'taxDeductions')
            .addSelect('SUM(pr.pf_deduction)', 'pfContributions')
            .addSelect('COUNT(pr.id)', 'processedCount')
            .addSelect("SUM(CASE WHEN pr.status = 'draft' THEN 1 ELSE 0 END)", 'pendingPayrollCount')
            .where('pr.month = :month AND pr.year = :year', { month, year })
            .getRawOne();
        return {
            payrollTotal: Number(result?.payrollTotal || 0),
            pendingPayrollCount: Number(result?.pendingPayrollCount || 0),
            taxDeductions: Number(result?.taxDeductions || 0),
            pfContributions: Number(result?.pfContributions || 0),
            processedCount: Number(result?.processedCount || 0),
        };
    }
    async getRecentPayrollActivities(limit = 5) {
        const payrolls = await this.payrollRepository.find({
            relations: ['employee'],
            order: { updated_at: 'DESC' },
            take: limit,
        });
        return payrolls.map((payroll) => ({
            title: payroll.status === 'completed' ? 'Payroll finalized' : 'Payroll draft updated',
            description: `${payroll.employee?.employee_code || 'Employee'} - ${payroll.month}/${payroll.year}`,
            date: payroll.updated_at,
        }));
    }
    async getSumDeductions() {
        const result = await this.payrollRepository.createQueryBuilder('pr')
            .select('SUM(pr.pf_deduction)', 'pf')
            .addSelect('SUM(pr.tax_deduction)', 'tax')
            .where('pr.status = :status', { status: 'completed' })
            .getRawOne();
        return {
            pf: Number(result?.pf || 0),
            tax: Number(result?.tax || 0),
        };
    }
    async getPayrollTrends() {
        const results = await this.payrollRepository.createQueryBuilder('pr')
            .select('pr.month', 'month')
            .addSelect('pr.year', 'year')
            .addSelect('SUM(pr.net_salary)', 'net_cost')
            .addSelect('SUM(pr.pf_deduction)', 'pf_total')
            .addSelect('SUM(pr.tax_deduction)', 'tax_total')
            .where('pr.status = :status', { status: 'completed' })
            .groupBy('pr.year')
            .addGroupBy('pr.month')
            .orderBy('pr.year', 'ASC')
            .addOrderBy('pr.month', 'ASC')
            .limit(6)
            .getRawMany();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return results.map(r => ({
            name: `${monthNames[r.month - 1]} ${r.year}`,
            payrollCost: Number(r.net_cost),
            pf: Number(r.pf_total),
            tax: Number(r.tax_total),
        }));
    }
    async removeDrafts(month, year) {
        await this.payrollRepository.delete({ month, year, status: 'draft' });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payroll_entity_1.Payroll)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        employees_service_1.EmployeesService,
        salary_structures_service_1.SalaryStructuresService,
        non_payable_days_service_1.NonPayableDaysService,
        pf_service_1.PFService,
        tax_service_1.TaxService,
        advances_service_1.AdvancesService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map