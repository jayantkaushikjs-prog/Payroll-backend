import { Repository } from 'typeorm';
import { SalaryStructure } from './salary-structure.entity';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { EmployeesService } from '../employees/employees.service';
export declare class SalaryStructuresService {
    private salaryStructuresRepository;
    private employeesService;
    constructor(salaryStructuresRepository: Repository<SalaryStructure>, employeesService: EmployeesService);
    create(createSalaryStructureDto: CreateSalaryStructureDto): Promise<SalaryStructure>;
    findActiveByEmployee(employeeId: number): Promise<SalaryStructure>;
    findHistoryByEmployee(employeeId: number): Promise<SalaryStructure[]>;
    findAllActive(): Promise<SalaryStructure[]>;
}
