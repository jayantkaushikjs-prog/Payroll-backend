export interface ManualReturnState {
  returnAmount: number;
  newRecovered: number;
  newRemaining: number;
  isFullyRecovered: boolean;
  status: 'returned' | 'partially_returned';
}

export function calculateManualReturnState(options: {
  amount: number;
  remainingBefore: number;
  totalRecovered: number;
  originalAmount: number;
}): ManualReturnState {
  const requestedAmount = Number(options.amount || 0);
  const safeRemainingBefore = Math.max(0, Number(options.remainingBefore || 0));
  const returnAmount = Math.min(requestedAmount, safeRemainingBefore);
  const newRecovered = Number((Number(options.totalRecovered || 0) + returnAmount).toFixed(2));
  const newRemaining = Math.max(0, Number((Number(options.originalAmount) - newRecovered).toFixed(2)));
  const isFullyRecovered = newRemaining <= 0.01;

  return {
    returnAmount,
    newRecovered,
    newRemaining,
    isFullyRecovered,
    status: isFullyRecovered ? 'returned' : 'partially_returned',
  };
}
