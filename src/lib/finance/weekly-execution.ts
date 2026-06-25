import { WEEKLY_EXECUTION_ITEMS } from "./constants";
import {
  isRealTransaction,
  transactionAmountForUsdAnalysis,
} from "./transactions";
import type {
  WeeklyExecutionAnalysis,
  WeeklyExecutionItemId,
  WeeklyExecutionReview,
  WeeklyExecutionStatus,
  WeeklyExecutionTransaction,
} from "./types";

export function analyzeWeeklyExecution({
  transactions,
  review,
  today = new Date(),
}: {
  transactions: WeeklyExecutionTransaction[];
  review?: WeeklyExecutionReview;
  today?: Date;
}): WeeklyExecutionAnalysis {
  const weekKey = review?.weekKey ?? toIsoWeekKey(today);
  const completedItemIds = new Set(review?.completedItemIds ?? []);
  const weekTransactions = transactions.filter(
    (transaction) =>
      isRealTransaction(transaction) && toIsoWeekKey(transaction.date) === weekKey,
  );
  const weekIncome = sumTransactionsByType(weekTransactions, "ingreso");
  const weekExpenses = weekTransactions.reduce((total, transaction) => {
    if (transaction.type !== "gasto" && transaction.type !== "deuda") {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
  const weekSavings = weekIncome - weekExpenses;
  const savingRate = weekIncome > 0 ? (weekSavings / weekIncome) * 100 : 0;
  const investmentCount = weekTransactions.filter(
    (transaction) => transaction.type === "inversion",
  ).length;
  const emotionalPurchaseCount = weekTransactions.filter(
    isEmotionalWeeklyPurchase,
  ).length;
  const newDebtCount = weekTransactions.filter(
    (transaction) => transaction.type === "deuda",
  ).length;
  const items = WEEKLY_EXECUTION_ITEMS.map((item) => ({
    ...item,
    completed: completedItemIds.has(item.id),
    detail: weeklyExecutionItemDetail(item.id, {
      weekIncome,
      weekExpenses,
      savingRate,
      investmentCount,
      emotionalPurchaseCount,
      newDebtCount,
    }),
  }));
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const status: WeeklyExecutionStatus =
    completedCount === 0
      ? "pendiente"
      : completedCount === totalCount
        ? "cumplido"
        : "incompleto";

  return {
    weekKey,
    status,
    scorePercent:
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    completedCount,
    totalCount,
    items,
    overdueActions: items
      .filter((item) => !item.completed)
      .map((item) => item.label),
    recommendation: weeklyExecutionRecommendation({
      status,
      weekTransactions,
      emotionalPurchaseCount,
      newDebtCount,
      investmentCount,
    }),
    weekIncome,
    weekExpenses,
    weekSavings,
    savingRate,
    investmentCount,
    emotionalPurchaseCount,
    newDebtCount,
  };
}

function sumTransactionsByType(
  transactions: WeeklyExecutionTransaction[],
  type: string,
) {
  return transactions.reduce(
    (total, transaction) =>
      transaction.type === type
        ? total + transactionAmountForUsdAnalysis(transaction)
        : total,
    0,
  );
}

function weeklyExecutionItemDetail(
  itemId: WeeklyExecutionItemId,
  summary: Pick<
    WeeklyExecutionAnalysis,
    | "weekIncome"
    | "weekExpenses"
    | "savingRate"
    | "investmentCount"
    | "emotionalPurchaseCount"
    | "newDebtCount"
  >,
) {
  if (itemId === "review_income") {
    return `${summary.weekIncome > 0 ? "Ingreso confirmado" : "Sin ingreso confirmado"} esta semana.`;
  }

  if (itemId === "review_expenses") {
    return `${summary.weekExpenses > 0 ? "Gasto confirmado" : "Sin gasto confirmado"} esta semana.`;
  }

  if (itemId === "review_saving_rate") {
    return `Tasa semanal estimada: ${Math.round(summary.savingRate)}%.`;
  }

  if (itemId === "confirm_monthly_investment") {
    return `${summary.investmentCount} aportes confirmados esta semana.`;
  }

  if (itemId === "detect_emotional_purchases") {
    return `${summary.emotionalPurchaseCount} compras con senales emocionales.`;
  }

  if (itemId === "review_new_debt") {
    return `${summary.newDebtCount} deudas confirmadas esta semana.`;
  }

  if (itemId === "detect_fomo_impulse") {
    return "Revisa FOMO, comparacion e impulso antes de repetir compras.";
  }

  if (itemId === "review_roadmap") {
    return "Conecta la semana con el proximo hito patrimonial.";
  }

  return "Cierra con una accion concreta y revisable.";
}

function weeklyExecutionRecommendation({
  status,
  weekTransactions,
  emotionalPurchaseCount,
  newDebtCount,
  investmentCount,
}: {
  status: WeeklyExecutionStatus;
  weekTransactions: WeeklyExecutionTransaction[];
  emotionalPurchaseCount: number;
  newDebtCount: number;
  investmentCount: number;
}) {
  if (status === "cumplido") {
    return "Semana cerrada. Mantener captura y revisar el proximo hito.";
  }

  if (weekTransactions.length === 0) {
    return "Capturar y confirmar al menos un movimiento real esta semana.";
  }

  if (emotionalPurchaseCount > 0) {
    return "Revisar compra emocional y esperar 48 horas antes de repetirla.";
  }

  if (newDebtCount > 0) {
    return "Abrir deuda y revisar la presion mensual antes de asumir otra cuota.";
  }

  if (investmentCount === 0) {
    return "Confirmar si el aporte del mes ya se invirtio o sigue pendiente.";
  }

  return "Definir una accion financiera concreta para cerrar la semana.";
}

function isEmotionalWeeklyPurchase(transaction: WeeklyExecutionTransaction) {
  if (transaction.type !== "gasto" && transaction.type !== "deuda") {
    return false;
  }

  const signals = transaction.antiErrorReview?.signals ?? [];
  const enemies = transaction.antiErrorReview?.detectedEnemies ?? [];

  return (
    Boolean(transaction.impulse) ||
    Boolean(transaction.antiErrorReview?.applies) ||
    signals.some((signal) => /compra|impulso|fomo/i.test(signal)) ||
    enemies.some((enemy) => /impulso|fomo|emocional|comparacion/i.test(enemy))
  );
}

function toIsoWeekKey(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
