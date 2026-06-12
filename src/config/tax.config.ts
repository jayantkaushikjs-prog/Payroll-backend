export interface TaxSlabConfig {
  from: number;
  to: number | null;
  rate: number; // as a percentage (e.g. 5 for 5%)
}

export interface RebateConfig {
  threshold: number; // e.g. 12,00,000 or 5,00,000
  maxAmount: number; // e.g. 60,000 or 12,500
}

export interface SurchargeConfig {
  threshold: number; // e.g. 50,00,000
  rate: number; // as a fraction (e.g. 0.10 for 10%)
}

export interface FinancialYearTaxConfig {
  standardDeduction: number;
  cessRate: number; // as a fraction (e.g. 0.04 for 4%)
  slabs: TaxSlabConfig[];
  rebate: RebateConfig;
  surcharges: SurchargeConfig[];
}

export const TAX_CONFIG: Record<string, Record<'new' | 'old', FinancialYearTaxConfig>> = {
  '2025-2026': {
    new: {
      standardDeduction: 75000,
      cessRate: 0.04,
      rebate: {
        threshold: 1200000,
        maxAmount: 60000,
      },
      surcharges: [
        { threshold: 5000000, rate: 0.10 },
        { threshold: 10000000, rate: 0.15 },
        { threshold: 20000000, rate: 0.25 },
        { threshold: 50000000, rate: 0.25 }, // Capped at 25% under the new tax regime
      ],
      slabs: [
        { from: 0, to: 400000, rate: 0 },
        { from: 400000, to: 800000, rate: 5 },
        { from: 800000, to: 1200000, rate: 10 },
        { from: 1200000, to: 1600000, rate: 15 },
        { from: 1600000, to: 2000000, rate: 20 },
        { from: 2000000, to: 2400000, rate: 25 },
        { from: 2400000, to: null, rate: 30 },
      ],
    },
    old: {
      standardDeduction: 50000,
      cessRate: 0.04,
      rebate: {
        threshold: 500000,
        maxAmount: 12500,
      },
      surcharges: [
        { threshold: 5000000, rate: 0.10 },
        { threshold: 10000000, rate: 0.15 },
        { threshold: 20000000, rate: 0.25 },
        { threshold: 50000000, rate: 0.37 }, // Max 37% for old regime
      ],
      slabs: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: null, rate: 30 },
      ],
    },
  },
  '2026-2027': {
    new: {
      standardDeduction: 75000,
      cessRate: 0.04,
      rebate: {
        threshold: 1200000,
        maxAmount: 60000,
      },
      surcharges: [
        { threshold: 5000000, rate: 0.10 },
        { threshold: 10000000, rate: 0.15 },
        { threshold: 20000000, rate: 0.25 },
        { threshold: 50000000, rate: 0.25 }, // Capped at 25% under the new tax regime
      ],
      slabs: [
        { from: 0, to: 400000, rate: 0 },
        { from: 400000, to: 800000, rate: 5 },
        { from: 800000, to: 1200000, rate: 10 },
        { from: 1200000, to: 1600000, rate: 15 },
        { from: 1600000, to: 2000000, rate: 20 },
        { from: 2000000, to: 2400000, rate: 25 },
        { from: 2400000, to: null, rate: 30 },
      ],
    },
    old: {
      standardDeduction: 50000,
      cessRate: 0.04,
      rebate: {
        threshold: 500000,
        maxAmount: 12500,
      },
      surcharges: [
        { threshold: 5000000, rate: 0.10 },
        { threshold: 10000000, rate: 0.15 },
        { threshold: 20000000, rate: 0.25 },
        { threshold: 50000000, rate: 0.37 },
      ],
      slabs: [
        { from: 0, to: 250000, rate: 0 },
        { from: 250000, to: 500000, rate: 5 },
        { from: 500000, to: 1000000, rate: 20 },
        { from: 1000000, to: null, rate: 30 },
      ],
    },
  },
};

export const DEFAULT_FY = '2026-2027';
