import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructure } from './salary-structure.entity';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { Employee } from '../employees/employee.entity';
import { EmployeesService } from '../employees/employees.service';
import { PFService } from '../pf/pf.service';
import { parseCsvLine } from '../../common/utils/csv.util';
import { calculateSalaryComponentsFromCtc } from './utils/salary-components.util';

@Injectable()
export class SalaryStructuresService {
  constructor(
    @InjectRepository(SalaryStructure)
    private salaryStructuresRepository: Repository<SalaryStructure>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    private employeesService: EmployeesService,
    private pfService: PFService,
  ) {}

  async create(createSalaryStructureDto: CreateSalaryStructureDto): Promise<SalaryStructure> {
    // Verify employee exists
    const employee = await this.employeesService.findOne(createSalaryStructureDto.employee_id);

    const ctc = Number(createSalaryStructureDto.ctc);

    const pfSettings = await this.pfService.findActiveAtDate(createSalaryStructureDto.effective_from);
    const employerContributionRate = employee.pf_deduction !== false
      ? Number(pfSettings.employer_contribution_rate)
      : 0;
    const maxPfCap = Number(pfSettings.max_pf_cap);
    const employeeEsiRate = Number(pfSettings.esi_employee_contribution_rate) / 100;
    const employerEsiRate = Number(pfSettings.esi_contribution_rate) / 100;

    const components = calculateSalaryComponentsFromCtc({
      ctc,
      basicPercent: createSalaryStructureDto.basic_percent || 50,
      hraPercent: createSalaryStructureDto.hra_percent || 40,
      pfDeduction: employee.pf_deduction,
      employerContributionRate,
      maxPfCap,
      employeeEsiRate,
      employerEsiRate,
    });

    // Deactivate existing structures for this employee
    await this.salaryStructuresRepository.update(
      { employee_id: createSalaryStructureDto.employee_id, is_active: true },
      { is_active: false },
    );

    // Create new active structure
    const newStructure = this.salaryStructuresRepository.create({
      employee_id: createSalaryStructureDto.employee_id,
      basic_salary: components.basic_salary,
      hra: components.hra,
      special_allowance: components.special_allowance,
      other_allowance: components.other_allowance,
      gross_salary: components.gross_salary,
      employer_pf: components.employer_pf,
      employer_esi: components.employer_esi,
      ctc,
      effective_from: createSalaryStructureDto.effective_from,
      is_active: true,
    });

    // Save the structure FIRST, then sync monthly_ctc on the employee record.
    // IMPORTANT: Use a direct repository update instead of employeesService.update()
    // to avoid a circular call: update() → syncSalaryStructureFromMonthlyCtc()
    // → which would create yet another salary structure, causing duplicates.
    const saved = await this.salaryStructuresRepository.save(newStructure);

    await this.employeesRepository.update(
      { id: createSalaryStructureDto.employee_id },
      { monthly_ctc: ctc, annual_ctc: ctc * 12 },
    );

    return saved;
  }

  async findActiveByEmployee(employeeId: number): Promise<SalaryStructure> {
    const structure = await this.salaryStructuresRepository.findOne({
      where: { employee_id: employeeId, is_active: true },
      order: { id: 'DESC' },
    });
    if (!structure) {
      throw new NotFoundException(`No active salary structure found for employee ID ${employeeId}`);
    }
    return structure;
  }

  async findHistoryByEmployee(employeeId: number): Promise<SalaryStructure[]> {
    const all = await this.salaryStructuresRepository.find({
      where: { employee_id: employeeId },
      order: { created_at: 'DESC', effective_from: 'DESC' },
    });

    // Defensive dedupe: remove consecutive/identical records that may have
    // been created due to a race or historical bug (same effective_from and ctc)
    const seen = new Set<string>();
    return all.filter((s) => {
      const key = `${s.employee_id}::${s.effective_from}::${Number(s.ctc)}::${Number(s.basic_salary)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async findAllActive(): Promise<SalaryStructure[]> {
    const all = await this.salaryStructuresRepository.find({
      where: { is_active: true },
      relations: ['employee'],
      order: { id: 'DESC' },
    });
    // Deduplicate: return only the latest active structure per employee
    // (handles any pre-existing data inconsistency where an employee has
    // multiple active rows due to the now-fixed circular-save bug)
    const seen = new Set<number>();
    return all.filter((s) => {
      if (!s.employee_id || seen.has(s.employee_id)) return false;
      seen.add(s.employee_id);
      return true;
    });
  }

  async findAll(): Promise<SalaryStructure[]> {
    return this.salaryStructuresRepository.find({
      relations: ['employee'],
      order: { effective_from: 'DESC' },
    });
  }

  async importCsv(csvContent: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV is empty or lacks data rows'] };
    }

    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const errors: string[] = [];
    let importedCount = 0;

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
          else if (header === 'ctc' || header === 'monthly ctc' || header === 'monthly_ctc') {
            data.ctc = val;
            data.is_annual = false;
          } else if (header === 'annual ctc' || header === 'annual_ctc') {
            data.ctc = val;
            data.is_annual = true;
          }
          else if (header === 'effective from' || header === 'effective_from' || header === 'effective date' || header === 'effective_date') data.effective_from = val;
          else if (header === 'basic percent' || header === 'basic_percent') data.basic_percent = val;
          else if (header === 'hra percent' || header === 'hra_percent') data.hra_percent = val;
        });

        if (!data.employee_code || !data.ctc || !data.effective_from) {
          errors.push(`Row ${i + 1}: Missing employee_code, ctc, or effective_from`);
          continue;
        }

        const employee = await this.employeesService.findByCode(data.employee_code);
        if (!employee) {
          errors.push(`Row ${i + 1}: Employee with code "${data.employee_code}" not found`);
          continue;
        }

        let ctcNum = Number(data.ctc);
        if (isNaN(ctcNum) || ctcNum <= 0) {
          errors.push(`Row ${i + 1}: CTC must be a positive number`);
          continue;
        }

        if (data.is_annual) {
          ctcNum = Number((ctcNum / 12).toFixed(2));
        }

        let basicPercent = 50;
        if (data.basic_percent !== undefined && data.basic_percent !== '') {
          const bp = Number(data.basic_percent);
          if (isNaN(bp) || bp <= 0 || bp > 100) {
            errors.push(`Row ${i + 1}: Basic % must be between 1 and 100`);
            continue;
          }
          basicPercent = bp;
        }

        let hraPercent = 40;
        if (data.hra_percent !== undefined && data.hra_percent !== '') {
          const hp = Number(data.hra_percent);
          if (isNaN(hp) || hp <= 0 || hp > 100) {
            errors.push(`Row ${i + 1}: HRA % must be between 1 and 100`);
            continue;
          }
          hraPercent = hp;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.effective_from)) {
          errors.push(`Row ${i + 1}: Effective date must be in YYYY-MM-DD format`);
          continue;
        }

        await this.create({
          employee_id: employee.id,
          ctc: ctcNum,
          basic_percent: basicPercent,
          hra_percent: hraPercent,
          effective_from: data.effective_from,
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || err}`);
      }
    }

    return { imported: importedCount, errors };
  }

}
