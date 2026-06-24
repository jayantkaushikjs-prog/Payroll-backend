export function hasPendingEmployeeDeductions(
  employee: { damages_recovery?: number | null; other_deductions?: number | null },
  _netPayableAmount: number | null | undefined = 0,
): boolean {
  const damagesRecovery = Number(employee?.damages_recovery || 0);
  const otherDeductions = Number(employee?.other_deductions || 0);
  const pendingBalance = damagesRecovery + otherDeductions;

  return pendingBalance > 0;
}
