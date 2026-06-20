import {
  createFixedMonthlyExpenseDraft,
  fixedMonthlyExpenseDraftToRow,
  fixedMonthlyExpenseFromRow,
  fixedMonthlyExpenseToRow,
  summarizeActiveFixedExpenses,
} from "../src/lib/fixed-monthly-expenses";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const netflix = createFixedMonthlyExpenseDraft("Netflix 15 USD");

assertEqual(netflix.name, "Netflix", "name is inferred without amount");
assertEqual(netflix.monthlyAmount, 15, "monthly amount is inferred");
assertEqual(netflix.currency, "USD", "currency is inferred");
assertEqual(netflix.category, "suscripciones", "subscription category is inferred");
assertEqual(netflix.active, true, "new fixed expenses default to active");

const rent = createFixedMonthlyExpenseDraft("Alquiler apartamento UYU 42000");

assertEqual(rent.name, "Alquiler apartamento", "housing name keeps useful text");
assertEqual(rent.category, "vivienda", "housing category is inferred");
assertEqual(rent.monthlyAmount, 42000, "UYU amount is inferred");
assertEqual(rent.currency, "UYU", "UYU currency is inferred");

const fallback = createFixedMonthlyExpenseDraft("");

assertEqual(fallback.name, "Gasto fijo", "empty text gets fallback name");
assertEqual(fallback.category, "otros", "unknown category falls back to other");
assertEqual(fallback.monthlyAmount, 0, "missing amount falls back to zero");
assertEqual(fallback.currency, "USD", "missing currency falls back to USD");

const insertRow = fixedMonthlyExpenseDraftToRow(netflix);

assertEqual(insertRow.name, "Netflix", "draft row carries normalized name");
assertEqual(insertRow.monthly_amount, 15, "draft row carries monthly amount");
assertEqual(insertRow.is_active, true, "draft row carries active flag");

const userId = "00000000-0000-4000-8000-000000000001";
const row = fixedMonthlyExpenseToRow(userId, {
  id: "00000000-0000-4000-8000-000000000101",
  name: "Internet casa",
  category: "servicios",
  monthlyAmount: 1800,
  currency: "UYU",
  active: false,
  note: "Fibra optica",
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-06-20T12:00:00.000Z",
});

assertEqual(row.user_id, userId, "row carries user_id");
assertEqual(row.monthly_amount, 1800, "row uses database monthly_amount");
assertEqual(row.is_active, false, "row uses database active flag");

const mapped = fixedMonthlyExpenseFromRow({
  id: row.id,
  name: row.name,
  category: row.category,
  monthly_amount: row.monthly_amount,
  currency: row.currency,
  is_active: row.is_active,
  note: row.note,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

assertEqual(mapped.monthlyAmount, 1800, "mapped expense restores amount");
assertEqual(mapped.active, false, "mapped expense restores active flag");
assertEqual(mapped.note, "Fibra optica", "mapped expense restores note");

const totals = summarizeActiveFixedExpenses([
  netflix,
  rent,
  { ...mapped, active: false },
]);

assertEqual(totals.length, 2, "active summary ignores inactive expenses");
assert(
  totals.some((total) => total.currency === "USD" && total.amount === 15),
  "active summary keeps USD total",
);
assert(
  totals.some((total) => total.currency === "UYU" && total.amount === 42000),
  "active summary keeps UYU total",
);
