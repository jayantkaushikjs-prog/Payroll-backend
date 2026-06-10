import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
  Matches,
  Length,
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

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'Employee code is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(3, 20, { message: 'Employee code must be between 3 and 20 characters' })
  employee_code: string;

  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^\d{10}$/, { message: 'Phone number must be numeric and exactly 10 digits' })
  phone?: string;

  @IsNotEmpty({ message: 'Department is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsIn(DEPARTMENTS, { message: 'Invalid department option selected' })
  department: string;

  @IsNotEmpty({ message: 'Designation is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsIn(DESIGNATIONS, { message: 'Invalid designation option selected' })
  designation: string;

  @IsNotEmpty({ message: 'Joining date is required' })
  @IsDateString({}, { message: 'Joining date must be a valid ISO date string (YYYY-MM-DD)' })
  joining_date: string;

  @IsNotEmpty({ message: 'Bank name is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Length(2, 100, { message: 'Bank name must be between 2 and 100 characters' })
  bank_name: string;

  @IsNotEmpty({ message: 'Account number is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(/^\d{9,18}$/, { message: 'Account number must be numeric and between 9 and 18 digits' })
  account_number: string;

  @IsNotEmpty({ message: 'IFSC code is required' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format (e.g. CHAS0001234)' })
  ifsc: string;

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
}