import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, LessThanOrEqual } from 'typeorm';
import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { EmployeeAdvance } from '../advances/employee-advance.entity';
import { PFSettings } from '../pf/pf-settings.entity';
import { calculateAnnualTax } from '../../utils/tax-calculator.util';

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

    const employee = this.employeesRepository.create(createEmployeeDto);
    const saved = await this.employeesRepository.save(employee);
    await this.syncSalaryStructureFromMonthlyCtc(saved, createEmployeeDto.monthly_ctc, saved.joining_date);
    return saved;
  }

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.find({ order: { id: 'DESC' } });
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

    const currentMonthlyCtc = Number(employee.monthly_ctc || 0);
    const nextMonthlyCtc = updateEmployeeDto.monthly_ctc !== undefined ? Number(updateEmployeeDto.monthly_ctc) : currentMonthlyCtc;
    const shouldSyncSalary =
      updateEmployeeDto.monthly_ctc !== undefined ||
      (updateEmployeeDto.pf_deduction !== undefined && nextMonthlyCtc > 0);

    Object.assign(employee, updateEmployeeDto);
    const saved = await this.employeesRepository.save(employee);

    if (shouldSyncSalary) {
      await this.syncSalaryStructureFromMonthlyCtc(saved, nextMonthlyCtc);
    }

    return saved;
  }

  private async syncSalaryStructureFromMonthlyCtc(
    employee: Employee,
    monthlyCtcValue?: number,
    preferredEffectiveFrom?: string,
  ): Promise<void> {
    const ctc = Number(monthlyCtcValue || 0);
    if (!ctc || isNaN(ctc) || ctc <= 0) {
      return;
    }

    const activeStructure = await this.salaryStructureRepository.findOne({
      where: { employee_id: employee.id, is_active: true },
    });

    if (activeStructure && Number(activeStructure.ctc) === ctc && preferredEffectiveFrom === undefined) {
      return;
    }

    const basicRatio = activeStructure && Number(activeStructure.gross_salary) > 0
      ? Number(activeStructure.basic_salary) / Number(activeStructure.gross_salary)
      : 0.5;
    const hraRatio = activeStructure && Number(activeStructure.basic_salary) > 0
      ? Number(activeStructure.hra) / Number(activeStructure.basic_salary)
      : 0.4;

    const effectiveFrom = preferredEffectiveFrom || new Date().toISOString().split('T')[0];
    let grossSalary = ctc;

    if (employee.pf_deduction !== false) {
      const pfSettings = await this.pfSettingsRepository.findOne({
        where: { effective_date: LessThanOrEqual(effectiveFrom) },
        order: { effective_date: 'DESC' },
      });
      const employerContributionRate = Number(pfSettings?.employer_contribution_rate ?? 12) / 100;
      const maxPfCap = Number(pfSettings?.max_pf_cap ?? 1800);
      const grossSalaryUncapped = ctc / (1 + employerContributionRate);

      if (grossSalaryUncapped * employerContributionRate > maxPfCap) {
        grossSalary = ctc - maxPfCap;
      } else {
        grossSalary = grossSalaryUncapped;
      }
    }

    grossSalary = Number(grossSalary.toFixed(2));
    const basicSalary = Number((basicRatio * grossSalary).toFixed(2));
    const hra = Number((hraRatio * basicSalary).toFixed(2));
    const specialAllowance = 0;
    const otherAllowance = Number((grossSalary - basicSalary - hra).toFixed(2));

    await this.salaryStructureRepository.update(
      { employee_id: employee.id, is_active: true },
      { is_active: false },
    );

    await this.salaryStructureRepository.save(this.salaryStructureRepository.create({
      employee_id: employee.id,
      basic_salary: basicSalary,
      hra,
      special_allowance: specialAllowance,
      other_allowance: otherAllowance,
      gross_salary: grossSalary,
      ctc,
      effective_from: effectiveFrom,
      is_active: true,
    }));
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeesRepository.remove(employee);
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

  private escapeCsv(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
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
      emp.active_status ? 'Active' : 'Inactive',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async importCsv(csvContent: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV is empty or lacks data rows'] };
    }

    const headers = this.parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const errors: string[] = [];
    let importedCount = 0;

    const csvEmployeeCodes = new Set<string>();
    const csvEmails = new Set<string>();
    const csvPhones = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i]);
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
          else if (header === 'phone') data.phone = val;
          else if (header === 'department') data.department = val;
          else if (header === 'designation') data.designation = val;
          else if (header === 'joining date' || header === 'joining_date') data.joining_date = val;
          else if (header === 'bank name' || header === 'bank_name') data.bank_name = val;
          else if (header === 'account number' || header === 'account_number') data.account_number = val;
          else if (header === 'ifsc') data.ifsc = val;
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

        if (!data.employee_code || !data.name || !data.email) {
          errors.push(`Row ${i + 1}: Missing employee_code, name, or email`);
          continue;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          errors.push(`Row ${i + 1}: Invalid email format "${data.email}"`);
          continue;
        }

        if (csvEmployeeCodes.has(data.employee_code)) {
          errors.push(`Row ${i + 1}: Duplicate Employee Code "${data.employee_code}" in CSV`);
          continue;
        }
        if (csvEmails.has(data.email.toLowerCase())) {
          errors.push(`Row ${i + 1}: Duplicate Email "${data.email}" in CSV`);
          continue;
        }
        if (data.phone && csvPhones.has(data.phone)) {
          errors.push(`Row ${i + 1}: Duplicate Phone "${data.phone}" in CSV`);
          continue;
        }

        csvEmployeeCodes.add(data.employee_code);
        csvEmails.add(data.email.toLowerCase());
        if (data.phone) csvPhones.add(data.phone);

        const existingCode = await this.employeesRepository.findOne({ where: { employee_code: data.employee_code } });
        
        const existingEmail = await this.employeesRepository.findOne({ where: { email: data.email } });
        if (existingEmail && (!existingCode || existingEmail.id !== existingCode.id)) {
          errors.push(`Row ${i + 1}: Email "${data.email}" is already taken by another employee`);
          continue;
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

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
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
      endDate = new Date(endDateStr);
    } else {
      const yr = year ? parseInt(year, 10) : new Date().getFullYear();
      startDate = new Date(yr, 3, 1); // April 1st of year
      endDate = new Date(yr + 1, 2, 31); // March 31st of year + 1
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

    const amountPaid = payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0);
    const pfDeducted = payrolls.reduce((sum, p) => sum + Number(p.pf_deduction), 0);
    const taxDeducted = payrolls.reduce((sum, p) => sum + Number(p.tax_deduction), 0);
    const advanceRecovered = payrolls.reduce((sum, p) => sum + Number(p.advance_recovery), 0);

    // Get salary structure to calculate remaining/to-be-paid months
    const structure = await this.salaryStructureRepository.findOne({
      where: { employee_id: employeeId },
    });

    let amountToBePaid = 0;
    let expectedPFRemaining = 0;
    let expectedTaxRemaining = 0;
    let remainingMonthsCount = 0;

    if (structure) {
      const monthlyGross = Number(structure.gross_salary);

      // Remaining months in the selection range that do not have disbursed payrolls
      const remainingMonths = targetMonths.filter(tm =>
        !payrolls.some(p => p.year === tm.year && p.month === tm.month)
      );
      remainingMonthsCount = remainingMonths.length;

      // Fetch dynamic PFSettings based on current date
      const pfSettings = await this.pfSettingsRepository.findOne({
        where: {
          effective_date: LessThanOrEqual(new Date().toISOString().split('T')[0]),
        },
        order: { effective_date: 'DESC' },
      });
      const pfRate = pfSettings ? Number(pfSettings.employee_contribution_rate) / 100 : 0.12;
      const maxPfCap = pfSettings ? Number(pfSettings.max_pf_cap) : 1800;

      // Use the start date's year to define the target FY for tax calculations
      const fyYear = startDate.getMonth() >= 3 ? startDate.getFullYear() : startDate.getFullYear() - 1;
      const targetFY = `${fyYear}-${fyYear + 1}`;

      // 1. Calculate projected annual gross: YTD Gross (excluding non_payable_deductions) + expected remaining months gross
      const grossPaidYTD = payrolls.reduce((sum, p) => sum + (Number(p.gross_salary) - Number(p.non_payable_deduction)), 0);
      const projectedAnnualGross = grossPaidYTD + (monthlyGross * remainingMonths.length);

      // 2. Calculate total expected annual tax
      let totalAnnualTax = 0;
      if (employee.tax_deduction !== false) {
        const taxRegime = employee.tax_regime || 'new';
        totalAnnualTax = calculateAnnualTax(projectedAnnualGross, taxRegime, undefined, targetFY);
      }

      // 3. Calculate remaining annual tax and distribute to remaining months
      const remainingAnnualTax = Math.max(0, totalAnnualTax - taxDeducted);
      const monthlyTdsRemaining = remainingMonthsCount > 0 ? Number((remainingAnnualTax / remainingMonthsCount).toFixed(2)) : 0;

      for (const m of remainingMonths) {
        // Expected PF
        let pf = 0;
        if (employee.pf_deduction !== false) {
          pf = Math.min(Number(structure.gross_salary) * pfRate, maxPfCap);
        }

        // Expected Tax (TDS)
        const tax = employee.tax_deduction !== false ? monthlyTdsRemaining : 0;

        const net = monthlyGross - pf - tax;
        amountToBePaid += net;
        expectedPFRemaining += pf;
        expectedTaxRemaining += tax;
      }
    }

    // Get all advances
    const advances = await this.advanceRepository.find({
      where: { employee_id: employeeId },
    });

    const totalAdvancesTaken = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalAdvancesRepaid = advances.reduce((sum, a) => sum + Number(a.total_recovered), 0);
    const remainingAdvanceBalance = totalAdvancesTaken - totalAdvancesRepaid;

    const paidMonthsCount = payrolls.length;

    return {
      year: year ? parseInt(year, 10) : startDate.getFullYear(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      amountPaid,
      amountToBePaid,
      pfDeducted,
      expectedPFRemaining,
      taxDeducted,
      expectedTaxRemaining,
      advanceRecovered,
      totalAdvancesTaken,
      totalAdvancesRepaid,
      remainingAdvanceBalance,
      paidMonthsCount,
      remainingMonthsCount,
      structure: structure ? {
        ctc: Number(structure.ctc),
        gross_salary: Number(structure.gross_salary),
        basic_salary: Number(structure.basic_salary),
        hra: Number(structure.hra),
        special_allowance: Number(structure.special_allowance),
        other_allowance: Number(structure.other_allowance),
      } : null,
    };
  }

  async generateFinancialsCsv(employeeId: number, startYear: number, endYear: number): Promise<string> {
    const employee = await this.findOne(employeeId);
    
    // Fetch all payrolls for this employee in the desired tenure
    const payrolls = await this.payrollRepository.find({
      where: { employee_id: employeeId },
      order: { year: 'ASC', month: 'ASC' },
    });

    // Filter by year range
    const filteredPayrolls = payrolls.filter(p => p.year >= startYear && p.year <= endYear);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const lines: string[] = [];
    lines.push(`Financial Report for Employee: ${employee.employee_code} - ${employee.name}`);
    lines.push(`Tenure: ${startYear} to ${endYear}`);
    lines.push('');
    lines.push('MONTHLY PAYROLL RECORDS');
    lines.push([
      'Month',
      'Year',
      'Gross Salary',
      'Non-Payable Deduction',
      'PF Deduction',
      'Tax Deduction',
      'Advance Recovery',
      'Net Salary',
      'Status'
    ].join(','));

    for (const p of filteredPayrolls) {
      lines.push([
        monthNames[p.month - 1],
        p.year,
        p.gross_salary,
        p.non_payable_deduction,
        p.pf_deduction,
        p.tax_deduction,
        p.advance_recovery,
        p.net_salary,
        p.status
      ].join(','));
    }

    lines.push('');
    lines.push('ANNUAL FINANCIAL SUMMARIES');
    lines.push([
      'Financial Year',
      'Total Gross Salary',
      'Total Non-Payable Deduction',
      'Total PF Deducted',
      'Total Tax Deducted',
      'Total Advance Recovered',
      'Total Net Salary Paid'
    ].join(','));

    // Group by financial year
    const fyGroups: Record<string, typeof filteredPayrolls> = {};
    for (const p of filteredPayrolls) {
      const fy = p.month >= 4 ? `${p.year}-${p.year + 1}` : `${p.year - 1}-${p.year}`;
      if (!fyGroups[fy]) {
        fyGroups[fy] = [];
      }
      fyGroups[fy].push(p);
    }

    for (const fy of Object.keys(fyGroups).sort()) {
      const group = fyGroups[fy];
      const totalGross = group.reduce((sum, p) => sum + Number(p.gross_salary), 0).toFixed(2);
      const totalNpd = group.reduce((sum, p) => sum + Number(p.non_payable_deduction), 0).toFixed(2);
      const totalPF = group.reduce((sum, p) => sum + Number(p.pf_deduction), 0).toFixed(2);
      const totalTax = group.reduce((sum, p) => sum + Number(p.tax_deduction), 0).toFixed(2);
      const totalAdv = group.reduce((sum, p) => sum + Number(p.advance_recovery), 0).toFixed(2);
      const totalNet = group.reduce((sum, p) => sum + Number(p.net_salary), 0).toFixed(2);

      lines.push([
        fy,
        totalGross,
        totalNpd,
        totalPF,
        totalTax,
        totalAdv,
        totalNet
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
