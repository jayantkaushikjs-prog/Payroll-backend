export function shouldIncludeAdvanceForPayrollRecovery(advance: {
  entry_type?: 'manual' | 'payroll' | string | null;
  is_fully_recovered?: boolean | null;
  remaining_amount?: number | string | null;
}): boolean {
  if (advance?.entry_type !== 'payroll') return false;
  if (advance?.is_fully_recovered) return false;

  const remainingAmount = Number(advance?.remaining_amount ?? 0);
  return remainingAmount > 0;
}
