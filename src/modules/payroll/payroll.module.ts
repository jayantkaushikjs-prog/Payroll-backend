import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payroll } from './payroll.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { EmployeesModule } from '../employees/employees.module';
import { SalaryStructuresModule } from '../salary-structures/salary-structures.module';
import { NonPayableDaysModule } from '../non-payable-days/non-payable-days.module';
import { PFModule } from '../pf/pf.module';
import { TaxModule } from '../tax/tax.module';
import { AdvancesModule } from '../advances/advances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payroll]),
    EmployeesModule,
    SalaryStructuresModule,
    NonPayableDaysModule,
    PFModule,
    TaxModule,
    AdvancesModule,
  ],
  providers: [PayrollService],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}
