import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll } from './payroll.entity';
import { EmployeesService } from '../employees/employees.service';
import { SalaryStructuresService } from '../salary-structures/salary-structures.service';
import { NonPayableDaysService } from '../non-payable-days/non-payable-days.service';
import { PFService } from '../pf/pf.service';
import { TaxService } from '../tax/tax.service';
import { AdvancesService } from '../advances/advances.service';
import { ExpensesService } from '../expenses/expenses.service';
import { calculateAnnualTaxWithBreakdown } from '../../utils/tax-calculator.util';
import {
  getCompletedFinancialYearMonthsBefore,
  getFinancialYear,
  getRemainingFinancialYearMonthsExcludingCurrent,
} from '../../common/utils/financial-year.util';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    private employeesService: EmployeesService,
    private salaryStructuresService: SalaryStructuresService,
    private nonPayableDaysService: NonPayableDaysService,
    private pfService: PFService,
    private taxService: TaxService,
    private advancesService: AdvancesService,
    private expensesService: ExpensesService,
  ) {}

  private getFinancialYear(month: number, year: number): string {
    return getFinancialYear(month, year);
  }

  async calculateSingleEmployee(employeeId: number, month: number, year: number) {
    const employee = await this.employeesService.findOne(employeeId);
    if (!employee.active_status) {
      throw new BadRequestException(`Employee ${employee.name} is inactive`);
    }

    // 1. Fetch Salary Structure
    let structure;
    try {
      structure = await this.salaryStructuresService.findActiveByEmployee(employeeId);
    } catch (error) {
      throw new BadRequestException(`Salary structure is missing for employee ${employee.name}`);
    }

    let grossSalary = Number(structure.gross_salary);
    let basicSalary = Number(structure.basic_salary);

    // Apply appraisal if active and effective
    if (Number(employee.appraisal) > 0 && employee.appraisal_effective_date) {
      const payrollDate = new Date(year, month - 1, 1);
      const effectiveDate = new Date(employee.appraisal_effective_date);
      const payrollMonthStart = new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 1);
      const effectiveMonthStart = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
      if (payrollMonthStart >= effectiveMonthStart) {
        grossSalary += Number(employee.appraisal);
        if (Number(structure.gross_salary) > 0) {
          basicSalary = Number(((Number(structure.basic_salary) / Number(structure.gross_salary)) * grossSalary).toFixed(2));
        }
      }
    }

    // 2. Compute Days in Month
    const daysInMonth = new Date(year, month, 0).getDate();

    // 3. Fetch Non Payable Days
    const npdRecord = await this.nonPayableDaysService.findByEmployeeMonthAndYear(employeeId, month, year);
    const nonPayableDays = npdRecord ? Number(npdRecord.days) : 0;

    // Deductions: Non Payable Deduction
    const nonPayableDeduction = Number(((grossSalary / daysInMonth) * nonPayableDays).toFixed(2));
    const payableGross = Math.max(0, grossSalary - nonPayableDeduction);

    // 4. PF Deduction
    let pfDeduction = 0;
    if (employee.pf_deduction !== false) {
      const pfSettings = await this.pfService.findActiveAtDate(`${year}-${String(month).padStart(2, '0')}-01`);
      const calculatedPf = Number((payableGross * (Number(pfSettings.employee_contribution_rate) / 100)).toFixed(2));
      const maxPfCap = pfSettings.max_pf_cap ? Number(pfSettings.max_pf_cap) : 1800.00;
      pfDeduction = Math.min(maxPfCap, calculatedPf); // Configurable PF cap
    }

    // 5. Tax Deduction (Progressive Slabs)
    let taxDeduction = 0;
    let taxBreakdown = null;
    if (employee.tax_deduction !== false) {
      const financialYear = this.getFinancialYear(month, year);
      const taxRegime = employee.tax_regime || 'new';
      const taxSlabs = await this.taxService.findByFinancialYearAndRegime(financialYear, taxRegime);

      // Fetch YTD gross and tax paid in locked/disbursed records of current financial year
      const payrollRecords = await this.payrollRepository.find({
        where: { employee_id: employeeId },
      });

      const ytdRecords = payrollRecords.filter(p => {
        if (p.status !== 'locked' && p.status !== 'disbursed') return false;
        if (this.getFinancialYear(p.month, p.year) !== financialYear) return false;
        if (p.year < year) return true;
        if (p.year === year && p.month < month) return true;
        return false;
      });

      // Handle any missing historical records in the current financial year by assuming standard gross
      const completedMonthsCount = getCompletedFinancialYearMonthsBefore(month);
      const dbRecordsCount = ytdRecords.length;
      const missingMonthsCount = Math.max(0, completedMonthsCount - dbRecordsCount);
      const missingGross = missingMonthsCount * grossSalary;

      const grossPaidYTD = ytdRecords.reduce((sum, p) => sum + (Number(p.gross_salary) - Number(p.non_payable_deduction)), 0) + missingGross;
      const taxPaidYTD = ytdRecords.reduce((sum, p) => sum + Number(p.tax_deduction), 0);

      const remainingMonthsExcludingCurrent = getRemainingFinancialYearMonthsExcludingCurrent(month);
      const remainingPayrollMonths = remainingMonthsExcludingCurrent + 1;

      // Projected Annual Income = YTD Gross Paid + Current Month Earnings + Expected Earnings for Remaining Months (standard monthly gross)
      const projectedAnnualIncome = grossPaidYTD + payableGross + (grossSalary * remainingMonthsExcludingCurrent);

      const breakdown = calculateAnnualTaxWithBreakdown(
        projectedAnnualIncome,
        taxRegime,
        taxSlabs,
        financialYear
      );

      const remainingAnnualTax = Math.max(0, breakdown.finalTax - taxPaidYTD);

      taxDeduction = Number((remainingAnnualTax / remainingPayrollMonths).toFixed(2));

      const baseGross = Number(structure.gross_salary);
      const baseCtc = Number(structure.ctc);
      const baseEmployerPf = Math.max(0, baseCtc - baseGross);
      const ctc = grossSalary + baseEmployerPf;
      const employerPf = baseEmployerPf;

      taxBreakdown = {
        ctc,
        grossSalary,
        employerPf,
        projectedAnnualIncome,
        standardDeduction: breakdown.standardDeduction,
        taxableIncome: breakdown.taxableIncome,
        baseTax: breakdown.baseTax,
        rebate: breakdown.rebate,
        surcharge: breakdown.surcharge,
        cess: breakdown.cess,
        totalAnnualTaxLiability: breakdown.finalTax,
        taxPaidYTD: taxPaidYTD,
        remainingAnnualTax: remainingAnnualTax,
        remainingPayrollMonths: remainingPayrollMonths,
        monthlyTDS: taxDeduction,
        slabs: breakdown.slabs,
      };

      console.log('--- Tax Calculation Audit ---', {
        employeeName: employee.name,
        month,
        year,
        ...taxBreakdown
      });
    }

    // 6. Advance Recovery
    const activeAdvances = await this.advancesService.findActiveForEmployeeAtDate(employeeId, month, year);
    let advanceRecovery = 0;
    const advanceRecoveriesBreakdown = [];
    
    // Check if there is an active advance salary for this upcoming month
    const hasAdvanceSalaryThisMonth = activeAdvances.some(adv => {
      if (!adv.is_advance_salary) return false;
      const issueDate = new Date(adv.date);
      const issueMonth = issueDate.getMonth() + 1;
      const issueYear = issueDate.getFullYear();
      let upcomingMonth = issueMonth + 1;
      let upcomingYear = issueYear;
      if (upcomingMonth > 12) {
        upcomingMonth = 1;
        upcomingYear += 1;
      }
      return month === upcomingMonth && year === upcomingYear;
    });

    // Available salary left for advances after mandatory government/statutory deductions (PF and Tax)
    let availableForAdvances = Math.max(0, Number((payableGross - pfDeduction - taxDeduction).toFixed(2)));

    // Process Advance Salary first if present for this month
    for (const adv of activeAdvances) {
      if (adv.is_advance_salary) {
        const issueDate = new Date(adv.date);
        const issueMonth = issueDate.getMonth() + 1;
        const issueYear = issueDate.getFullYear();
        let upcomingMonth = issueMonth + 1;
        let upcomingYear = issueYear;
        if (upcomingMonth > 12) {
          upcomingMonth = 1;
          upcomingYear += 1;
        }
        if (month === upcomingMonth && year === upcomingYear) {
          const recovery = Number(adv.remaining_amount);
          advanceRecovery += recovery;
          advanceRecoveriesBreakdown.push({
            advanceId: adv.id,
            amount: recovery,
          });
          availableForAdvances = Math.max(0, Number((availableForAdvances - recovery).toFixed(2)));
        }
      }
    }

    // Now process normal advances
    for (const adv of activeAdvances) {
      // Skip if already processed as advance salary above
      if (adv.is_advance_salary) {
        const issueDate = new Date(adv.date);
        const issueMonth = issueDate.getMonth() + 1;
        const issueYear = issueDate.getFullYear();
        let upcomingMonth = issueMonth + 1;
        let upcomingYear = issueYear;
        if (upcomingMonth > 12) {
          upcomingMonth = 1;
          upcomingYear += 1;
        }
        if (month === upcomingMonth && year === upcomingYear) {
          continue;
        }
      }

      if (availableForAdvances <= 0) {
        break; // Keep remaining deduction pending for further months
      }

      let recovery = 0;
      if (adv.recovery_type === 'one_time') {
        recovery = Number(adv.remaining_amount);
      } else {
        const instAmount = adv.installment_amount ? Number(adv.installment_amount) : Number(adv.remaining_amount);
        recovery = Math.min(instAmount, Number(adv.remaining_amount));
      }
      
      // Cap the recovery at available salary to prevent negative net salary
      const actualRecovery = Number(Math.min(recovery, availableForAdvances).toFixed(2));
      
      if (actualRecovery > 0) {
        advanceRecovery += actualRecovery;
        advanceRecoveriesBreakdown.push({
          advanceId: adv.id,
          amount: actualRecovery,
        });
        availableForAdvances = Number((availableForAdvances - actualRecovery).toFixed(2));
      }
    }

    advanceRecovery = Number(advanceRecovery.toFixed(2));

    // 7. Net Salary
    let netSalary = Number(Math.max(0, payableGross - pfDeduction - taxDeduction - advanceRecovery).toFixed(2));
    if (hasAdvanceSalaryThisMonth) {
      netSalary = 0;
    }

    return {
      employee,
      grossSalary,
      nonPayableDeduction,
      pfDeduction,
      taxDeduction,
      advanceRecovery,
      netSalary,
      advanceRecoveriesBreakdown,
      taxBreakdown,
    };
  }

  async generatePayroll(month: number, year: number): Promise<Payroll[]> {
    const employees = await this.employeesService.findAll();
    const activeEmployees = employees.filter(emp => emp.active_status);

    const payrollsList: Payroll[] = [];

    for (const emp of activeEmployees) {
      // Check if a locked or disbursed payroll already exists
      const existingCompleted = await this.payrollRepository.findOne({
        where: [
          { employee_id: emp.id, month, year, status: 'locked' },
          { employee_id: emp.id, month, year, status: 'disbursed' },
        ],
      });

      if (existingCompleted) {
        payrollsList.push(existingCompleted);
        continue; // Keep the existing locked record, do not re-calculate
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
          payroll.tax_breakdown_json = calc.taxBreakdown;
        } else {
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
            tax_breakdown_json: calc.taxBreakdown,
          });
        }

        const saved = await this.payrollRepository.save(payroll);
        payrollsList.push(saved);
      } catch (err) {
        // Log errors (e.g. employee missing salary structure) but continue calculating for other employees
        console.warn(`Skipping payroll for employee ID ${emp.id}: ${err.message}`);
      }
    }

    return this.getPayrollForMonthAndYear(month, year);
  }

  async getPayrollForMonthAndYear(month: number, year: number): Promise<Payroll[]> {
    const payrolls = await this.payrollRepository.find({
      where: { month, year },
      relations: ['employee'],
      order: { employee_id: 'ASC' },
    });
    return payrolls.filter((payroll) => payroll.employee?.active_status !== false);
  }

  async updatePayrollStatus(month: number, year: number, status: 'draft' | 'locked' | 'disbursed'): Promise<Payroll[]> {
    const payrolls = await this.getPayrollForMonthAndYear(month, year);
    if (payrolls.length === 0) {
      throw new NotFoundException(`No payroll records found for ${month}/${year}`);
    }

    if (status === 'locked') {
      for (const pr of payrolls) {
        if (pr.status === 'locked' || pr.status === 'disbursed') continue;

        // Finalize advance recoveries when locking
        if (pr.recoveries_json && pr.recoveries_json.length > 0) {
          for (const item of pr.recoveries_json) {
            await this.advancesService.recordRecovery(item.advanceId, item.amount);
          }
        }

        pr.status = 'locked';
        await this.payrollRepository.save(pr);
      }
    } else if (status === 'draft') {
      for (const pr of payrolls) {
        if (pr.status === 'disbursed') {
          throw new BadRequestException('Cannot unlock already disbursed payroll');
        }
        if (pr.status === 'draft') continue;

        // Revert advance recoveries when unlocking
        if (pr.recoveries_json && pr.recoveries_json.length > 0) {
          for (const item of pr.recoveries_json) {
            await this.advancesService.revertRecovery(item.advanceId, item.amount);
          }
        }

        pr.status = 'draft';
        await this.payrollRepository.save(pr);
      }
    } else if (status === 'disbursed') {
      for (const pr of payrolls) {
        if (pr.status === 'draft') {
          throw new BadRequestException('Please lock the payroll first before disbursing');
        }
        if (pr.status === 'disbursed') continue;

        pr.status = 'disbursed';
        await this.payrollRepository.save(pr);
      }

      await this.syncPayrollExpenses(month, year);
    }

    return this.getPayrollForMonthAndYear(month, year);
  }

  private async syncPayrollExpenses(month: number, year: number) {
    const payrolls = await this.getPayrollForMonthAndYear(month, year);
    const disbursedPayrolls = payrolls.filter(pr => pr.status === 'disbursed');
    if (disbursedPayrolls.length === 0) return;

    let totalGrossSalaries = 0;
    let totalEmployerPF = 0;

    const daysInMonth = new Date(year, month, 0).getDate();
    const pfSettings = await this.pfService.findActiveAtDate(`${year}-${String(month).padStart(2, '0')}-01`);
    const employerContributionRate = Number(pfSettings.employer_contribution_rate) / 100;

    for (const pr of disbursedPayrolls) {
      totalGrossSalaries += Number(pr.gross_salary);

      if (pr.employee && pr.employee.pf_deduction !== false) {
        const payableGross = Math.max(0, Number(pr.gross_salary) - Number(pr.non_payable_deduction));
        const employer_pf = Math.min(1800, Number((payableGross * employerContributionRate).toFixed(2)));
        totalEmployerPF += employer_pf;
      }
    }

    totalGrossSalaries = Number(totalGrossSalaries.toFixed(2));
    totalEmployerPF = Number(totalEmployerPF.toFixed(2));

    const dateStr = `${year}-${String(month).padStart(2, '0')}-28`;

    let salaryExpense = await this.expensesService.getExpensesForMonthAndYear(month, year);
    let salariesEntry = salaryExpense.find(exp => exp.category === 'salary');
    if (salariesEntry) {
      await this.expensesService.update(salariesEntry.id, { amount: totalGrossSalaries });
    } else {
      await this.expensesService.create({
        title: 'Employee Salaries',
        amount: totalGrossSalaries,
        category: 'salary',
        frequency: 'monthly',
        date: dateStr,
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        description: `Total monthly employee salaries disbursement for ${month}/${year}`,
      });
    }

    let pfEntry = salaryExpense.find(exp => exp.category === 'pf');
    if (pfEntry) {
      await this.expensesService.update(pfEntry.id, { amount: totalEmployerPF });
    } else {
      await this.expensesService.create({
        title: 'Employer PF Contribution',
        amount: totalEmployerPF,
        category: 'pf',
        frequency: 'monthly',
        date: dateStr,
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        description: `Total monthly employer PF contribution for ${month}/${year}`,
      });
    }
  }

  async countTotalPayrollCost(): Promise<number> {
    // Computes sum of net salary for disbursed payrolls of the latest calculated month
    const latestPayroll = await this.payrollRepository.findOne({
      where: { status: 'disbursed' },
      order: { year: 'DESC', month: 'DESC' },
    });
    if (!latestPayroll) return 0;

    const result = await this.payrollRepository.createQueryBuilder('pr')
      .select('SUM(pr.net_salary)', 'total')
      .where('pr.month = :month AND pr.year = :year AND pr.status = :status', {
        month: latestPayroll.month,
        year: latestPayroll.year,
        status: 'disbursed',
      })
      .getRawOne();
    return Number(result?.total || 0);
  }

  async getCurrentMonthFinanceSummary(month: number, year: number): Promise<{
    payrollTotal: number;
    pendingPayrollCount: number;
    taxDeductions: number;
    pfContributions: number;
    processedCount: number;
  }> {
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

  async getRecentPayrollActivities(limit = 5): Promise<{ title: string; description: string; date: Date | string }[]> {
    const payrolls = await this.payrollRepository.find({
      relations: ['employee'],
      order: { updated_at: 'DESC' },
      take: limit,
    });

    return payrolls.map((payroll) => ({
      title: payroll.status === 'disbursed' ? 'Payroll disbursed' : payroll.status === 'locked' ? 'Payroll locked' : 'Payroll draft updated',
      description: `${payroll.employee?.employee_code || 'Employee'} - ${payroll.month}/${payroll.year}`,
      date: payroll.updated_at,
    }));
  }

  async getSumDeductions(): Promise<{ pf: number; tax: number }> {
    const result = await this.payrollRepository.createQueryBuilder('pr')
      .select('SUM(pr.pf_deduction)', 'pf')
      .addSelect('SUM(pr.tax_deduction)', 'tax')
      .where('pr.status = :status', { status: 'disbursed' })
      .getRawOne();
    return {
      pf: Number(result?.pf || 0),
      tax: Number(result?.tax || 0),
    };
  }

  async getPayrollTrends(): Promise<any[]> {
    // Group disbursed payroll costs by month and year for last 6 runs
    const results = await this.payrollRepository.createQueryBuilder('pr')
      .select('pr.month', 'month')
      .addSelect('pr.year', 'year')
      .addSelect('SUM(pr.net_salary)', 'net_cost')
      .addSelect('SUM(pr.pf_deduction)', 'pf_total')
      .addSelect('SUM(pr.tax_deduction)', 'tax_total')
      .where('pr.status = :status', { status: 'disbursed' })
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

  async removeDrafts(month: number, year: number): Promise<void> {
    await this.payrollRepository.delete({ month, year, status: 'draft' });
  }
}
