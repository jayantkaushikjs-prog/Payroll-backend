import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdatePayrollStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(['draft', 'completed'], { message: 'Status must be draft or completed' })
  status: 'draft' | 'completed';
}
