import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAdvance } from './employee-advance.entity';
import { AdvanceLog } from './advance-log.entity';
import { AdvancesService } from './advances.service';
import { AdvancesController } from './advances.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeAdvance, AdvanceLog]),
    forwardRef(() => EmployeesModule),
  ],
  providers: [AdvancesService],
  controllers: [AdvancesController],
  exports: [AdvancesService],
})
export class AdvancesModule {}
