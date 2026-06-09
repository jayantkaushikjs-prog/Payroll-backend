import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './modules/users/user.entity';
import { Employee } from './modules/employees/employee.entity';
import { SalaryStructure } from './modules/salary-structures/salary-structure.entity';
import { PFSettings } from './modules/pf/pf-settings.entity';
import { TaxSlab } from './modules/tax/tax-slab.entity';
import { EmployeeAdvance } from './modules/advances/employee-advance.entity';
import { Payroll } from './modules/payroll/payroll.entity';
export declare class AppModule implements OnApplicationBootstrap {
    private readonly userRepo;
    private readonly employeeRepo;
    private readonly salaryRepo;
    private readonly pfRepo;
    private readonly taxRepo;
    private readonly advanceRepo;
    private readonly payrollRepo;
    constructor(userRepo: Repository<User>, employeeRepo: Repository<Employee>, salaryRepo: Repository<SalaryStructure>, pfRepo: Repository<PFSettings>, taxRepo: Repository<TaxSlab>, advanceRepo: Repository<EmployeeAdvance>, payrollRepo: Repository<Payroll>);
    onApplicationBootstrap(): Promise<void>;
    private seedUsers;
    private seedPFSettings;
    private seedTaxSlabs;
    private seedEmployees;
}
