import { Repository } from 'typeorm';
import { NonPayableDays } from './non-payable-days.entity';
import { CreateNonPayableDaysDto } from './dto/create-non-payable-days.dto';
import { EmployeesService } from '../employees/employees.service';
export declare class NonPayableDaysService {
    private nonPayableDaysRepository;
    private employeesService;
    constructor(nonPayableDaysRepository: Repository<NonPayableDays>, employeesService: EmployeesService);
    createOrUpdate(createDto: CreateNonPayableDaysDto): Promise<NonPayableDays>;
    findByEmployee(employeeId: number): Promise<NonPayableDays[]>;
    findByEmployeeMonthAndYear(employeeId: number, month: number, year: number): Promise<NonPayableDays | null>;
    findByMonthAndYear(month: number, year: number): Promise<NonPayableDays[]>;
    findAll(): Promise<NonPayableDays[]>;
    getMonthSummary(month: number, year: number): Promise<{
        employeesAffected: number;
        totalDays: number;
    }>;
    remove(id: number): Promise<void>;
}
