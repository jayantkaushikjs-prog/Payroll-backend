import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { User } from './modules/users/user.entity';
import { Employee } from './modules/employees/employee.entity';
import { SalaryStructure } from './modules/salary-structures/salary-structure.entity';
import { NonPayableDays } from './modules/non-payable-days/non-payable-days.entity';
import { PFSettings } from './modules/pf/pf-settings.entity';
import { TaxSlab } from './modules/tax/tax-slab.entity';
import { EmployeeAdvance } from './modules/advances/employee-advance.entity';
import { Payroll } from './modules/payroll/payroll.entity';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { SalaryStructuresModule } from './modules/salary-structures/salary-structures.module';
import { NonPayableDaysModule } from './modules/non-payable-days/non-payable-days.module';
import { PFModule } from './modules/pf/pf.module';
import { TaxModule } from './modules/tax/tax.module';
import { AdvancesModule } from './modules/advances/advances.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ReportsModule } from './modules/reports/reports.module';

// Helpers
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'payroll',
      entities: [
        User,
        Employee,
        SalaryStructure,
        NonPayableDays,
        PFSettings,
        TaxSlab,
        EmployeeAdvance,
        Payroll,
      ],
      synchronize: true, // For development ease. Production should use migrations.
    }),
    TypeOrmModule.forFeature([
      User,
      Employee,
      SalaryStructure,
      NonPayableDays,
      PFSettings,
      TaxSlab,
      EmployeeAdvance,
      Payroll,
    ]),
    AuthModule,
    UsersModule,
    EmployeesModule,
    SalaryStructuresModule,
    NonPayableDaysModule,
    PFModule,
    TaxModule,
    AdvancesModule,
    PayrollModule,
    ReportsModule,
  ],
  providers: [],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(SalaryStructure) private readonly salaryRepo: Repository<SalaryStructure>,
    @InjectRepository(PFSettings) private readonly pfRepo: Repository<PFSettings>,
    @InjectRepository(TaxSlab) private readonly taxRepo: Repository<TaxSlab>,
    @InjectRepository(EmployeeAdvance) private readonly advanceRepo: Repository<EmployeeAdvance>,
    @InjectRepository(Payroll) private readonly payrollRepo: Repository<Payroll>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
    await this.seedPFSettings();
    await this.seedTaxSlabs();
    await this.seedEmployees();
  }

  private async seedUsers() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    console.log('Seeding default system users...');
    const users = [
      { email: 'admin@payroll.com', password: 'Admin@123', role: Role.SUPER_ADMIN },
      { email: 'finance@payroll.com', password: 'Finance@123', role: Role.FINANCE },
      { email: 'hr@payroll.com', password: 'HR@123', role: Role.HR },
    ];

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const user = this.userRepo.create({
        email: u.email,
        password: hashedPassword,
        role: u.role,
      });
      await this.userRepo.save(user);
    }
  }

  private async seedPFSettings() {
    const count = await this.pfRepo.count();
    if (count > 0) return;

    console.log('Seeding default PF settings...');
    const pf = this.pfRepo.create({
      employee_contribution_rate: 12.0,
      employer_contribution_rate: 12.0,
      effective_date: '2026-01-01',
    });
    await this.pfRepo.save(pf);
  }

  private async seedTaxSlabs() {
    const count = await this.taxRepo.count();
    if (count > 0) return;

    console.log('Seeding default Tax Slabs (FY 2026-2027)...');
    const slabs = [
      // New Regime (FY 2026-2027)
      { financial_year: '2026-2027', regime: 'new', from_amount: 0, to_amount: 300000, percentage: 0 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 300000, to_amount: 600000, percentage: 5 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 600000, to_amount: 900000, percentage: 10 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 900000, to_amount: 1200000, percentage: 15 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 1200000, to_amount: 1500000, percentage: 20 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 1500000, to_amount: null, percentage: 30 },

      // Old Regime (FY 2026-2027)
      { financial_year: '2026-2027', regime: 'old', from_amount: 0, to_amount: 250000, percentage: 0 },
      { financial_year: '2026-2027', regime: 'old', from_amount: 250000, to_amount: 500000, percentage: 5 },
      { financial_year: '2026-2027', regime: 'old', from_amount: 500000, to_amount: 1000000, percentage: 20 },
      { financial_year: '2026-2027', regime: 'old', from_amount: 1000000, to_amount: null, percentage: 30 },
    ];

    for (const s of slabs) {
      await this.taxRepo.save(this.taxRepo.create(s));
    }
  }

  private async seedEmployees() {
    const count = await this.employeeRepo.count();
    if (count > 0) return;

    console.log('Seeding default employee data and salary structures...');
    const employeesData = [
      {
        employee_code: 'EMP001',
        name: 'John Doe',
        email: 'john.doe@payroll.com',
        phone: '9876543210',
        department: 'Information Technology (IT)',
        designation: 'Team Lead',
        joining_date: '2022-04-15',
        bank_name: 'Chase Bank',
        account_number: '123456789',
        ifsc: 'CHAS0001234',
        tax_regime: 'new',
        active_status: true,
      },
      {
        employee_code: 'EMP002',
        name: 'Jane Smith',
        email: 'jane.smith@payroll.com',
        phone: '9876543211',
        department: 'Operations',
        designation: 'Manager',
        joining_date: '2023-01-10',
        bank_name: 'Wells Fargo',
        account_number: '987654321',
        ifsc: 'WFLS0005678',
        tax_regime: 'new',
        active_status: true,
      },
    ];

    const salaries = [
      { basic_salary: 50000, hra: 20000, special_allowance: 15000, other_allowance: 10000, gross_salary: 95000 },
      { basic_salary: 40000, hra: 16000, special_allowance: 12000, other_allowance: 8000, gross_salary: 76000 },
    ];

    for (let i = 0; i < employeesData.length; i++) {
      const emp = await this.employeeRepo.save(this.employeeRepo.create(employeesData[i]));
      const sal = this.salaryRepo.create({
        employee_id: emp.id,
        basic_salary: salaries[i].basic_salary,
        hra: salaries[i].hra,
        special_allowance: salaries[i].special_allowance,
        other_allowance: salaries[i].other_allowance,
        gross_salary: salaries[i].gross_salary,
        effective_from: '2026-01-01',
        is_active: true,
      });
      await this.salaryRepo.save(sal);

      // Seed a few historical completed payrolls for trend graphs
      // E.g., Jan, Feb, Mar 2026 payrolls
      for (let m = 1; m <= 3; m++) {
        // Compute standard net: no non payable days, no advance, direct tax deduction
        const gross = salaries[i].gross_salary;
        const basic = salaries[i].basic_salary;
        const pf = basic * 0.12;

        // Calculate progressive tax on gross * 12
        const annualGross = gross * 12;
        let annualTax = 0;
        if (annualGross > 1500000) {
          annualTax += (annualGross - 1500000) * 0.30 + 300000 * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
        } else if (annualGross > 1200000) {
          annualTax += (annualGross - 1200000) * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
        } else if (annualGross > 900000) {
          annualTax += (annualGross - 900000) * 0.15 + 300000 * 0.10 + 300000 * 0.05;
        } else if (annualGross > 600000) {
          annualTax += (annualGross - 600000) * 0.10 + 300000 * 0.05;
        } else if (annualGross > 300000) {
          annualTax += (annualGross - 300000) * 0.05;
        }
        const monthlyTax = Number((annualTax / 12).toFixed(2));
        const net = gross - pf - monthlyTax;

        await this.payrollRepo.save(this.payrollRepo.create({
          employee_id: emp.id,
          month: m,
          year: 2026,
          gross_salary: gross,
          non_payable_deduction: 0,
          pf_deduction: pf,
          tax_deduction: monthlyTax,
          advance_recovery: 0,
          net_salary: net,
          status: 'completed',
        }));
      }
    }

    // Seed one outstanding advance for EMP001
    const emp1 = await this.employeeRepo.findOne({ where: { employee_code: 'EMP001' } });
    if (emp1) {
      await this.advanceRepo.save(this.advanceRepo.create({
        employee_id: emp1.id,
        amount: 30000,
        date: '2026-04-01',
        reason: 'Relocation expenses',
        recovery_type: 'installment',
        installment_amount: 5000,
        total_recovered: 0,
        remaining_amount: 30000,
        start_month: 5,
        start_year: 2026,
        is_fully_recovered: false,
      }));
    }
  }
}
