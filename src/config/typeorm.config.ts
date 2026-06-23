import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Employee } from '../modules/employees/employee.entity';
import { Department } from '../modules/employees/department.entity';
import { Designation } from '../modules/employees/designation.entity';
import { SalaryStructure } from '../modules/salary-structures/salary-structure.entity';
import { NonPayableDays } from '../modules/non-payable-days/non-payable-days.entity';
import { PFSettings } from '../modules/pf/pf-settings.entity';
import { TaxSlab } from '../modules/tax/tax-slab.entity';
import { EmployeeAdvance } from '../modules/advances/employee-advance.entity';
import { AdvanceLog } from '../modules/advances/advance-log.entity';
import { Payroll } from '../modules/payroll/payroll.entity';
import { Expense } from '../modules/expenses/expense.entity';
import { ExpenseCategory } from '../modules/expenses/expense-category.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';
import { BlacklistedToken } from '../modules/auth/blacklisted-token.entity';
import { HrPreviewReview } from '../modules/employees/hr-preview-review.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
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
    AdvanceLog,
    Payroll,
    Expense,
    ExpenseCategory,
    RefreshToken,
    BlacklistedToken,
    HrPreviewReview,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
