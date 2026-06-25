import {
  consumeMatchingFixedExpense,
  fixedExpenseAmountForUsdAnalysis,
  isEssentialMarginCategory,
  sumFixedExpensesByEssentialCategory,
} from "./fixed-expenses";
import {
  toMonthKey,
  transactionAmountForUsdAnalysis,
  transactionValueForUsdAnalysis,
} from "./transactions";
import type {
  FinancialMarginAnalysis,
  FinancialMarginFixedExpense,
  FinancialMarginState,
  FinancialMarginTransaction,
} from "./types";
import { normalizePositiveNumber, roundToTwo } from "./utils";

export function analyzeFinancialMargin({
  transactions,
  fixedExpenses = [],
  today = new Date(),
  estimatedMonthlyIncome = 0,
  uyuPerUsdRate,
}: {
  transactions: FinancialMarginTransaction[];
  fixedExpenses?: FinancialMarginFixedExpense[];
  today?: Date;
  estimatedMonthlyIncome?: number;
  uyuPerUsdRate?: number;
}): FinancialMarginAnalysis {
  const monthKey = toMonthKey(today);
  const realTransactions = transactions.filter(isRealFinancialMarginTransaction);
  const currentMonthTransactions = realTransactions.filter(
    (transaction) => toMonthKey(transaction.date) === monthKey,
  );
  const fixedAssumptions = fixedExpenses.reduce((total, expense) => {
    if (expense.active === false) {
      return total;
    }

    return total + fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate);
  }, 0);
  const coveredFixedExpenseIndexes = new Set<number>();
  const uncoveredRecurringTransactions = currentMonthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transaction.recurring &&
      !consumeMatchingFixedExpense({
        transaction,
        fixedExpenses,
        coveredFixedExpenseIndexes,
        uyuPerUsdRate,
      }),
  );
  const uncoveredRecurringTransactionSet = new Set(uncoveredRecurringTransactions);
  const confirmedRecurringExpenses = uncoveredRecurringTransactions.reduce(
    (total, transaction) => {
      return total + transactionAmountForUsdAnalysis(transaction);
    },
    0,
  );
  const fixedMonthlyExpenses = fixedAssumptions + confirmedRecurringExpenses;
  const variableMonthlyExpenses = currentMonthTransactions.reduce(
    (total, transaction) => {
      if (
        transaction.type !== "gasto" ||
        transaction.recurring ||
        transaction.debt?.monthlyMarginImpact
      ) {
        return total;
      }

      return total + transactionAmountForUsdAnalysis(transaction);
    },
    0,
  );
  const debtMonthlyPayments = realTransactions.reduce((total, transaction) => {
    if (transaction.type !== "deuda") {
      return total;
    }

    return (
      total +
      transactionValueForUsdAnalysis(
        transaction,
        transaction.debt?.monthlyMarginImpact ?? 0,
      )
    );
  }, 0);
  const monthlyIncome = currentMonthTransactions.reduce((total, transaction) => {
    if (transaction.type !== "ingreso") {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
  const essentialExpenses =
    debtMonthlyPayments +
    sumFixedExpensesByEssentialCategory(fixedExpenses, uyuPerUsdRate) +
    currentMonthTransactions.reduce((total, transaction) => {
      if (
        transaction.type !== "gasto" ||
        !isEssentialMarginCategory(transaction.category) ||
        (transaction.recurring && !uncoveredRecurringTransactionSet.has(transaction))
      ) {
        return total;
      }

      return total + transactionAmountForUsdAnalysis(transaction);
    }, 0);
  const totalOutflow =
    fixedMonthlyExpenses + variableMonthlyExpenses + debtMonthlyPayments;
  const nonEssentialExpenses = Math.max(0, totalOutflow - essentialExpenses);
  const normalizedEstimatedMonthlyIncome =
    normalizePositiveNumber(estimatedMonthlyIncome);
  const marginMonthlyIncome =
    monthlyIncome > 0 ? monthlyIncome : normalizedEstimatedMonthlyIncome;
  const marginIncomeSource =
    monthlyIncome > 0
      ? "confirmed"
      : normalizedEstimatedMonthlyIncome > 0
        ? "estimated"
        : "none";
  const availableMonthlyMargin = marginMonthlyIncome - totalOutflow;
  const availableMonthlyMarginTone = financialMarginAvailableTone({
    availableMonthlyMargin,
    marginMonthlyIncome,
  });
  const estimatedAvailableMonthlyMargin =
    normalizedEstimatedMonthlyIncome - totalOutflow;
  const savingRate =
    marginMonthlyIncome > 0
      ? roundToTwo((availableMonthlyMargin / marginMonthlyIncome) * 100)
      : 0;
  const debtPressurePercent =
    marginMonthlyIncome > 0
      ? roundToTwo((debtMonthlyPayments / marginMonthlyIncome) * 100)
      : 0;
  const state = financialMarginState({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
    savingRate,
    debtPressurePercent,
  });
  const paycheckDependency = marginPaycheckDependency({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
  });

  return {
    monthKey,
    monthlyIncome,
    estimatedMonthlyIncome: normalizedEstimatedMonthlyIncome,
    marginIncomeSource,
    availableMonthlyMarginTone,
    fixedMonthlyExpenses,
    variableMonthlyExpenses,
    debtMonthlyPayments,
    availableMonthlyMargin,
    estimatedAvailableMonthlyMargin,
    monthlyBurnRate: totalOutflow,
    savingRate,
    debtPressurePercent,
    essentialExpenses,
    nonEssentialExpenses,
    state,
    paycheckDependency,
    signals: financialMarginSignals({
      monthlyIncome,
      estimatedMonthlyIncome: normalizedEstimatedMonthlyIncome,
      marginIncomeSource,
      availableMonthlyMargin,
      debtPressurePercent,
    }),
    recommendation: financialMarginRecommendation(state),
  };
}

function isRealFinancialMarginTransaction(
  transaction: FinancialMarginTransaction,
) {
  return (
    !transaction.ignored &&
    transaction.intent === "real" &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0
  );
}

function financialMarginState({
  monthlyIncome,
  availableMonthlyMargin,
  savingRate,
  debtPressurePercent,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
  savingRate: number;
  debtPressurePercent: number;
}): FinancialMarginState {
  if (
    monthlyIncome <= 0 ||
    availableMonthlyMargin < 0 ||
    debtPressurePercent >= 35
  ) {
    return "fragil";
  }

  if (savingRate < 10 || debtPressurePercent >= 20) {
    return "ajustado";
  }

  if (savingRate >= 25 && debtPressurePercent < 10) {
    return "fuerte";
  }

  return "estable";
}

function financialMarginAvailableTone({
  availableMonthlyMargin,
  marginMonthlyIncome,
}: {
  availableMonthlyMargin: number;
  marginMonthlyIncome: number;
}): FinancialMarginAnalysis["availableMonthlyMarginTone"] {
  if (availableMonthlyMargin <= 0) {
    return "red";
  }

  if (
    marginMonthlyIncome > 0 &&
    availableMonthlyMargin / marginMonthlyIncome < 0.05
  ) {
    return "red";
  }

  return "green";
}

function marginPaycheckDependency({
  monthlyIncome,
  availableMonthlyMargin,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
}) {
  if (monthlyIncome <= 0 || availableMonthlyMargin < 0) {
    return "alta";
  }

  if (availableMonthlyMargin / monthlyIncome < 0.15) {
    return "media";
  }

  return "baja";
}

function financialMarginSignals({
  monthlyIncome,
  estimatedMonthlyIncome,
  marginIncomeSource,
  availableMonthlyMargin,
  debtPressurePercent,
}: {
  monthlyIncome: number;
  estimatedMonthlyIncome: number;
  marginIncomeSource: FinancialMarginAnalysis["marginIncomeSource"];
  availableMonthlyMargin: number;
  debtPressurePercent: number;
}) {
  const signals: string[] = [];

  if (marginIncomeSource === "estimated") {
    signals.push(
      "Margen disponible usa sueldo mensual confirmado desde Config.",
    );
  }

  if (monthlyIncome <= 0 && estimatedMonthlyIncome <= 0) {
    signals.push("Falta ingreso confirmado del mes.");
  }

  if (availableMonthlyMargin < 0) {
    signals.push("El mes queda por debajo de cero antes de invertir.");
  }

  if (debtPressurePercent >= 20) {
    signals.push("La deuda consume una parte importante del ingreso confirmado.");
  }

  if (signals.length === 0) {
    signals.push("Margen mensual positivo y deuda bajo control.");
  }

  return signals;
}

function financialMarginRecommendation(state: FinancialMarginState) {
  if (state === "fragil") {
    return "Bajar gasto fijo o deuda antes de asumir decisiones nuevas.";
  }

  if (state === "ajustado") {
    return "Revisar gastos fijos y deuda antes de asumir decisiones nuevas.";
  }

  if (state === "estable") {
    return "Mantener margen positivo y evitar que nuevos gastos fijos absorban la ventaja.";
  }

  return "Proteger el margen y evitar que nuevos gastos fijos absorban la ventaja.";
}
