import { DEFAULT_WEALTH_MILESTONES } from "./constants";
import { completionPercent, estimateYearsToTarget } from "./fire";
import type {
  MilestoneProgress,
  WealthMilestone,
  WealthRoadmapAnalysis,
  WealthRoadmapInputs,
} from "./types";

export function analyzeWealthRoadmap(
  inputs: WealthRoadmapInputs,
): WealthRoadmapAnalysis {
  const milestones = (inputs.milestones ?? DEFAULT_WEALTH_MILESTONES).map(
    (milestone) => normalizeWealthMilestone(milestone),
  );
  const progressItems = milestones.reduce<MilestoneProgress[]>(
    (items, milestone) => {
      const priorMilestonesCompleted = items.every((item) => item.isReached);
      items.push(analyzeMilestoneProgress(milestone, inputs, priorMilestonesCompleted));
      return items;
    },
    [],
  );
  const nextMilestone = progressItems.find((milestone) => !milestone.isReached);
  const milestonesWithNext = progressItems.map((milestone) => ({
    ...milestone,
    isNext: milestone.milestone.id === nextMilestone?.milestone.id,
  }));

  return {
    milestones: milestonesWithNext,
    nextMilestone: milestonesWithNext.find((milestone) => milestone.isNext),
  };
}

function analyzeMilestoneProgress(
  milestone: WealthMilestone,
  inputs: WealthRoadmapInputs,
  priorMilestonesCompleted = true,
): MilestoneProgress {
  const currentAmount = roadmapCurrentAmount(milestone, inputs);
  const targetAmount = Math.max(0, milestone.targetAmount);
  const distanceAmount = Math.max(0, targetAmount - currentAmount);
  const isReached = distanceAmount === 0;
  const status = roadmapStatus({
    currentAmount,
    isReached,
    priorMilestonesCompleted,
  });
  const estimatedYears = estimateYearsToTarget({
    currentAmount,
    targetAmount,
    monthlyContribution: inputs.monthlyContribution,
    annualReturnPercent: inputs.annualReturnPercent,
  });
  const simulatedEstimatedYears =
    inputs.simulatedMonthlyContribution !== undefined
      ? estimateYearsToTarget({
          currentAmount,
          targetAmount,
          monthlyContribution: inputs.simulatedMonthlyContribution,
          annualReturnPercent: inputs.annualReturnPercent,
        })
      : undefined;

  return {
    milestone,
    currentAmount,
    distanceAmount,
    progressPercent: completionPercent(currentAmount, targetAmount),
    title: milestone.label,
    description: milestone.description ?? "",
    currentValue: currentAmount,
    targetValue: targetAmount,
    progressPercentage: completionPercent(currentAmount, targetAmount),
    status,
    missingAmount: distanceAmount,
    unlockConditions: milestone.unlockConditions ?? [],
    riskNotes: milestone.riskNotes ?? [],
    readingRule:
      milestone.readingRule ??
      "El progreso real usa datos confirmados; la simulacion solo estima fechas.",
    valueKind: milestone.valueKind ?? "usd",
    estimatedMonths: yearsToMonths(estimatedYears),
    simulatedEstimatedMonths:
      simulatedEstimatedYears !== undefined
        ? yearsToMonths(simulatedEstimatedYears)
        : undefined,
    isReached,
    isNext: false,
  };
}

function normalizeWealthMilestone(milestone: WealthMilestone): WealthMilestone {
  return {
    ...milestone,
    targetAmount: Math.max(0, milestone.targetAmount),
  };
}

function roadmapCurrentAmount(
  milestone: WealthMilestone,
  inputs: Pick<
    WealthRoadmapInputs,
    | "netWorth"
    | "investedCapital"
    | "botOperationalCapital"
    | "section8PropertyCount"
    | "positiveCashFlowPropertyCount"
  >,
) {
  if (milestone.basis === "invested_capital") {
    return Math.max(0, inputs.investedCapital);
  }

  if (milestone.basis === "bot_operational_capital") {
    return Math.max(0, inputs.botOperationalCapital ?? 0);
  }

  if (milestone.basis === "section8_property_count") {
    return Math.max(0, inputs.section8PropertyCount ?? 0);
  }

  if (milestone.basis === "positive_cash_flow_property_count") {
    return Math.max(0, inputs.positiveCashFlowPropertyCount ?? 0);
  }

  return Math.max(0, inputs.netWorth);
}

function roadmapStatus({
  currentAmount,
  isReached,
  priorMilestonesCompleted,
}: {
  currentAmount: number;
  isReached: boolean;
  priorMilestonesCompleted: boolean;
}) {
  if (isReached) {
    return "completed";
  }

  if (!priorMilestonesCompleted) {
    return "locked";
  }

  return currentAmount > 0 ? "in_progress" : "enabled";
}

function yearsToMonths(years: number) {
  if (!Number.isFinite(years)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, years * 12);
}
