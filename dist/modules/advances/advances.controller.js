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
exports.AdvancesController = void 0;
const common_1 = require("@nestjs/common");
const advances_service_1 = require("./advances.service");
const create_advance_dto_1 = require("./dto/create-advance.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let AdvancesController = class AdvancesController {
    constructor(advancesService) {
        this.advancesService = advancesService;
    }
    create(createDto) {
        return this.advancesService.create(createDto);
    }
    findAll() {
        return this.advancesService.findAll();
    }
    findByEmployee(employeeId) {
        return this.advancesService.findByEmployee(+employeeId);
    }
    remove(id) {
        return this.advancesService.remove(+id);
    }
};
exports.AdvancesController = AdvancesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_ADVANCES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_advance_dto_1.CreateAdvanceDto]),
    __metadata("design:returntype", void 0)
], AdvancesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_ADVANCES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdvancesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_ADVANCES),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdvancesController.prototype, "findByEmployee", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_ADVANCES),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdvancesController.prototype, "remove", null);
exports.AdvancesController = AdvancesController = __decorate([
    (0, common_1.Controller)('advances'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [advances_service_1.AdvancesService])
], AdvancesController);
//# sourceMappingURL=advances.controller.js.map