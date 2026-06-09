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
exports.CreateSalaryStructureDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSalaryStructureDto {
}
exports.CreateSalaryStructureDto = CreateSalaryStructureDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee ID is required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSalaryStructureDto.prototype, "employee_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Basic salary is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryStructureDto.prototype, "basic_salary", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'HRA is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryStructureDto.prototype, "hra", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Special allowance is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryStructureDto.prototype, "special_allowance", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Other allowance is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryStructureDto.prototype, "other_allowance", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Effective date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Effective date must be a valid ISO date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateSalaryStructureDto.prototype, "effective_from", void 0);
//# sourceMappingURL=create-salary-structure.dto.js.map