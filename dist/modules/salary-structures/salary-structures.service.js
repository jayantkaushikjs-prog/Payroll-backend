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
exports.SalaryStructuresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const salary_structure_entity_1 = require("./salary-structure.entity");
const employees_service_1 = require("../employees/employees.service");
let SalaryStructuresService = class SalaryStructuresService {
    constructor(salaryStructuresRepository, employeesService) {
        this.salaryStructuresRepository = salaryStructuresRepository;
        this.employeesService = employeesService;
    }
    async create(createSalaryStructureDto) {
        await this.employeesService.findOne(createSalaryStructureDto.employee_id);
        const gross_salary = Number(createSalaryStructureDto.basic_salary) +
            Number(createSalaryStructureDto.hra) +
            Number(createSalaryStructureDto.special_allowance) +
            Number(createSalaryStructureDto.other_allowance);
        await this.salaryStructuresRepository.update({ employee_id: createSalaryStructureDto.employee_id, is_active: true }, { is_active: false });
        const newStructure = this.salaryStructuresRepository.create({
            ...createSalaryStructureDto,
            gross_salary,
            is_active: true,
        });
        return this.salaryStructuresRepository.save(newStructure);
    }
    async findActiveByEmployee(employeeId) {
        const structure = await this.salaryStructuresRepository.findOne({
            where: { employee_id: employeeId, is_active: true },
        });
        if (!structure) {
            throw new common_1.NotFoundException(`No active salary structure found for employee ID ${employeeId}`);
        }
        return structure;
    }
    async findHistoryByEmployee(employeeId) {
        return this.salaryStructuresRepository.find({
            where: { employee_id: employeeId },
            order: { effective_from: 'DESC', created_at: 'DESC' },
        });
    }
    async findAllActive() {
        return this.salaryStructuresRepository.find({
            where: { is_active: true },
            relations: ['employee'],
        });
    }
};
exports.SalaryStructuresService = SalaryStructuresService;
exports.SalaryStructuresService = SalaryStructuresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(salary_structure_entity_1.SalaryStructure)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        employees_service_1.EmployeesService])
], SalaryStructuresService);
//# sourceMappingURL=salary-structures.service.js.map