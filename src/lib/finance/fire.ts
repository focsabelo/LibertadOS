import { FIRE_REDUCTION_LEVELS } from "./constants";

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

export function completionPercent(currentAmount: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return clampPercent((Math.max(0, currentAmount) / target) * 100);
}

export function freedomProgressMetrics({
  investedCapital,
  targetAmount,
  monthlyContribution,
  annualReturnPercent,
}: {
  investedCapital: number;
  targetAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
}) {
  const currentAmount = Math.max(0, investedCapital);
  const target = Math.max(0, targetAmount);
  const remaining = Math.max(0, target - currentAmount);
  const years = estimateYearsToTarget({
    currentAmount,
    targetAmount: target,
    monthlyContribution,
    annualReturnPercent,
  });

  return {
    currentAmount,
    completed: completionPercent(currentAmount, target),
    remaining,
    years,
  };
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
