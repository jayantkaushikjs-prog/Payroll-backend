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
exports.CreateEmployeeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const DEPARTMENTS = [
    'Human Resources (HR)',
    'Finance & Accounts',
    'Information Technology (IT)',
    'Operations',
    'Sales',
    'Marketing',
    'Customer Support',
    'Administration',
    'Legal',
    'Procurement',
];
const DESIGNATIONS = [
    'Intern',
    'Trainee',
    'Associate',
    'Executive',
    'Senior Executive',
    'Team Lead',
    'Assistant Manager',
    'Manager',
    'Senior Manager',
    'Director',
];
class CreateEmployeeDto {
}
exports.CreateEmployeeDto = CreateEmployeeDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Length)(3, 20, { message: 'Employee code must be between 3 and 20 characters' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "employee_code", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Full name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Length)(2, 100, { message: 'Name must be between 2 and 100 characters' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Email address is required' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email address format' }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'Phone number must be numeric and exactly 10 digits' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Department is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsIn)(DEPARTMENTS, { message: 'Invalid department option selected' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Designation is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsIn)(DESIGNATIONS, { message: 'Invalid designation option selected' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "designation", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Joining date is required' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Joining date must be a valid ISO date string (YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "joining_date", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Bank name is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Length)(2, 100, { message: 'Bank name must be between 2 and 100 characters' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "bank_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Account number is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.Matches)(/^\d{9,18}$/, { message: 'Account number must be numeric and between 9 and 18 digits' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "account_number", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'IFSC code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value),
    (0, class_validator_1.Matches)(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format (e.g. CHAS0001234)' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "ifsc", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsIn)(['old', 'new'], { message: 'Tax regime must be either old or new' }),
    __metadata("design:type", String)
], CreateEmployeeDto.prototype, "tax_regime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEmployeeDto.prototype, "active_status", void 0);
//# sourceMappingURL=create-employee.dto.js.map