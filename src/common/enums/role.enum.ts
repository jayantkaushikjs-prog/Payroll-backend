export enum Role {
  SUPER_ADMIN = 'Super Admin',
  FINANCE = 'Finance',
  HR = 'HR',
}

export enum Permission {
  // User Management
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',

  // Employee Management (HR)
  CREATE_EMPLOYEE = 'create_employee',
  VIEW_EMPLOYEE = 'view_employee',
  UPDATE_EMPLOYEE = 'update_employee',
  DELETE_EMPLOYEE = 'delete_employee',
  EXPORT_EMPLOYEES = 'export_employees',

  // Attendance & Leave (HR)
  MANAGE_ATTENDANCE = 'manage_attendance',
  MANAGE_LEAVE = 'manage_leave',
  MANAGE_HOLIDAYS = 'manage_holidays',

  // Non-Payable Days (HR)
  MANAGE_NON_PAYABLE_DAYS = 'manage_non_payable_days',

  // Salary Structure (Finance)
  MANAGE_SALARY_STRUCTURES = 'manage_salary_structures',

  // Payroll (Finance)
  GENERATE_PAYROLL = 'generate_payroll',
  VIEW_PAYROLL = 'view_payroll',
  UPDATE_PAYROLL = 'update_payroll',
  EXPORT_PAYROLL = 'export_payroll',

  // Tax (Finance)
  MANAGE_TAX_SLABS = 'manage_tax_slabs',

  // PF/ESI (Finance)
  MANAGE_PF_SETTINGS = 'manage_pf_settings',

  // Advances (Finance/HR)
  MANAGE_ADVANCES = 'manage_advances',
  VIEW_ADVANCES = 'view_advances',

  // Reports
  VIEW_HR_REPORTS = 'view_hr_reports',
  VIEW_PAYROLL_REPORTS = 'view_payroll_reports',
  VIEW_FINANCIAL_DASHBOARDS = 'view_financial_dashboards',

  // System Settings
  MANAGE_COMPANY_SETTINGS = 'manage_company_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
}
