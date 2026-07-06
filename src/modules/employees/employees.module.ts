import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { HrPreviewReview } from './hr-preview-review.entity';
import { MonthlyEmployeeInput } from './monthly-employee-input.entity';
import { PFModule } from '../pf/pf.module';
import { AdvancesModule } from '../advances/advances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Department,
      Designation,
      Payroll,
      SalaryStructure,
      HrPreviewReview,
      MonthlyEmployeeInput,
    ]),
    PFModule,
    forwardRef(() => AdvancesModule),
  ],
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
