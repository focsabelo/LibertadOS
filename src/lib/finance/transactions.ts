import {
  createMoney,
  usdAmountForCalculation,
  type Money,
} from "../money";
import { previousLocalMonthKey, toLocalMonthKey } from "../local-date";
import type { UsdConvertedAmount } from "./types";
import { normalizePositiveNumber } from "./utils";

export function isRealTransaction(transaction: {
  amount: number;
  ignored?: boolean;
  intent?: string;
}) {
  return (
    !transaction.ignored &&
    (transaction.intent === undefined || transaction.intent === "real") &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0
  );
}

export function transactionAmountForUsdAnalysis(transaction: {
  amount: number;
  currency?: string;
  money?: Money;
  usdConversion?: UsdConvertedAmount;
}) {
  return transactionValueForUsdAnalysis(transaction, transaction.amount);
}

export function transactionValueForUsdAnalysis(
  transaction: {
    amount?: number;
    currency?: string;
    money?: Money;
    usdConversion?: UsdConvertedAmount;
  },
  value: number,
) {
  if (
    transaction.money &&
    normalizePositiveNumber(transaction.amount ?? 0) ===
      normalizePositiveNumber(value)
  ) {
    return usdAmountForCalculation(transaction.money, "Transaction money");
  }

  return usdAmountForCalculation(
    createMoney({
      amount: value,
      currency: transaction.currency,
      usdConversion: transaction.usdConversion,
    }),
    "Transaction amount",
  );
}

export function previousMonth(monthKey: string) {
  return previousLocalMonthKey(monthKey);
}

export function toMonthKey(value: Date | string) {
  return toLocalMonthKey(value);
}
