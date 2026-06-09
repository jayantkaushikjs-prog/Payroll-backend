import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonPayableDays } from './non-payable-days.entity';
import { CreateNonPayableDaysDto } from './dto/create-non-payable-days.dto';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class NonPayableDaysService {
  constructor(
    @InjectRepository(NonPayableDays)
    private nonPayableDaysRepository: Repository<NonPayableDays>,
    private employeesService: EmployeesService,
  ) {}

  async createOrUpdate(createDto: CreateNonPayableDaysDto): Promise<NonPayableDays> {
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
    await this.nonPayableDaysRepository.delete(id);
  }
}
