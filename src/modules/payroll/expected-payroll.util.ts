export function calculateProratedMonthlyAmount(
  monthlyAmount: number,
  month: number,
  year: number,
  joiningDate?: string | null,
  relievingDate?: string | null,
): number {
  const normalizedAmount = Number(monthlyAmount || 0);
  if (!normalizedAmount) return 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month - 1, daysInMonth));

  const parseDateOnly = (value?: string | null): Date | null => {
    if (!value) return null;
    const [parsedYear, parsedMonth, parsedDay] = String(value).split('-').map(Number);
    if (!parsedYear || !parsedMonth || !parsedDay) return null;
    return new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));
  };

  const joining = parseDateOnly(joiningDate);
  const relieving = parseDateOnly(relievingDate);

  if (joining && monthEnd < joining) return 0;
  if (relieving && monthStart > relieving) return 0;

  let payableDays = daysInMonth;

  if (joining && joining.getUTCFullYear() === year && joining.getUTCMonth() + 1 === month) {
    payableDays = Math.max(0, payableDays - Math.max(0, joining.getUTCDate() - 1));
  }

  if (relieving && relieving.getUTCFullYear() === year && relieving.getUTCMonth() + 1 === month) {
    payableDays = Math.max(0, payableDays - Math.max(0, daysInMonth - relieving.getUTCDate()));
  }

  const ratio = daysInMonth > 0 ? payableDays / daysInMonth : 1;
  return Number((normalizedAmount * Math.max(0, Math.min(1, ratio))).toFixed(2));
}
