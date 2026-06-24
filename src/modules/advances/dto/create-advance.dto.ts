import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, IsIn, IsDateString, IsBoolean } from 'class-validator';

export class CreateAdvanceDto {
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber()
  employee_id: number;

  @IsNotEmpty({ message: 'Advance amount is required' })
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty({ message: 'Advance date is required' })
  @IsDateString({}, { message: 'Advance date must be a valid ISO date string (YYYY-MM-DD)' })
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsNotEmpty({ message: 'Recovery type is required' })
  @IsIn(['one_time', 'installment'], { message: 'Recovery type must be either one_time or installment' })
  recovery_type: 'one_time' | 'installment';

  @IsOptional()
  @IsNumber()
  @Min(1)
  installment_amount?: number;

  @IsNotEmpty({ message: 'Start month is required' })
  @IsNumber()
  @Min(1)
  @Max(12)
  start_month: number;

  @IsNotEmpty({ message: 'Start year is required' })
  @IsNumber()
  @Min(2000, { message: 'Start year must be at least 2000' })
  @Max(2100, { message: 'Start year cannot exceed 2100' })
  start_year: number;

  @IsOptional()
  @IsBoolean()
  is_advance_salary?: boolean;

  @IsOptional()
  @IsIn(['manual', 'payroll'], { message: 'Entry type must be either manual or payroll' })
  entry_type?: 'manual' | 'payroll';
}
