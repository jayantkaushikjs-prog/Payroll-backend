import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
export declare class EmployeesService {
    private employeesRepository;
    constructor(employeesRepository: Repository<Employee>);
    create(createEmployeeDto: CreateEmployeeDto): Promise<Employee>;
    findAll(): Promise<Employee[]>;
    findOne(id: number): Promise<Employee>;
    update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee>;
    remove(id: number): Promise<void>;
    countAll(): Promise<number>;
    countEmployees(): Promise<{
        total: number;
        active: number;
    }>;
    countNewJoinees(month: number, year: number): Promise<number>;
    getDepartmentDistribution(): Promise<{
        department: string;
        count: number;
    }[]>;
    getRecentEmployeeActivities(limit?: number): Promise<{
        title: string;
        description: string;
        date: Date | string;
    }[]>;
    generateCsv(employees: Employee[]): string;
    importCsv(csvContent: string): Promise<{
        imported: number;
        errors: string[];
    }>;
    private parseCsvLine;
}
