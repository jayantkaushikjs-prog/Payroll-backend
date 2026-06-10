import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NonPayableDays } from './non-payable-days.entity';
import { NonPayableDaysService } from './non-payable-days.service';
import { NonPayableDaysController } from './non-payable-days.controller';
import { EmployeesModule } from '../employees/employees.module';
import { Payroll } from '../payroll/payroll.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NonPayableDays, Payroll]),
    EmployeesModule,
  ],
  providers: [NonPayableDaysService],
  controllers: [NonPayableDaysController],
  exports: [NonPayableDaysService],
})
export class NonPayableDaysModule {}
