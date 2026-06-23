import {
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
