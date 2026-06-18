import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonPayableDays } from './non-payable-days.entity';
import { CreateNonPayableDaysDto } from './dto/create-non-payable-days.dto';
import { EmployeesService } from '../employees/employees.service';
import { Payroll } from '../payroll/payroll.entity';
import { parseCsvLine } from '../../common/utils/csv.util';

@Injectable()
export class NonPayableDaysService {
  constructor(
    @InjectRepository(NonPayableDays)
    private nonPayableDaysRepository: Repository<NonPayableDays>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    private employeesService: EmployeesService,
  ) {}

  async checkDisbursed(month: number, year: number) {
    const isDisbursed = await this.payrollRepository.findOne({
      where: { month, year, status: 'disbursed' },
    });
    if (isDisbursed) {
      throw new BadRequestException(`Cannot modify non-payable days: Payroll for ${month}/${year} has already been disbursed.`);
    }
  }

  async createOrUpdate(createDto: CreateNonPayableDaysDto): Promise<NonPayableDays> {
    await this.checkDisbursed(createDto.month, createDto.year);
    await this.employeesService.findOne(createDto.employee_id);

    let record = await this.nonPayableDaysRepository.findOne({
      where: {
        employee_id: createDto.employee_id,
        month: createDto.month,
        year: createDto.year,
      },
    });

    if (record) {
      record.days = createDto.days;
      record.remarks = createDto.remarks;
    } else {
      record = this.nonPayableDaysRepository.create(createDto);
    }

    return this.nonPayableDaysRepository.save(record);
  }

  async findByEmployee(employeeId: number): Promise<NonPayableDays[]> {
    return this.nonPayableDaysRepository.find({
      where: { employee_id: employeeId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async findByEmployeeMonthAndYear(employeeId: number, month: number, year: number): Promise<NonPayableDays | null> {
    return this.nonPayableDaysRepository.findOne({
      where: { employee_id: employeeId, month, year },
    });
  }

  async findByMonthAndYear(month: number, year: number): Promise<NonPayableDays[]> {
    return this.nonPayableDaysRepository.find({
      where: { month, year },
      relations: ['employee'],
      order: { employee_id: 'ASC' },
    });
  }

  async findAll(): Promise<NonPayableDays[]> {
    return this.nonPayableDaysRepository.find({
      relations: ['employee'],
      order: { year: 'DESC', month: 'DESC', employee_id: 'ASC' },
    });
  }

  async getMonthSummary(month: number, year: number): Promise<{ employeesAffected: number; totalDays: number }> {
    const result = await this.nonPayableDaysRepository
      .createQueryBuilder('npd')
      .select('COUNT(DISTINCT npd.employee_id)', 'employeesAffected')
      .addSelect('SUM(npd.days)', 'totalDays')
      .where('npd.month = :month AND npd.year = :year', { month, year })
      .getRawOne();

    return {
      employeesAffected: Number(result?.employeesAffected || 0),
      totalDays: Number(result?.totalDays || 0),
    };
  }

  async remove(id: number): Promise<void> {
    const record = await this.nonPayableDaysRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Non-payable days record ID ${id} not found`);
    }
    await this.checkDisbursed(record.month, record.year);
    await this.nonPayableDaysRepository.delete(id);
  }

  async importCsv(csvContent: string): Promise<{ imported: number; errors: string[] }> {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or missing header');
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
        headers.forEach((header, idx) => {
          const val = values[idx]?.trim();
          if (header === 'employee code' || header === 'employee_code') data.employee_code = val;
          else if (header === 'month') data.month = parseInt(val, 10);
          else if (header === 'year') data.year = parseInt(val, 10);
          else if (header === 'days') data.days = parseFloat(val);
          else if (header === 'remarks' || header === 'remark') data.remarks = val;
        });

        if (!data.employee_code || isNaN(data.month) || isNaN(data.year) || isNaN(data.days)) {
          errors.push(`Row ${i + 1}: Missing or invalid Employee Code, Month, Year, or Days`);
          continue;
        }

        // Check if payroll is disbursed for this month/year
        const isDisbursed = await this.payrollRepository.findOne({
          where: { month: data.month, year: data.year, status: 'disbursed' }
        });
        if (isDisbursed) {
          errors.push(`Row ${i + 1}: Payroll for ${data.month}/${data.year} is already disbursed`);
          continue;
        }

        // Find employee by code
        const emp = await this.employeesService.findByCode(data.employee_code);
        if (!emp) {
          errors.push(`Row ${i + 1}: Employee code ${data.employee_code} not found`);
          continue;
        }

        await this.createOrUpdate({
          employee_id: emp.id,
          month: data.month,
          year: data.year,
          days: data.days,
          remarks: data.remarks || '',
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || err}`);
      }
    }

    return { imported: importedCount, errors };
  }

}
