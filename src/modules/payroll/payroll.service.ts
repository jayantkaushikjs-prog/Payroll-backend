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
import { calculateAnnualTaxWithBreakdown } from '../../utils/tax-calculator.util';
import {
  getCompletedFinancialYearMonthsBefore,
  getFinancialYear,
  getRemainingFinancialYearMonthsExcludingCurrent,
} from '../../common/utils/financial-year.util';
import {
  calculateSalaryComponentsFromCtc,
  isEsiApplicableForBasic,
  isPfApplicable,
} from '../salary-structures/utils/salary-components.util';
import { shouldIncludeAdvanceForPayrollRecovery } from '../advances/advance-recovery.util';

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
    return getFinancialYear(month, year);
  }

  private parseDateOnly(dateString?: string | null): Date | null {
    if (!dateString) return null;
    const [year, month, day] = String(dateString).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }

  private getEmploymentProration(employee: any, month: number, year: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));
    const joiningDate = this.parseDateOnly(employee.joining_date);
    const relievingDate = this.parseDateOnly(employee.relieving_date);

    if (joiningDate && monthEnd < joiningDate) {
      return {
        isPayable: false,
        joiningNonPayableDays: 0,
        relievingNonPayableDays: 0,
        reason: 'Payroll month is before employee joining date',
      };
    }

    if (relievingDate && monthStart > relievingDate) {
      return {
        isPayable: false,
        joiningNonPayableDays: 0,
        relievingNonPayableDays: 0,
        reason: 'Payroll month is after employee relieving date',
      };
    }

    let joiningNonPayableDays = 0;
    if (joiningDate && joiningDate.getUTCFullYear() === year && joiningDate.getUTCMonth() + 1 === month) {
      joiningNonPayableDays = Math.max(0, joiningDate.getUTCDate() - 1);
    }

    let relievingNonPayableDays = 0;
    if (relievingDate && relievingDate.getUTCFullYear() === year && relievingDate.getUTCMonth() + 1 === month) {
      relievingNonPayableDays = Math.max(0, daysInMonth - relievingDate.getUTCDate());
    }

    return {
      isPayable: true,
      joiningNonPayableDays,
      relievingNonPayableDays,
      reason: null,
    };
  }

  async calculateSingleEmployee(employeeId: number, month: number, year: number) {
    const employee = await this.employeesService.findOne(employeeId);
    if (!employee.active_status) {
      throw new BadRequestException(`Employee ${employee.name} is inactive`);
    }

    const employmentProration = this.getEmploymentProration(employee, month, year);
    if (!employmentProration.isPayable) {
      throw new BadRequestException(`Employee ${employee.name} is not payable for ${month}/${year}: ${employmentProration.reason}`);
    }

    // 1. Salary structure
    let structure;
    try {
      structure = await this.salaryStructuresService.findActiveByEmployee(employeeId);
    } catch {
      throw new BadRequestException(`Salary structure is missing for employee ${employee.name}`);
    }

    let monthlyCtc = Number(structure.ctc);

    // Apply appraisal if effective this month, or if no effective date is set
    if (Number(employee.appraisal) > 0) {
      if (employee.appraisal_effective_date) {
        const effectiveMonthStart = new Date(new Date(employee.appraisal_effective_date).getFullYear(), new Date(employee.appraisal_effective_date).getMonth(), 1);
        const payrollMonthStart = new Date(year, month - 1, 1);
        if (payrollMonthStart >= effectiveMonthStart) {
          monthlyCtc += Number(employee.appraisal);
        }
      } else {
        // If no effective date is provided, apply the appraisal immediately
        monthlyCtc += Number(employee.appraisal);
      }
    }

    const pfSettings = await this.pfService.findActiveAtDate(`${year}-${String(month).padStart(2, '0')}-01`);

    // ── CALCULATOR-IDENTICAL COMPONENT DERIVATION ──
    const pfEmployerRate = (Number(pfSettings?.employer_contribution_rate) || 12) / 100;
    const pfEmployeeRate = (Number(pfSettings?.employee_contribution_rate) || 12) / 100;
    const esiEmployerRate = (Number(pfSettings?.esi_contribution_rate) || 3.25) / 100;
    const esiEmployeeRate = (Number(pfSettings?.esi_employee_contribution_rate) || 0.75) / 100;
    const maxPfCap = Number(pfSettings.max_pf_cap) || 1800;
    const professionalTax = Number(pfSettings.professional_tax ?? 200);

    const basic = Number((monthlyCtc * 0.5).toFixed(2));
    const hra   = Number((basic * 0.4).toFixed(2));

    const pfApplicable  = isPfApplicable(Number(employee.monthly_ctc), employee.pf_deduction !== false);
    const esiApplicable = isEsiApplicableForBasic(basic);

    const employerPf  = pfApplicable  ? Number(Math.min(basic * pfEmployerRate,  maxPfCap).toFixed(2)) : 0;
    const employerEsi = esiApplicable ? Number((basic * esiEmployerRate).toFixed(2)) : 0;
    const employeePf  = pfApplicable  ? Number(Math.min(basic * pfEmployeeRate,  maxPfCap).toFixed(2)) : 0;
    const employeeEsi = esiApplicable ? Number((basic * esiEmployeeRate).toFixed(2)) : 0;

    // Gross = CTC − employerPf − employerEsi
    const gross          = Number((monthlyCtc - employerPf - employerEsi).toFixed(2));
    const othersAllowance = Math.max(0, Number((gross - basic - hra).toFixed(2)));
    const appliedPt      = (monthlyCtc * 12) <= 250000 ? 0 : professionalTax;

    // 2. Non-payable day proration
    const daysInMonth = new Date(year, month, 0).getDate();
    const npdRecord = await this.nonPayableDaysService.findByEmployeeMonthAndYear(employeeId, month, year);
    
    const consoleAbsentDays = Number(employee.deduction_absent || 0);
    const explicitNpdDays = npdRecord ? Number(npdRecord.days) : 0;
    const derivedAbsentDays = Math.max(0, daysInMonth - (employee.no_of_days_present ?? daysInMonth));
    
    const manualNpd = consoleAbsentDays + explicitNpdDays + derivedAbsentDays;
    const totalNpd  = Math.min(daysInMonth, manualNpd + employmentProration.joiningNonPayableDays + employmentProration.relievingNonPayableDays);
    const payableDays = daysInMonth - totalNpd;
    const prorateRatio = daysInMonth > 0 ? payableDays / daysInMonth : 1;

    // Prorated values
    const payableGross  = Number((gross  * prorateRatio).toFixed(2));
    const payableBasic  = Number((basic  * prorateRatio).toFixed(2));
    const nonPayableDeduction = Number((gross  - payableGross).toFixed(2));

    // Prorated deductions
    const pfDeduction         = Number(Math.min(payableBasic * pfEmployeeRate,  maxPfCap * prorateRatio).toFixed(2));
    const employeeEsiDeduction = esiApplicable ? Number((payableBasic * esiEmployeeRate).toFixed(2)) : 0;
    const pfDeductionFinal    = pfApplicable ? pfDeduction : 0;
    const ptDeduction         = appliedPt > 0 ? Number(appliedPt.toFixed(2)) : 0;
    
    // Prorated Employer contributions
    const employerPfFinal     = pfApplicable ? Number(Math.min(payableBasic * pfEmployerRate, maxPfCap * prorateRatio).toFixed(2)) : 0;
    const employerEsiFinal    = esiApplicable ? Number((payableBasic * esiEmployerRate).toFixed(2)) : 0;

    // Additional Components
    const lateAbsentDays = Math.floor(Number(employee.late_arrival_deduction || 0) / 3) * 0.5;
    const lateArrivalDeductionAmount = Number(((gross / daysInMonth) * lateAbsentDays).toFixed(2));
    const bonusIncentives = Number(employee.bonus_incentives || 0);
    const leaveEncashment = Number(employee.leave_encashment || 0);
    const damagesRecovery = Number(employee.damages_recovery || 0);
    const otherDeductionsAmount = Number(employee.other_deductions || 0);

    // 3. Tax (YTD progressive)
    let taxDeduction = 0;
    
    // Default tax properties in case they are skipped
    let grossPaidYTD = 0, taxPaidYTD = 0, projectedAnnualGross = 0;
    let standardDeduction = 0, taxableIncome = 0, baseTax = 0, rebate = 0;
    let surcharge = 0, cess = 0, finalTax = 0, remainingAnnualTax = 0;
    let remainingPayrollMonths = 12;
    let slabs = [];

    if (employee.tax_deduction !== false) {
      const financialYear = this.getFinancialYear(month, year);
      const taxRegime = employee.tax_regime || 'new';
      const taxSlabs = await this.taxService.findByFinancialYearAndRegime(financialYear, taxRegime);

      const allRecords = await this.payrollRepository.find({ where: { employee_id: employeeId } });
      const ytdRecords = allRecords.filter(p => {
        if (p.status !== 'locked' && p.status !== 'disbursed') return false;
        if (this.getFinancialYear(p.month, p.year) !== financialYear) return false;
        return p.year < year || (p.year === year && p.month < month);
      });

      const completedMonthsCount = getCompletedFinancialYearMonthsBefore(month);
      const missingCtc = Math.max(0, completedMonthsCount - ytdRecords.length) * monthlyCtc;
      grossPaidYTD = ytdRecords.reduce((s, p) => {
        const bd = p.tax_breakdown_json as any;
        return s + Number(bd?.payableGross ?? Number(p.gross_salary));
      }, 0) + missingCtc;
      taxPaidYTD = ytdRecords.reduce((s, p) => s + Number(p.tax_deduction), 0);

      const remainingMonthsExcludingCurrent = getRemainingFinancialYearMonthsExcludingCurrent(month);
      remainingPayrollMonths = remainingMonthsExcludingCurrent + 1;
      projectedAnnualGross = grossPaidYTD + payableGross + bonusIncentives + leaveEncashment + (gross * remainingMonthsExcludingCurrent);

      const breakdown = calculateAnnualTaxWithBreakdown(projectedAnnualGross, taxRegime, taxSlabs, financialYear);
      remainingAnnualTax = Math.max(0, breakdown.finalTax - taxPaidYTD);
      taxDeduction = Number((remainingAnnualTax / remainingPayrollMonths).toFixed(2));
      
      standardDeduction = breakdown.standardDeduction;
      taxableIncome = breakdown.taxableIncome;
      baseTax = breakdown.baseTax;
      rebate = breakdown.rebate;
      surcharge = breakdown.surcharge;
      cess = breakdown.cess;
      finalTax = breakdown.finalTax;
      slabs = breakdown.slabs;
    }

    const taxBreakdown = {
      // Earnings
      ctc: monthlyCtc, basic, hra, othersAllowance, gross,
      bonus: bonusIncentives, leaveEncashment,
      // Prorated
      payableGross, payableBasic, nonPayableDeduction, payableDays, totalNpd, daysInMonth,
      // Employer side
      employerPf: employerPfFinal, employerEsi: employerEsiFinal,
      // Employee deductions
      employeePf: pfDeductionFinal, employeeEsi: employeeEsiDeduction, professionalTax: ptDeduction,
      lateArrivalDeduction: lateArrivalDeductionAmount, damages: damagesRecovery, otherDeductions: otherDeductionsAmount,
      // Tax
      grossPaidYTD, taxPaidYTD, projectedAnnualGross,
      grossIncome: projectedAnnualGross,
      standardDeduction,
      taxableIncome,
      baseTax, rebate,
      surcharge, cess,
      finalTax,
      remainingAnnualTax, remainingPayrollMonths,
      monthlyTDS: taxDeduction,
      slabs,
    };

    // 4. Advance recovery
    const activeAdvances = await this.advancesService.findActiveForEmployeeAtDate(employeeId, month, year);
    let advanceRecovery = 0;
    const advanceRecoveriesBreakdown = [];

    const hasAdvanceSalaryThisMonth = activeAdvances.some(adv => {
      if (!adv.is_advance_salary) return false;
      const d = new Date(adv.date);
      let nm = d.getMonth() + 2; let ny = d.getFullYear();
      if (nm > 12) { nm = 1; ny++; }
      return month === nm && year === ny;
    });

    const totalDeductions = pfDeductionFinal + employeeEsiDeduction + ptDeduction + taxDeduction + lateArrivalDeductionAmount + damagesRecovery + otherDeductionsAmount;
    const totalEarnings = Number((payableGross + bonusIncentives + leaveEncashment).toFixed(2));
    let availableForAdvances = Math.max(0, Number((totalEarnings - totalDeductions).toFixed(2)));
    const damageCarryForward = Math.max(0, Number((damagesRecovery - Math.max(0, totalEarnings - (pfDeductionFinal + employeeEsiDeduction + ptDeduction + taxDeduction + lateArrivalDeductionAmount + otherDeductionsAmount))).toFixed(2)));

    for (const adv of activeAdvances) {
      if (!shouldIncludeAdvanceForPayrollRecovery(adv)) continue;

      if (adv.is_advance_salary) {
        const d = new Date(adv.date);
        let nm = d.getMonth() + 2; let ny = d.getFullYear();
        if (nm > 12) { nm = 1; ny++; }
        if (month === nm && year === ny) {
          const rec = Number(adv.remaining_amount);
          advanceRecovery += rec;
          advanceRecoveriesBreakdown.push({ advanceId: adv.id, amount: rec });
          availableForAdvances = Math.max(0, availableForAdvances - rec);
        }
      }
    }

    for (const adv of activeAdvances) {
      if (!shouldIncludeAdvanceForPayrollRecovery(adv)) continue;

      if (adv.is_advance_salary) {
        const d = new Date(adv.date);
        let nm = d.getMonth() + 2; let ny = d.getFullYear();
        if (nm > 12) { nm = 1; ny++; }
        if (month === nm && year === ny) continue;
      }
      if (availableForAdvances <= 0) break;
      const instAmount = adv.recovery_type === 'one_time' ? Number(adv.remaining_amount) : Math.min(adv.installment_amount ? Number(adv.installment_amount) : Number(adv.remaining_amount), Number(adv.remaining_amount));
      const actualRecovery = Number(Math.min(instAmount, availableForAdvances).toFixed(2));
      if (actualRecovery > 0) {
        advanceRecovery += actualRecovery;
        advanceRecoveriesBreakdown.push({ advanceId: adv.id, amount: actualRecovery });
        availableForAdvances = Number((availableForAdvances - actualRecovery).toFixed(2));
      }
    }

    advanceRecovery = Number(advanceRecovery.toFixed(2));

    // 5. Net = totalEarnings − totalDeductions − advance
    let netSalary = Number(Math.max(0, totalEarnings - totalDeductions - advanceRecovery).toFixed(2));
    if (hasAdvanceSalaryThisMonth) netSalary = 0;

    return {
      employee,
      grossSalary: payableGross,          // stored gross_salary = prorated gross
      nonPayableDeduction,
      pfDeduction: pfDeductionFinal,
      employeeEsiDeduction,
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
        
        if (pr.employee_id) {
          await this.employeesService.clearHrInputs(pr.employee_id);
        }
      }

    }

    return this.getPayrollForMonthAndYear(month, year);
  }

  /**
   * Dynamically compute payroll expense summary for a given month/year.
   * Returns totals for salary, employer PF, and employer ESI across all active payrolls.
   */
  async getPayrollExpenseSummary(month: number, year: number): Promise<{
    totalMonthlyCtc: number;
    totalNetSalaries: number;
    totalEmployerPF: number;
    totalEmployerESI: number;
    totalEmployeeESI: number;
    status: 'draft' | 'locked' | 'disbursed' | 'none';
  }> {
    const payrolls = await this.getPayrollForMonthAndYear(month, year);
    if (payrolls.length === 0) {
      return { totalMonthlyCtc: 0, totalNetSalaries: 0, totalEmployerPF: 0, totalEmployerESI: 0, totalEmployeeESI: 0, status: 'none' };
    }

    // Determine overall status (highest status wins)
    const statusPriority = { disbursed: 3, locked: 2, draft: 1 };
    let overallStatus: 'draft' | 'locked' | 'disbursed' = 'draft';
    for (const pr of payrolls) {
      if ((statusPriority[pr.status] || 0) > (statusPriority[overallStatus] || 0)) {
        overallStatus = pr.status;
      }
    }

    let totalMonthlyCtc = 0;
    let totalNetSalaries = 0;
    let totalEmployerPF = 0;
    let totalEmployerESI = 0;
    let totalEmployeeESI = 0;

    for (const pr of payrolls) {
      const breakdown = pr.tax_breakdown_json as any;
      totalMonthlyCtc += Number(breakdown?.ctc ?? 0);
      totalNetSalaries += Number(pr.net_salary);
      totalEmployeeESI += Number(breakdown?.employeeEsi ?? 0);
      totalEmployerPF += Number(breakdown?.employerPf ?? 0);
      totalEmployerESI += Number(breakdown?.employerEsi ?? 0);
    }

    return {
      totalMonthlyCtc: Number(totalMonthlyCtc.toFixed(2)),
      totalNetSalaries: Number(totalNetSalaries.toFixed(2)),
      totalEmployerPF: Number(totalEmployerPF.toFixed(2)),
      totalEmployerESI: Number(totalEmployerESI.toFixed(2)),
      totalEmployeeESI: Number(totalEmployeeESI.toFixed(2)),
      status: overallStatus,
    };
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

  private async getCurrentMonthDynamicProjection(month: number, year: number): Promise<{
    taxDeductions: number;
    employeePf: number;
    employerPf: number;
    employeeEsi: number;
    employerEsi: number;
  }> {
    const activeEmployees = await this.employeesService.findAll();
    const activeEmployeeList = activeEmployees.filter(emp => emp.active_status);

    let taxDeductions = 0;
    let employeePf = 0;
    let employerPf = 0;
    let employeeEsi = 0;
    let employerEsi = 0;

    for (const employee of activeEmployeeList) {
      try {
        const calc = await this.calculateSingleEmployee(employee.id, month, year);
        taxDeductions += Number(calc.taxDeduction || 0) + Number(calc.taxBreakdown?.professionalTax || 0);
        employeePf += Number(calc.pfDeduction || 0);
        employeeEsi += Number(calc.employeeEsiDeduction || 0);
        employerPf += Number(calc.taxBreakdown?.employerPf || 0);
        employerEsi += Number(calc.taxBreakdown?.employerEsi || 0);
      } catch {
        // Skip employees that cannot be projected for the current month.
      }
    }

    return {
      taxDeductions: Number(taxDeductions.toFixed(2)),
      employeePf: Number(employeePf.toFixed(2)),
      employerPf: Number(employerPf.toFixed(2)),
      employeeEsi: Number(employeeEsi.toFixed(2)),
      employerEsi: Number(employerEsi.toFixed(2)),
    };
  }

  async getCurrentMonthFinanceSummary(month: number, year: number): Promise<{
    payrollTotal: number;
    totalPayrollCost: number;
    pendingPayrollCount: number;
    taxDeductions: number;
    employeePf: number;
    employerPf: number;
    employeeEsi: number;
    employerEsi: number;
    processedCount: number;
    expectedPayrollThisMonth: number;
    monthlyAdvancesOut: number;
  }> {
    const result = await this.payrollRepository.createQueryBuilder('pr')
      .select('SUM(pr.net_salary)', 'payrollTotal')
      .addSelect('SUM(pr.tax_deduction)', 'taxDeductions')
      .addSelect('SUM(pr.pf_deduction)', 'pfContributions')
      .addSelect('COUNT(pr.id)', 'processedCount')
      .addSelect("SUM(CASE WHEN pr.status = 'draft' THEN 1 ELSE 0 END)", 'pendingPayrollCount')
      .where('pr.month = :month AND pr.year = :year', { month, year })
      .getRawOne();

    const activeEmployees = await this.employeesService.findAll();
    const activeEmployeeList = activeEmployees.filter(emp => emp.active_status);
    const dynamicProjection = await this.getCurrentMonthDynamicProjection(month, year);

    let expectedPayrollThisMonth = 0;
    for (const employee of activeEmployeeList) {
      try {
        const structure = await this.salaryStructuresService.findActiveByEmployee(employee.id).catch(() => null);
        const monthlyCtc = Number(structure?.ctc || employee.monthly_ctc || 0);
        const effectiveCtc = Number((monthlyCtc + Number(employee.appraisal || 0)).toFixed(2));
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));
        const joiningDate = employee.joining_date ? new Date(`${employee.joining_date}T00:00:00.000Z`) : null;
        const relievingDate = employee.relieving_date ? new Date(`${employee.relieving_date}T00:00:00.000Z`) : null;
        let payableDays = daysInMonth;
        if (joiningDate && monthEnd < joiningDate) {
          payableDays = 0;
        } else if (joiningDate && joiningDate.getUTCFullYear() === year && joiningDate.getUTCMonth() + 1 === month) {
          payableDays = Math.max(0, payableDays - Math.max(0, joiningDate.getUTCDate() - 1));
        }
        if (relievingDate && monthStart > relievingDate) {
          payableDays = 0;
        } else if (relievingDate && relievingDate.getUTCFullYear() === year && relievingDate.getUTCMonth() + 1 === month) {
          payableDays = Math.max(0, payableDays - Math.max(0, daysInMonth - relievingDate.getUTCDate()));
        }
        const ratio = daysInMonth > 0 ? payableDays / daysInMonth : 1;
        const proratedCtc = Number((effectiveCtc * Math.max(0, Math.min(1, ratio))).toFixed(2));
        expectedPayrollThisMonth += proratedCtc;
      } catch {
        const structure = await this.salaryStructuresService.findActiveByEmployee(employee.id).catch(() => null);
        const monthlyCtc = Number(structure?.ctc || employee.monthly_ctc || 0);
        const effectiveCtc = Number((monthlyCtc + Number(employee.appraisal || 0)).toFixed(2));
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));
        const joiningDate = employee.joining_date ? new Date(`${employee.joining_date}T00:00:00.000Z`) : null;
        const relievingDate = employee.relieving_date ? new Date(`${employee.relieving_date}T00:00:00.000Z`) : null;
        let payableDays = daysInMonth;
        if (joiningDate && monthEnd < joiningDate) {
          payableDays = 0;
        } else if (joiningDate && joiningDate.getUTCFullYear() === year && joiningDate.getUTCMonth() + 1 === month) {
          payableDays = Math.max(0, payableDays - Math.max(0, joiningDate.getUTCDate() - 1));
        }
        if (relievingDate && monthStart > relievingDate) {
          payableDays = 0;
        } else if (relievingDate && relievingDate.getUTCFullYear() === year && relievingDate.getUTCMonth() + 1 === month) {
          payableDays = Math.max(0, payableDays - Math.max(0, daysInMonth - relievingDate.getUTCDate()));
        }
        const ratio = daysInMonth > 0 ? payableDays / daysInMonth : 1;
        expectedPayrollThisMonth += Number((effectiveCtc * Math.max(0, Math.min(1, ratio))).toFixed(2));
      }
    }

    const dynamicExpenses = await this.getPayrollExpenseSummary(month, year);
    const advancesRaisedThisMonth = await this.advancesService.countRaisedThisMonth(month, year);
    const monthlyAdvancesOut = await this.advancesService.countTotalOutstanding();

    return {
      payrollTotal: Number(result?.payrollTotal || 0),
      totalPayrollCost: dynamicExpenses.totalNetSalaries + dynamicExpenses.totalEmployerPF + dynamicExpenses.totalEmployerESI,
      pendingPayrollCount: Number(result?.pendingPayrollCount || 0),
      taxDeductions: dynamicProjection.taxDeductions,
      employeePf: dynamicProjection.employeePf,
      employerPf: dynamicProjection.employerPf,
      employeeEsi: dynamicProjection.employeeEsi,
      employerEsi: dynamicProjection.employerEsi,
      processedCount: Number(result?.processedCount || 0),
      expectedPayrollThisMonth: Number(expectedPayrollThisMonth.toFixed(2)),
      monthlyAdvancesOut: Number(advancesRaisedThisMonth.toFixed(2)),
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

  async getSumDeductions(): Promise<{ pf: number; tax: number; esi: number }> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentProjection = await this.getCurrentMonthDynamicProjection(currentMonth, currentYear);

    const disbursedMonths = await this.payrollRepository.createQueryBuilder('pr')
      .select('pr.month', 'month')
      .addSelect('pr.year', 'year')
      .where('pr.status = :status', { status: 'disbursed' })
      .groupBy('pr.year')
      .addGroupBy('pr.month')
      .getRawMany();

    let totalEmployerPf = 0;
    let totalEmployerEsi = 0;
    let totalEmployeeEsi = 0;
    for (const { month, year } of disbursedMonths) {
      const summary = await this.getPayrollExpenseSummary(month, year);
      totalEmployerPf += summary.totalEmployerPF;
      totalEmployerEsi += summary.totalEmployerESI;
      totalEmployeeEsi += summary.totalEmployeeESI;
    }

    const result = await this.payrollRepository.createQueryBuilder('pr')
      .select('SUM(pr.pf_deduction)', 'pf')
      .addSelect('SUM(pr.tax_deduction)', 'tax')
      .where('pr.status = :status', { status: 'disbursed' })
      .getRawOne();
    return {
      pf: Number(result?.pf || 0) + totalEmployerPf + currentProjection.employeePf + currentProjection.employerPf,
      tax: Number(result?.tax || 0) + currentProjection.taxDeductions,
      esi: totalEmployerEsi + totalEmployeeEsi + currentProjection.employerEsi + currentProjection.employeeEsi,
    };
  }

  async getPayrollTrends(): Promise<any[]> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const results = await this.payrollRepository.createQueryBuilder('pr')
      .select('pr.month', 'month')
      .addSelect('pr.year', 'year')
      .addSelect('SUM(pr.net_salary)', 'net_cost')
      .addSelect('SUM(pr.pf_deduction)', 'pf_total')
      .addSelect('SUM(pr.tax_deduction)', 'tax_total')
      .where('pr.status IN (:...statuses)', { statuses: ['draft', 'locked', 'disbursed'] })
      .groupBy('pr.year')
      .addGroupBy('pr.month')
      .orderBy('pr.year', 'ASC')
      .addOrderBy('pr.month', 'ASC')
      .getRawMany();

    const trendEntries = await Promise.all(results.map(async r => {
      const dynamicSummary = await this.getPayrollExpenseSummary(r.month, r.year);
      return {
        month: Number(r.month),
        year: Number(r.year),
        name: `${monthNames[Number(r.month) - 1]} ${r.year}`,
        payrollCost: Number(r.net_cost),
        pf: Number(r.pf_total) + dynamicSummary.totalEmployerPF,
        esi: dynamicSummary.totalEmployerESI + dynamicSummary.totalEmployeeESI,
        tax: Number(r.tax_total),
      };
    }));

    const currentMonthSummary = await this.getCurrentMonthFinanceSummary(currentMonth, currentYear);
    const currentMonthEntry = {
      month: currentMonth,
      year: currentYear,
      name: `${monthNames[currentMonth - 1]} ${currentYear}`,
      payrollCost: Number(currentMonthSummary.expectedPayrollThisMonth || 0),
      pf: Number(currentMonthSummary.employerPf || 0) + Number(currentMonthSummary.employeePf || 0),
      esi: Number(currentMonthSummary.employerEsi || 0) + Number(currentMonthSummary.employeeEsi || 0),
      tax: Number(currentMonthSummary.taxDeductions || 0),
    };

    const merged = [...trendEntries];
    const currentIndex = merged.findIndex(entry => entry.month === currentMonth && entry.year === currentYear);
    if (currentIndex >= 0) {
      merged[currentIndex] = currentMonthEntry;
    } else {
      merged.push(currentMonthEntry);
    }

    return merged
      .sort((a, b) => (a.year - b.year) || (a.month - b.month))
      .slice(-6);
  }

  async removeDrafts(month: number, year: number): Promise<void> {
    await this.payrollRepository.delete({ month, year, status: 'draft' });
  }
}
