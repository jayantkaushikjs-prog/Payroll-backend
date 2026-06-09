import { Employee } from '../employees/employee.entity';
export declare class Payroll {
    id: number;
    employee_id: number;
    employee: Employee;
    month: number;
    year: number;
    gross_salary: number;
    non_payable_deduction: number;
    pf_deduction: number;
    tax_deduction: number;
    advance_recovery: number;
    net_salary: number;
    status: 'draft' | 'completed';
    recoveries_json: {
        advanceId: number;
        amount: number;
    }[];
    generated_at: Date;
    updated_at: Date;
}
