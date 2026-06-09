import { Response } from 'express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    downloadCsv(res: Response): Promise<Response<any, Record<string, any>>>;
    create(createEmployeeDto: CreateEmployeeDto): Promise<import("./employee.entity").Employee>;
    importCsv(csvContent: string): Promise<{
        imported: number;
        errors: string[];
    }>;
    findAll(req: any): Promise<import("./employee.entity").Employee[]>;
    findOne(id: string, req: any): Promise<import("./employee.entity").Employee>;
    update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<import("./employee.entity").Employee>;
    remove(id: string): Promise<void>;
}
