import { calculateSalaryComponentsFromCtc } from './salary-components.util';

describe('calculateSalaryComponentsFromCtc', () => {
  it('computes gross salary as CTC minus employer PF and employer ESI contributions', () => {
    const result = calculateSalaryComponentsFromCtc({
      ctc: 100000,
      basicPercent: 50,
      hraPercent: 40,
      pfDeduction: true,
      employerContributionRate: 12,
      maxPfCap: 1800,
      employerEsiRate: 3.25,
    });

    expect(result.gross_salary).toBe(Number((100000 - result.employer_pf - result.employer_esi).toFixed(2)));
    expect(result.gross_salary).toBeLessThan(result.ctc);
  });
});
