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
exports.PFController = void 0;
const common_1 = require("@nestjs/common");
const pf_service_1 = require("./pf.service");
const create_pf_settings_dto_1 = require("./dto/create-pf-settings.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let PFController = class PFController {
    constructor(pfService) {
        this.pfService = pfService;
    }
    create(createDto) {
        return this.pfService.create(createDto);
    }
    findAll() {
        return this.pfService.findAll();
    }
    findActive(date) {
        const checkDate = date || new Date().toISOString().split('T')[0];
        return this.pfService.findActiveAtDate(checkDate);
    }
    remove(id) {
        return this.pfService.remove(+id);
    }
};
exports.PFController = PFController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_PF_SETTINGS),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pf_settings_dto_1.CreatePFSettingsDto]),
    __metadata("design:returntype", void 0)
], PFController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_PF_SETTINGS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PFController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_PF_SETTINGS),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PFController.prototype, "findActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.MANAGE_PF_SETTINGS),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PFController.prototype, "remove", null);
exports.PFController = PFController = __decorate([
    (0, common_1.Controller)('pf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [pf_service_1.PFService])
], PFController);
//# sourceMappingURL=pf.controller.js.map