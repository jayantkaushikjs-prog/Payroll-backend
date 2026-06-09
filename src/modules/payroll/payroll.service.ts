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
  ) {}

  private getFinancialYear(month: number, year: number): string {
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
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

    const grossSalary = Number(structure.gross_salary);
    const basicSalary = Number(structure.basic_salary);

    // 2. Compute Days in Month
    const daysInMonth = new Date(year, month, 0).getDate();

    // 3. Fetch Non Payable Days
    const npdRecord = await this.nonPayableDaysService.findByEmployeeMonthAndYear(employeeId, month, year);
    const nonPayableDays = npdRecord ? Number(npdRecord.days) : 0;

    // Deductions: Non Payable Deduction
    const nonPayableDeduction = Number(((grossSalary / daysInMonth) * nonPayableDays).toFixed(2));
    const payableGross = Math.max(0, grossSalary - nonPayableDeduction);

    // 4. PF Deduction
    const pfSettings = await this.pfService.findActiveAtDate(`${year}-${String(month).padStart(2, '0')}-01`);
    const payableBasic = Math.max(0, basicSalary - ((basicSalary / daysInMonth) * nonPayableDays));
    const pfDeduction = Number((payableBasic * (Number(pfSettings.employee_contribution_rate) / 100)).toFixed(2));

    // 5. Tax Deduction (Progressive Slabs)
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

    // 6. Advance Recovery
    const activeAdvances = await this.advancesService.findActiveForEmployeeAtDate(employeeId, month, year);
    let advanceRecovery = 0;
    const advanceRecoveriesBreakdown = [];

    for (const adv of activeAdvances) {
      let recovery = 0;
      if (adv.recovery_type === 'one_time') {
        recovery = Number(adv.remaining_amount);
      } else {
        recovery = Math.min(Number(adv.installment_amount), Number(adv.remaining_amount));
      }
      
      advanceRecovery += recovery;
      advanceRecoveriesBreakdown.push({
        advanceId: adv.id,
        amount: recovery,
      });
    }

    advanceRecovery = Number(advanceRecovery.toFixed(2));

    // 7. Net Salary
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

  async generatePayroll(month: number, year: number): Promise<Payroll[]> {
    const employees = await this.employeesService.findAll();
    const activeEmployees = employees.filter(emp => emp.active_status);

    const payrollsList: Payroll[] = [];

    for (const emp of activeEmployees) {
      // Check if a completed payroll already exists
      const existingCompleted = await this.payrollRepository.findOne({
        where: { employee_id: emp.id, month, year, status: 'completed' },
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
    return this.payrollRepository.find({
      where: { month, year },
      relations: ['employee'],
      order: { employee_id: 'ASC' },
    });
  }

  async updatePayrollStatus(month: number, year: number, status: 'draft' | 'completed'): Promise<Payroll[]> {
    const payrolls = await this.getPayrollForMonthAndYear(month, year);
    if (payrolls.length === 0) {
      throw new NotFoundException(`No payroll records found for ${month}/${year}`);
    }

    // Check if we are locking the payrolls to "completed"
    if (status === 'completed') {
      for (const pr of payrolls) {
        if (pr.status === 'completed') continue; // Already completed

        // Finalize advance recoveries using the pre-calculated breakdown from the draft
        if (pr.recoveries_json && pr.recoveries_json.length > 0) {
          for (const item of pr.recoveries_json) {
            await this.advancesService.recordRecovery(item.advanceId, item.amount);
          }
        }

        pr.status = 'completed';
        await this.payrollRepository.save(pr);
      }
    } else {
      // Revert status to draft if needed
      for (const pr of payrolls) {
        if (pr.status === 'draft') continue; // Already draft

        // Revert advance recoveries
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

  async countTotalPayrollCost(): Promise<number> {
    // Computes sum of net salary for completed payrolls of the latest calculated month
    const latestPayroll = await this.payrollRepository.findOne({
      where: { status: 'completed' },
      order: { year: 'DESC', month: 'DESC' },
    });
    if (!latestPayroll) return 0;

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
      title: payroll.status === 'completed' ? 'Payroll finalized' : 'Payroll draft updated',
      description: `${payroll.employee?.employee_code || 'Employee'} - ${payroll.month}/${payroll.year}`,
      date: payroll.updated_at,
    }));
  }

  async getSumDeductions(): Promise<{ pf: number; tax: number }> {
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

  async getPayrollTrends(): Promise<any[]> {
    // Group completed payroll costs by month and year for last 6 runs
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

  async removeDrafts(month: number, year: number): Promise<void> {
    await this.payrollRepository.delete({ month, year, status: 'draft' });
  }
}
