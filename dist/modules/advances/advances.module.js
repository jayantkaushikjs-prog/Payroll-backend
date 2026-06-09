"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const employee_advance_entity_1 = require("./employee-advance.entity");
const advances_service_1 = require("./advances.service");
const advances_controller_1 = require("./advances.controller");
const employees_module_1 = require("../employees/employees.module");
let AdvancesModule = class AdvancesModule {
};
exports.AdvancesModule = AdvancesModule;
exports.AdvancesModule = AdvancesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([employee_advance_entity_1.EmployeeAdvance]),
            employees_module_1.EmployeesModule,
        ],
        providers: [advances_service_1.AdvancesService],
        controllers: [advances_controller_1.AdvancesController],
        exports: [advances_service_1.AdvancesService],
    })
], AdvancesModule);
//# sourceMappingURL=advances.module.js.map