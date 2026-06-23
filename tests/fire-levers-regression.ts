import {
  confirmedTransactionsSummary,
  freedomNumber,
} from "../src/lib/finance";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const summary = confirmedTransactionsSummary([], {
  fixedMonthlyExpenses: [
    {
      name: "Transporte mensual",
      category: "transporte",
      monthlyAmount: 120,
      currency: "USD",
      active: true,
    },
    {
      name: "Comida vieja",
      category: "comida",
      monthlyAmount: 80,
      currency: "USD",
      active: false,
    },
  ],
});

assertEqual(
  summary.coreMonthlyExpenses.transporte,
  120,
  "active fixed transport expense is included in FIRE levers",
);
assertEqual(
  summary.coreMonthlyExpenses.comida,
  0,
  "inactive fixed core expenses are ignored",
);
assertEqual(
  summary.monthlyConfirmedExpenses,
  120,
  "active fixed expenses increase monthly FIRE lever expenses",
);
assertEqual(
  summary.confirmedFireNumber,
  freedomNumber(120),
  "active fixed expenses increase confirmed FIRE number",
);
