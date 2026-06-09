import { Employee } from '../employees/employee.entity';
export declare class EmployeeAdvance {
    id: number;
    employee_id: number;
    employee: Employee;
    amount: number;
    date: string;
    reason: string;
    recovery_type: 'one_time' | 'installment';
    installment_amount: number;
    total_recovered: number;
    remaining_amount: number;
    start_month: number;
    start_year: number;
    is_fully_recovered: boolean;
    created_at: Date;
}
