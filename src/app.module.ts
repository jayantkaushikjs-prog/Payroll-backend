import 'dotenv/config';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { User } from './modules/users/user.entity';
import { Employee } from './modules/employees/employee.entity';
import { Department } from './modules/employees/department.entity';
import { Designation } from './modules/employees/designation.entity';
import { SalaryStructure } from './modules/salary-structures/salary-structure.entity';
import { NonPayableDays } from './modules/non-payable-days/non-payable-days.entity';
import { PFSettings } from './modules/pf/pf-settings.entity';
import { TaxSlab } from './modules/tax/tax-slab.entity';
import { EmployeeAdvance } from './modules/advances/employee-advance.entity';
import { Payroll } from './modules/payroll/payroll.entity';
import { Expense } from './modules/expenses/expense.entity';
import { ExpenseCategory } from './modules/expenses/expense-category.entity';
import { RefreshToken } from './modules/auth/refresh-token.entity';
import { BlacklistedToken } from './modules/auth/blacklisted-token.entity';
import { HrPreviewReview } from './modules/employees/hr-preview-review.entity';

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
import { ExpensesModule } from './modules/expenses/expenses.module';

// Helpers
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import {
  calculateSalaryComponentsFromCtc,
  EMPLOYEE_ESI_RATE,
  isEsiApplicableForBasic,
  isPfApplicableForBasic,
} from './modules/salary-structures/utils/salary-components.util';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'payroll_management',
      entities: [
        User,
        Employee,
        Department,
        Designation,
        SalaryStructure,
        NonPayableDays,
        PFSettings,
        TaxSlab,
        EmployeeAdvance,
        Payroll,
        Expense,
        ExpenseCategory,
        RefreshToken,
        BlacklistedToken,
        HrPreviewReview,
      ],
      synchronize: false, // For development ease. Production should use migrations.
    }),
    TypeOrmModule.forFeature([
      User,
      Employee,
      Department,
      Designation,
      SalaryStructure,
      NonPayableDays,
      PFSettings,
      TaxSlab,
      EmployeeAdvance,
      Payroll,
      Expense,
      ExpenseCategory,
      RefreshToken,
      BlacklistedToken,
      HrPreviewReview,
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
    ExpensesModule,
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
    @InjectRepository(Expense) private readonly expenseRepo: Repository<Expense>,
  ) {}

  async onApplicationBootstrap() {
    // Seeding is now managed via command: npm run seed
  }

  async seed() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const adminUser = await this.userRepo.findOne({ where: { email: 'admin@techindustan.com' } });
    if (adminUser) {
      console.log('Admin user already exists.');
      return;
    }

    console.log('Seeding admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const user = this.userRepo.create({
      email: 'admin@techindustan.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    });
    await this.userRepo.save(user);
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
    // Clear existing tax slabs to replace them with the new configuration
    await this.taxRepo.clear();

    console.log('Seeding default Tax Slabs (FY 2025-2026 and FY 2026-2027)...');
    const slabs = [
      // New Regime (FY 2025-2026)
      { financial_year: '2025-2026', regime: 'new', from_amount: 0, to_amount: 400000, percentage: 0 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 400000, to_amount: 800000, percentage: 5 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 800000, to_amount: 1200000, percentage: 10 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 1200000, to_amount: 1600000, percentage: 15 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 1600000, to_amount: 2000000, percentage: 20 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 2000000, to_amount: 2400000, percentage: 25 },
      { financial_year: '2025-2026', regime: 'new', from_amount: 2400000, to_amount: null, percentage: 30 },

      // New Regime (FY 2026-2027)
      { financial_year: '2026-2027', regime: 'new', from_amount: 0, to_amount: 400000, percentage: 0 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 400000, to_amount: 800000, percentage: 5 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 800000, to_amount: 1200000, percentage: 10 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 1200000, to_amount: 1600000, percentage: 15 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 1600000, to_amount: 2000000, percentage: 20 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 2000000, to_amount: 2400000, percentage: 25 },
      { financial_year: '2026-2027', regime: 'new', from_amount: 2400000, to_amount: null, percentage: 30 },
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
        pf_deduction: true,
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
        pf_deduction: true,
      },
    ];

    const salaries = [96800, 77800].map(ctc => calculateSalaryComponentsFromCtc({
      ctc,
      basicPercent: 50,
      hraPercent: 40,
      pfDeduction: true,
      employerContributionRate: 12,
      maxPfCap: 1800,
    }));

    for (let i = 0; i < employeesData.length; i++) {
      const emp = await this.employeeRepo.save(this.employeeRepo.create(employeesData[i]));
      const sal = this.salaryRepo.create({
        employee_id: emp.id,
        basic_salary: salaries[i].basic_salary,
        hra: salaries[i].hra,
        special_allowance: salaries[i].special_allowance,
        other_allowance: salaries[i].other_allowance,
        gross_salary: salaries[i].gross_salary,
        ctc: salaries[i].ctc,
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
        const ctc = salaries[i].ctc;
        const pf = isPfApplicableForBasic(basic, true) ? Math.min(basic * 0.12, 1800) : 0;
        const esi = isEsiApplicableForBasic(basic) ? Number((basic * EMPLOYEE_ESI_RATE).toFixed(2)) : 0;

        // Calculate progressive tax on taxable CTC * 12
        const annualGross = ctc * 12;
        let annualTax = 0;
        if (annualGross > 2400000) {
          annualTax += (annualGross - 2400000) * 0.30 + 400000 * 0.25 + 400000 * 0.20 + 400000 * 0.15 + 400000 * 0.10 + 400000 * 0.05;
        } else if (annualGross > 2000000) {
          annualTax += (annualGross - 2000000) * 0.25 + 400000 * 0.20 + 400000 * 0.15 + 400000 * 0.10 + 400000 * 0.05;
        } else if (annualGross > 1600000) {
          annualTax += (annualGross - 1600000) * 0.20 + 400000 * 0.15 + 400000 * 0.10 + 400000 * 0.05;
        } else if (annualGross > 1200000) {
          annualTax += (annualGross - 1200000) * 0.15 + 400000 * 0.10 + 400000 * 0.05;
        } else if (annualGross > 800000) {
          annualTax += (annualGross - 800000) * 0.10 + 400000 * 0.05;
        } else if (annualGross > 400000) {
          annualTax += (annualGross - 400000) * 0.05;
        }
        const monthlyTax = Number((annualTax / 12).toFixed(2));
        const net = gross + basic - pf - esi - monthlyTax;

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
          status: 'disbursed',
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

  private async seedExpenses() {
    const count = await this.expenseRepo.count();
    if (count > 0) return;

    console.log('Seeding default company expenses...');
    const now = new Date();
    
    const expenses = [];
    
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      
      expenses.push(
        {
          title: 'Office Space Rent',
          amount: 25000,
          category: 'rent',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-01`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'Monthly office rental fee',
        },
        {
          title: 'Employee Salaries',
          amount: 171000,
          category: 'salary',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-28`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'Total monthly employee salaries disbursement',
        },
        {
          title: 'Employer PF Contribution',
          amount: 3600,
          category: 'pf',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-28`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'Total monthly employer PF contribution',
        },
        {
          title: 'AWS & Heroku Cloud Infrastructure',
          amount: 4500,
          category: 'utilities',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-10`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'Hosting & server charges',
        },
        {
          title: 'Office Internet & Electric Bill',
          amount: 2200,
          category: 'utilities',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-12`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'High-speed fiber and power supply bills',
        },
        {
          title: 'LinkedIn Recruiters Subscription',
          amount: 8000,
          category: 'marketing',
          frequency: 'monthly',
          date: `${yearStr}-${monthStr}-05`,
          startDate: `2026-01-01`,
          endDate: null,
          description: 'Recruitment platform fees',
        }
      );
      
      if (i === 0) {
        expenses.push({
          title: 'Laptops for New Hires',
          amount: 150000,
          category: 'one-time',
          frequency: 'one-time',
          date: `${yearStr}-${monthStr}-18`,
          startDate: null,
          endDate: null,
          description: 'Purchase of 2 MacBook Airs for design team',
        });
      } else if (i === 2) {
        expenses.push({
          title: 'Annual Team Offsite Meeting',
          amount: 85000,
          category: 'one-time',
          frequency: 'one-time',
          date: `${yearStr}-${monthStr}-15`,
          startDate: null,
          endDate: null,
          description: 'Food, stay and travel for company annual retreat',
        });
      }
    }

    for (const exp of expenses) {
      await this.expenseRepo.save(this.expenseRepo.create(exp));
    }
  }
}
