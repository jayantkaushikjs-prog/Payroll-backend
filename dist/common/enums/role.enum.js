"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "Super Admin";
    Role["FINANCE"] = "Finance";
    Role["HR"] = "HR";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    Permission["MANAGE_USERS"] = "manage_users";
    Permission["MANAGE_ROLES"] = "manage_roles";
    Permission["CREATE_EMPLOYEE"] = "create_employee";
    Permission["VIEW_EMPLOYEE"] = "view_employee";
    Permission["UPDATE_EMPLOYEE"] = "update_employee";
    Permission["DELETE_EMPLOYEE"] = "delete_employee";
    Permission["EXPORT_EMPLOYEES"] = "export_employees";
    Permission["MANAGE_ATTENDANCE"] = "manage_attendance";
    Permission["MANAGE_LEAVE"] = "manage_leave";
    Permission["MANAGE_HOLIDAYS"] = "manage_holidays";
    Permission["MANAGE_NON_PAYABLE_DAYS"] = "manage_non_payable_days";
    Permission["MANAGE_SALARY_STRUCTURES"] = "manage_salary_structures";
    Permission["GENERATE_PAYROLL"] = "generate_payroll";
    Permission["VIEW_PAYROLL"] = "view_payroll";
    Permission["UPDATE_PAYROLL"] = "update_payroll";
    Permission["EXPORT_PAYROLL"] = "export_payroll";
    Permission["MANAGE_TAX_SLABS"] = "manage_tax_slabs";
    Permission["MANAGE_PF_SETTINGS"] = "manage_pf_settings";
    Permission["MANAGE_ADVANCES"] = "manage_advances";
    Permission["VIEW_ADVANCES"] = "view_advances";
    Permission["VIEW_HR_REPORTS"] = "view_hr_reports";
    Permission["VIEW_PAYROLL_REPORTS"] = "view_payroll_reports";
    Permission["VIEW_FINANCIAL_DASHBOARDS"] = "view_financial_dashboards";
    Permission["MANAGE_COMPANY_SETTINGS"] = "manage_company_settings";
    Permission["VIEW_AUDIT_LOGS"] = "view_audit_logs";
})(Permission || (exports.Permission = Permission = {}));
//# sourceMappingURL=role.enum.js.map