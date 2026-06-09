import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { UpdatePayrollStatusDto } from './dto/update-payroll-status.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    generate(generateDto: GeneratePayrollDto): Promise<import("./payroll.entity").Payroll[]>;
    findByMonthAndYear(month: string, year: string): Promise<import("./payroll.entity").Payroll[]>;
    updateStatus(month: string, year: string, statusDto: UpdatePayrollStatusDto): Promise<import("./payroll.entity").Payroll[]>;
    removeDrafts(month: string, year: string): Promise<void>;
}
