export declare class CreateAdvanceDto {
    employee_id: number;
    amount: number;
    date: string;
    reason?: string;
    recovery_type: 'one_time' | 'installment';
    installment_amount?: number;
    start_month: number;
    start_year: number;
}
