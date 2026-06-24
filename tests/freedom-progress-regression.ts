import {
  calculateEffectiveInputs,
  freedomNumber,
  freedomProgressMetrics,
} from "../src/lib/finance";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const targetAmount = freedomNumber(4000);
const progress = freedomProgressMetrics({
  investedCapital: 900000,
  targetAmount,
  monthlyContribution: 0,
  annualReturnPercent: 0,
});

assertEqual(
  progress.currentAmount,
  900000,
  "freedom progress uses invested capital as current amount",
);
assertEqual(
  progress.completed,
  75,
  "freedom progress ignores higher net worth and uses invested capital",
);
assertEqual(
  progress.remaining,
  300000,
  "freedom remaining is measured against invested capital",
);

const effectiveInputs = calculateEffectiveInputs(
  {
    netWorth: 1991,
    investedCapital: 0,
    estimatedMonthlyIncome: 0,
    desiredMonthlySpend: 0,
    monthlyContribution: 0,
    expectedAnnualReturn: 7,
  },
  {
    netWorthDelta: 450,
    investedDelta: 300,
    recurringMonthlyExpenses: 0,
  },
  {
    wealthAssets: [
      {
        id: "cash",
        name: "Efectivo",
        category: "efectivo",
        estimatedValue: 1200,
        debtBalance: 0,
        countsAsInvestmentCapital: false,
      },
      {
        id: "car",
        name: "Auto",
        category: "vehiculo",
        estimatedValue: 5000,
        debtBalance: 1500,
        countsAsInvestmentCapital: false,
      },
    ],
  },
);

assertEqual(
  effectiveInputs.netWorth,
  5450,
  "current net worth is explicit assets plus confirmed net worth changes and investments",
);
