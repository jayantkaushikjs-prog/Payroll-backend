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
exports.NonPayableDaysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const non_payable_days_entity_1 = require("./non-payable-days.entity");
const employees_service_1 = require("../employees/employees.service");
let NonPayableDaysService = class NonPayableDaysService {
    constructor(nonPayableDaysRepository, employeesService) {
        this.nonPayableDaysRepository = nonPayableDaysRepository;
        this.employeesService = employeesService;
    }
    async createOrUpdate(createDto) {
        await this.employeesService.findOne(createDto.employee_id);
        let record = await this.nonPayableDaysRepository.findOne({
            where: {
                employee_id: createDto.employee_id,
                month: createDto.month,
                year: createDto.year,
            },
        });
        if (record) {
            record.days = createDto.days;
            record.remarks = createDto.remarks;
        }
        else {
            record = this.nonPayableDaysRepository.create(createDto);
        }
        return this.nonPayableDaysRepository.save(record);
    }
    async findByEmployee(employeeId) {
        return this.nonPayableDaysRepository.find({
            where: { employee_id: employeeId },
            order: { year: 'DESC', month: 'DESC' },
        });
    }
    async findByEmployeeMonthAndYear(employeeId, month, year) {
        return this.nonPayableDaysRepository.findOne({
            where: { employee_id: employeeId, month, year },
        });
    }
    async findByMonthAndYear(month, year) {
        return this.nonPayableDaysRepository.find({
            where: { month, year },
            relations: ['employee'],
            order: { employee_id: 'ASC' },
        });
    }
    async findAll() {
        return this.nonPayableDaysRepository.find({
            relations: ['employee'],
            order: { year: 'DESC', month: 'DESC', employee_id: 'ASC' },
        });
    }
    async getMonthSummary(month, year) {
        const result = await this.nonPayableDaysRepository
            .createQueryBuilder('npd')
            .select('COUNT(DISTINCT npd.employee_id)', 'employeesAffected')
            .addSelect('SUM(npd.days)', 'totalDays')
            .where('npd.month = :month AND npd.year = :year', { month, year })
            .getRawOne();
        return {
            employeesAffected: Number(result?.employeesAffected || 0),
            totalDays: Number(result?.totalDays || 0),
        };
    }
    async remove(id) {
        await this.nonPayableDaysRepository.delete(id);
    }
};
exports.NonPayableDaysService = NonPayableDaysService;
exports.NonPayableDaysService = NonPayableDaysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(non_payable_days_entity_1.NonPayableDays)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        employees_service_1.EmployeesService])
], NonPayableDaysService);
//# sourceMappingURL=non-payable-days.service.js.map