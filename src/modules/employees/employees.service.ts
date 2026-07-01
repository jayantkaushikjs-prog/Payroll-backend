import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, LessThanOrEqual, Not, IsNull } from 'typeorm';
import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { EmployeeAdvance } from '../advances/employee-advance.entity';
import { PFSettings } from '../pf/pf-settings.entity';
import { HrPreviewReview } from './hr-preview-review.entity';
import { calculateAnnualTax } from '../../utils/tax-calculator.util';
import { escapeCsv, parseCsvLine } from '../../common/utils/csv.util';
import { getFinancialYear } from '../../common/utils/financial-year.util';
import {
  calculateSalaryComponentsFromExistingRatios,
  isEsiApplicableForBasic,
  isPfApplicableForBasic,
} from '../salary-structures/utils/salary-components.util';
import { hasPendingEmployeeDeductions } from './employee-deactivation.util';
import { shouldIncludeAdvanceForPayrollRecovery } from '../advances/advance-recovery.util';

const PF_WAGE_LIMIT = 15000;
const isPfRequiredByMonthlyCtc = (monthlyCtc?: number | string | null): boolean => {
  const ctc = Number(monthlyCtc || 0);
  if (!ctc || isNaN(ctc) || ctc <= 0) {
    return false;
  }
  return ctc * 0.5 <= PF_WAGE_LIMIT;
};

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(SalaryStructure)
    private salaryStructureRepository: Repository<SalaryStructure>,
    @InjectRepository(EmployeeAdvance)
    private advanceRepository: Repository<EmployeeAdvance>,
    @InjectRepository(PFSettings)
    private pfSettingsRepository: Repository<PFSettings>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Designation)
    private designationRepository: Repository<Designation>,
    @InjectRepository(HrPreviewReview)
    private hrPreviewReviewRepository: Repository<HrPreviewReview>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const codeExists = await this.employeesRepository.findOne({
      where: { employee_code: createEmployeeDto.employee_code },
    });
    if (codeExists) {
      throw new ConflictException('Employee code already exists');
    }

    const emailExists = await this.employeesRepository.findOne({
      where: { email: createEmployeeDto.email },
    });
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const employee = this.employeesRepository.create({
      ...createEmployeeDto,
      pf_deduction: createEmployeeDto.pf_deduction !== undefined
        ? createEmployeeDto.pf_deduction
        : isPfRequiredByMonthlyCtc(createEmployeeDto.monthly_ctc),
    });
    const saved = await this.employeesRepository.save(employee);
    await this.syncSalaryStructureFromMonthlyCtc(saved, createEmployeeDto.monthly_ctc, saved.joining_date);
    return saved;
  }

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { deleted_at: IsNull() },
      order: { id: 'DESC' },
    });
  }

  async findAllIncludingDeleted(): Promise<Employee[]> {
    return this.employeesRepository.find({ order: { id: 'DESC' } });
  }

  async findArchived(): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { deleted_at: Not(IsNull()) },
      order: { id: 'DESC' },
    });
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    const pendingAdvance = await this.advanceRepository.findOne({
      where: { employee_id: id, is_fully_recovered: false },
    });
    if (pendingAdvance && Number(pendingAdvance.remaining_amount) > 0.01) {
      throw new BadRequestException('Cannot archive employee while Advances are pending, Firstly clear all the dues.');
    }

    const netPayableAmount = Number(employee.monthly_ctc || 0);
    if (hasPendingEmployeeDeductions(employee, netPayableAmount)) {
      throw new BadRequestException('Cannot archive employee while Damages Recovery or Other Deductions exceed the net payable amount. Clear the dues first.');
    }

    await this.employeesRepository.update(id, { deleted_at: new Date(), active_status: false });
  }

  async restore(id: number): Promise<void> {
    await this.employeesRepository.update(id, { deleted_at: null, active_status: false });
  }

  async findByCode(code: string): Promise<Employee | null> {
    return this.employeesRepository.findOne({ where: { employee_code: code } });
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  private async getOrCreatePreviewReview(month: string): Promise<HrPreviewReview> {
    let review = await this.hrPreviewReviewRepository.findOne({ where: { month } });
    if (!review) {
      review = this.hrPreviewReviewRepository.create({
        month,
        status: 'undone',
        finance_remarks: '',
        logs: [],
      });
      review = await this.hrPreviewReviewRepository.save(review);
    }
    return review;
  }

  async getPreviewReview(month: string): Promise<HrPreviewReview> {
    return this.getOrCreatePreviewReview(month);
  }

  async updatePreviewReviewStatus(month: string, status: 'done' | 'undone', userEmail?: string): Promise<HrPreviewReview> {
    const review = await this.getOrCreatePreviewReview(month);
    const previousStatus = review.status;
    review.status = status;
    if (status === 'done') {
      review.hr_marked_done_at = new Date();
    } else {
      review.hr_marked_undone_at = new Date();
    }
    review.logs = [
      ...(review.logs || []),
      {
        action: 'status_changed',
        from: previousStatus,
        to: status,
        email: userEmail,
        created_at: new Date().toISOString(),
      },
    ];
    return this.hrPreviewReviewRepository.save(review);
  }

  async updatePreviewFinanceRemarks(month: string, financeRemarks: string, userEmail?: string): Promise<HrPreviewReview> {
    const review = await this.getOrCreatePreviewReview(month);
    review.finance_remarks = financeRemarks || '';
    review.finance_remarks_updated_at = new Date();
    review.logs = [
      ...(review.logs || []),
      {
        action: 'finance_remarks_updated',
        remarks: review.finance_remarks,
        email: userEmail,
        created_at: new Date().toISOString(),
      },
    ];
    return this.hrPreviewReviewRepository.save(review);
  }

  async clearHrInputs(id: number): Promise<void> {
    await this.employeesRepository.update(id, {
      no_of_days_present: null,
      deduction_absent: 0,
      appraisal: 0,
      leave_encashment: 0,
      late_arrival_deduction: 0,
      damages_recovery: 0,
      bonus_incentives: 0,
      other_deductions: 0,
      remarks: '',
    });
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.employee_code && updateEmployeeDto.employee_code !== employee.employee_code) {
      const codeExists = await this.employeesRepository.findOne({
        where: { employee_code: updateEmployeeDto.employee_code },
      });
      if (codeExists) {
        throw new ConflictException('Employee code already exists');
      }
    }

    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const emailExists = await this.employeesRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    const { monthly_ctc, appraisal, appraisal_effective_date, ...rest } = updateEmployeeDto;

    // Capture whether the PF toggle is actually changing, BEFORE Object.assign mutates the entity
    const pfDeductionChanged =
      updateEmployeeDto.pf_deduction !== undefined &&
      updateEmployeeDto.pf_deduction !== employee.pf_deduction;

    // Determine if this is an appraisal increment
    let newCtc: number | undefined;
    let effectiveDate: string | undefined;
    if (appraisal !== undefined && appraisal_effective_date) {
      const increment = Number(appraisal);
      const currentCtc = Number(employee.monthly_ctc || 0);
      newCtc = currentCtc + increment;
      effectiveDate = appraisal_effective_date;
    }

    // Apply regular monthly CTC update if provided and not an appraisal
    if (monthly_ctc !== undefined) {
      employee.monthly_ctc = Number(monthly_ctc);
    }

    Object.assign(employee, rest);

    const pfDeductionBeforeAutoRule = employee.pf_deduction;
    if (isPfRequiredByMonthlyCtc(employee.monthly_ctc)) {
      employee.pf_deduction = true;
    }
    const salaryPfDeductionChanged = pfDeductionChanged || employee.pf_deduction !== pfDeductionBeforeAutoRule;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shouldAutoDeactivate = Boolean(employee.relieving_date && (() => {
      const [ry, rm, rd] = String(employee.relieving_date).split('-').map(Number);
      const relievingDate = new Date(ry, rm - 1, rd);
      return relievingDate <= today;
    })());

    if (updateEmployeeDto.active_status === false || shouldAutoDeactivate) {
      const pendingAdvance = await this.advanceRepository.findOne({
        where: { employee_id: employee.id, is_fully_recovered: false },
      });
      if (pendingAdvance && Number(pendingAdvance.remaining_amount) > 0.01) {
        throw new BadRequestException('Cannot deactivate employee while Advances are pending, Firstly clear all the dues.');
      }

      const netPayableAmount = Number(employee.monthly_ctc || 0);
      if (hasPendingEmployeeDeductions(employee, netPayableAmount)) {
        throw new BadRequestException('Cannot deactivate employee while Damages Recovery or Other Deductions exceed the net payable amount. Clear the dues first.');
      }

      employee.active_status = false;
    }

    const saved = await this.employeesRepository.save(employee);

    if (newCtc !== undefined) {
      // Appraisal branch: update CTC, sync structure, then clear appraisal fields
      saved.monthly_ctc = newCtc;
      if (isPfRequiredByMonthlyCtc(newCtc)) {
        saved.pf_deduction = true;
      }
      await this.employeesRepository.save(saved);
      await this.syncSalaryStructureFromMonthlyCtc(saved, newCtc, effectiveDate);
      saved.appraisal = 0;
      saved.appraisal_effective_date = null;
      await this.employeesRepository.save(saved);
    } else if (monthly_ctc !== undefined) {
      // Direct CTC update: re-sync with new CTC value.
      // If pf_deduction also changed in the same request, Object.assign has already
      // applied it to `saved`; force sync so equal CTC does not skip PF recalculation.
      await this.syncSalaryStructureFromMonthlyCtc(saved, Number(monthly_ctc), undefined, salaryPfDeductionChanged);
    } else if (salaryPfDeductionChanged) {
      // PF toggle changed without a CTC change: force a re-sync using the current
      // CTC so that the new pf_deduction value is reflected in the salary structure.
      await this.syncSalaryStructureFromMonthlyCtc(saved, Number(saved.monthly_ctc), undefined, true);
    }

    return saved;
  }

  // forceSync bypasses the early-exit guard that skips re-sync when CTC hasn't changed.
  // This is needed when only a non-CTC field (e.g. pf_deduction) changes but the
  // salary structure components still need to be recalculated.
  private async syncSalaryStructureFromMonthlyCtc(
    employee: Employee,
    monthlyCtcValue?: number,
    preferredEffectiveFrom?: string,
    forceSync = false,
  ): Promise<void> {
    const ctc = Number(monthlyCtcValue || 0);
    if (!ctc || isNaN(ctc) || ctc <= 0) {
      return;
    }

    const activeStructure = await this.salaryStructureRepository.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    if (
      !forceSync &&
      activeStructure &&
      Number(activeStructure.ctc) === ctc &&
      preferredEffectiveFrom === undefined
    ) {
      return;
    }

    const effectiveFrom = preferredEffectiveFrom || new Date().toISOString().split('T')[0];
    const pfSettings = await this.pfSettingsRepository.findOne({
      where: { effective_date: LessThanOrEqual(effectiveFrom) },
      order: { effective_date: 'DESC' },
    });
    const employerContributionRate = Number(pfSettings?.employer_contribution_rate ?? 12);
    const maxPfCap = Number(pfSettings?.max_pf_cap ?? 1800);

    const components = calculateSalaryComponentsFromExistingRatios({
      ctc,
      basicRatio: 0.5,
      hraRatio: 0.4,
      pfDeduction: employee.pf_deduction,
      employerContributionRate,
      maxPfCap,
    });

    await this.salaryStructureRepository.update(
      { employee_id: employee.id, is_active: true },
      { is_active: false },
    );

    await this.salaryStructureRepository.save(this.salaryStructureRepository.create({
      employee_id: employee.id,
      basic_salary: components.basic_salary,
      hra: components.hra,
      special_allowance: components.special_allowance,
      other_allowance: components.other_allowance,
      gross_salary: components.gross_salary,
      ctc,
      effective_from: effectiveFrom,
      is_active: true,
    }));
  }

  async countAll(): Promise<number> {
    return this.employeesRepository.count({ where: { active_status: true } });
  }

  async countEmployees(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.employeesRepository.count(),
      this.employeesRepository.count({ where: { active_status: true } }),
    ]);

    return { total, active };
  }

  async countNewJoinees(month: number, year: number): Promise<number> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];

    return this.employeesRepository.count({
      where: {
        joining_date: Between(start, end),
      },
    });
  }

  async getDepartmentDistribution(): Promise<{ department: string; count: number }[]> {
    const rows = await this.employeesRepository
      .createQueryBuilder('emp')
      .select('emp.department', 'department')
      .addSelect('COUNT(emp.id)', 'count')
      .where('emp.active_status = :active', { active: true })
      .groupBy('emp.department')
      .orderBy('COUNT(emp.id)', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      department: row.department || 'Unassigned',
      count: Number(row.count || 0),
    }));
  }

  async getRecentEmployeeActivities(limit = 5): Promise<{ title: string; description: string; date: Date | string }[]> {
    const employees = await this.employeesRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });

    return employees.map((emp) => ({
      title: 'Employee profile added',
      description: `${emp.employee_code} - ${emp.name}`,
      date: emp.created_at,
    }));
  }

  async generateNextEmployeeCode(): Promise<{ code: string }> {
    const employees = await this.employeesRepository.find();
    let maxNum = 0;
    employees.forEach(emp => {
      if (emp.employee_code && emp.employee_code.startsWith('TS')) {
        const numPart = emp.employee_code.substring(4);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const code = `TS${String(nextNum).padStart(3, '0')}`;
    return { code };
  }

  private escapeCsv(value: unknown): string {
    return escapeCsv(value);
  }

  generateCsv(employees: Employee[]): string {
    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Joining Date',
      'Bank Name',
      'Account Number',
      'IFSC',
      'PF No. / UAN',
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
      this.escapeCsv(emp.bank_name),
      this.escapeCsv(emp.account_number),
      this.escapeCsv(emp.ifsc),
      this.escapeCsv(emp.pf_uan),
      emp.active_status ? 'Active' : 'Inactive',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async importCsv(csvContent: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV is empty or lacks data rows'] };
    }

    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const errors: string[] = [];
    let importedCount = 0;

    const csvEmployeeCodes = new Set<string>();
    const csvEmails = new Set<string>();
    const csvPhones = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCsvLine(lines[i]);
        if (values.length < headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const data: any = {};
        headers.forEach((header, index) => {
          const val = values[index]?.trim();
          if (header === 'employee code' || header === 'employee_code') data.employee_code = val;
          else if (header === 'name') data.name = val;
          else if (header === 'email') data.email = val;
          else if (header === 'personal email' || header === 'personal_email') data.personal_email = val || null;
          else if (header === 'phone') data.phone = val || null;
          else if (header === 'department') data.department = val;
          else if (header === 'designation') data.designation = val;
          else if (header === 'joining date' || header === 'joining_date') {
            if (val) {
              const matchDmy = val.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (matchDmy) {
                const [_, d, m, y] = matchDmy;
                data.joining_date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              } else {
                data.joining_date = val;
              }
            } else {
              data.joining_date = val;
            }
          }
          else if (header === 'bank name' || header === 'bank_name') data.bank_name = val;
          else if (header === 'account number' || header === 'account_number') data.account_number = val;
          else if (header === 'ifsc') data.ifsc = val;
          else if (header === 'pf no. / uan' || header === 'pf no / uan' || header === 'pf_uan' || header === 'uan') data.pf_uan = val || null;
          else if (header === 'tax regime' || header === 'tax_regime') data.tax_regime = val || 'new';
          else if (header === 'active status' || header === 'active_status') {
            data.active_status = val?.toLowerCase() === 'active' || val?.toLowerCase() === 'true' || val === '1';
          }
        });

        if (!data.tax_regime) {
          data.tax_regime = 'new';
        }
        if (data.active_status === undefined) {
          data.active_status = true;
        }

        if (!data.employee_code || !data.name) {
          errors.push(`Row ${i + 1}: Missing employee_code or name`);
          continue;
        }

        if (csvEmployeeCodes.has(data.employee_code)) {
          errors.push(`Row ${i + 1}: Duplicate Employee Code "${data.employee_code}" in CSV`);
          continue;
        }
        if (data.email && csvEmails.has(data.email.toLowerCase())) {
          errors.push(`Row ${i + 1}: Duplicate Email "${data.email}" in CSV`);
          continue;
        }
        if (data.phone && csvPhones.has(data.phone)) {
          errors.push(`Row ${i + 1}: Duplicate Phone "${data.phone}" in CSV`);
          continue;
        }

        csvEmployeeCodes.add(data.employee_code);
        if (data.email) csvEmails.add(data.email.toLowerCase());
        if (data.phone) csvPhones.add(data.phone);

        const existingCode = await this.employeesRepository.findOne({ where: { employee_code: data.employee_code } });

        if (data.email) {
          const existingEmail = await this.employeesRepository.findOne({ where: { email: data.email } });
          if (existingEmail && (!existingCode || existingEmail.id !== existingCode.id)) {
            errors.push(`Row ${i + 1}: Email "${data.email}" is already taken by another employee`);
            continue;
          }
        }

        if (data.phone) {
          const existingPhone = await this.employeesRepository.findOne({ where: { phone: data.phone } });
          if (existingPhone && (!existingCode || existingPhone.id !== existingCode.id)) {
            errors.push(`Row ${i + 1}: Phone "${data.phone}" is already taken by another employee`);
            continue;
          }
        }

        if (existingCode) {
          Object.assign(existingCode, data);
          await this.employeesRepository.save(existingCode);
        } else {
          await this.employeesRepository.save(this.employeesRepository.create(data));
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || err}`);
      }
    }
    return { imported: importedCount, errors };
  }

  async importEmployeesJson(employeesData: any[]): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let importedCount = 0;

    for (let i = 0; i < employeesData.length; i++) {
      try {
        const data = employeesData[i];
        if (data.joining_date) {
          const matchDmy = data.joining_date.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
          if (matchDmy) {
            const [_, d, m, y] = matchDmy;
            data.joining_date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }

        if (!data.employee_code || !data.name) {
          errors.push(`Row ${i + 1}: Missing employee_code or name`);
          continue;
        }

        const existingCode = await this.employeesRepository.findOne({ where: { employee_code: data.employee_code } });
        if (data.email) {
          const existingEmail = await this.employeesRepository.findOne({ where: { email: data.email } });
          if (existingEmail && (!existingCode || existingEmail.id !== existingCode.id)) {
            errors.push(`Row ${i + 1}: Email "${data.email}" is already taken by another employee`);
            continue;
          }
        }

        if (existingCode) {
          Object.assign(existingCode, data);
          await this.employeesRepository.save(existingCode);
        } else {
          await this.employeesRepository.save(this.employeesRepository.create(data));
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || err}`);
      }
    }
    return { imported: importedCount, errors };
  }

  async getFinancialSummary(
    employeeId: number,
    year?: string,
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<any> {
    const employee = await this.findOne(employeeId);

    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateStr);
      endDate.setHours(0, 0, 0, 0);
    } else {
      const yr = year ? parseInt(year, 10) : new Date().getFullYear();
      startDate = new Date(yr, 3, 1); // April 1st of year
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(yr + 1, 2, 31); // March 31st of year + 1
      endDate.setHours(0, 0, 0, 0);
    }

    // Generate all target months within the range
    const targetMonths: { year: number; month: number }[] = [];
    const current = new Date(startDate.getTime());
    current.setDate(1);
    const endLimit = new Date(endDate.getTime());
    endLimit.setDate(1);
    while (current <= endLimit) {
      targetMonths.push({ year: current.getFullYear(), month: current.getMonth() + 1 });
      current.setMonth(current.getMonth() + 1);
    }

    // Get all disbursed payrolls for the employee
    const allPayrolls = await this.payrollRepository.find({
      where: { employee_id: employeeId, status: 'disbursed' },
    });

    // Filter payrolls that match target months
    const payrolls = allPayrolls.filter(p =>
      targetMonths.some(tm => tm.year === p.year && tm.month === p.month)
    );

    const getProrationRatio = (year: number, month: number): number => {
      const monthStart = new Date(year, month - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(year, month, 0);
      monthEnd.setHours(0, 0, 0, 0);

      const overlapStart = startDate > monthStart ? startDate : monthStart;
      const overlapEnd = endDate < monthEnd ? endDate : monthEnd;

      if (overlapStart > overlapEnd) return 0;

      const overlapDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = monthEnd.getDate();

      return overlapDays / totalDays;
    };

    const parseDateOnly = (dateString?: string | null): Date | null => {
      if (!dateString) return null;
      const [dateYear, dateMonth, dateDay] = String(dateString).split('-').map(Number);
      if (!dateYear || !dateMonth || !dateDay) return null;
      return new Date(Date.UTC(dateYear, dateMonth - 1, dateDay));
    };

    const getEmploymentNonPayableDays = (year: number, month: number): number => {
      const daysInMonth = new Date(year, month, 0).getDate();
      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));
      const joiningDate = parseDateOnly(employee.joining_date);
      const relievingDate = parseDateOnly(employee.relieving_date);

      if ((joiningDate && monthEnd < joiningDate) || (relievingDate && monthStart > relievingDate)) {
        return daysInMonth;
      }

      let nonPayableDays = 0;
      if (joiningDate && joiningDate.getUTCFullYear() === year && joiningDate.getUTCMonth() + 1 === month) {
        nonPayableDays += Math.max(0, joiningDate.getUTCDate() - 1);
      }
      if (relievingDate && relievingDate.getUTCFullYear() === year && relievingDate.getUTCMonth() + 1 === month) {
        nonPayableDays += Math.max(0, daysInMonth - relievingDate.getUTCDate());
      }

      return Math.min(daysInMonth, nonPayableDays);
    };

    const getAppraisalForMonth = (year: number, month: number): number => {
      const appraisal = Number(employee.appraisal || 0);
      if (appraisal <= 0) return 0;
      if (!employee.appraisal_effective_date) return appraisal;

      const effectiveDate = new Date(employee.appraisal_effective_date);
      const effectiveMonthStart = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
      const targetMonthStart = new Date(year, month - 1, 1);

      return targetMonthStart >= effectiveMonthStart ? appraisal : 0;
    };

    let amountPaid = 0;
    let pfDeducted = 0;
    let taxDeducted = 0;
    let advanceRecovered = 0;
    let esiDeducted = 0;
    let paidMonthsCount = 0;

    payrolls.forEach(p => {
      const ratio = getProrationRatio(p.year, p.month);
      amountPaid += Number(p.net_salary) * ratio;
      pfDeducted += Number(p.pf_deduction) * ratio;
      taxDeducted += Number(p.tax_deduction) * ratio;
      advanceRecovered += Number(p.advance_recovery) * ratio;

      const breakdown = p.tax_breakdown_json as any;
      esiDeducted += Number(breakdown?.employeeEsi ?? breakdown?.employeeEsiDeduction ?? 0) * ratio;

      paidMonthsCount += ratio;
    });

    // Get all advances once so projected remaining net can mirror payroll recovery.
    const advances = await this.advanceRepository.find({
      where: { employee_id: employeeId },
      order: { date: 'ASC' },
    });

    // Use salary structure history so annual/monthly/custom summaries follow revisions.
    const salaryStructures = await this.salaryStructureRepository.find({
      where: { employee_id: employeeId },
      order: { effective_from: 'ASC', created_at: 'ASC' },
    });

    const getStructureForMonth = (year: number, month: number): SalaryStructure | null => {
      const monthEnd = new Date(year, month, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const effective = salaryStructures
        .filter((s) => {
          const effectiveFrom = new Date(s.effective_from);
          effectiveFrom.setHours(0, 0, 0, 0);
          return effectiveFrom <= monthEnd;
        })
        .at(-1);

      return effective || salaryStructures[0] || null;
    };

    const displayStructure =
      getStructureForMonth(endDate.getFullYear(), endDate.getMonth() + 1) ||
      salaryStructures.find((s) => s.is_active) ||
      salaryStructures.at(-1) ||
      null;

    let amountToBePaid = 0;
    let expectedPFRemaining = 0;
    let expectedESIRemaining = 0;
    let expectedTaxRemaining = 0;
    let remainingMonthsCount = 0;
    let estimatedMonthlyPayout = 0;

    if (displayStructure) {
      const displayYear = endDate.getFullYear();
      const displayMonth = endDate.getMonth() + 1;
      const pfSettings = await this.pfSettingsRepository.findOne({
        where: {
          effective_date: LessThanOrEqual(`${displayYear}-${String(displayMonth).padStart(2, '0')}-01`),
        },
        order: { effective_date: 'DESC' },
      });
      const pfEmployerRate = (Number(pfSettings?.employer_contribution_rate) || 12) / 100;
      const pfEmployeeRate = (Number(pfSettings?.employee_contribution_rate) || 12) / 100;
      const esiEmployerRate = (Number(pfSettings?.esi_contribution_rate) || 3.25) / 100;
      const esiEmployeeRate = (Number(pfSettings?.esi_employee_contribution_rate) || 0.75) / 100;
      const maxPfCap = Number(pfSettings?.max_pf_cap) || 1800;
      const professionalTax = Number(pfSettings?.professional_tax ?? 200);
      const monthlyCtc = Number(displayStructure.ctc) + getAppraisalForMonth(displayYear, displayMonth);
      const basic = Number((monthlyCtc * 0.5).toFixed(2));
      const pfApplicable = isPfApplicableForBasic(basic, employee.pf_deduction !== false);
      const esiApplicable = isEsiApplicableForBasic(basic);
      const employerPf = pfApplicable ? Number(Math.min(basic * pfEmployerRate, maxPfCap).toFixed(2)) : 0;
      const employerEsi = esiApplicable ? Number((basic * esiEmployerRate).toFixed(2)) : 0;
      const gross = Number((monthlyCtc - employerPf - employerEsi).toFixed(2));
      const employeePf = pfApplicable ? Number(Math.min(basic * pfEmployeeRate, maxPfCap).toFixed(2)) : 0;
      const employeeEsi = esiApplicable ? Number((basic * esiEmployeeRate).toFixed(2)) : 0;
      const professionalTaxDeduction = (monthlyCtc * 12) <= 250000 ? 0 : Number(professionalTax.toFixed(2));
      const lateAbsentDays = Math.floor(Number(employee.late_arrival_deduction || 0) / 3) * 0.5;
      const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
      const lateArrivalDeduction = Number(((gross / daysInMonth) * lateAbsentDays).toFixed(2));
      estimatedMonthlyPayout = Number(Math.max(
        0,
        gross +
          Number(employee.bonus_incentives || 0) +
          Number(employee.leave_encashment || 0) -
          employeePf -
          employeeEsi -
          professionalTaxDeduction -
          lateArrivalDeduction -
          Number(employee.damages_recovery || 0) -
          Number(employee.other_deductions || 0),
      ).toFixed(2));
    }

    if (salaryStructures.length > 0) {
      // Remaining months in the selection range that do not have disbursed payrolls
      const remainingMonths = targetMonths.filter(tm =>
        !payrolls.some(p => p.year === tm.year && p.month === tm.month)
      );
      const remainingFullMonths = remainingMonths.length;

      // Use the start date's year to define the target FY for tax calculations
      const fyYear = startDate.getMonth() >= 3 ? startDate.getFullYear() : startDate.getFullYear() - 1;
      const targetFY = `${fyYear}-${fyYear + 1}`;

      // 1. Calculate projected annual gross: YTD Gross (excluding non_payable_deductions) + expected remaining months gross
      const grossPaidYTD = payrolls.reduce((sum, p) => {
        const breakdown = p.tax_breakdown_json as any;
        return sum + Number(breakdown?.payableGross ?? Number(p.gross_salary));
      }, 0);

      const expectedMonthCalculations = await Promise.all(remainingMonths.map(async (m) => {
        const monthStructure = getStructureForMonth(m.year, m.month);
        if (!monthStructure) return null;

        const daysInMonth = new Date(m.year, m.month, 0).getDate();
        const rangeRatio = getProrationRatio(m.year, m.month);
        const monthlyCtc = Number(monthStructure.ctc) + getAppraisalForMonth(m.year, m.month);
        const pfSettings = await this.pfSettingsRepository.findOne({
          where: {
            effective_date: LessThanOrEqual(`${m.year}-${String(m.month).padStart(2, '0')}-01`),
          },
          order: { effective_date: 'DESC' },
        });

        const pfEmployerRate = (Number(pfSettings?.employer_contribution_rate) || 12) / 100;
        const pfEmployeeRate = (Number(pfSettings?.employee_contribution_rate) || 12) / 100;
        const esiEmployerRate = (Number(pfSettings?.esi_contribution_rate) || 3.25) / 100;
        const esiEmployeeRate = (Number(pfSettings?.esi_employee_contribution_rate) || 0.75) / 100;
        const maxPfCap = Number(pfSettings?.max_pf_cap) || 1800;
        const professionalTax = Number(pfSettings?.professional_tax ?? 200);

        const basic = Number((monthlyCtc * 0.5).toFixed(2));
        const pfApplicable = isPfApplicableForBasic(basic, employee.pf_deduction !== false);
        const esiApplicable = isEsiApplicableForBasic(basic);
        const employerPf = pfApplicable ? Number(Math.min(basic * pfEmployerRate, maxPfCap).toFixed(2)) : 0;
        const employerEsi = esiApplicable ? Number((basic * esiEmployerRate).toFixed(2)) : 0;
        const gross = Number((monthlyCtc - employerPf - employerEsi).toFixed(2));

        const consoleAbsentDays = Number(employee.deduction_absent || 0);
        const derivedAbsentDays = Math.max(0, daysInMonth - (employee.no_of_days_present ?? daysInMonth));
        const totalNpd = Math.min(daysInMonth, consoleAbsentDays + derivedAbsentDays + getEmploymentNonPayableDays(m.year, m.month));
        const payableDays = Math.max(0, daysInMonth - totalNpd);
        const payrollRatio = daysInMonth > 0 ? payableDays / daysInMonth : 1;
        const payableGross = Number((gross * payrollRatio).toFixed(2));
        const payableBasic = Number((basic * payrollRatio).toFixed(2));

        const pf = pfApplicable ? Number(Math.min(payableBasic * pfEmployeeRate, maxPfCap * payrollRatio).toFixed(2)) : 0;
        const esi = esiApplicable ? Number((payableBasic * esiEmployeeRate).toFixed(2)) : 0;
        const professionalTaxDeduction = (monthlyCtc * 12) <= 250000 ? 0 : Number(professionalTax.toFixed(2));
        const lateAbsentDays = Math.floor(Number(employee.late_arrival_deduction || 0) / 3) * 0.5;
        const lateArrivalDeduction = Number(((gross / daysInMonth) * lateAbsentDays).toFixed(2));
        const bonusIncentives = Number(employee.bonus_incentives || 0);
        const leaveEncashment = Number(employee.leave_encashment || 0);
        const damagesRecovery = Number(employee.damages_recovery || 0);
        const otherDeductions = Number(employee.other_deductions || 0);
        const totalEarnings = Number((payableGross + bonusIncentives + leaveEncashment).toFixed(2));

        return {
          year: m.year,
          month: m.month,
          rangeRatio,
          payableGross,
          totalEarnings,
          pf,
          esi,
          professionalTaxDeduction,
          lateArrivalDeduction,
          damagesRecovery,
          otherDeductions,
        };
      }));

      const validExpectedMonths = expectedMonthCalculations.filter((calc): calc is NonNullable<typeof calc> => Boolean(calc));
      const projectedRemainingGross = validExpectedMonths.reduce((sum, calc) => sum + (calc.payableGross * calc.rangeRatio), 0);
      const projectedAnnualGross = grossPaidYTD + projectedRemainingGross;

      // 2. Calculate total expected annual tax
      let totalAnnualTax = 0;
      if (employee.tax_deduction !== false) {
        const taxRegime = employee.tax_regime || 'new';
        totalAnnualTax = calculateAnnualTax(projectedAnnualGross, taxRegime, undefined, targetFY);
      }

      // 3. Calculate remaining annual tax and distribute to remaining months
      const remainingAnnualTax = Math.max(0, totalAnnualTax - taxDeducted);
      const monthlyTdsRemaining = remainingFullMonths > 0 ? Number((remainingAnnualTax / remainingFullMonths).toFixed(2)) : 0;

      if (employee.tax_deduction !== false) {
        estimatedMonthlyPayout = Number(Math.max(0, estimatedMonthlyPayout - monthlyTdsRemaining).toFixed(2));
      }

      const projectedAdvanceRemaining = new Map<number, number>();
      advances.forEach((advance) => {
        projectedAdvanceRemaining.set(advance.id, Number(advance.remaining_amount || 0));
      });

      const displayMonthCalculation = [...validExpectedMonths]
        .reverse()
        .find((calc) => {
          const calcStructure = getStructureForMonth(calc.year, calc.month);
          return calcStructure?.id === displayStructure?.id;
        }) || validExpectedMonths.at(-1);

      for (const calc of validExpectedMonths) {
        const tax = employee.tax_deduction !== false ? monthlyTdsRemaining : 0;
        const totalDeductions =
          calc.pf +
          calc.esi +
          calc.professionalTaxDeduction +
          tax +
          calc.lateArrivalDeduction +
          calc.damagesRecovery +
          calc.otherDeductions;
        let availableForAdvances = Math.max(0, Number((calc.totalEarnings - totalDeductions).toFixed(2)));
        let projectedAdvanceRecovery = 0;

        const activeAdvances = advances.filter((advance) => {
          const remaining = projectedAdvanceRemaining.get(advance.id) ?? Number(advance.remaining_amount || 0);
          if (!shouldIncludeAdvanceForPayrollRecovery({ ...advance, remaining_amount: remaining, is_fully_recovered: remaining <= 0.01 })) return false;
          if (advance.start_year < calc.year) return true;
          return advance.start_year === calc.year && advance.start_month <= calc.month;
        });

        const advanceSalaryThisMonth = activeAdvances.some((advance) => {
          if (!advance.is_advance_salary) return false;
          const advanceDate = new Date(advance.date);
          let recoveryMonth = advanceDate.getMonth() + 2;
          let recoveryYear = advanceDate.getFullYear();
          if (recoveryMonth > 12) {
            recoveryMonth = 1;
            recoveryYear += 1;
          }
          return calc.month === recoveryMonth && calc.year === recoveryYear;
        });

        for (const advance of activeAdvances) {
          if (!advance.is_advance_salary) continue;
          const advanceDate = new Date(advance.date);
          let recoveryMonth = advanceDate.getMonth() + 2;
          let recoveryYear = advanceDate.getFullYear();
          if (recoveryMonth > 12) {
            recoveryMonth = 1;
            recoveryYear += 1;
          }
          if (calc.month !== recoveryMonth || calc.year !== recoveryYear) continue;

          const remaining = projectedAdvanceRemaining.get(advance.id) ?? Number(advance.remaining_amount || 0);
          projectedAdvanceRecovery += remaining;
          projectedAdvanceRemaining.set(advance.id, 0);
          availableForAdvances = Math.max(0, Number((availableForAdvances - remaining).toFixed(2)));
        }

        for (const advance of activeAdvances) {
          if (availableForAdvances <= 0) break;

          if (advance.is_advance_salary) {
            const advanceDate = new Date(advance.date);
            let recoveryMonth = advanceDate.getMonth() + 2;
            let recoveryYear = advanceDate.getFullYear();
            if (recoveryMonth > 12) {
              recoveryMonth = 1;
              recoveryYear += 1;
            }
            if (calc.month === recoveryMonth && calc.year === recoveryYear) continue;
          }

          const remaining = projectedAdvanceRemaining.get(advance.id) ?? Number(advance.remaining_amount || 0);
          const installment = advance.recovery_type === 'one_time'
            ? remaining
            : Math.min(advance.installment_amount ? Number(advance.installment_amount) : remaining, remaining);
          const actualRecovery = Number(Math.min(installment, availableForAdvances).toFixed(2));
          if (actualRecovery <= 0) continue;

          projectedAdvanceRecovery += actualRecovery;
          projectedAdvanceRemaining.set(advance.id, Number((remaining - actualRecovery).toFixed(2)));
          availableForAdvances = Number((availableForAdvances - actualRecovery).toFixed(2));
        }

        const net = advanceSalaryThisMonth ? 0 : Number(Math.max(0, calc.totalEarnings - totalDeductions - projectedAdvanceRecovery).toFixed(2));
        amountToBePaid += net * calc.rangeRatio;
        expectedPFRemaining += calc.pf * calc.rangeRatio;
        expectedESIRemaining += calc.esi * calc.rangeRatio;
        expectedTaxRemaining += tax * calc.rangeRatio;
        remainingMonthsCount += calc.rangeRatio;
      }
    }

    const totalAdvancesTaken = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalAdvancesRepaid = advances.reduce((sum, a) => sum + Number(a.total_recovered), 0);
    const remainingAdvanceBalance = totalAdvancesTaken - totalAdvancesRepaid;
    const advanceDetails = advances
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((advance) => ({
        id: advance.id,
        amount: Number(advance.amount),
        date: advance.date,
        reason: advance.reason,
        recovery_type: advance.recovery_type,
        installment_amount: advance.installment_amount ? Number(advance.installment_amount) : null,
        total_recovered: Number(advance.total_recovered),
        remaining_amount: Number(advance.remaining_amount),
        start_month: advance.start_month,
        start_year: advance.start_year,
        is_fully_recovered: advance.is_fully_recovered,
        is_advance_salary: advance.is_advance_salary,
      }));

    // Compute employer PF and ESI from the active structure for accurate breakdown display
    let structureEmployerPf = 0;
    let structureEmployerEsi = 0;
    if (displayStructure) {
      // Fetch PF settings if not already fetched (when there were 0 remaining months)
      const pfSettingsForStructure = await this.pfSettingsRepository.findOne({
        where: {
          effective_date: LessThanOrEqual(new Date().toISOString().split('T')[0]),
        },
        order: { effective_date: 'DESC' },
      });
      const structPfRate = pfSettingsForStructure ? Number(pfSettingsForStructure.employer_contribution_rate) / 100 : 0.12;
      const structMaxPfCap = pfSettingsForStructure ? Number(pfSettingsForStructure.max_pf_cap) : 1800;
      const structEsiEmployerRate = pfSettingsForStructure ? Number(pfSettingsForStructure.esi_contribution_rate ?? 3.25) / 100 : 0.0325;
      const structPfContribType = pfSettingsForStructure ? pfSettingsForStructure.pf_contribution_type : 2;
      const structEsiContribType = pfSettingsForStructure ? pfSettingsForStructure.esi_contribution_type : 2;
      const basicSal = Number(displayStructure.basic_salary);
      if (structPfContribType === 2 && employee.pf_deduction !== false) {
        structureEmployerPf = Math.min(basicSal * structPfRate, structMaxPfCap);
      }
      if (structEsiContribType === 2 && basicSal < 21000) {
        structureEmployerEsi = basicSal * structEsiEmployerRate;
      }
    }

    return {
      year: year ? parseInt(year, 10) : startDate.getFullYear(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      amountPaid,
      amountToBePaid,
      estimatedMonthlyPayout,
      pfDeducted,
      expectedPFRemaining,
      esiDeducted,
      expectedESIRemaining,
      taxDeducted,
      expectedTaxRemaining,
      advanceRecovered,
      totalAdvancesTaken,
      totalAdvancesRepaid,
      remainingAdvanceBalance,
      advanceDetails,
      paidMonthsCount,
      remainingMonthsCount,
      structure: displayStructure ? {
        ctc: Number(displayStructure.ctc),
        gross_salary: Number(displayStructure.gross_salary),
        basic_salary: Number(displayStructure.basic_salary),
        hra: Number(displayStructure.hra),
        special_allowance: Number(displayStructure.special_allowance),
        other_allowance: Number(displayStructure.other_allowance),
        effective_from: displayStructure.effective_from,
        employer_pf: Number(structureEmployerPf.toFixed(2)),
        employer_esi: Number(structureEmployerEsi.toFixed(2)),
      } : null,
    };
  }

  async generateFinancialsCsv(employeeId: number, startDateStr: string, endDateStr: string): Promise<string> {
    const employee = await this.findOne(employeeId);
    const summary = await this.getFinancialSummary(employeeId, undefined, startDateStr, endDateStr);

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const targetMonths: { year: number; month: number }[] = [];
    const current = new Date(startDate.getTime());
    current.setDate(1);
    const endLimit = new Date(endDate.getTime());
    endLimit.setDate(1);
    while (current <= endLimit) {
      targetMonths.push({ year: current.getFullYear(), month: current.getMonth() + 1 });
      current.setMonth(current.getMonth() + 1);
    }

    // Fetch all payrolls for this employee in the desired tenure
    const payrolls = await this.payrollRepository.find({
      where: { employee_id: employeeId },
      order: { year: 'ASC', month: 'ASC' },
    });

    const filteredPayrolls = payrolls.filter(p =>
      targetMonths.some(tm => tm.year === p.year && tm.month === p.month)
    );

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const lines: string[] = [];
    lines.push(['Financial Report for Employee', this.escapeCsv(`${employee.employee_code} - ${employee.name}`)].join(','));
    lines.push(['Tenure', this.escapeCsv(`${summary.startDate} to ${summary.endDate}`)].join(','));
    lines.push('');
    lines.push('FINANCIAL SUMMARY');
    lines.push(['Metric', 'Value'].join(','));
    [
      ['Amount Paid', summary.amountPaid],
      ['Amount To Be Paid', summary.amountToBePaid],
      ['PF Deducted', summary.pfDeducted],
      ['Expected PF Remaining', summary.expectedPFRemaining],
      ['Tax Deducted', summary.taxDeducted],
      ['Expected Tax Remaining', summary.expectedTaxRemaining],
      ['Advance Recovered', summary.advanceRecovered],
      ['Total Advances Taken', summary.totalAdvancesTaken],
      ['Total Advances Repaid', summary.totalAdvancesRepaid],
      ['Remaining Advance Balance', summary.remainingAdvanceBalance],
      ['Paid Months Count', summary.paidMonthsCount],
      ['Remaining Months Count', summary.remainingMonthsCount],
      ['CTC', summary.structure?.ctc ?? 0],
      ['Gross Salary', summary.structure?.gross_salary ?? 0],
      ['Basic Salary', summary.structure?.basic_salary ?? 0],
      ['HRA', summary.structure?.hra ?? 0],
      ['Special Allowance', summary.structure?.special_allowance ?? 0],
      ['Other Allowance', summary.structure?.other_allowance ?? 0],
    ].forEach(([label, value]) => {
      lines.push([this.escapeCsv(label), this.escapeCsv(value)].join(','));
    });
    lines.push('');
    lines.push('ADVANCE DETAILS');
    lines.push([
      'Date',
      'Amount',
      'Recovery Type',
      'Installment Amount',
      'Estimated No. Of Months',
      'Start Month',
      'Start Year',
      'Total Recovered',
      'Remaining Amount',
      'Fully Recovered',
      'Advance Salary',
      'Reason'
    ].join(','));
    for (const advance of summary.advanceDetails || []) {
      const estimatedMonths = advance.installment_amount
        ? Math.ceil(Number(advance.amount) / Number(advance.installment_amount))
        : '';
      lines.push([
        this.escapeCsv(advance.date),
        this.escapeCsv(advance.amount),
        this.escapeCsv(advance.recovery_type),
        this.escapeCsv(advance.installment_amount ?? ''),
        this.escapeCsv(estimatedMonths),
        this.escapeCsv(advance.start_month),
        this.escapeCsv(advance.start_year),
        this.escapeCsv(advance.total_recovered),
        this.escapeCsv(advance.remaining_amount),
        this.escapeCsv(advance.is_fully_recovered ? 'Yes' : 'No'),
        this.escapeCsv(advance.is_advance_salary ? 'Yes' : 'No'),
        this.escapeCsv(advance.reason || ''),
      ].join(','));
    }
    lines.push('');
    lines.push('MONTHLY PAYROLL RECORDS');
    lines.push([
      'Month',
      'Year',
      'Gross Salary',
      'PF Deduction',
      'Tax Deduction',
      'Advance Recovery',
      'Net Salary',
      'Status'
    ].join(','));

    for (const p of filteredPayrolls) {
      lines.push([
        this.escapeCsv(monthNames[p.month - 1]),
        this.escapeCsv(p.year),
        this.escapeCsv(p.gross_salary),
        this.escapeCsv(p.pf_deduction),
        this.escapeCsv(p.tax_deduction),
        this.escapeCsv(p.advance_recovery),
        this.escapeCsv(p.net_salary),
        this.escapeCsv(p.status)
      ].join(','));
    }

    lines.push('');
    lines.push('ANNUAL FINANCIAL SUMMARIES');
    lines.push([
      'Financial Year',
      'Total Gross Salary',
      'Total PF Deducted',
      'Total Tax Deducted',
      'Total Advance Recovered',
      'Total Net Salary Paid'
    ].join(','));

    // Group by financial year
    const fyGroups: Record<string, typeof filteredPayrolls> = {};
    for (const p of filteredPayrolls) {
      const fy = getFinancialYear(p.month, p.year);
      if (!fyGroups[fy]) {
        fyGroups[fy] = [];
      }
      fyGroups[fy].push(p);
    }

    for (const fy of Object.keys(fyGroups).sort()) {
      const group = fyGroups[fy];
      const totalGross = group.reduce((sum, p) => sum + Number(p.gross_salary), 0).toFixed(2);
      const totalPF = group.reduce((sum, p) => sum + Number(p.pf_deduction), 0).toFixed(2);
      const totalTax = group.reduce((sum, p) => sum + Number(p.tax_deduction), 0).toFixed(2);
      const totalAdv = group.reduce((sum, p) => sum + Number(p.advance_recovery), 0).toFixed(2);
      const totalNet = group.reduce((sum, p) => sum + Number(p.net_salary), 0).toFixed(2);

      lines.push([
        this.escapeCsv(fy),
        this.escapeCsv(totalGross),
        this.escapeCsv(totalPF),
        this.escapeCsv(totalTax),
        this.escapeCsv(totalAdv),
        this.escapeCsv(totalNet)
      ].join(','));
    }

    return lines.join('\n');
  }

  async findAllDepartments(): Promise<Department[]> {
    return this.departmentRepository.find({ order: { name: 'ASC' } });
  }

  async createDepartment(name: string): Promise<Department> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('Department name cannot be empty');
    }
    const exists = await this.departmentRepository.findOne({ where: { name: trimmed } });
    if (exists) {
      return exists;
    }
    const dep = this.departmentRepository.create({ name: trimmed });
    return this.departmentRepository.save(dep);
  }

  async findAllDesignations(): Promise<Designation[]> {
    return this.designationRepository.find({ order: { name: 'ASC' } });
  }

  async createDesignation(name: string): Promise<Designation> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConflictException('Designation name cannot be empty');
    }
    const exists = await this.designationRepository.findOne({ where: { name: trimmed } });
    if (exists) {
      return exists;
    }
    const des = this.designationRepository.create({ name: trimmed });
    return this.designationRepository.save(des);
  }

  async removeDepartment(id: number): Promise<void> {
    await this.departmentRepository.delete(id);
  }

  async removeDesignation(id: number): Promise<void> {
    await this.designationRepository.delete(id);
  }
}
