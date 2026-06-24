import { shouldIncludeAdvanceForPayrollRecovery } from './advance-recovery.util';

describe('shouldIncludeAdvanceForPayrollRecovery', () => {
  it('excludes advances that are marked as manual', () => {
    expect(
      shouldIncludeAdvanceForPayrollRecovery({
        entry_type: 'manual',
        is_fully_recovered: false,
        remaining_amount: 1000,
      } as any),
    ).toBe(false);
  });

  it('excludes advances that are already fully recovered', () => {
    expect(
      shouldIncludeAdvanceForPayrollRecovery({
        entry_type: 'payroll',
        is_fully_recovered: true,
        remaining_amount: 0,
      } as any),
    ).toBe(false);
  });

  it('includes only payroll-entry advances that still have an outstanding balance', () => {
    expect(
      shouldIncludeAdvanceForPayrollRecovery({
        entry_type: 'payroll',
        is_fully_recovered: false,
        remaining_amount: 250,
      } as any),
    ).toBe(true);
  });
});
