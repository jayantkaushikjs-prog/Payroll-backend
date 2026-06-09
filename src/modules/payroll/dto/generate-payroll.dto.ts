import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class GeneratePayrollDto {
  @IsNotEmpty({ message: 'Month is required' })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty({ message: 'Year is required' })
  @IsNumber()
  year: number;
}
