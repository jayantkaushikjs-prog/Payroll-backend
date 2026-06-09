import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateNonPayableDaysDto {
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsNumber()
  employee_id: number;

  @IsNotEmpty({ message: 'Month is required' })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty({ message: 'Year is required' })
  @IsNumber()
  year: number;

  @IsNotEmpty({ message: 'Days count is required' })
  @IsNumber()
  @Min(0)
  @Max(31)
  days: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
