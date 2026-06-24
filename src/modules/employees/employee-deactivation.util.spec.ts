import { hasPendingEmployeeDeductions } from './employee-deactivation.util';

describe('hasPendingEmployeeDeductions', () => {
  it('returns true when any deduction balance remains', () => {
    expect(hasPendingEmployeeDeductions({ damages_recovery: 1, other_deductions: 0 } as any, 1000)).toBe(true);
    expect(hasPendingEmployeeDeductions({ damages_recovery: 0, other_deductions: 1 } as any, 1000)).toBe(true);
    expect(hasPendingEmployeeDeductions({ damages_recovery: 5000, other_deductions: 0 } as any, 2000)).toBe(true);
  });

  it('returns false when no deduction balance remains', () => {
    expect(hasPendingEmployeeDeductions({ damages_recovery: 0, other_deductions: 0 } as any, 5000)).toBe(false);
  });
});
