import { IsOptional, IsNumber, IsString, Max, Min, IsIn, IsDateString } from 'class-validator';

export class UpdateAdvanceDto {
  @IsOptional()
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsIn(['one_time', 'installment'])
  recovery_type?: 'one_time' | 'installment';

  @IsOptional()
  @IsNumber()
  @Min(1)
  installment_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  start_month?: number;

  @IsOptional()
  @IsNumber()
  @Min(2000)
  @Max(2100)
  start_year?: number;
}
