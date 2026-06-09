"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const employees_module_1 = require("../employees/employees.module");
const payroll_module_1 = require("../payroll/payroll.module");
const advances_module_1 = require("../advances/advances.module");
const salary_structures_module_1 = require("../salary-structures/salary-structures.module");
const non_payable_days_module_1 = require("../non-payable-days/non-payable-days.module");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            employees_module_1.EmployeesModule,
            payroll_module_1.PayrollModule,
            advances_module_1.AdvancesModule,
            salary_structures_module_1.SalaryStructuresModule,
            non_payable_days_module_1.NonPayableDaysModule,
        ],
        providers: [reports_service_1.ReportsService],
        controllers: [reports_controller_1.ReportsController],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map