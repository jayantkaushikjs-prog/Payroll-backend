import { Employee } from '../employees/employee.entity';
export declare class SalaryStructure {
    id: number;
    employee_id: number;
    employee: Employee;
    basic_salary: number;
    hra: number;
    special_allowance: number;
    other_allowance: number;
    gross_salary: number;
    is_active: boolean;
    effective_from: string;
    created_at: Date;
}
