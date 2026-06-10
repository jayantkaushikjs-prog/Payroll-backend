import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsNotEmpty({ message: 'Category is required' })
  @IsString()
  category: string; // e.g. 'rent', 'salary', 'utilities', 'marketing', 'one-time', 'other'

  @IsNotEmpty({ message: 'Frequency is required' })
  @IsString()
  frequency: string; // 'monthly', 'one-time'

  @IsNotEmpty({ message: 'Date is required' })
  @IsString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
