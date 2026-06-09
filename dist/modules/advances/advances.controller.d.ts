import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
export declare class AdvancesController {
    private readonly advancesService;
    constructor(advancesService: AdvancesService);
    create(createDto: CreateAdvanceDto): Promise<import("./employee-advance.entity").EmployeeAdvance>;
    findAll(): Promise<import("./employee-advance.entity").EmployeeAdvance[]>;
    findByEmployee(employeeId: string): Promise<import("./employee-advance.entity").EmployeeAdvance[]>;
    remove(id: string): Promise<void>;
}
