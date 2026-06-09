import { Employee } from '../employees/employee.entity';
export declare class NonPayableDays {
    id: number;
    employee_id: number;
    employee: Employee;
    month: number;
    year: number;
    days: number;
    remarks: string;
    created_at: Date;
}
