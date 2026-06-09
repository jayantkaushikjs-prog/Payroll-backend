import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EmployeesModule } from '../employees/employees.module';
import { PayrollModule } from '../payroll/payroll.module';
import { AdvancesModule } from '../advances/advances.module';
import { SalaryStructuresModule } from '../salary-structures/salary-structures.module';
import { NonPayableDaysModule } from '../non-payable-days/non-payable-days.module';

@Module({
  imports: [
    EmployeesModule,
    PayrollModule,
    AdvancesModule,
    SalaryStructuresModule,
    NonPayableDaysModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
