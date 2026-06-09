import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructure } from './salary-structure.entity';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class SalaryStructuresService {
  constructor(
    @InjectRepository(SalaryStructure)
    private salaryStructuresRepository: Repository<SalaryStructure>,
    private employeesService: EmployeesService,
  ) {}

  async create(createSalaryStructureDto: CreateSalaryStructureDto): Promise<SalaryStructure> {
    // Verify employee exists
    await this.employeesService.findOne(createSalaryStructureDto.employee_id);

    // Calculate gross salary
    const gross_salary =
      Number(createSalaryStructureDto.basic_salary) +
      Number(createSalaryStructureDto.hra) +
      Number(createSalaryStructureDto.special_allowance) +
      Number(createSalaryStructureDto.other_allowance);

    // Deactivate existing structures for this employee
    await this.salaryStructuresRepository.update(
      { employee_id: createSalaryStructureDto.employee_id, is_active: true },
      { is_active: false },
    );

    // Create new active structure
    const newStructure = this.salaryStructuresRepository.create({
      ...createSalaryStructureDto,
      gross_salary,
      is_active: true,
    });

    return this.salaryStructuresRepository.save(newStructure);
  }

  async findActiveByEmployee(employeeId: number): Promise<SalaryStructure> {
    const structure = await this.salaryStructuresRepository.findOne({
      where: { employee_id: employeeId, is_active: true },
    });
    if (!structure) {
      throw new NotFoundException(`No active salary structure found for employee ID ${employeeId}`);
    }
    return structure;
  }

  async findHistoryByEmployee(employeeId: number): Promise<SalaryStructure[]> {
    return this.salaryStructuresRepository.find({
      where: { employee_id: employeeId },
      order: { effective_from: 'DESC', created_at: 'DESC' },
    });
  }

  async findAllActive(): Promise<SalaryStructure[]> {
    return this.salaryStructuresRepository.find({
      where: { is_active: true },
      relations: ['employee'],
    });
  }
}
