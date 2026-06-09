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
exports.SalaryStructuresController = void 0;
const common_1 = require("@nestjs/common");
const salary_structures_service_1 = require("./salary-structures.service");
const create_salary_structure_dto_1 = require("./dto/create-salary-structure.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SalaryStructuresController = class SalaryStructuresController {
    constructor(salaryStructuresService) {
        this.salaryStructuresService = salaryStructuresService;
    }
    create(createSalaryStructureDto) {
        return this.salaryStructuresService.create(createSalaryStructureDto);
    }
    findAllActive() {
        return this.salaryStructuresService.findAllActive();
    }
    findActiveByEmployee(employeeId) {
        return this.salaryStructuresService.findActiveByEmployee(+employeeId);
    }
    findHistoryByEmployee(employeeId) {
        return this.salaryStructuresService.findHistoryByEmployee(+employeeId);
    }
};
exports.SalaryStructuresController = SalaryStructuresController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_salary_structure_dto_1.CreateSalaryStructureDto]),
    __metadata("design:returntype", void 0)
], SalaryStructuresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalaryStructuresController.prototype, "findAllActive", null);
__decorate([
    (0, common_1.Get)('active/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryStructuresController.prototype, "findActiveByEmployee", null);
__decorate([
    (0, common_1.Get)('history/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryStructuresController.prototype, "findHistoryByEmployee", null);
exports.SalaryStructuresController = SalaryStructuresController = __decorate([
    (0, common_1.Controller)('salary-structures'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [salary_structures_service_1.SalaryStructuresService])
], SalaryStructuresController);
//# sourceMappingURL=salary-structures.controller.js.map