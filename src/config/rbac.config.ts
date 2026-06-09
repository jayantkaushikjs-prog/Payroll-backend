import { Role, Permission } from '../common/enums/role.enum';

/**
 * Complete RBAC Configuration - Maps each role to its permitted actions
 * This is the single source of truth for role-permission mappings
 */

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // User Management
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    // Employee Management
    Permission.CREATE_EMPLOYEE,
    Permission.VIEW_EMPLOYEE,
    Permission.UPDATE_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.EXPORT_EMPLOYEES,
    // Attendance & Leave
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_LEAVE,
    Permission.MANAGE_HOLIDAYS,
    // Non-Payable Days
    Permission.MANAGE_NON_PAYABLE_DAYS,
    // Salary Structure
    Permission.MANAGE_SALARY_STRUCTURES,
    // Payroll
    Permission.GENERATE_PAYROLL,
    Permission.VIEW_PAYROLL,
    Permission.UPDATE_PAYROLL,
    Permission.EXPORT_PAYROLL,
    // Tax
    Permission.MANAGE_TAX_SLABS,
    // PF/ESI
    Permission.MANAGE_PF_SETTINGS,
    // Advances
    Permission.MANAGE_ADVANCES,
    Permission.VIEW_ADVANCES,
    // Reports
    Permission.VIEW_HR_REPORTS,
    Permission.VIEW_PAYROLL_REPORTS,
    Permission.VIEW_FINANCIAL_DASHBOARDS,
    // System
    Permission.MANAGE_COMPANY_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [Role.HR]: [
    // Employee Management
    Permission.CREATE_EMPLOYEE,
    Permission.VIEW_EMPLOYEE,
    Permission.UPDATE_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.EXPORT_EMPLOYEES,
    // Attendance & Leave
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_LEAVE,
    Permission.MANAGE_HOLIDAYS,
    // Non-Payable Days
    Permission.MANAGE_NON_PAYABLE_DAYS,
    // Reports
    Permission.VIEW_HR_REPORTS,
  ],

  [Role.FINANCE]: [
    // Salary Structure
    Permission.MANAGE_SALARY_STRUCTURES,
    // Payroll
    Permission.GENERATE_PAYROLL,
    Permission.VIEW_PAYROLL,
    Permission.UPDATE_PAYROLL,
    Permission.EXPORT_PAYROLL,
    // Tax
    Permission.MANAGE_TAX_SLABS,
    // PF/ESI
    Permission.MANAGE_PF_SETTINGS,
    // Advances
    Permission.MANAGE_ADVANCES,
    Permission.VIEW_ADVANCES,
    // Reports
    Permission.VIEW_PAYROLL_REPORTS,
    Permission.VIEW_FINANCIAL_DASHBOARDS,
  ],
};

/**
 * Helper function to get permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Helper function to check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

/**
 * Feature to Role Matrix for documentation purposes
 * This provides a clear view of who can access what
 */
export const FEATURE_ROLE_MATRIX = {
  // User Management
  'User Management': {
    'Create User': [Role.SUPER_ADMIN],
    'View Users': [Role.SUPER_ADMIN],
    'Update User': [Role.SUPER_ADMIN],
    'Delete User': [Role.SUPER_ADMIN],
  },

  // Employee Management
  'Employee Management': {
    'Create Employee': [Role.SUPER_ADMIN, Role.HR],
    'View Employee': [Role.SUPER_ADMIN, Role.HR],
    'Update Employee': [Role.SUPER_ADMIN, Role.HR],
    'Delete Employee': [Role.SUPER_ADMIN, Role.HR],
    'Export Employees': [Role.SUPER_ADMIN, Role.HR],
  },

  // Attendance & Leave
  'Attendance & Leave Management': {
    'Manage Attendance': [Role.SUPER_ADMIN, Role.HR],
    'Manage Leave': [Role.SUPER_ADMIN, Role.HR],
    'Manage Holidays': [Role.SUPER_ADMIN, Role.HR],
  },

  // Non-Payable Days
  'Non-Payable Days Management': {
    'Create Non-Payable Day': [Role.SUPER_ADMIN, Role.HR],
    'View Non-Payable Days': [Role.SUPER_ADMIN, Role.HR],
    'Update Non-Payable Day': [Role.SUPER_ADMIN, Role.HR],
    'Delete Non-Payable Day': [Role.SUPER_ADMIN, Role.HR],
  },

  // Salary Structure
  'Salary Structure Management': {
    'Create Salary Structure': [Role.SUPER_ADMIN, Role.FINANCE],
    'View Salary Structure': [Role.SUPER_ADMIN, Role.FINANCE],
    'Update Salary Structure': [Role.SUPER_ADMIN, Role.FINANCE],
    'Delete Salary Structure': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // Payroll
  'Payroll Management': {
    'Generate Payroll': [Role.SUPER_ADMIN, Role.FINANCE],
    'View Payroll': [Role.SUPER_ADMIN, Role.FINANCE],
    'Update Payroll': [Role.SUPER_ADMIN, Role.FINANCE],
    'Delete Payroll': [Role.SUPER_ADMIN, Role.FINANCE],
    'Export Payroll': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // Tax
  'Tax Management': {
    'Create Tax Slab': [Role.SUPER_ADMIN, Role.FINANCE],
    'View Tax Slabs': [Role.SUPER_ADMIN, Role.FINANCE],
    'Update Tax Slab': [Role.SUPER_ADMIN, Role.FINANCE],
    'Delete Tax Slab': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // PF/ESI
  'PF/ESI Settings': {
    'Manage PF Settings': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // Advances
  'Advances Management': {
    'Create Advance': [Role.SUPER_ADMIN, Role.FINANCE],
    'View Advances': [Role.SUPER_ADMIN, Role.FINANCE],
    'Update Advance': [Role.SUPER_ADMIN, Role.FINANCE],
    'Delete Advance': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // Reports
  Reports: {
    'HR Reports': [Role.SUPER_ADMIN, Role.HR],
    'Payroll Reports': [Role.SUPER_ADMIN, Role.FINANCE],
    'Financial Dashboards': [Role.SUPER_ADMIN, Role.FINANCE],
  },

  // System Settings
  'System Configuration': {
    'Company Settings': [Role.SUPER_ADMIN],
    'Audit Logs': [Role.SUPER_ADMIN],
  },
};
