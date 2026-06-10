import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Payroll } from '../payroll/payroll.entity';
import { SalaryStructure } from '../salary-structures/salary-structure.entity';
import { EmployeeAdvance } from '../advances/employee-advance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Payroll, SalaryStructure, EmployeeAdvance])],
  providers: [EmployeesService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
