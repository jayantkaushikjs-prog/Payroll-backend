import { calculateAnnualTaxWithBreakdown } from './tax-calculator.util';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

function runTests() {
  console.log('Running Income Tax Calculation Module Unit Tests...\n');

  // 1. Income below ₹4 lakh
  const tc1 = calculateAnnualTaxWithBreakdown(398200);
  assert(tc1.taxableIncome === 323200, 'TC1: Taxable income should be 323,200');
  assert(tc1.finalTax === 0, 'TC1: Tax should be 0');

  // 2. Income between ₹4–12 lakh (eligible for 87A rebate)
  const tc2 = calculateAnnualTaxWithBreakdown(798200);
  assert(tc2.taxableIncome === 723200, 'TC2: Taxable income should be 723,200');
  assert(tc2.baseTax === 16160, 'TC2: Base tax should be 16,160');
  assert(tc2.rebate === 16160, 'TC2: Rebate should be 16,160');
  assert(tc2.finalTax === 0, 'TC2: Tax should be 0');

  // 3. Income eligible for 87A rebate up to ₹12.75L Gross
  const tc3 = calculateAnnualTaxWithBreakdown(1275000);
  assert(tc3.taxableIncome === 1200000, 'TC3: Taxable income should be 1,200,000');
  assert(tc3.baseTax === 60000, 'TC3: Base tax should be 60,000');
  assert(tc3.rebate === 60000, 'TC3: Rebate should be 60,000');
  assert(tc3.finalTax === 0, 'TC3: Tax should be 0');

  // 4. Income above ₹24 lakh
  const tc4 = calculateAnnualTaxWithBreakdown(2498200);
  assert(tc4.taxableIncome === 2423200, 'TC4: Taxable income should be 2,423,200');
  assert(tc4.baseTax === 306960, 'TC4: Base tax should be 306,960');
  assert(tc4.rebate === 0, 'TC4: Rebate should be 0');
  assert(Math.abs(tc4.finalTax - 319238.4) < 1, 'TC4: Final tax should be approximately 3.19 Lakh (3,19,238)');

  // 5. Surcharge Threshold 50L (without marginal relief)
  const tc5 = calculateAnnualTaxWithBreakdown(6000000);
  assert(tc5.surcharge > 0, 'TC5: Surcharge should be calculated for income > 50L');
  assert(Math.abs(tc5.surcharge - tc5.taxBeforeSurcharge * 0.10) < 1, 'TC5: Surcharge rate should be 10%');

  // 6. Surcharge Marginal Relief at 50L
  const tc6 = calculateAnnualTaxWithBreakdown(5100000);
  assert(tc6.surcharge === 17500, 'TC6: Surcharge with marginal relief should be exactly 17,500');

  // 7. Monthly payroll calculations
  const monthlyTds1 = calculateAnnualTaxWithBreakdown(33183.33 * 12).monthlyTDS;
  const monthlyTds2 = calculateAnnualTaxWithBreakdown(208183.33 * 12).monthlyTDS;
  assert(monthlyTds1 === 0, 'TC7: Monthly TDS for 33,183 monthly gross should be 0');
  assert(Math.abs(monthlyTds2 - 26603.20) < 5, 'TC7: Monthly TDS for 2,08,183 monthly gross should be approx 26,603');

  console.log('\nAll Unit Tests Passed Successfully! 🎉');
}

runTests();
