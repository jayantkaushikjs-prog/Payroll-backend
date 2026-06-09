"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const user_entity_1 = require("./modules/users/user.entity");
const employee_entity_1 = require("./modules/employees/employee.entity");
const salary_structure_entity_1 = require("./modules/salary-structures/salary-structure.entity");
const non_payable_days_entity_1 = require("./modules/non-payable-days/non-payable-days.entity");
const pf_settings_entity_1 = require("./modules/pf/pf-settings.entity");
const tax_slab_entity_1 = require("./modules/tax/tax-slab.entity");
const employee_advance_entity_1 = require("./modules/advances/employee-advance.entity");
const payroll_entity_1 = require("./modules/payroll/payroll.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const employees_module_1 = require("./modules/employees/employees.module");
const salary_structures_module_1 = require("./modules/salary-structures/salary-structures.module");
const non_payable_days_module_1 = require("./modules/non-payable-days/non-payable-days.module");
const pf_module_1 = require("./modules/pf/pf.module");
const tax_module_1 = require("./modules/tax/tax.module");
const advances_module_1 = require("./modules/advances/advances.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const reports_module_1 = require("./modules/reports/reports.module");
const role_enum_1 = require("./common/enums/role.enum");
const bcrypt = require("bcryptjs");
let AppModule = class AppModule {
    constructor(userRepo, employeeRepo, salaryRepo, pfRepo, taxRepo, advanceRepo, payrollRepo) {
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
        this.salaryRepo = salaryRepo;
        this.pfRepo = pfRepo;
        this.taxRepo = taxRepo;
        this.advanceRepo = advanceRepo;
        this.payrollRepo = payrollRepo;
    }
    async onApplicationBootstrap() {
        await this.seedUsers();
        await this.seedPFSettings();
        await this.seedTaxSlabs();
        await this.seedEmployees();
    }
    async seedUsers() {
        const count = await this.userRepo.count();
        if (count > 0)
            return;
        console.log('Seeding default system users...');
        const users = [
            { email: 'admin@payroll.com', password: 'Admin@123', role: role_enum_1.Role.SUPER_ADMIN },
            { email: 'finance@payroll.com', password: 'Finance@123', role: role_enum_1.Role.FINANCE },
            { email: 'hr@payroll.com', password: 'HR@123', role: role_enum_1.Role.HR },
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
    async seedPFSettings() {
        const count = await this.pfRepo.count();
        if (count > 0)
            return;
        console.log('Seeding default PF settings...');
        const pf = this.pfRepo.create({
            employee_contribution_rate: 12.0,
            employer_contribution_rate: 12.0,
            effective_date: '2026-01-01',
        });
        await this.pfRepo.save(pf);
    }
    async seedTaxSlabs() {
        const count = await this.taxRepo.count();
        if (count > 0)
            return;
        console.log('Seeding default Tax Slabs (FY 2026-2027)...');
        const slabs = [
            { financial_year: '2026-2027', regime: 'new', from_amount: 0, to_amount: 300000, percentage: 0 },
            { financial_year: '2026-2027', regime: 'new', from_amount: 300000, to_amount: 600000, percentage: 5 },
            { financial_year: '2026-2027', regime: 'new', from_amount: 600000, to_amount: 900000, percentage: 10 },
            { financial_year: '2026-2027', regime: 'new', from_amount: 900000, to_amount: 1200000, percentage: 15 },
            { financial_year: '2026-2027', regime: 'new', from_amount: 1200000, to_amount: 1500000, percentage: 20 },
            { financial_year: '2026-2027', regime: 'new', from_amount: 1500000, to_amount: null, percentage: 30 },
            { financial_year: '2026-2027', regime: 'old', from_amount: 0, to_amount: 250000, percentage: 0 },
            { financial_year: '2026-2027', regime: 'old', from_amount: 250000, to_amount: 500000, percentage: 5 },
            { financial_year: '2026-2027', regime: 'old', from_amount: 500000, to_amount: 1000000, percentage: 20 },
            { financial_year: '2026-2027', regime: 'old', from_amount: 1000000, to_amount: null, percentage: 30 },
        ];
        for (const s of slabs) {
            await this.taxRepo.save(this.taxRepo.create(s));
        }
    }
    async seedEmployees() {
        const count = await this.employeeRepo.count();
        if (count > 0)
            return;
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
            for (let m = 1; m <= 3; m++) {
                const gross = salaries[i].gross_salary;
                const basic = salaries[i].basic_salary;
                const pf = basic * 0.12;
                const annualGross = gross * 12;
                let annualTax = 0;
                if (annualGross > 1500000) {
                    annualTax += (annualGross - 1500000) * 0.30 + 300000 * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
                }
                else if (annualGross > 1200000) {
                    annualTax += (annualGross - 1200000) * 0.20 + 300000 * 0.15 + 300000 * 0.10 + 300000 * 0.05;
                }
                else if (annualGross > 900000) {
                    annualTax += (annualGross - 900000) * 0.15 + 300000 * 0.10 + 300000 * 0.05;
                }
                else if (annualGross > 600000) {
                    annualTax += (annualGross - 600000) * 0.10 + 300000 * 0.05;
                }
                else if (annualGross > 300000) {
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
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT, 10) || 5432,
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'payroll',
                entities: [
                    user_entity_1.User,
                    employee_entity_1.Employee,
                    salary_structure_entity_1.SalaryStructure,
                    non_payable_days_entity_1.NonPayableDays,
                    pf_settings_entity_1.PFSettings,
                    tax_slab_entity_1.TaxSlab,
                    employee_advance_entity_1.EmployeeAdvance,
                    payroll_entity_1.Payroll,
                ],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                employee_entity_1.Employee,
                salary_structure_entity_1.SalaryStructure,
                non_payable_days_entity_1.NonPayableDays,
                pf_settings_entity_1.PFSettings,
                tax_slab_entity_1.TaxSlab,
                employee_advance_entity_1.EmployeeAdvance,
                payroll_entity_1.Payroll,
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            employees_module_1.EmployeesModule,
            salary_structures_module_1.SalaryStructuresModule,
            non_payable_days_module_1.NonPayableDaysModule,
            pf_module_1.PFModule,
            tax_module_1.TaxModule,
            advances_module_1.AdvancesModule,
            payroll_module_1.PayrollModule,
            reports_module_1.ReportsModule,
        ],
        providers: [],
    }),
    __param(0, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_2.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_2.InjectRepository)(salary_structure_entity_1.SalaryStructure)),
    __param(3, (0, typeorm_2.InjectRepository)(pf_settings_entity_1.PFSettings)),
    __param(4, (0, typeorm_2.InjectRepository)(tax_slab_entity_1.TaxSlab)),
    __param(5, (0, typeorm_2.InjectRepository)(employee_advance_entity_1.EmployeeAdvance)),
    __param(6, (0, typeorm_2.InjectRepository)(payroll_entity_1.Payroll)),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository])
], AppModule);
//# sourceMappingURL=app.module.js.map