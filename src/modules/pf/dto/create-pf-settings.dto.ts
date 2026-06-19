import { IsNotEmpty, IsNumber, IsDateString, Max, Min, IsOptional } from 'class-validator';

export class CreatePFSettingsDto {
  @IsNotEmpty({ message: 'Employee contribution rate is required' })
  @IsNumber()
  @Min(0)
  @Max(100)
  employee_contribution_rate: number;

  @IsNotEmpty({ message: 'Employer contribution rate is required' })
  @IsNumber()
  @Min(0)
  @Max(100)
  employer_contribution_rate: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  max_pf_cap?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  esi_contribution_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  esi_employee_contribution_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  professional_tax?: number;

  @IsNotEmpty({ message: 'Effective date is required' })
  @IsDateString({}, { message: 'Effective date must be a valid ISO date string (YYYY-MM-DD)' })
  effective_date: string; // YYYY-MM-DD
}
