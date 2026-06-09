import { NonPayableDaysService } from './non-payable-days.service';
import { CreateNonPayableDaysDto } from './dto/create-non-payable-days.dto';
export declare class NonPayableDaysController {
    private readonly nonPayableDaysService;
    constructor(nonPayableDaysService: NonPayableDaysService);
    createOrUpdate(createDto: CreateNonPayableDaysDto): Promise<import("./non-payable-days.entity").NonPayableDays>;
    findAll(): Promise<import("./non-payable-days.entity").NonPayableDays[]>;
    findByEmployee(employeeId: string): Promise<import("./non-payable-days.entity").NonPayableDays[]>;
    findByMonthAndYear(month: string, year: string): Promise<import("./non-payable-days.entity").NonPayableDays[]>;
    remove(id: string): Promise<void>;
}
