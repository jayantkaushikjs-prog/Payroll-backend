import { TAX_CONFIG, DEFAULT_FY } from '../config/tax.config';

export interface TaxSlabInput {
  from_amount: number | string;
  to_amount: number | string | null;
  percentage: number | string;
}

export interface SlabBreakdownItem {
  from: number;
  to: number | null;
  rate: number;
  taxableInSlab: number;
  taxAmount: number;
}

export interface TaxBreakdown {
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  slabs: SlabBreakdownItem[];
  baseTax: number;
  rebate: number;
  taxBeforeSurcharge: number;
  surcharge: number;
  cess: number;
  finalTax: number;
  monthlyTDS: number;
}

/**
 * Calculates progressive tax and returns a detailed breakdown object.
 */
export function calculateAnnualTaxWithBreakdown(
  projectedAnnualIncome: number,
  regime?: string,
  slabsInput?: TaxSlabInput[],
  financialYear?: string
): TaxBreakdown {
  const fy = financialYear && TAX_CONFIG[financialYear] ? financialYear : DEFAULT_FY;
  const activeRegime = regime === 'old' ? 'old' : 'new';
  const config = TAX_CONFIG[fy][activeRegime];

  // 1. Apply Standard Deduction
  const standardDeduction = config.standardDeduction;
  const taxableIncome = Math.max(0, projectedAnnualIncome - standardDeduction);

  // 2. Map Slabs from database input or use default configuration
  const slabs = slabsInput && slabsInput.length > 0
    ? slabsInput.map(s => ({
        from: Number(s.from_amount),
        to: s.to_amount ? Number(s.to_amount) : null,
        rate: Number(s.percentage),
      }))
    : config.slabs;

  // 3. Progressive Tax Computation
  let baseTax = 0;
  const slabBreakdowns: SlabBreakdownItem[] = [];

  for (const slab of slabs) {
    const from = slab.from;
    const to = slab.to !== null ? slab.to : Infinity;
    const rate = slab.rate / 100;

    let taxableInSlab = 0;
    if (taxableIncome > from) {
      taxableInSlab = Math.min(taxableIncome, to) - from;
    }
    taxableInSlab = Math.max(0, taxableInSlab);
    const taxAmount = Number(taxableInSlab * rate);
    baseTax += taxAmount;

    slabBreakdowns.push({
      from,
      to: slab.to,
      rate: slab.rate,
      taxableInSlab: Number(taxableInSlab.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
    });
  }

  baseTax = Number(baseTax.toFixed(2));

  // 4. Section 87A Rebate with Marginal Relief (Marginal Relief is New Regime specific)
  let rebate = 0;
  if (taxableIncome <= config.rebate.threshold) {
    rebate = baseTax; // Full rebate up to tax amount
  } else if (activeRegime === 'new') {
    // Check marginal relief: rebate = baseTax - (taxableIncome - threshold)
    const excessIncome = taxableIncome - config.rebate.threshold;
    if (baseTax > excessIncome) {
      rebate = baseTax - excessIncome;
    }
  }

  rebate = Number(rebate.toFixed(2));
  const taxBeforeSurcharge = Number(Math.max(0, baseTax - rebate).toFixed(2));

  // 5. Surcharge Calculation with Surcharge Marginal Relief
  let surchargeRate = 0;
  let activeThresholdObj = null;

  for (const s of config.surcharges) {
    if (taxableIncome > s.threshold) {
      surchargeRate = s.rate;
      activeThresholdObj = s;
    }
  }

  let surcharge = Number((taxBeforeSurcharge * surchargeRate).toFixed(2));
  let taxAndSurcharge = taxBeforeSurcharge + surcharge;

  if (activeThresholdObj) {
    const threshold = activeThresholdObj.threshold;
    
    // Calculate base tax at the threshold
    let baseTaxAtThreshold = 0;
    for (const slab of slabs) {
      const from = slab.from;
      const to = slab.to !== null ? slab.to : Infinity;
      const rate = slab.rate / 100;

      let taxableInSlab = 0;
      if (threshold > from) {
        taxableInSlab = Math.min(threshold, to) - from;
      }
      taxableInSlab = Math.max(0, taxableInSlab);
      baseTaxAtThreshold += taxableInSlab * rate;
    }

    const rebateAtThreshold = 0; // Surcharge thresholds are always > 12L, so 0 rebate
    const taxBeforeSurchargeAtThreshold = Math.max(0, baseTaxAtThreshold - rebateAtThreshold);

    // Find surcharge rate at threshold
    let thresholdSurchargeRate = 0;
    for (const s of config.surcharges) {
      if (threshold > s.threshold) {
        thresholdSurchargeRate = s.rate;
      }
    }

    const surchargeAtThreshold = taxBeforeSurchargeAtThreshold * thresholdSurchargeRate;
    const totalTaxAndSurchargeAtThreshold = taxBeforeSurchargeAtThreshold + surchargeAtThreshold;

    const excessIncomeOverThreshold = taxableIncome - threshold;
    const maxAllowedTaxAndSurcharge = totalTaxAndSurchargeAtThreshold + excessIncomeOverThreshold;

    if (taxAndSurcharge > maxAllowedTaxAndSurcharge) {
      taxAndSurcharge = maxAllowedTaxAndSurcharge;
      surcharge = Number(Math.max(0, taxAndSurcharge - taxBeforeSurcharge).toFixed(2));
    }
  }

  taxAndSurcharge = Number(taxAndSurcharge.toFixed(2));

  // 6. Cess: 4%
  const cess = Number((taxAndSurcharge * config.cessRate).toFixed(2));
  const finalTax = Number((taxAndSurcharge + cess).toFixed(2));
  const monthlyTDS = Number((finalTax / 12).toFixed(2));

  return {
    grossIncome: projectedAnnualIncome,
    standardDeduction,
    taxableIncome,
    slabs: slabBreakdowns,
    baseTax,
    rebate,
    taxBeforeSurcharge,
    surcharge,
    cess,
    finalTax,
    monthlyTDS,
  };
}

/**
 * Backwards compatible function that returns just the final annual tax number.
 */
export function calculateAnnualTax(
  projectedAnnualIncome: number,
  regime?: string,
  slabsInput?: TaxSlabInput[],
  financialYear?: string
): number {
  const breakdown = calculateAnnualTaxWithBreakdown(projectedAnnualIncome, regime, slabsInput, financialYear);
  return breakdown.finalTax;
}
