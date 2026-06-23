import {
  DEFAULT_UYU_PER_USD_ANALYSIS_RATE,
  createMoney,
  usdAmountForCalculation,
} from "../src/lib/money";
import { analyzeFinancialNote } from "../src/lib/financial-notes";
import { confirmedTransactionsSummary } from "../src/lib/finance";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertThrows(action: () => unknown, message: string) {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(threw, message);
}

const usdMoney = createMoney({ amount: 1500, currency: "USD" });

assertEqual(usdMoney.amount, 1500, "USD money preserves original amount");
assertEqual(usdMoney.currency, "USD", "USD money normalizes currency");
assertEqual(usdMoney.usdAmount, 1500, "USD money uses original amount as USD");
assertEqual(usdMoney.conversionStatus, "exact", "USD money is exact");

const exactUyuMoney = createMoney({
  amount: 1000,
  currency: "UYU",
  usdConversion: {
    originalAmount: 1000,
    originalCurrency: "UYU",
    convertedAmount: 25,
    convertedCurrency: "USD",
    rate: 40,
    date: "2026-06-21",
    source: "DolarAPI",
  },
});

assertEqual(exactUyuMoney.usdAmount, 25, "UYU money uses stored conversion");
assertEqual(exactUyuMoney.conversionStatus, "exact", "Stored UYU conversion is exact");

const fallbackUyuMoney = createMoney({ amount: 1000, currency: "UYU" });

assertEqual(
  fallbackUyuMoney.usdAmount,
  1000 / DEFAULT_UYU_PER_USD_ANALYSIS_RATE,
  "UYU money falls back when no quote exists",
);
assertEqual(
  fallbackUyuMoney.conversionStatus,
  "fallback",
  "UYU money marks fallback conversion",
);

const missingMoney = createMoney({ amount: 100, currency: "EUR" });

assertEqual(missingMoney.usdAmount, 0, "Missing money has no usable USD amount");
assertEqual(missingMoney.conversionStatus, "missing", "Unsupported conversion is missing");
assertThrows(
  () => usdAmountForCalculation(missingMoney, "EUR test"),
  "Missing money cannot be used in USD calculations",
);

const fallbackNoteItem = analyzeFinancialNote(
  "Gaste UYU 1000 en comida",
  new Date("2026-06-18T12:00:00Z"),
  { defaultCurrency: "UYU" },
)[0];

assertEqual(
  fallbackNoteItem.money.conversionStatus,
  "fallback",
  "Detected UYU note item carries fallback Money",
);
assertEqual(fallbackNoteItem.money.usdAmount, 25, "Detected UYU fallback stores USD amount");

const exactNoteItem = analyzeFinancialNote(
  "Gaste UYU 1000 en comida",
  new Date("2026-06-18T12:00:00Z"),
  {
    defaultCurrency: "UYU",
    dailyUsdQuote: {
      uyuPerUsd: 50,
      date: "2026-06-18",
      source: "DolarAPI",
    },
  },
)[0];

assertEqual(
  exactNoteItem.money.conversionStatus,
  "exact",
  "Detected UYU note item carries exact Money when quote exists",
);
assertEqual(exactNoteItem.money.usdAmount, 20, "Detected UYU exact quote stores USD amount");

const summary = confirmedTransactionsSummary([
  {
    type: "gasto",
    amount: 1000,
    currency: "UYU",
    date: "2026-06-20",
    category: "comida",
    recurring: false,
    intent: "real",
    ignored: false,
    money: fallbackNoteItem.money,
  },
]);

assertEqual(summary.confirmedExpenses, 25, "Summary consumes Money USD amount");
assertEqual(summary.netWorthDelta, -25, "Summary uses Money for net worth delta");

console.log("Money regression tests passed");
