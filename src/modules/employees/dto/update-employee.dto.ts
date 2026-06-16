import {
  IsOptional,
  IsEmail,
  IsBoolean,
  IsString,
  IsDateString,
  IsIn,
  Matches,
  Length,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

const DEPARTMENTS = [
  'Human Resources (HR)',
  'Finance & Accounts',
  'Information Technology (IT)',
  'Operations',
  'Sales',
  'Marketing',
  'Customer Support',
  'Administration',
  'Legal',
  'Procurement',
];

const DESIGNATIONS = [
  'Intern',
  'Trainee',
  'Associate',
  'Executive',
  'Senior Executive',
  'Team Lead',
  'Assistant Manager',
  'Manager',
  'Senior Manager',
  'Director',
];

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(3, 20, { message: 'Employee code must be between 3 and 20 characters' })
  employee_code?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^\d{10}$/, { message: 'Phone number must be numeric and exactly 10 digits' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  department?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  designation?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Joining date must be a valid ISO date string (YYYY-MM-DD)' })
  joining_date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(2, 100, { message: 'Bank name must be between 2 and 100 characters' })
  bank_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^\d{9,18}$/, { message: 'Account number must be numeric and between 9 and 18 digits' })
  account_number?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format (e.g. CHAS0001234)' })
  ifsc?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsIn(['old', 'new'], { message: 'Tax regime must be either old or new' })
  tax_regime?: string;

  @IsOptional()
  @IsBoolean()
  active_status?: boolean;

  @IsOptional()
  @IsBoolean()
  pf_deduction?: boolean;

  @IsOptional()
  @IsBoolean()
  tax_deduction?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Monthly CTC must be a number' })
  monthly_ctc?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Annual CTC must be a number' })
  annual_ctc?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Relieving date must be a valid ISO date string (YYYY-MM-DD)' })
  relieving_date?: string;

  @IsOptional()
  @IsString()
  other_inputs?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Number of days present must be a number' })
  no_of_days_present?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Deduction (Absent) must be a number' })
  deduction_absent?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Appraisal must be a number' })
  appraisal?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Appraisal effective date must be a valid ISO date string (YYYY-MM-DD)' })
  appraisal_effective_date?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Leave Encashment must be a number' })
  leave_encashment?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Late Arrival Deduction must be a number' })
  late_arrival_deduction?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Damages Recovery must be a number' })
  damages_recovery?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Bonus / Incentives must be a number' })
  bonus_incentives?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Other Deductions must be a number' })
  other_deductions?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
