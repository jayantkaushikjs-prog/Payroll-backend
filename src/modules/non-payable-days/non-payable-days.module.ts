import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NonPayableDays } from './non-payable-days.entity';
import { NonPayableDaysService } from './non-payable-days.service';
import { NonPayableDaysController } from './non-payable-days.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NonPayableDays]),
    EmployeesModule,
  ],
  providers: [NonPayableDaysService],
  controllers: [NonPayableDaysController],
  exports: [NonPayableDaysService],
})
export class NonPayableDaysModule {}
