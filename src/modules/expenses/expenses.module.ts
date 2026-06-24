import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './expense.entity';
import { ExpenseCategory } from './expense-category.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { PayrollModule } from '../payroll/payroll.module';
import { AdvancesModule } from '../advances/advances.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseCategory]),
    PayrollModule,
    AdvancesModule,
  ],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService],
})
export class ExpensesModule {}
