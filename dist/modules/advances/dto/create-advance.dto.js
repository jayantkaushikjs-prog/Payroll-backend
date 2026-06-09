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
exports.CreateAdvanceDto = void 0;
const class_validator_1 = require("class-validator");
class CreateAdvanceDto {
}
exports.CreateAdvanceDto = CreateAdvanceDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee ID is required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAdvanceDto.prototype, "employee_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Advance amount is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAdvanceDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Advance date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Advance date must be a valid ISO date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateAdvanceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdvanceDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Recovery type is required' }),
    (0, class_validator_1.IsIn)(['one_time', 'installment'], { message: 'Recovery type must be either one_time or installment' }),
    __metadata("design:type", String)
], CreateAdvanceDto.prototype, "recovery_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAdvanceDto.prototype, "installment_amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Start month is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateAdvanceDto.prototype, "start_month", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Start year is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(2000, { message: 'Start year must be at least 2000' }),
    (0, class_validator_1.Max)(2100, { message: 'Start year cannot exceed 2100' }),
    __metadata("design:type", Number)
], CreateAdvanceDto.prototype, "start_year", void 0);
//# sourceMappingURL=create-advance.dto.js.map