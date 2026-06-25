import { LIFESTYLE_BIG_PURCHASE_THRESHOLD } from "./constants";
import {
  isRealTransaction,
  toMonthKey,
  transactionAmountForUsdAnalysis,
  transactionValueForUsdAnalysis,
} from "./transactions";
import type {
  MonthlyReviewAnalysis,
  MonthlyReviewStatus,
  MonthlyReviewTransaction,
} from "./types";
import {
  formatCompactCurrency,
  normalizePositiveNumber,
  roundToTwo,
} from "./utils";

export function analyzeMonthlyReview({
  transactions,
  today = new Date(),
  confirmedMonthlyIncome = 0,
}: {
  transactions: MonthlyReviewTransaction[];
  today?: Date;
  confirmedMonthlyIncome?: number;
}): MonthlyReviewAnalysis {
  const monthKey = toMonthKey(today);
  const monthTransactions = transactions.filter(
    (transaction) =>
      isRealTransaction(transaction) && toMonthKey(transaction.date) === monthKey,
  );
  const baseMonthlyIncome = normalizePositiveNumber(confirmedMonthlyIncome);
  const monthlyIncome = roundToTwo(
    baseMonthlyIncome + sumMonthlyReviewTransactions(monthTransactions, "ingreso"),
  );
  const monthlyExpenses = roundToTwo(
    sumMonthlyReviewTransactions(monthTransactions, "gasto"),
  );
  const investmentAmount = roundToTwo(
    sumMonthlyReviewTransactions(monthTransactions, "inversion"),
  );
  const debtAdded = roundToTwo(
    monthTransactions.reduce((total, transaction) => {
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
    }, 0),
  );
  const savingsAmount = roundToTwo(monthlyIncome - monthlyExpenses - debtAdded);
  const savingRate =
    monthlyIncome > 0 ? roundToTwo((savingsAmount / monthlyIncome) * 100) : 0;
  const bigPurchaseCount = monthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transactionAmountForUsdAnalysis(transaction) >=
        LIFESTYLE_BIG_PURCHASE_THRESHOLD,
  ).length;
  const emotionalPurchaseCount = monthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transaction.antiErrorReview?.applies === true,
  ).length;
  const hasConfirmedData = monthTransactions.length > 0 || baseMonthlyIncome > 0;
  const status = monthlyReviewStatus({
    hasConfirmedData,
    monthlyIncome,
    savingRate,
    investmentAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
  });
  const signals = monthlyReviewSignals({
    hasConfirmedData,
    monthlyIncome,
    monthlyExpenses,
    investmentAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
    savingRate,
  });

  return {
    monthKey,
    hasConfirmedData,
    status,
    monthlyIncome,
    monthlyExpenses,
    investmentAmount,
    savingsAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
    savingRate,
    primaryAction: monthlyReviewPrimaryAction({
      status,
      hasConfirmedData,
      debtAdded,
      emotionalPurchaseCount,
      investmentAmount,
    }),
    signals,
    nextMonthFocus: monthlyReviewNextMonthFocus(status),
  };
}

function sumMonthlyReviewTransactions(
  transactions: MonthlyReviewTransaction[],
  type: string,
) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type !== type) {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
}

function monthlyReviewStatus({
  hasConfirmedData,
  monthlyIncome,
  savingRate,
  investmentAmount,
  debtAdded,
  bigPurchaseCount,
  emotionalPurchaseCount,
}: {
  hasConfirmedData: boolean;
  monthlyIncome: number;
  savingRate: number;
  investmentAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
}): MonthlyReviewStatus {
  if (!hasConfirmedData || monthlyIncome <= 0) {
    return "alerta";
  }

  if (debtAdded > 0 && (emotionalPurchaseCount > 0 || savingRate < 15)) {
    return "alerta";
  }

  if (savingRate < 0) {
    return "alerta";
  }

  if (savingRate < 15 || emotionalPurchaseCount > 0 || bigPurchaseCount >= 2) {
    return "debil";
  }

  if (savingRate >= 30 && investmentAmount > 0 && debtAdded === 0) {
    return "fuerte";
  }

  return "correcto";
}

function monthlyReviewSignals({
  hasConfirmedData,
  monthlyIncome,
  monthlyExpenses,
  investmentAmount,
  debtAdded,
  bigPurchaseCount,
  emotionalPurchaseCount,
  savingRate,
}: {
  hasConfirmedData: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
  savingRate: number;
}) {
  if (!hasConfirmedData) {
    return ["No hay movimientos reales confirmados para cerrar este mes."];
  }

  const signals = [
    `Ingreso confirmado del mes: ${formatCompactCurrency(monthlyIncome)}.`,
    `Gasto confirmado del mes: ${formatCompactCurrency(monthlyExpenses)}.`,
    `Tasa de ahorro estimada: ${roundToTwo(savingRate)}%.`,
  ];

  if (investmentAmount > 0) {
    signals.push(`Inversion realizada: ${formatCompactCurrency(investmentAmount)}.`);
  }

  if (debtAdded > 0) {
    signals.push(`Deuda nueva o presion mensual: ${formatCompactCurrency(debtAdded)}.`);
  }

  if (bigPurchaseCount > 0) {
    signals.push(`${bigPurchaseCount} compra(s) grande(s) confirmada(s).`);
  }

  if (emotionalPurchaseCount > 0) {
    signals.push(`${emotionalPurchaseCount} compra(s) con senales de impulso.`);
  }

  return signals;
}

function monthlyReviewPrimaryAction({
  status,
  hasConfirmedData,
  debtAdded,
  emotionalPurchaseCount,
  investmentAmount,
}: {
  status: MonthlyReviewStatus;
  hasConfirmedData: boolean;
  debtAdded: number;
  emotionalPurchaseCount: number;
  investmentAmount: number;
}) {
  if (!hasConfirmedData) {
    return "Confirmar ingresos y gastos reales del mes antes de sacar conclusiones.";
  }

  if (debtAdded > 0 || emotionalPurchaseCount > 0) {
    return "Revisar deuda nueva y compras impulsivas antes de planear el mes siguiente.";
  }

  if (status === "fuerte" && investmentAmount > 0) {
    return "Cerrar el mes y sostener el aporte antes de subir gastos fijos.";
  }

  if (status === "debil") {
    return "Elegir un gasto revisable y proteger el aporte del mes siguiente.";
  }

  if (status === "alerta") {
    return "Cerrar datos faltantes y congelar gastos nuevos hasta entender el mes.";
  }

  return "Mantener captura semanal y definir una accion concreta para el mes siguiente.";
}

function monthlyReviewNextMonthFocus(status: MonthlyReviewStatus) {
  const focus = {
    fuerte: "Sostener aporte, no subir gastos fijos y revisar cartera.",
    correcto: "Cerrar una mejora concreta sin cambiar el plan base.",
    debil: "Reducir una fuga de gasto y preservar margen mensual.",
    alerta: "Ordenar datos, deuda y compras grandes antes de avanzar.",
  };

  return focus[status];
}
