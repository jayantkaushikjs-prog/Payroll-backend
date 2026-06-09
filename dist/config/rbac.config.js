"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_ROLE_MATRIX = exports.ROLE_PERMISSIONS = void 0;
exports.getRolePermissions = getRolePermissions;
exports.hasPermission = hasPermission;
const role_enum_1 = require("../common/enums/role.enum");
exports.ROLE_PERMISSIONS = {
    [role_enum_1.Role.SUPER_ADMIN]: [
        role_enum_1.Permission.MANAGE_USERS,
        role_enum_1.Permission.MANAGE_ROLES,
        role_enum_1.Permission.CREATE_EMPLOYEE,
        role_enum_1.Permission.VIEW_EMPLOYEE,
        role_enum_1.Permission.UPDATE_EMPLOYEE,
        role_enum_1.Permission.DELETE_EMPLOYEE,
        role_enum_1.Permission.EXPORT_EMPLOYEES,
        role_enum_1.Permission.MANAGE_ATTENDANCE,
        role_enum_1.Permission.MANAGE_LEAVE,
        role_enum_1.Permission.MANAGE_HOLIDAYS,
        role_enum_1.Permission.MANAGE_NON_PAYABLE_DAYS,
        role_enum_1.Permission.MANAGE_SALARY_STRUCTURES,
        role_enum_1.Permission.GENERATE_PAYROLL,
        role_enum_1.Permission.VIEW_PAYROLL,
        role_enum_1.Permission.UPDATE_PAYROLL,
        role_enum_1.Permission.EXPORT_PAYROLL,
        role_enum_1.Permission.MANAGE_TAX_SLABS,
        role_enum_1.Permission.MANAGE_PF_SETTINGS,
        role_enum_1.Permission.MANAGE_ADVANCES,
        role_enum_1.Permission.VIEW_ADVANCES,
        role_enum_1.Permission.VIEW_HR_REPORTS,
        role_enum_1.Permission.VIEW_PAYROLL_REPORTS,
        role_enum_1.Permission.VIEW_FINANCIAL_DASHBOARDS,
        role_enum_1.Permission.MANAGE_COMPANY_SETTINGS,
        role_enum_1.Permission.VIEW_AUDIT_LOGS,
    ],
    [role_enum_1.Role.HR]: [
        role_enum_1.Permission.CREATE_EMPLOYEE,
        role_enum_1.Permission.VIEW_EMPLOYEE,
        role_enum_1.Permission.UPDATE_EMPLOYEE,
        role_enum_1.Permission.DELETE_EMPLOYEE,
        role_enum_1.Permission.EXPORT_EMPLOYEES,
        role_enum_1.Permission.MANAGE_ATTENDANCE,
        role_enum_1.Permission.MANAGE_LEAVE,
        role_enum_1.Permission.MANAGE_HOLIDAYS,
        role_enum_1.Permission.MANAGE_NON_PAYABLE_DAYS,
        role_enum_1.Permission.VIEW_HR_REPORTS,
    ],
    [role_enum_1.Role.FINANCE]: [
        role_enum_1.Permission.MANAGE_SALARY_STRUCTURES,
        role_enum_1.Permission.GENERATE_PAYROLL,
        role_enum_1.Permission.VIEW_PAYROLL,
        role_enum_1.Permission.UPDATE_PAYROLL,
        role_enum_1.Permission.EXPORT_PAYROLL,
        role_enum_1.Permission.MANAGE_TAX_SLABS,
        role_enum_1.Permission.MANAGE_PF_SETTINGS,
        role_enum_1.Permission.MANAGE_ADVANCES,
        role_enum_1.Permission.VIEW_ADVANCES,
        role_enum_1.Permission.VIEW_PAYROLL_REPORTS,
        role_enum_1.Permission.VIEW_FINANCIAL_DASHBOARDS,
    ],
};
function getRolePermissions(role) {
    return exports.ROLE_PERMISSIONS[role] || [];
}
function hasPermission(role, permission) {
    return getRolePermissions(role).includes(permission);
}
exports.FEATURE_ROLE_MATRIX = {
    'User Management': {
        'Create User': [role_enum_1.Role.SUPER_ADMIN],
        'View Users': [role_enum_1.Role.SUPER_ADMIN],
        'Update User': [role_enum_1.Role.SUPER_ADMIN],
        'Delete User': [role_enum_1.Role.SUPER_ADMIN],
    },
    'Employee Management': {
        'Create Employee': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'View Employee': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Update Employee': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Delete Employee': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Export Employees': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
    },
    'Attendance & Leave Management': {
        'Manage Attendance': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Manage Leave': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Manage Holidays': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
    },
    'Non-Payable Days Management': {
        'Create Non-Payable Day': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'View Non-Payable Days': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Update Non-Payable Day': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Delete Non-Payable Day': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
    },
    'Salary Structure Management': {
        'Create Salary Structure': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'View Salary Structure': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Update Salary Structure': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Delete Salary Structure': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    'Payroll Management': {
        'Generate Payroll': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'View Payroll': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Update Payroll': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Delete Payroll': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Export Payroll': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    'Tax Management': {
        'Create Tax Slab': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'View Tax Slabs': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Update Tax Slab': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Delete Tax Slab': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    'PF/ESI Settings': {
        'Manage PF Settings': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    'Advances Management': {
        'Create Advance': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'View Advances': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Update Advance': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Delete Advance': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    Reports: {
        'HR Reports': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.HR],
        'Payroll Reports': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
        'Financial Dashboards': [role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.FINANCE],
    },
    'System Configuration': {
        'Company Settings': [role_enum_1.Role.SUPER_ADMIN],
        'Audit Logs': [role_enum_1.Role.SUPER_ADMIN],
    },
};
//# sourceMappingURL=rbac.config.js.map