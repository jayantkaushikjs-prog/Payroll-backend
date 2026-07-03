import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructure } from './salary-structure.entity';
import { Employee } from '../employees/employee.entity';
import { SalaryStructuresService } from './salary-structures.service';
import { SalaryStructuresController } from './salary-structures.controller';
import { EmployeesModule } from '../employees/employees.module';
import { PFModule } from '../pf/pf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryStructure, Employee]),
    EmployeesModule,
    PFModule,
  ],
  providers: [SalaryStructuresService],
  controllers: [SalaryStructuresController],
  exports: [SalaryStructuresService],
})
export class SalaryStructuresModule {}
