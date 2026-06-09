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
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
let EmployeesService = class EmployeesService {
    constructor(employeesRepository) {
        this.employeesRepository = employeesRepository;
    }
    async create(createEmployeeDto) {
        const codeExists = await this.employeesRepository.findOne({
            where: { employee_code: createEmployeeDto.employee_code },
        });
        if (codeExists) {
            throw new common_1.ConflictException('Employee code already exists');
        }
        const emailExists = await this.employeesRepository.findOne({
            where: { email: createEmployeeDto.email },
        });
        if (emailExists) {
            throw new common_1.ConflictException('Email already exists');
        }
        const employee = this.employeesRepository.create(createEmployeeDto);
        return this.employeesRepository.save(employee);
    }
    async findAll() {
        return this.employeesRepository.find({ order: { employee_code: 'ASC' } });
    }
    async findOne(id) {
        const employee = await this.employeesRepository.findOne({ where: { id } });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
        }
        return employee;
    }
    async update(id, updateEmployeeDto) {
        const employee = await this.findOne(id);
        if (updateEmployeeDto.employee_code && updateEmployeeDto.employee_code !== employee.employee_code) {
            const codeExists = await this.employeesRepository.findOne({
                where: { employee_code: updateEmployeeDto.employee_code },
            });
            if (codeExists) {
                throw new common_1.ConflictException('Employee code already exists');
            }
        }
        if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
            const emailExists = await this.employeesRepository.findOne({
                where: { email: updateEmployeeDto.email },
            });
            if (emailExists) {
                throw new common_1.ConflictException('Email already exists');
            }
        }
        Object.assign(employee, updateEmployeeDto);
        return this.employeesRepository.save(employee);
    }
    async remove(id) {
        const employee = await this.findOne(id);
        await this.employeesRepository.remove(employee);
    }
    async countAll() {
        return this.employeesRepository.count({ where: { active_status: true } });
    }
    async countEmployees() {
        const [total, active] = await Promise.all([
            this.employeesRepository.count(),
            this.employeesRepository.count({ where: { active_status: true } }),
        ]);
        return { total, active };
    }
    async countNewJoinees(month, year) {
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = new Date(year, month, 0).toISOString().split('T')[0];
        return this.employeesRepository.count({
            where: {
                joining_date: (0, typeorm_2.Between)(start, end),
            },
        });
    }
    async getDepartmentDistribution() {
        const rows = await this.employeesRepository
            .createQueryBuilder('emp')
            .select('emp.department', 'department')
            .addSelect('COUNT(emp.id)', 'count')
            .where('emp.active_status = :active', { active: true })
            .groupBy('emp.department')
            .orderBy('COUNT(emp.id)', 'DESC')
            .getRawMany();
        return rows.map((row) => ({
            department: row.department || 'Unassigned',
            count: Number(row.count || 0),
        }));
    }
    async getRecentEmployeeActivities(limit = 5) {
        const employees = await this.employeesRepository.find({
            order: { created_at: 'DESC' },
            take: limit,
        });
        return employees.map((emp) => ({
            title: 'Employee profile added',
            description: `${emp.employee_code} - ${emp.name}`,
            date: emp.created_at,
        }));
    }
    generateCsv(employees) {
        const headers = [
            'Employee Code',
            'Name',
            'Email',
            'Phone',
            'Department',
            'Designation',
            'Joining Date',
            'Bank Name',
            'Account Number',
            'IFSC',
            'Active Status',
        ];
        const rows = employees.map(emp => [
            `"${emp.employee_code}"`,
            `"${emp.name.replace(/"/g, '""')}"`,
            `"${emp.email}"`,
            `"${emp.phone || ''}"`,
            `"${emp.department.replace(/"/g, '""')}"`,
            `"${emp.designation.replace(/"/g, '""')}"`,
            `"${emp.joining_date}"`,
            `"${emp.bank_name.replace(/"/g, '""')}"`,
            `"${emp.account_number}"`,
            `"${emp.ifsc}"`,
            emp.active_status ? 'Active' : 'Inactive',
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    async importCsv(csvContent) {
        const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            return { imported: 0, errors: ['CSV is empty or lacks data rows'] };
        }
        const headers = this.parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
        const errors = [];
        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCsvLine(lines[i]);
                if (values.length < headers.length) {
                    errors.push(`Row ${i + 1}: Column count mismatch`);
                    continue;
                }
                const data = {};
                headers.forEach((header, index) => {
                    const val = values[index]?.trim();
                    if (header === 'employee code' || header === 'employee_code')
                        data.employee_code = val;
                    else if (header === 'name')
                        data.name = val;
                    else if (header === 'email')
                        data.email = val;
                    else if (header === 'phone')
                        data.phone = val;
                    else if (header === 'department')
                        data.department = val;
                    else if (header === 'designation')
                        data.designation = val;
                    else if (header === 'joining date' || header === 'joining_date')
                        data.joining_date = val;
                    else if (header === 'bank name' || header === 'bank_name')
                        data.bank_name = val;
                    else if (header === 'account number' || header === 'account_number')
                        data.account_number = val;
                    else if (header === 'ifsc')
                        data.ifsc = val;
                    else if (header === 'tax regime' || header === 'tax_regime')
                        data.tax_regime = val || 'new';
                    else if (header === 'active status' || header === 'active_status') {
                        data.active_status = val?.toLowerCase() === 'active' || val?.toLowerCase() === 'true' || val === '1';
                    }
                });
                if (!data.tax_regime) {
                    data.tax_regime = 'new';
                }
                if (data.active_status === undefined) {
                    data.active_status = true;
                }
                if (!data.employee_code || !data.name || !data.email) {
                    errors.push(`Row ${i + 1}: Missing employee_code, name, or email`);
                    continue;
                }
                const existingCode = await this.employeesRepository.findOne({ where: { employee_code: data.employee_code } });
                if (existingCode) {
                    Object.assign(existingCode, data);
                    await this.employeesRepository.save(existingCode);
                }
                else {
                    const existingEmail = await this.employeesRepository.findOne({ where: { email: data.email } });
                    if (existingEmail) {
                        errors.push(`Row ${i + 1}: Email ${data.email} already exists for another employee`);
                        continue;
                    }
                    await this.employeesRepository.save(this.employeesRepository.create(data));
                }
                importedCount++;
            }
            catch (err) {
                errors.push(`Row ${i + 1}: ${err.message || err}`);
            }
        }
        return { imported: importedCount, errors };
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map