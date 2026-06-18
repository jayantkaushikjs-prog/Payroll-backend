export interface SalaryComponentInput {
  ctc: number;
  basicPercent?: number;
  hraPercent?: number;
  pfDeduction?: boolean;
  employerContributionRate?: number;
  maxPfCap?: number;
}

export interface SalaryComponents {
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
  gross_salary: number;
  ctc: number;
}

export function calculateSalaryComponentsFromCtc(input: SalaryComponentInput): SalaryComponents {
  const ctc = Number(input.ctc);
  const basicRatio = Number(input.basicPercent ?? 50) / 100;
  const hraRatio = Number(input.hraPercent ?? 40) / 100;
  const employerContributionRate = Number(input.employerContributionRate ?? 12) / 100;
  const maxPfCap = Number(input.maxPfCap ?? 1800);

  let gross_salary = ctc;
  if (input.pfDeduction !== false) {
    const gross_salary_uncapped = ctc / (1 + employerContributionRate);
    if (gross_salary_uncapped * employerContributionRate > maxPfCap) {
      gross_salary = ctc - maxPfCap;
    } else {
      gross_salary = gross_salary_uncapped;
    }
  }

  gross_salary = Number(gross_salary.toFixed(2));
  const basic_salary = Number((basicRatio * gross_salary).toFixed(2));
  const hra = Number((hraRatio * basic_salary).toFixed(2));
  const special_allowance = 0;
  const other_allowance = Number((gross_salary - basic_salary - hra).toFixed(2));

  return {
    basic_salary,
    hra,
    special_allowance,
    other_allowance,
    gross_salary,
    ctc,
  };
}

export function calculateSalaryComponentsFromExistingRatios(
  input: SalaryComponentInput & { basicRatio: number; hraRatio: number },
): SalaryComponents {
  const ctc = Number(input.ctc);
  const employerContributionRate = Number(input.employerContributionRate ?? 12) / 100;
  const maxPfCap = Number(input.maxPfCap ?? 1800);

  let gross_salary = ctc;
  if (input.pfDeduction !== false) {
    const grossSalaryUncapped = ctc / (1 + employerContributionRate);
    if (grossSalaryUncapped * employerContributionRate > maxPfCap) {
      gross_salary = ctc - maxPfCap;
    } else {
      gross_salary = grossSalaryUncapped;
    }
  }

  gross_salary = Number(gross_salary.toFixed(2));
  const basic_salary = Number((input.basicRatio * gross_salary).toFixed(2));
  const hra = Number((input.hraRatio * basic_salary).toFixed(2));
  const special_allowance = 0;
  const other_allowance = Number((gross_salary - basic_salary - hra).toFixed(2));

  return {
    basic_salary,
    hra,
    special_allowance,
    other_allowance,
    gross_salary,
    ctc,
  };
}

