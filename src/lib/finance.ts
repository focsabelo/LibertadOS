export type FreedomInputs = {
  netWorth: number;
  investedCapital: number;
  desiredMonthlySpend: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
};

export const CORE_EXPENSE_CATEGORIES = ["vivienda", "transporte", "comida"] as const;
export const FIRE_REDUCTION_LEVELS = [10, 50, 100, 250] as const;
export const DEFAULT_EMERGENCY_FUND_RATE = 0.05;
export const DEFAULT_INVESTMENT_RATE = 0.15;

export type CoreExpenseCategory = (typeof CORE_EXPENSE_CATEGORIES)[number];

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function freedomNumber(monthlySpend: number) {
  return Math.max(0, monthlySpend) * 12 * 25;
}

export function annualSpend(monthlySpend: number) {
  return Math.max(0, monthlySpend) * 12;
}

export function completionPercent(netWorth: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return clampPercent((Math.max(0, netWorth) / target) * 100);
}

export function estimateYearsToTarget({
  currentAmount,
  targetAmount,
  monthlyContribution,
  annualReturnPercent,
}: {
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
}) {
  const current = Math.max(0, currentAmount);
  const target = Math.max(0, targetAmount);
  const contribution = Math.max(0, monthlyContribution);

  if (target <= 0 || current >= target) {
    return 0;
  }

  const monthlyRate = Math.pow(1 + annualReturnPercent / 100, 1 / 12) - 1;

  if (monthlyRate <= 0) {
    if (contribution <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return (target - current) / contribution / 12;
  }

  if (contribution <= 0) {
    if (current <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.log(target / current) / Math.log(1 + monthlyRate) / 12;
  }

  const numerator = target * monthlyRate + contribution;
  const denominator = current * monthlyRate + contribution;

  if (denominator <= 0 || numerator <= denominator) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.log(numerator / denominator) / Math.log(1 + monthlyRate) / 12;
}

export function monthlySpendReductionImpact(monthlyReduction: number) {
  return freedomNumber(Math.max(0, monthlyReduction));
}

export function monthlyEquivalentExpense(amount: number, recurring: boolean) {
  return recurring ? Math.max(0, amount) : Math.max(0, amount) / 12;
}

export function fireReductionScenarios(
  reductions: readonly number[] = FIRE_REDUCTION_LEVELS,
) {
  return reductions.map((monthlyReduction) => ({
    monthlyReduction,
    fireReduction: monthlySpendReductionImpact(monthlyReduction),
  }));
}

export function coreExpenseShare(categoryAmount: number, totalAmount: number) {
  if (totalAmount <= 0) {
    return 0;
  }

  return clampPercent((Math.max(0, categoryAmount) / totalAmount) * 100);
}

export function incomeRuleSuggestion(amount: number, isIncrease = false) {
  const base = Math.max(0, amount);

  if (isIncrease) {
    return {
      emergencyFund: base * DEFAULT_EMERGENCY_FUND_RATE,
      suggestedInvestment: base * 0.7,
      savingRate: 70,
      lifestyleUpgrade: base * 0.2,
      personalTreat: base * 0.1,
      isIncreaseRule: true,
    };
  }

  const emergencyFund = base * DEFAULT_EMERGENCY_FUND_RATE;
  const suggestedInvestment = base * DEFAULT_INVESTMENT_RATE;

  return {
    emergencyFund,
    suggestedInvestment,
    savingRate: (DEFAULT_EMERGENCY_FUND_RATE + DEFAULT_INVESTMENT_RATE) * 100,
    lifestyleUpgrade: 0,
    personalTreat: 0,
    isIncreaseRule: false,
  };
}
