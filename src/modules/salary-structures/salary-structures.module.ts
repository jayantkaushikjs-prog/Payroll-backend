import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructure } from './salary-structure.entity';
import { SalaryStructuresService } from './salary-structures.service';
import { SalaryStructuresController } from './salary-structures.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryStructure]),
    EmployeesModule,
  ],
  providers: [SalaryStructuresService],
  controllers: [SalaryStructuresController],
  exports: [SalaryStructuresService],
})
export class SalaryStructuresModule {}
