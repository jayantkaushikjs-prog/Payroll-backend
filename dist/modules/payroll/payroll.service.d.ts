import { Repository } from 'typeorm';
import { Payroll } from './payroll.entity';
import { EmployeesService } from '../employees/employees.service';
import { SalaryStructuresService } from '../salary-structures/salary-structures.service';
import { NonPayableDaysService } from '../non-payable-days/non-payable-days.service';
import { PFService } from '../pf/pf.service';
import { TaxService } from '../tax/tax.service';
import { AdvancesService } from '../advances/advances.service';
export declare class PayrollService {
    private payrollRepository;
    private employeesService;
    private salaryStructuresService;
    private nonPayableDaysService;
    private pfService;
    private taxService;
    private advancesService;
    constructor(payrollRepository: Repository<Payroll>, employeesService: EmployeesService, salaryStructuresService: SalaryStructuresService, nonPayableDaysService: NonPayableDaysService, pfService: PFService, taxService: TaxService, advancesService: AdvancesService);
    private getFinancialYear;
    calculateSingleEmployee(employeeId: number, month: number, year: number): Promise<{
        employee: import("../employees/employee.entity").Employee;
        grossSalary: number;
        nonPayableDeduction: number;
        pfDeduction: number;
        taxDeduction: number;
        advanceRecovery: number;
        netSalary: number;
        advanceRecoveriesBreakdown: any[];
    }>;
    generatePayroll(month: number, year: number): Promise<Payroll[]>;
    getPayrollForMonthAndYear(month: number, year: number): Promise<Payroll[]>;
    updatePayrollStatus(month: number, year: number, status: 'draft' | 'completed'): Promise<Payroll[]>;
    countTotalPayrollCost(): Promise<number>;
    getCurrentMonthFinanceSummary(month: number, year: number): Promise<{
        payrollTotal: number;
        pendingPayrollCount: number;
        taxDeductions: number;
        pfContributions: number;
        processedCount: number;
    }>;
    getRecentPayrollActivities(limit?: number): Promise<{
        title: string;
        description: string;
        date: Date | string;
    }[]>;
    getSumDeductions(): Promise<{
        pf: number;
        tax: number;
    }>;
    getPayrollTrends(): Promise<any[]>;
    removeDrafts(month: number, year: number): Promise<void>;
}
