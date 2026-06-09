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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePFSettingsDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePFSettingsDto {
}
exports.CreatePFSettingsDto = CreatePFSettingsDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee contribution rate is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreatePFSettingsDto.prototype, "employee_contribution_rate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employer contribution rate is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreatePFSettingsDto.prototype, "employer_contribution_rate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Effective date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Effective date must be a valid ISO date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreatePFSettingsDto.prototype, "effective_date", void 0);
//# sourceMappingURL=create-pf-settings.dto.js.map