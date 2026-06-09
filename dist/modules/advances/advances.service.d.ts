import { Repository } from 'typeorm';
import { EmployeeAdvance } from './employee-advance.entity';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { EmployeesService } from '../employees/employees.service';
export declare class AdvancesService {
    private advancesRepository;
    private employeesService;
    constructor(advancesRepository: Repository<EmployeeAdvance>, employeesService: EmployeesService);
    create(createDto: CreateAdvanceDto): Promise<EmployeeAdvance>;
    findAll(): Promise<EmployeeAdvance[]>;
    findByEmployee(employeeId: number): Promise<EmployeeAdvance[]>;
    findActiveForEmployeeAtDate(employeeId: number, month: number, year: number): Promise<EmployeeAdvance[]>;
    recordRecovery(advanceId: number, recoveredAmount: number): Promise<EmployeeAdvance>;
    revertRecovery(advanceId: number, recoveredAmount: number): Promise<EmployeeAdvance | null>;
    countTotalOutstanding(): Promise<number>;
    remove(id: number): Promise<void>;
}
