import {
  DEFAULT_INCOME_INCREASE_RULE_SETTINGS,
  DEFAULT_INVESTMENT_RATE,
} from "./constants";
import { monthlySpendReductionImpact } from "./fire";
import type {
  IncomeIncreaseAnalysis,
  IncomeIncreasePlan,
  IncomeIncreaseRuleSettings,
  IncomeRuleSuggestion,
  LifestyleInflationAnalysis,
} from "./types";
import {
  formatCompactCurrency,
  normalizePositiveNumber,
  roundToTwo,
} from "./utils";

export function incomeRuleSuggestion(
  amount: number,
  isIncrease = false,
): IncomeRuleSuggestion {
  const base = Math.max(0, amount);

  if (isIncrease) {
    return {
      suggestedInvestment: base * 0.7,
      savingRate: 70,
      lifestyleUpgrade: base * 0.2,
      personalTreat: base * 0.1,
      isIncreaseRule: true,
    };
  }

  const suggestedInvestment = base * DEFAULT_INVESTMENT_RATE;

  return {
    suggestedInvestment,
    savingRate: DEFAULT_INVESTMENT_RATE * 100,
    lifestyleUpgrade: 0,
    personalTreat: 0,
    isIncreaseRule: false,
  };
}

export function normalizeIncomeIncreaseRuleSettings(
  settings: Partial<IncomeIncreaseRuleSettings> = {},
): IncomeIncreaseRuleSettings {
  const investmentPercent = normalizePositiveNumber(
    settings.investmentPercent ?? DEFAULT_INCOME_INCREASE_RULE_SETTINGS.investmentPercent,
  );
  const lifestylePercent = normalizePositiveNumber(
    settings.lifestylePercent ?? DEFAULT_INCOME_INCREASE_RULE_SETTINGS.lifestylePercent,
  );
  const treatPercent = normalizePositiveNumber(
    settings.treatPercent ?? DEFAULT_INCOME_INCREASE_RULE_SETTINGS.treatPercent,
  );
  const total = investmentPercent + lifestylePercent + treatPercent;

  if (
    investmentPercent > 100 ||
    lifestylePercent > 100 ||
    treatPercent > 100 ||
    Math.abs(total - 100) > 0.01
  ) {
    return DEFAULT_INCOME_INCREASE_RULE_SETTINGS;
  }

  return {
    investmentPercent: roundToTwo(investmentPercent),
    lifestylePercent: roundToTwo(lifestylePercent),
    treatPercent: roundToTwo(treatPercent),
  };
}

export function analyzeIncomeIncrease({
  lifestyle,
  settings,
  monthlyContribution = 0,
}: {
  lifestyle: LifestyleInflationAnalysis;
  settings?: Partial<IncomeIncreaseRuleSettings>;
  monthlyContribution?: number;
}): IncomeIncreaseAnalysis {
  const rule = normalizeIncomeIncreaseRuleSettings(settings);
  const hasIncrease = lifestyle.hasComparison && lifestyle.incomeIncrease > 0;
  const increaseAmount = hasIncrease ? roundToTwo(lifestyle.incomeIncrease) : 0;
  const absorbedByExpenses = hasIncrease
    ? roundToTwo(Math.max(0, lifestyle.expenseIncrease))
    : 0;
  const capturedForFreedom = hasIncrease
    ? roundToTwo(Math.max(0, lifestyle.capturedForFreedom))
    : 0;
  const plan = incomeIncreasePlan(increaseAmount, rule);
  const fireImpact = monthlySpendReductionImpact(plan.investment);
  const simulatedMonthlyContribution = roundToTwo(
    normalizePositiveNumber(monthlyContribution) + plan.investment,
  );
  const monthlyContributionDelta = roundToTwo(
    simulatedMonthlyContribution - normalizePositiveNumber(monthlyContribution),
  );
  const signals = incomeIncreaseSignals({
    hasIncrease,
    lifestyle,
    absorbedByExpenses,
    capturedForFreedom,
  });

  return {
    hasIncrease,
    hasComparison: lifestyle.hasComparison,
    currentMonthKey: lifestyle.current.monthKey,
    previousMonthKey: lifestyle.previous.monthKey,
    increaseAmount,
    absorbedByExpenses,
    absorbedByExpensesPercent: hasIncrease
      ? lifestyle.absorbedByExpensesPercent
      : 0,
    capturedForFreedom,
    plan,
    fireImpact,
    simulatedMonthlyContribution,
    monthlyContributionDelta,
    signals,
    primaryAction: incomeIncreasePrimaryAction({
      hasIncrease,
      absorbedByExpensesPercent: lifestyle.absorbedByExpensesPercent,
      capturedForFreedom,
    }),
  };
}

function incomeIncreasePlan(
  increaseAmount: number,
  rule: IncomeIncreaseRuleSettings,
): IncomeIncreasePlan {
  const base = normalizePositiveNumber(increaseAmount);

  return {
    investment: roundToTwo((base * rule.investmentPercent) / 100),
    lifestyleUpgrade: roundToTwo((base * rule.lifestylePercent) / 100),
    personalTreat: roundToTwo((base * rule.treatPercent) / 100),
    totalPlanned: base,
  };
}

function incomeIncreaseSignals({
  hasIncrease,
  lifestyle,
  absorbedByExpenses,
  capturedForFreedom,
}: {
  hasIncrease: boolean;
  lifestyle: LifestyleInflationAnalysis;
  absorbedByExpenses: number;
  capturedForFreedom: number;
}) {
  if (!lifestyle.hasComparison) {
    return ["Falta comparar contra un mes anterior confirmado."];
  }

  if (!hasIncrease) {
    return ["No hay aumento de ingreso confirmado este mes."];
  }

  const signals = [
    `Aumento confirmado de ${formatCompactCurrency(lifestyle.incomeIncrease)}.`,
  ];

  if (absorbedByExpenses > 0) {
    signals.push(
      `${formatCompactCurrency(absorbedByExpenses)} del aumento ya fue absorbido por gasto confirmado.`,
    );
  }

  if (capturedForFreedom > 0) {
    signals.push(
      `${formatCompactCurrency(capturedForFreedom)} sigue disponible como margen capturado.`,
    );
  }

  if (lifestyle.absorbedByExpensesPercent >= 70) {
    signals.push("El aumento corre riesgo de convertirse en nuevo estilo de vida.");
  }

  return signals;
}

function incomeIncreasePrimaryAction({
  hasIncrease,
  absorbedByExpensesPercent,
  capturedForFreedom,
}: {
  hasIncrease: boolean;
  absorbedByExpensesPercent: number;
  capturedForFreedom: number;
}) {
  if (!hasIncrease) {
    return "Confirmar ingresos reales y esperar un aumento antes de aplicar la regla.";
  }

  if (absorbedByExpensesPercent >= 80) {
    return "Congelar nuevos gastos y decidir manualmente que parte del aumento se protege.";
  }

  if (capturedForFreedom > 0) {
    return "Separar el tramo de inversion antes de subir gastos recurrentes.";
  }

  return "Revisar gastos confirmados antes de asignar el aumento.";
}
