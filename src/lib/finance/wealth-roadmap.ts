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
  const progressItems = milestones.map((milestone) =>
    analyzeMilestoneProgress(milestone, inputs),
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
): MilestoneProgress {
  const currentAmount = roadmapCurrentAmount(milestone, inputs);
  const targetAmount = Math.max(0, milestone.targetAmount);
  const distanceAmount = Math.max(0, targetAmount - currentAmount);
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
    estimatedMonths: yearsToMonths(estimatedYears),
    simulatedEstimatedMonths:
      simulatedEstimatedYears !== undefined
        ? yearsToMonths(simulatedEstimatedYears)
        : undefined,
    isReached: distanceAmount === 0,
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
  inputs: Pick<WealthRoadmapInputs, "netWorth" | "investedCapital">,
) {
  if (milestone.basis === "invested_capital") {
    return Math.max(0, inputs.investedCapital);
  }

  return Math.max(0, inputs.netWorth);
}

function yearsToMonths(years: number) {
  if (!Number.isFinite(years)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, years * 12);
}
