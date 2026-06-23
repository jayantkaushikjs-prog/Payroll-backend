import { IsOptional, IsNumber, IsString, IsIn, IsDateString, Min } from 'class-validator';

export class UpdateAdvanceLogDto {
  @IsOptional()
  @IsNumber()
  employee_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsDateString()
  borrowed_date?: string;

  @IsOptional()
  @IsDateString()
  tentative_return_date?: string;

  @IsOptional()
  @IsDateString()
  actual_return_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['open', 'returned', 'partially_returned'])
  status?: 'open' | 'returned' | 'partially_returned';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_returned?: number;
}
