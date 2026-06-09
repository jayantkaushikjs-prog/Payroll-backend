"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payroll_entity_1 = require("./payroll.entity");
const payroll_service_1 = require("./payroll.service");
const payroll_controller_1 = require("./payroll.controller");
const employees_module_1 = require("../employees/employees.module");
const salary_structures_module_1 = require("../salary-structures/salary-structures.module");
const non_payable_days_module_1 = require("../non-payable-days/non-payable-days.module");
const pf_module_1 = require("../pf/pf.module");
const tax_module_1 = require("../tax/tax.module");
const advances_module_1 = require("../advances/advances.module");
let PayrollModule = class PayrollModule {
};
exports.PayrollModule = PayrollModule;
exports.PayrollModule = PayrollModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([payroll_entity_1.Payroll]),
            employees_module_1.EmployeesModule,
            salary_structures_module_1.SalaryStructuresModule,
            non_payable_days_module_1.NonPayableDaysModule,
            pf_module_1.PFModule,
            tax_module_1.TaxModule,
            advances_module_1.AdvancesModule,
        ],
        providers: [payroll_service_1.PayrollService],
        controllers: [payroll_controller_1.PayrollController],
        exports: [payroll_service_1.PayrollService],
    })
], PayrollModule);
//# sourceMappingURL=payroll.module.js.map