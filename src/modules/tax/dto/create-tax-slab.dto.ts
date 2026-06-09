import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, IsIn } from 'class-validator';

export class CreateTaxSlabDto {
  @IsNotEmpty({ message: 'Financial year is required' })
  @IsString()
  financial_year: string;

  @IsNotEmpty({ message: 'Regime is required' })
  @IsString()
  @IsIn(['old', 'new'], { message: 'Regime must be either old or new' })
  regime: string;

  @IsNotEmpty({ message: 'From amount is required' })
  @IsNumber()
  @Min(0)
  from_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  to_amount?: number;

  @IsNotEmpty({ message: 'Percentage is required' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}
