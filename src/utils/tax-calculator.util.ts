export interface TaxSlabInput {
  from_amount: number | string;
  to_amount: number | string | null;
  percentage: number | string;
}

const DEFAULT_NEW_SLABS = [
  { from_amount: 0, to_amount: 400000, percentage: 0 },
  { from_amount: 400000, to_amount: 800000, percentage: 5 },
  { from_amount: 800000, to_amount: 1200000, percentage: 10 },
  { from_amount: 1200000, to_amount: 1600000, percentage: 15 },
  { from_amount: 1600000, to_amount: 2000000, percentage: 20 },
  { from_amount: 2000000, to_amount: 2400000, percentage: 25 },
  { from_amount: 2400000, to_amount: null, percentage: 30 },
];

export function calculateAnnualTax(
  projectedAnnualIncome: number,
  regime?: string,
  slabsInput?: TaxSlabInput[]
): number {
  // Always use the new regime tax slabs and rules
  const slabs = slabsInput && slabsInput.length > 0 
    ? slabsInput 
    : DEFAULT_NEW_SLABS;

  // Standard Deduction: ₹75,000 (salaried employees)
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, projectedAnnualIncome - standardDeduction);

  // Calculate progressive tax on taxable income
  let baseTax = 0;
  for (const slab of slabs) {
    const from = Number(slab.from_amount);
    const to = slab.to_amount ? Number(slab.to_amount) : Infinity;
    const rate = Number(slab.percentage) / 100;

    if (taxableIncome > from) {
      const taxableInSlab = Math.min(taxableIncome, to) - from;
      if (taxableInSlab > 0) {
        baseTax += taxableInSlab * rate;
      }
    }
  }

  // Section 87A Rebate: up to ₹60,000 if taxable income <= ₹12 lakh
  // Marginal relief near ₹12 lakh threshold
  let taxBeforeSurcharge = baseTax;
  if (taxableIncome <= 1200000) {
    taxBeforeSurcharge = 0;
  } else {
    const excessIncomeOver12L = taxableIncome - 1200000;
    if (baseTax > excessIncomeOver12L) {
      taxBeforeSurcharge = excessIncomeOver12L;
    }
  }

  // Surcharge support for high-income taxpayers (with marginal relief)
  let taxAndSurcharge = taxBeforeSurcharge;

  if (taxableIncome > 5000000) {
    let surchargeRate = 0;
    let threshold = 5000000;
    let thresholdSurchargeRate = 0;

    if (taxableIncome <= 10000000) {
      surchargeRate = 0.10;
      threshold = 5000000;
      thresholdSurchargeRate = 0;
    } else if (taxableIncome <= 20000000) {
      surchargeRate = 0.15;
      threshold = 10000000;
      thresholdSurchargeRate = 0.10;
    } else {
      surchargeRate = 0.25;
      threshold = 20000000;
      thresholdSurchargeRate = 0.15;
    }

    // Calculate progressive tax at threshold
    let taxAtThreshold = 0;
    for (const slab of slabs) {
      const from = Number(slab.from_amount);
      const to = slab.to_amount ? Number(slab.to_amount) : Infinity;
      const rate = Number(slab.percentage) / 100;

      if (threshold > from) {
        const taxableInSlab = Math.min(threshold, to) - from;
        if (taxableInSlab > 0) {
          taxAtThreshold += taxableInSlab * rate;
        }
      }
    }

    let taxBeforeSurchargeAtThreshold = taxAtThreshold;
    if (threshold <= 1200000) {
      taxBeforeSurchargeAtThreshold = 0;
    } else {
      const excessIncomeOver12L = threshold - 1200000;
      if (taxAtThreshold > excessIncomeOver12L) {
        taxBeforeSurchargeAtThreshold = excessIncomeOver12L;
      }
    }

    const surchargeAtThreshold = taxBeforeSurchargeAtThreshold * thresholdSurchargeRate;
    const totalAtThreshold = taxBeforeSurchargeAtThreshold + surchargeAtThreshold;

    const currentSurcharge = taxBeforeSurcharge * surchargeRate;
    const currentTotal = taxBeforeSurcharge + currentSurcharge;

    const excessIncomeOverThreshold = taxableIncome - threshold;
    const maxAllowed = totalAtThreshold + excessIncomeOverThreshold;

    if (currentTotal > maxAllowed) {
      taxAndSurcharge = maxAllowed;
    } else {
      taxAndSurcharge = currentTotal;
    }
  }

  // Health & Education Cess: 4%
  const cess = taxAndSurcharge * 0.04;
  return taxAndSurcharge + cess;
}
