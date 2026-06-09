import { Role, Permission } from '../common/enums/role.enum';
export declare const ROLE_PERMISSIONS: Record<Role, Permission[]>;
export declare function getRolePermissions(role: Role): Permission[];
export declare function hasPermission(role: Role, permission: Permission): boolean;
export declare const FEATURE_ROLE_MATRIX: {
    'User Management': {
        'Create User': Role[];
        'View Users': Role[];
        'Update User': Role[];
        'Delete User': Role[];
    };
    'Employee Management': {
        'Create Employee': Role[];
        'View Employee': Role[];
        'Update Employee': Role[];
        'Delete Employee': Role[];
        'Export Employees': Role[];
    };
    'Attendance & Leave Management': {
        'Manage Attendance': Role[];
        'Manage Leave': Role[];
        'Manage Holidays': Role[];
    };
    'Non-Payable Days Management': {
        'Create Non-Payable Day': Role[];
        'View Non-Payable Days': Role[];
        'Update Non-Payable Day': Role[];
        'Delete Non-Payable Day': Role[];
    };
    'Salary Structure Management': {
        'Create Salary Structure': Role[];
        'View Salary Structure': Role[];
        'Update Salary Structure': Role[];
        'Delete Salary Structure': Role[];
    };
    'Payroll Management': {
        'Generate Payroll': Role[];
        'View Payroll': Role[];
        'Update Payroll': Role[];
        'Delete Payroll': Role[];
        'Export Payroll': Role[];
    };
    'Tax Management': {
        'Create Tax Slab': Role[];
        'View Tax Slabs': Role[];
        'Update Tax Slab': Role[];
        'Delete Tax Slab': Role[];
    };
    'PF/ESI Settings': {
        'Manage PF Settings': Role[];
    };
    'Advances Management': {
        'Create Advance': Role[];
        'View Advances': Role[];
        'Update Advance': Role[];
        'Delete Advance': Role[];
    };
    Reports: {
        'HR Reports': Role[];
        'Payroll Reports': Role[];
        'Financial Dashboards': Role[];
    };
    'System Configuration': {
        'Company Settings': Role[];
        'Audit Logs': Role[];
    };
};
