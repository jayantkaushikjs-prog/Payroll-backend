import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdatePayrollStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(['draft', 'locked', 'disbursed'], { message: 'Status must be draft, locked, or disbursed' })
  status: 'draft' | 'locked' | 'disbursed';
}
