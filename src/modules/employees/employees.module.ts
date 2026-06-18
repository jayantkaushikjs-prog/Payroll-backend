import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { EmployeeAdvance } from '../advances/employee-advance.entity';
import { PFSettings } from '../pf/pf-settings.entity';
import { HrPreviewReview } from './hr-preview-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Department, Designation, Payroll, SalaryStructure, EmployeeAdvance, PFSettings, HrPreviewReview])],
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
