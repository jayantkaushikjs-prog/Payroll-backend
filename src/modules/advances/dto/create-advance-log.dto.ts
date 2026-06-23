import { IsNumber, IsString, IsOptional, IsDateString, IsIn, Min } from 'class-validator';

export class CreateAdvanceLogDto {
  @IsNumber()
  employee_id: number;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsDateString()
  borrowed_date: string;

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
