import { IsNotEmpty, IsNumber, IsDateString, Min, IsOptional } from 'class-validator';

export class CreateSalaryStructureDto {
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber()
  employee_id: number;

  @IsNotEmpty({ message: 'CTC is required' })
  @IsNumber()
  @Min(0)
  ctc: number;

  @IsOptional()
  @IsNumber()
  basic_percent?: number;

  @IsOptional()
  @IsNumber()
  hra_percent?: number;

  @IsNotEmpty({ message: 'Effective date is required' })
  @IsDateString({}, { message: 'Effective date must be a valid ISO date string (YYYY-MM-DD)' })
  effective_from: string; // ISO date string YYYY-MM-DD
}
