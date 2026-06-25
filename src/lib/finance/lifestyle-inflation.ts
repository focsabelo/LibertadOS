import {
  CORE_EXPENSE_CATEGORIES,
  LIFESTYLE_BIG_PURCHASE_THRESHOLD,
  LIFESTYLE_HIGH_CORE_EXPENSE_SHARE,
} from "./constants";
import { clampPercent, coreExpenseShare } from "./fire";
import { incomeRuleSuggestion } from "./income-increase";
import {
  isRealTransaction,
  previousMonth,
  toMonthKey,
  transactionAmountForUsdAnalysis,
  transactionValueForUsdAnalysis,
} from "./transactions";
import type {
  CoreExpenseCategory,
  LifestyleInflationAnalysis,
  LifestyleInflationMonth,
  LifestyleInflationRisk,
  LifestyleInflationTransaction,
} from "./types";

export function analyzeLifestyleInflation(
  transactions: LifestyleInflationTransaction[],
  today = new Date(),
): LifestyleInflationAnalysis {
  const currentMonthKey = toMonthKey(today);
  const previousMonthKey = previousMonth(currentMonthKey);
  const current = summarizeLifestyleMonth(transactions, currentMonthKey);
  const previous = summarizeLifestyleMonth(transactions, previousMonthKey);
  const hasComparison = previous.income > 0 || previous.expenses > 0;
  const incomeIncrease = current.income - previous.income;
  const expenseIncrease = current.expenses - previous.expenses;
  const absorbedByExpensesPercent =
    incomeIncrease > 0 ? Math.max(0, (expenseIncrease / incomeIncrease) * 100) : 0;
  const savingRateChange = current.savingRate - previous.savingRate;
  const risk = lifestyleRisk({
    hasComparison,
    incomeIncrease,
    expenseIncrease,
  });
  const signals = lifestyleSignals({
    current,
    previous,
    incomeIncrease,
    expenseIncrease,
    absorbedByExpensesPercent,
    savingRateChange,
    risk,
  });
  const alert =
    hasComparison &&
    incomeIncrease > 0 &&
    expenseIncrease >= incomeIncrease * 0.8;

  return {
    risk,
    hasComparison,
    current,
    previous,
    incomeIncrease,
    expenseIncrease,
    capturedForFreedom: incomeIncrease - expenseIncrease,
    absorbedByExpensesPercent: clampPercent(absorbedByExpensesPercent),
    savingRateChange,
    alert,
    signals,
    recommendation: lifestyleRecommendation(risk, signals),
    increaseRule:
      incomeIncrease > 0 ? incomeRuleSuggestion(incomeIncrease, true) : undefined,
  };
}

function summarizeLifestyleMonth(
  transactions: LifestyleInflationTransaction[],
  monthKey: string,
): LifestyleInflationMonth {
  const summary: LifestyleInflationMonth = {
    monthKey,
    income: 0,
    expenses: 0,
    estimatedSavings: 0,
    savingRate: 0,
    coreExpenses: {
      vivienda: 0,
      transporte: 0,
      comida: 0,
    },
    bigPurchases: 0,
  };

  for (const transaction of transactions) {
    if (!isRealTransaction(transaction) || toMonthKey(transaction.date) !== monthKey) {
      continue;
    }

    const amount =
      transaction.type === "deuda" && transaction.debt?.monthlyMarginImpact
        ? transactionValueForUsdAnalysis(
            transaction,
            transaction.debt.monthlyMarginImpact,
          )
        : transactionAmountForUsdAnalysis(transaction);

    if (transaction.type === "ingreso") {
      summary.income += amount;
    }

    if (transaction.type === "gasto" || transaction.type === "deuda") {
      summary.expenses += amount;

      if (
        CORE_EXPENSE_CATEGORIES.includes(
          transaction.category as CoreExpenseCategory,
        )
      ) {
        summary.coreExpenses[transaction.category as CoreExpenseCategory] +=
          amount;
      }

      if (isLifestyleBigPurchase(transaction)) {
        summary.bigPurchases += amount;
      }
    }
  }

  summary.estimatedSavings = summary.income - summary.expenses;
  summary.savingRate =
    summary.income > 0 ? (summary.estimatedSavings / summary.income) * 100 : 0;

  return summary;
}

function isLifestyleBigPurchase(transaction: LifestyleInflationTransaction) {
  return (
    !transaction.recurring &&
    (transaction.amount >= LIFESTYLE_BIG_PURCHASE_THRESHOLD ||
      transaction.antiErrorReview?.signals?.includes("Compra grande") ||
      Boolean(transaction.antiErrorReview?.applies))
  );
}

function lifestyleRisk({
  hasComparison,
  incomeIncrease,
  expenseIncrease,
}: {
  hasComparison: boolean;
  incomeIncrease: number;
  expenseIncrease: number;
}) {
  if (!hasComparison) {
    return "sin-datos";
  }

  if (incomeIncrease <= 0) {
    return "bajo";
  }

  if (expenseIncrease >= incomeIncrease) {
    return "alto";
  }

  if (expenseIncrease > 0) {
    return "medio";
  }

  return "bajo";
}

function lifestyleSignals({
  current,
  previous,
  incomeIncrease,
  expenseIncrease,
  absorbedByExpensesPercent,
  savingRateChange,
  risk,
}: {
  current: LifestyleInflationMonth;
  previous: LifestyleInflationMonth;
  incomeIncrease: number;
  expenseIncrease: number;
  absorbedByExpensesPercent: number;
  savingRateChange: number;
  risk: LifestyleInflationRisk;
}) {
  const signals: string[] = [];

  if (risk === "sin-datos") {
    return signals;
  }

  if (incomeIncrease > 0 && expenseIncrease > 0) {
    signals.push("Ingreso subió, pero gasto también subió.");
  }

  if (savingRateChange < 0) {
    signals.push("La tasa de ahorro cayó.");
  }

  if (incomeIncrease > 0 && absorbedByExpensesPercent >= 70) {
    signals.push("Gran parte del aumento se convirtio en consumo.");
  }

  if (coreExpenseShare(totalCoreExpenses(current), current.expenses) >= LIFESTYLE_HIGH_CORE_EXPENSE_SHARE) {
    signals.push("Gastos críticos siguen altos.");
  }

  if (
    current.bigPurchases > 0 &&
    incomeIncrease > 0 &&
    current.bigPurchases >= Math.max(1, incomeIncrease * 0.25)
  ) {
    signals.push("Compras grandes recientes pueden estar absorbiendo el aumento.");
  }

  if (
    risk === "alto" ||
    (risk === "medio" && expenseIncrease > 0 && current.savingRate < previous.savingRate)
  ) {
    signals.push("Posible inflación del estilo de vida.");
  }

  return signals;
}

function lifestyleRecommendation(
  risk: LifestyleInflationRisk,
  signals: string[],
) {
  if (risk === "sin-datos") {
    return "Confirmar movimientos de este mes y del mes anterior antes de sacar conclusiones.";
  }

  if (risk === "alto") {
    return "Congelar gastos nuevos por 30 días y no subir estilo de vida hasta estabilizar tasa de ahorro.";
  }

  if (signals.includes("Gastos críticos siguen altos.")) {
    return "Revisar vivienda, transporte y comida antes de asumir nuevos gastos fijos.";
  }

  if (risk === "medio") {
    return "Aplicar 70/20/10 al próximo aumento y capturar la parte de inversion antes de subir gastos.";
  }

  return "Mantener gastos nuevos congelados y capturar el aumento para inversión o libertad.";
}

function totalCoreExpenses(month: LifestyleInflationMonth) {
  return CORE_EXPENSE_CATEGORIES.reduce(
    (total, category) => total + month.coreExpenses[category],
    0,
  );
}
