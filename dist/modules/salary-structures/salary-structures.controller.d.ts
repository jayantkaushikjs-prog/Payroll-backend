import { SalaryStructuresService } from './salary-structures.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
export declare class SalaryStructuresController {
    private readonly salaryStructuresService;
    constructor(salaryStructuresService: SalaryStructuresService);
    create(createSalaryStructureDto: CreateSalaryStructureDto): Promise<import("./salary-structure.entity").SalaryStructure>;
    findAllActive(): Promise<import("./salary-structure.entity").SalaryStructure[]>;
    findActiveByEmployee(employeeId: string): Promise<import("./salary-structure.entity").SalaryStructure>;
    findHistoryByEmployee(employeeId: string): Promise<import("./salary-structure.entity").SalaryStructure[]>;
}
