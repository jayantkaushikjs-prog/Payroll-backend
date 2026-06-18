export function getFinancialYear(month: number, year: number): string {
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function getCompletedFinancialYearMonthsBefore(month: number): number {
  return month >= 4 ? month - 4 : 8 + month;
}

export function getRemainingFinancialYearMonthsExcludingCurrent(month: number): number {
  return month >= 4 ? 15 - month : 3 - month;
}

