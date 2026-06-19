export interface SalaryComponentInput {
  ctc: number;
  basicPercent?: number;
  hraPercent?: number;
  pfDeduction?: boolean;
  employerContributionRate?: number;
  maxPfCap?: number;
  employeeEsiRate?: number;
  employerEsiRate?: number;
}

export interface SalaryComponents {
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
  gross_salary: number;
  ctc: number;
  employer_pf: number;
  employer_esi: number;
}

export const BASIC_PERCENT_OF_CTC = 50;
export const HRA_PERCENT_OF_BASIC = 40;
export const PF_WAGE_LIMIT = 15000;
export const ESI_WAGE_LIMIT = 21000;
export const EMPLOYEE_ESI_RATE = 0.0075;
export const EMPLOYER_ESI_RATE = 0.0325;

export function isPfApplicableForBasic(basicSalary: number, existingPfMember?: boolean): boolean {
  return existingPfMember === true || basicSalary <= PF_WAGE_LIMIT;
}

export function isEsiApplicableForBasic(basicSalary: number): boolean {
  return basicSalary < ESI_WAGE_LIMIT;
}

export function calculateSalaryComponentsFromCtc(input: SalaryComponentInput): SalaryComponents {
  const ctc = Number(input.ctc);
  const basicRatio = Number(input.basicPercent ?? BASIC_PERCENT_OF_CTC) / 100;
  const hraRatio = Number(input.hraPercent ?? HRA_PERCENT_OF_BASIC) / 100;
  const employerContributionRate = Number(input.employerContributionRate ?? 12) / 100;
  const maxPfCap = Number(input.maxPfCap ?? 1800);
  const employeeEsiRate = Number(input.employeeEsiRate ?? EMPLOYEE_ESI_RATE);
  const employerEsiRate = Number(input.employerEsiRate ?? EMPLOYER_ESI_RATE);

  const basic_salary = Number((basicRatio * ctc).toFixed(2));
  const hra = Number((hraRatio * basic_salary).toFixed(2));
  const pfApplicable = isPfApplicableForBasic(basic_salary, input.pfDeduction !== false);
  const esiApplicable = isEsiApplicableForBasic(basic_salary);
  const employer_pf = pfApplicable ? Number(Math.min(basic_salary * employerContributionRate, maxPfCap).toFixed(2)) : 0;
  const employer_esi = esiApplicable ? Number((basic_salary * employerEsiRate).toFixed(2)) : 0;
  const gross_salary = Number((ctc - employer_pf - employer_esi).toFixed(2));
  const special_allowance = 0;
  const other_allowance = Math.max(0, Number((gross_salary - basic_salary - hra).toFixed(2)));

  return {
    basic_salary,
    hra,
    special_allowance,
    other_allowance,
    gross_salary,
    ctc,
    employer_pf,
    employer_esi,
  };
}

export function calculateSalaryComponentsFromExistingRatios(
  input: SalaryComponentInput & { basicRatio: number; hraRatio: number },
): SalaryComponents {
  const ctc = Number(input.ctc);
  const employerContributionRate = Number(input.employerContributionRate ?? 12) / 100;
  const maxPfCap = Number(input.maxPfCap ?? 1800);
  const employeeEsiRate = Number(input.employeeEsiRate ?? EMPLOYEE_ESI_RATE);
  const employerEsiRate = Number(input.employerEsiRate ?? EMPLOYER_ESI_RATE);

  const basic_salary = Number((input.basicRatio * ctc).toFixed(2));
  const hra = Number((input.hraRatio * basic_salary).toFixed(2));
  const pfApplicable = isPfApplicableForBasic(basic_salary, input.pfDeduction !== false);
  const esiApplicable = isEsiApplicableForBasic(basic_salary);
  const employer_pf = pfApplicable ? Number(Math.min(basic_salary * employerContributionRate, maxPfCap).toFixed(2)) : 0;
  const employer_esi = esiApplicable ? Number((basic_salary * employerEsiRate).toFixed(2)) : 0;
  const gross_salary = Number((ctc - employer_pf - employer_esi).toFixed(2));
  const special_allowance = 0;
  const other_allowance = Math.max(0, Number((gross_salary - basic_salary - hra).toFixed(2)));

  return {
    basic_salary,
    hra,
    special_allowance,
    other_allowance,
    gross_salary,
    ctc,
    employer_pf,
    employer_esi,
  };
}
