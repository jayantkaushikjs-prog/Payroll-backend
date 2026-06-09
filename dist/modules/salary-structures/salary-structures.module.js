"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryStructuresModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const salary_structure_entity_1 = require("./salary-structure.entity");
const salary_structures_service_1 = require("./salary-structures.service");
const salary_structures_controller_1 = require("./salary-structures.controller");
const employees_module_1 = require("../employees/employees.module");
let SalaryStructuresModule = class SalaryStructuresModule {
};
exports.SalaryStructuresModule = SalaryStructuresModule;
exports.SalaryStructuresModule = SalaryStructuresModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([salary_structure_entity_1.SalaryStructure]),
            employees_module_1.EmployeesModule,
        ],
        providers: [salary_structures_service_1.SalaryStructuresService],
        controllers: [salary_structures_controller_1.SalaryStructuresController],
        exports: [salary_structures_service_1.SalaryStructuresService],
    })
], SalaryStructuresModule);
//# sourceMappingURL=salary-structures.module.js.map