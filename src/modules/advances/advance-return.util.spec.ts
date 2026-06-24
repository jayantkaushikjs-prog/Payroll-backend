import { calculateManualReturnState } from './advance-return.util';

describe('calculateManualReturnState', () => {
  it('marks the advance as partially returned when the payment is less than the outstanding balance', () => {
    const result = calculateManualReturnState({
      amount: 300,
      remainingBefore: 1000,
      totalRecovered: 200,
      originalAmount: 1200,
    });

    expect(result.returnAmount).toBe(300);
    expect(result.newRecovered).toBe(500);
    expect(result.newRemaining).toBe(700);
    expect(result.isFullyRecovered).toBe(false);
    expect(result.status).toBe('partially_returned');
  });

  it('marks the advance as fully returned when the payment clears the remaining balance', () => {
    const result = calculateManualReturnState({
      amount: 1000,
      remainingBefore: 1000,
      totalRecovered: 200,
      originalAmount: 1200,
    });

    expect(result.returnAmount).toBe(1000);
    expect(result.newRecovered).toBe(1200);
    expect(result.newRemaining).toBe(0);
    expect(result.isFullyRecovered).toBe(true);
    expect(result.status).toBe('returned');
  });
});
