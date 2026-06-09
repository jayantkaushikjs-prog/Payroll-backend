import { IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber()
  employee_id: number;

  @IsNotEmpty({ message: 'Basic salary is required' })
  @IsNumber()
  @Min(0)
  basic_salary: number;

  @IsNotEmpty({ message: 'HRA is required' })
  @IsNumber()
  @Min(0)
  hra: number;

  @IsNotEmpty({ message: 'Special allowance is required' })
  @IsNumber()
  @Min(0)
  special_allowance: number;

  @IsNotEmpty({ message: 'Other allowance is required' })
  @IsNumber()
  @Min(0)
  other_allowance: number;

  @IsNotEmpty({ message: 'Effective date is required' })
  @IsDateString({}, { message: 'Effective date must be a valid ISO date string (YYYY-MM-DD)' })
  effective_from: string; // ISO date string YYYY-MM-DD
}
