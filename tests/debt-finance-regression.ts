import {
  calculateDebtPayment,
  calculateDebtTotals,
  estimateEffectiveAnnualRate,
} from "../src/lib/debt-finance";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

function assertAlmostEqual(actual: number, expected: number, message: string) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

assertAlmostEqual(
  calculateDebtPayment({
    principal: 1200,
    annualRate: 12,
    termMonths: 12,
  }),
  106.27,
  "debt payment uses amortized finite term",
);

assertAlmostEqual(
  estimateEffectiveAnnualRate({
    principal: 1000,
    installmentAmount: 100,
    termMonths: 12,
  }),
  41.3,
  "effective annual rate is estimated from payment stream",
);

const totals = calculateDebtTotals({
  principal: 1200,
  annualRate: 12,
  termMonths: 12,
});

assertAlmostEqual(
  totals.installmentAmount,
  106.27,
  "debt totals infer installment from principal, rate and term",
);
assertAlmostEqual(totals.totalCost ?? 0, 1275.29, "debt totals compute total cost");
assertAlmostEqual(
  totals.totalInterest ?? 0,
  75.29,
  "debt totals compute total interest",
);
assertEqual(totals.fireImpact > 0, true, "debt totals compute FIRE impact");
