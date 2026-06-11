import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { EmployeeAdvance } from '../advances/employee-advance.entity';

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
    return this.employeesRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.find({ order: { employee_code: 'ASC' } });
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

    Object.assign(employee, updateEmployeeDto);
    return this.employeesRepository.save(employee);
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

  async getFinancialSummary(employeeId: number, year: number): Promise<any> {
    const employee = await this.findOne(employeeId);

    // Get all disbursed payrolls for the employee in that year
    const payrolls = await this.payrollRepository.find({
      where: { employee_id: employeeId, year, status: 'disbursed' },
    });

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

    if (structure) {
      const monthlyGross = Number(structure.gross_salary);

      // Find which months in the year already have a disbursed payroll
      const paidMonths = payrolls.map(p => p.month);
      const remainingMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => !paidMonths.includes(m));

      for (const m of remainingMonths) {
        // Expected PF
        let pf = 0;
        if (employee.pf_deduction !== false) {
          pf = Math.min(Number(structure.basic_salary) * 0.12, 1800);
        }

        // Expected Tax
        let tax = 0;
        if (employee.tax_deduction !== false) {
          // Simple slab rate emulation or 10% estimation
          tax = monthlyGross > 50000 ? monthlyGross * 0.10 : 0;
        }

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

    return {
      year,
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
    };
  }
}
