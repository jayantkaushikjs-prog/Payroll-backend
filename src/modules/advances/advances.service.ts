import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeAdvance } from './employee-advance.entity';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class AdvancesService {
  constructor(
    @InjectRepository(EmployeeAdvance)
    private advancesRepository: Repository<EmployeeAdvance>,
    private employeesService: EmployeesService,
  ) {}

  async create(createDto: CreateAdvanceDto): Promise<EmployeeAdvance> {
    await this.employeesService.findOne(createDto.employee_id);

    if (createDto.recovery_type === 'installment' && (!createDto.installment_amount || createDto.installment_amount <= 0)) {
      throw new BadRequestException('Installment amount is required and must be greater than 0 for installment recovery type');
    }

    const advance = this.advancesRepository.create({
      ...createDto,
      remaining_amount: createDto.amount,
      total_recovered: 0,
      is_fully_recovered: false,
    });

    return this.advancesRepository.save(advance);
  }

  async findAll(): Promise<EmployeeAdvance[]> {
    return this.advancesRepository.find({
      relations: ['employee'],
      order: { date: 'DESC' },
    });
  }

  async findByEmployee(employeeId: number): Promise<EmployeeAdvance[]> {
    return this.advancesRepository.find({
      where: { employee_id: employeeId },
      order: { date: 'DESC' },
    });
  }

  async findActiveForEmployeeAtDate(employeeId: number, month: number, year: number): Promise<EmployeeAdvance[]> {
    // Find advances that are not fully recovered and have start date <= target month/year
    const advances = await this.advancesRepository.find({
      where: {
        employee_id: employeeId,
        is_fully_recovered: false,
      },
      order: { date: 'ASC' },
    });

    // Filter programmatically by start_year and start_month
    return advances.filter(adv => {
      if (adv.start_year < year) return true;
      if (adv.start_year === year && adv.start_month <= month) return true;
      return false;
    });
  }

  async recordRecovery(advanceId: number, recoveredAmount: number): Promise<EmployeeAdvance> {
    const adv = await this.advancesRepository.findOne({ where: { id: advanceId } });
    if (!adv) {
      throw new NotFoundException(`Advance ID ${advanceId} not found`);
    }

    const totalRecovered = Number(adv.total_recovered) + Number(recoveredAmount);
    const remaining = Math.max(0, Number(adv.amount) - totalRecovered);

    adv.total_recovered = totalRecovered;
    adv.remaining_amount = remaining;
    adv.is_fully_recovered = remaining <= 0.01; // Avoid floating point issues

    return this.advancesRepository.save(adv);
  }

  async revertRecovery(advanceId: number, recoveredAmount: number): Promise<EmployeeAdvance | null> {
    const adv = await this.advancesRepository.findOne({ where: { id: advanceId } });
    if (!adv) {
      return null; // Gracefully handle if advance was manually deleted in the meantime
    }

    const totalRecovered = Math.max(0, Number(adv.total_recovered) - Number(recoveredAmount));
    const remaining = Math.min(Number(adv.amount), Number(adv.amount) - totalRecovered);

    adv.total_recovered = totalRecovered;
    adv.remaining_amount = remaining;
    adv.is_fully_recovered = remaining <= 0.01; // Should set to false if remaining is positive

    return this.advancesRepository.save(adv);
  }

  async countTotalOutstanding(): Promise<number> {
    const result = await this.advancesRepository.createQueryBuilder('adv')
      .select('SUM(adv.remaining_amount)', 'total')
      .where('adv.is_fully_recovered = :status', { status: false })
      .getRawOne();
    return Number(result?.total || 0);
  }

  async update(id: number, updateDto: Partial<CreateAdvanceDto>): Promise<EmployeeAdvance> {
    const adv = await this.advancesRepository.findOne({ where: { id } });
    if (!adv) {
      throw new NotFoundException(`Advance ID ${id} not found`);
    }

    const recoveryType = updateDto.recovery_type !== undefined ? updateDto.recovery_type : adv.recovery_type;
    const installmentAmount = updateDto.installment_amount !== undefined ? updateDto.installment_amount : adv.installment_amount;

    if (recoveryType === 'installment' && (!installmentAmount || installmentAmount <= 0)) {
      throw new BadRequestException('Installment amount is required and must be greater than 0 for installment recovery type');
    }

    if (updateDto.amount !== undefined) {
      const newAmount = Number(updateDto.amount);
      if (newAmount < Number(adv.total_recovered)) {
        throw new BadRequestException(`Advance amount cannot be less than the already recovered amount of ${adv.total_recovered}`);
      }
      adv.amount = newAmount;
      adv.remaining_amount = Number((newAmount - Number(adv.total_recovered)).toFixed(2));
      adv.is_fully_recovered = adv.remaining_amount <= 0.01;
    }

    if (updateDto.employee_id !== undefined) {
      await this.employeesService.findOne(updateDto.employee_id);
      adv.employee_id = updateDto.employee_id;
    }

    if (updateDto.date !== undefined) adv.date = updateDto.date;
    if (updateDto.reason !== undefined) adv.reason = updateDto.reason;
    if (updateDto.recovery_type !== undefined) adv.recovery_type = updateDto.recovery_type;
    if (updateDto.installment_amount !== undefined) {
      adv.installment_amount = updateDto.recovery_type === 'one_time' ? null : Number(installmentAmount);
    }
    if (updateDto.start_month !== undefined) adv.start_month = updateDto.start_month;
    if (updateDto.start_year !== undefined) adv.start_year = updateDto.start_year;
    if (updateDto.is_advance_salary !== undefined) adv.is_advance_salary = updateDto.is_advance_salary;

    return this.advancesRepository.save(adv);
  }

  async remove(id: number): Promise<void> {
    await this.advancesRepository.delete(id);
  }
}
