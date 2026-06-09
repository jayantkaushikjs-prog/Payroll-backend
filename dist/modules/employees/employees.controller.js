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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const employees_service_1 = require("./employees.service");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const update_employee_dto_1 = require("./dto/update-employee.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const rbac_config_1 = require("../../config/rbac.config");
let EmployeesController = class EmployeesController {
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    async downloadCsv(res) {
        const employees = await this.employeesService.findAll();
        const csvContent = this.employeesService.generateCsv(employees);
        const today = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=employee-master_${today}.csv`);
        return res.status(200).send(csvContent);
    }
    create(createEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }
    importCsv(csvContent) {
        return this.employeesService.importCsv(csvContent);
    }
    findAll(req) {
        const user = req.user;
        if (!user || !user.role) {
            throw new common_1.ForbiddenException('User role information is missing');
        }
        if (user.role === role_enum_1.Role.SUPER_ADMIN) {
            return this.employeesService.findAll();
        }
        const rolePermissions = (0, rbac_config_1.getRolePermissions)(user.role);
        if (rolePermissions.includes(role_enum_1.Permission.VIEW_EMPLOYEE) ||
            rolePermissions.includes(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES)) {
            return this.employeesService.findAll();
        }
        throw new common_1.ForbiddenException('You do not have permission to view employees');
    }
    findOne(id, req) {
        const user = req.user;
        if (!user || !user.role) {
            throw new common_1.ForbiddenException('User role information is missing');
        }
        if (user.role === role_enum_1.Role.SUPER_ADMIN) {
            return this.employeesService.findOne(+id);
        }
        const rolePermissions = (0, rbac_config_1.getRolePermissions)(user.role);
        if (rolePermissions.includes(role_enum_1.Permission.VIEW_EMPLOYEE) ||
            rolePermissions.includes(role_enum_1.Permission.MANAGE_SALARY_STRUCTURES)) {
            return this.employeesService.findOne(+id);
        }
        throw new common_1.ForbiddenException('You do not have permission to view this employee');
    }
    update(id, updateEmployeeDto) {
        return this.employeesService.update(+id, updateEmployeeDto);
    }
    remove(id) {
        return this.employeesService.remove(+id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)('csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.EXPORT_EMPLOYEES),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "downloadCsv", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.CREATE_EMPLOYEE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.CREATE_EMPLOYEE),
    __param(0, (0, common_1.Body)('csvContent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.UPDATE_EMPLOYEE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.DELETE_EMPLOYEE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, common_1.Controller)('employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map