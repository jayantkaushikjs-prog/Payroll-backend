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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getRole(req) {
        return req.user.role;
    }
    getDashboardData(req) {
        return this.reportsService.getDashboardData(this.getRole(req));
    }
    async downloadPayrollCsv(month, year, req, res) {
        const csvContent = await this.reportsService.generatePayrollCsv(+month, +year, this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('payroll')}`);
        return res.status(200).send(csvContent);
    }
    async downloadBankTransferCsv(month, year, req, res) {
        const csvContent = await this.reportsService.generateBankTransferCsv(+month, +year, this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('bank-transfer')}`);
        return res.status(200).send(csvContent);
    }
    async downloadPFCsv(month, year, req, res) {
        const csvContent = await this.reportsService.generatePFCsv(+month, +year, this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('pf-report')}`);
        return res.status(200).send(csvContent);
    }
    async downloadTaxCsv(month, year, req, res) {
        const csvContent = await this.reportsService.generateTaxCsv(+month, +year, this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('tax-report')}`);
        return res.status(200).send(csvContent);
    }
    async downloadAdvancesCsv(req, res) {
        const csvContent = await this.reportsService.generateAdvancesCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('advances-report')}`);
        return res.status(200).send(csvContent);
    }
    async downloadSalaryComponentsCsv(req, res) {
        const csvContent = await this.reportsService.generateSalaryComponentsCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('salary-components')}`);
        return res.status(200).send(csvContent);
    }
    async downloadPayrollSummaryCsv(req, res) {
        const csvContent = await this.reportsService.generatePayrollSummaryCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('payroll-summary')}`);
        return res.status(200).send(csvContent);
    }
    async downloadEmployeeMasterCsv(req, res) {
        const csvContent = await this.reportsService.generateEmployeeMasterCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('employee-master')}`);
        return res.status(200).send(csvContent);
    }
    async downloadNonPayableDaysCsv(req, res) {
        const csvContent = await this.reportsService.generateNonPayableDaysCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('non-payable-days')}`);
        return res.status(200).send(csvContent);
    }
    async downloadJoiningExitCsv(req, res) {
        const csvContent = await this.reportsService.generateJoiningExitCsv(this.getRole(req));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${this.reportsService.filename('joining-exit-records')}`);
        return res.status(200).send(csvContent);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.Get)('payroll/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadPayrollCsv", null);
__decorate([
    (0, common_1.Get)('bank-transfer/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadBankTransferCsv", null);
__decorate([
    (0, common_1.Get)('pf/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadPFCsv", null);
__decorate([
    (0, common_1.Get)('tax/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadTaxCsv", null);
__decorate([
    (0, common_1.Get)('advances/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadAdvancesCsv", null);
__decorate([
    (0, common_1.Get)('salary-components/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadSalaryComponentsCsv", null);
__decorate([
    (0, common_1.Get)('payroll-summary/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_PAYROLL_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadPayrollSummaryCsv", null);
__decorate([
    (0, common_1.Get)('employee-master/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_HR_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadEmployeeMasterCsv", null);
__decorate([
    (0, common_1.Get)('non-payable-days/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_HR_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadNonPayableDaysCsv", null);
__decorate([
    (0, common_1.Get)('joining-exit/csv'),
    (0, permissions_decorator_1.RequirePermissions)(role_enum_1.Permission.VIEW_HR_REPORTS),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadJoiningExitCsv", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map