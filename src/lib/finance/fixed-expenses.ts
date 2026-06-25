import {
  createMoney,
  normalizeCurrencyCode,
  usdAmountForCalculation,
  type Money,
} from "../money";
import type {
  FinancialMarginFixedExpense,
  UsdConvertedAmount,
} from "./types";
import { transactionAmountForUsdAnalysis } from "./transactions";

export function fixedExpenseAmountForUsdAnalysis(
  expense: FinancialMarginFixedExpense,
  uyuPerUsdRate?: number,
) {
  const currency = normalizeCurrencyCode(expense.currency);

  return usdAmountForCalculation(
    createMoney({
      amount: expense.monthlyAmount,
      currency,
      fallbackRates:
        currency === "UYU" && uyuPerUsdRate
          ? { UYU: uyuPerUsdRate }
          : undefined,
    }),
    "Fixed monthly expense",
  );
}

export function consumeMatchingFixedExpense({
  transaction,
  fixedExpenses,
  coveredFixedExpenseIndexes,
  uyuPerUsdRate,
}: {
  transaction: {
    amount: number;
    currency?: string;
    money?: Money;
    category?: string;
    usdConversion?: UsdConvertedAmount;
  };
  fixedExpenses: FinancialMarginFixedExpense[];
  coveredFixedExpenseIndexes: Set<number>;
  uyuPerUsdRate?: number;
}) {
  const transactionCategory = normalizeMarginCategory(transaction.category);
  const transactionAmount = transactionAmountForUsdAnalysis(transaction);

  for (const [index, expense] of fixedExpenses.entries()) {
    if (expense.active === false || coveredFixedExpenseIndexes.has(index)) {
      continue;
    }

    if (normalizeMarginCategory(expense.category) !== transactionCategory) {
      continue;
    }

    if (
      Math.abs(
        fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate) -
          transactionAmount,
      ) > 0.01
    ) {
      continue;
    }

    coveredFixedExpenseIndexes.add(index);
    return true;
  }

  return false;
}

export function isEssentialMarginCategory(category?: string) {
  return [
    "vivienda",
    "transporte",
    "comida",
    "servicios",
    "salud",
    "seguros",
    "impuestos",
  ].includes(normalizeMarginCategory(category));
}

export function sumFixedExpensesByEssentialCategory(
  fixedExpenses: FinancialMarginFixedExpense[],
  uyuPerUsdRate?: number,
) {
  return fixedExpenses.reduce((total, expense) => {
    if (
      expense.active === false ||
      !isEssentialMarginCategory(expense.category)
    ) {
      return total;
    }

    return total + fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate);
  }, 0);
}

export function normalizeMarginCategory(category?: string) {
  return (category ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .trim();
}
