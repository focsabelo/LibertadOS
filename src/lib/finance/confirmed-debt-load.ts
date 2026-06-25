import { clampPercent } from "./fire";
import type {
  ConfirmedDebtLoadAnalysis,
  ConfirmedDebtLoadTransaction,
  DebtPressureRisk,
} from "./types";

export function analyzeConfirmedDebtLoad(
  transactions: ConfirmedDebtLoadTransaction[],
  monthlyContribution = 0,
): ConfirmedDebtLoadAnalysis {
  const summary: ConfirmedDebtLoadAnalysis = {
    count: 0,
    monthlyMarginImpact: 0,
    annualCost: 0,
    totalCost: 0,
    totalInterest: 0,
    fireImpact: 0,
    principalBalance: 0,
    highRiskCount: 0,
    minimumPaymentCount: 0,
    salaryDependencyIncrease: 0,
    monthlyDecisionMargin: monthlyContribution > 0 ? monthlyContribution : 0,
    debtPressureRisk: "bajo",
    debtPressurePercent: 0,
    signals: [],
  };
  const signals = new Set<string>();

  for (const transaction of transactions) {
    if (
      transaction.type !== "deuda" ||
      transaction.ignored ||
      transaction.intent !== "real"
    ) {
      continue;
    }

    const debt = transaction.debt;
    const fallbackBalance = Math.max(0, transaction.amount);

    summary.count += 1;
    summary.monthlyMarginImpact += debt?.monthlyMarginImpact ?? 0;
    summary.annualCost += debt?.annualCost ?? 0;
    summary.totalCost += debt?.totalCost ?? fallbackBalance;
    summary.totalInterest += debt?.totalInterest ?? 0;
    summary.fireImpact += debt?.fireImpact ?? 0;
    summary.principalBalance += debt?.principal
      ? debt.principal
      : debt?.totalCost ?? fallbackBalance;

    if (debt?.risk === "alto") {
      summary.highRiskCount += 1;
    }

    if (debt?.kind === "pago_minimo") {
      summary.minimumPaymentCount += 1;
    }

    for (const signal of debt?.signals ?? []) {
      signals.add(signal);
    }
  }

  summary.salaryDependencyIncrease =
    monthlyContribution > 0
      ? clampPercent((summary.monthlyMarginImpact / monthlyContribution) * 100)
      : 0;
  summary.debtPressurePercent = summary.salaryDependencyIncrease;
  summary.monthlyDecisionMargin =
    monthlyContribution > 0
      ? Math.max(0, monthlyContribution - summary.monthlyMarginImpact)
      : 0;
  summary.debtPressureRisk = debtPressureRisk({
    monthlyMarginImpact: summary.monthlyMarginImpact,
    monthlyContribution,
  });
  summary.freedomWarning = debtFreedomWarning(summary.debtPressureRisk);
  summary.signals = Array.from(signals);

  return summary;
}

function debtPressureRisk({
  monthlyMarginImpact,
  monthlyContribution,
}: {
  monthlyMarginImpact: number;
  monthlyContribution: number;
}): DebtPressureRisk {
  if (monthlyMarginImpact <= 0) {
    return "bajo";
  }

  if (monthlyContribution <= 0) {
    return "sin_datos";
  }

  const pressure = monthlyMarginImpact / monthlyContribution;

  if (pressure >= 1) {
    return "alto";
  }

  if (pressure >= 0.5) {
    return "medio";
  }

  return "bajo";
}

function debtFreedomWarning(risk: DebtPressureRisk) {
  if (risk === "alto") {
    return "La deuda consume todo tu margen mensual y compromete tu libertad de decision.";
  }

  if (risk === "medio") {
    return "La deuda ya consume una parte importante de tu margen mensual.";
  }

  if (risk === "sin_datos") {
    return "Falta un aporte mensual base para medir presion sobre margen.";
  }

  return undefined;
}
