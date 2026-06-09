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
exports.CreateNonPayableDaysDto = void 0;
const class_validator_1 = require("class-validator");
class CreateNonPayableDaysDto {
}
exports.CreateNonPayableDaysDto = CreateNonPayableDaysDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee ID is required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateNonPayableDaysDto.prototype, "employee_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Month is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateNonPayableDaysDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Year is required' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateNonPayableDaysDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Days count is required' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(31),
    __metadata("design:type", Number)
], CreateNonPayableDaysDto.prototype, "days", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNonPayableDaysDto.prototype, "remarks", void 0);
//# sourceMappingURL=create-non-payable-days.dto.js.map