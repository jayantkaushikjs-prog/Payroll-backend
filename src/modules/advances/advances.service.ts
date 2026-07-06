import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { EmployeeAdvance } from './employee-advance.entity';
import { AdvanceLog } from './advance-log.entity';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { CreateAdvanceLogDto } from './dto/create-advance-log.dto';
import { UpdateAdvanceLogDto } from './dto/update-advance-log.dto';
import { EmployeesService } from '../employees/employees.service';
import { calculateManualReturnState } from './advance-return.util';

@Injectable()
export class AdvancesService {
  constructor(
    @InjectRepository(EmployeeAdvance)
    private advancesRepository: Repository<EmployeeAdvance>,
    @InjectRepository(AdvanceLog)
    private advanceLogsRepository: Repository<AdvanceLog>,
    @Inject(forwardRef(() => EmployeesService))
    private employeesService: EmployeesService,
  ) {}

  async create(createDto: CreateAdvanceDto): Promise<EmployeeAdvance> {
    await this.employeesService.findOne(createDto.employee_id);

    if (createDto.recovery_type === 'installment' && (!createDto.installment_amount || createDto.installment_amount <= 0)) {
      throw new BadRequestException('Installment amount is required and must be greater than 0 for installment recovery type');
    }

    const { entry_type, ...rest } = createDto;
    const entryLabel = entry_type === 'manual';
    const reasonText = [rest.reason, entryLabel].filter(Boolean).join(' | ');

    const advance = this.advancesRepository.create({
      ...rest,
      entry_type: entry_type || 'manual',
      reason: reasonText || null,
      remaining_amount: createDto.amount,
      total_recovered: 0,
      is_fully_recovered: false,
    });

    const saved = await this.advancesRepository.save(advance);
    await this.advanceLogsRepository.save(this.advanceLogsRepository.create({
      employee_id: saved.employee_id,
      amount: Number(saved.amount),
      borrowed_date: saved.date,
      notes: reasonText || 'Advance issued',
      status: 'open',
      amount_returned: 0,
    }));

    return saved;
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

  async countRaisedThisMonth(month: number, year: number): Promise<number> {
    const result = await this.advancesRepository.createQueryBuilder('adv')
      .select('SUM(adv.amount)', 'total')
      .where('adv.start_month = :month AND adv.start_year = :year', { month, year })
      .getRawOne();
    return Number(result?.total || 0);
  }

  async hasOutstandingAdvances(employeeId: number): Promise<boolean> {
    const pending = await this.advancesRepository.findOne({
      where: { employee_id: employeeId, is_fully_recovered: false },
    });
    return !!pending && Number(pending.remaining_amount) > 0.01;
  }

  async findActive(): Promise<EmployeeAdvance[]> {
    return this.advancesRepository.find({
      where: { is_fully_recovered: false },
    });
  }

  async findByEmployeeAsc(employeeId: number): Promise<EmployeeAdvance[]> {
    return this.advancesRepository.find({
      where: { employee_id: employeeId },
      order: { date: 'ASC' },
    });
  }

  async removeByEmployee(employeeId: number): Promise<void> {
    await this.advancesRepository.delete({ employee_id: employeeId });
  }

  async removeByEmployees(employeeIds: number[]): Promise<void> {
    await this.advancesRepository.delete({ employee_id: In(employeeIds) });
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
    if (updateDto.entry_type !== undefined) adv.entry_type = updateDto.entry_type;

    return this.advancesRepository.save(adv);
  }

  async remove(id: number): Promise<void> {
    await this.advancesRepository.delete(id);
  }

  async manualReturn(advanceId: number, dto: { amount: number; date: string; notes?: string }): Promise<EmployeeAdvance> {
    const advance = await this.advancesRepository.findOne({ where: { id: advanceId } });
    if (!advance) {
      throw new NotFoundException(`Advance ID ${advanceId} not found`);
    }

    const amount = Number(dto.amount || 0);
    if (amount <= 0) {
      throw new BadRequestException('Return amount must be greater than 0');
    }

    const remainingBefore = Number(advance.remaining_amount || 0);
    const state = calculateManualReturnState({
      amount,
      remainingBefore,
      totalRecovered: Number(advance.total_recovered || 0),
      originalAmount: Number(advance.amount),
    });

    advance.total_recovered = state.newRecovered;
    advance.remaining_amount = state.newRemaining;
    advance.is_fully_recovered = state.isFullyRecovered;

    await this.advancesRepository.save(advance);
    await this.advanceLogsRepository.save(this.advanceLogsRepository.create({
      employee_id: advance.employee_id,
      amount: state.returnAmount,
      borrowed_date: dto.date,
      actual_return_date: dto.date,
      notes: dto.notes || 'Manual return recorded',
      status: state.status,
      amount_returned: state.returnAmount,
    }));

    return advance;
  }

  // ─── Advance Logs (Manual Borrow/Return tracking) ───────────────────────────

  async createLog(dto: CreateAdvanceLogDto): Promise<AdvanceLog> {
    await this.employeesService.findOne(dto.employee_id);
    const log = this.advanceLogsRepository.create({
      ...dto,
      status: dto.status || 'open',
      amount_returned: dto.amount_returned || 0,
    });
    return this.advanceLogsRepository.save(log);
  }

  async findAllLogs(): Promise<AdvanceLog[]> {
    return this.advanceLogsRepository.find({
      relations: ['employee'],
      order: { borrowed_date: 'DESC', id: 'DESC' },
    });
  }

  async findLogsByEmployee(employeeId: number): Promise<AdvanceLog[]> {
    return this.advanceLogsRepository.find({
      where: { employee_id: employeeId },
      order: { borrowed_date: 'DESC' },
    });
  }

  async updateLog(id: number, dto: UpdateAdvanceLogDto): Promise<AdvanceLog> {
    const log = await this.advanceLogsRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Advance log ID ${id} not found`);

    if (dto.employee_id !== undefined) {
      await this.employeesService.findOne(dto.employee_id);
      log.employee_id = dto.employee_id;
    }
    if (dto.amount !== undefined) log.amount = dto.amount;
    if (dto.borrowed_date !== undefined) log.borrowed_date = dto.borrowed_date;
    if (dto.tentative_return_date !== undefined) log.tentative_return_date = dto.tentative_return_date || null;
    if (dto.actual_return_date !== undefined) log.actual_return_date = dto.actual_return_date || null;
    if (dto.notes !== undefined) log.notes = dto.notes || null;
    if (dto.status !== undefined) log.status = dto.status;
    if (dto.amount_returned !== undefined) log.amount_returned = dto.amount_returned;

    // Auto-derive status from amount_returned if not explicitly set
    if (dto.amount_returned !== undefined && dto.status === undefined) {
      const returned = Number(dto.amount_returned);
      const total = Number(log.amount);
      if (returned <= 0) log.status = 'open';
      else if (returned >= total) log.status = 'returned';
      else log.status = 'partially_returned';
    }

    return this.advanceLogsRepository.save(log);
  }

  async removeLog(id: number): Promise<void> {
    const log = await this.advanceLogsRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Advance log ID ${id} not found`);
    await this.advanceLogsRepository.delete(id);
  }
}
