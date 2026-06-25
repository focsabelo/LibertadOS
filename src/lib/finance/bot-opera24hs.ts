import { DEFAULT_BOT_OPERA24HS_INVESTMENT } from "./constants";
import type {
  BotOpera24hsAnalysis,
  BotOpera24hsHistoryMonth,
  BotOpera24hsInvestment,
} from "./types";

export function analyzeBotOpera24hs(
  investment: BotOpera24hsInvestment,
): BotOpera24hsAnalysis {
  const normalizedInvestment = normalizeBotOpera24hsInvestment(investment);
  let operationalCapital = normalizedInvestment.initialCapital;
  let pendingContributionCapital = 0;
  let pendingProfitCapital = 0;
  let accumulatedResult = 0;
  let capitalTotalContributed = normalizedInvestment.initialCapital;
  const history: BotOpera24hsHistoryMonth[] = [];

  for (const monthlyResult of normalizedInvestment.monthlyResults) {
    const operationalCapitalStart = operationalCapital;
    const contribution =
      monthlyResult.contribution ?? normalizedInvestment.monthlyContribution;
    const result = monthlyResult.amount;

    pendingContributionCapital += contribution;
    pendingProfitCapital = Math.max(0, pendingProfitCapital + Math.max(0, result));
    accumulatedResult += result;
    capitalTotalContributed += contribution;

    const reinvestedAmount = calculateBotOperaReinvestment({
      pendingContributionCapital,
      pendingProfitCapital,
      reinvestmentMinimum: normalizedInvestment.reinvestmentMinimum,
    });

    if (reinvestedAmount > 0) {
      const consumed = consumePendingCapital({
        pendingContributionCapital,
        pendingProfitCapital,
        amount: reinvestedAmount,
      });

      pendingContributionCapital = consumed.pendingContributionCapital;
      pendingProfitCapital = consumed.pendingProfitCapital;
      operationalCapital += reinvestedAmount;
    }

    const pendingCapital = pendingContributionCapital + pendingProfitCapital;

    history.push({
      month: monthlyResult.month,
      contribution,
      result,
      operationalCapitalStart,
      operationalCapitalEnd: operationalCapital,
      pendingContributionCapital,
      pendingProfitCapital,
      pendingCapital,
      reinvestedAmount,
      monthlyReturnPercent:
        operationalCapitalStart > 0 ? (result / operationalCapitalStart) * 100 : 0,
      accumulatedReturnPercent:
        capitalTotalContributed > 0
          ? (accumulatedResult / capitalTotalContributed) * 100
          : 0,
    });
  }

  const pendingCapital = pendingContributionCapital + pendingProfitCapital;
  const currentMonth = history.at(-1);

  return {
    investment: normalizedInvestment,
    capitalTotalContributed,
    currentOperationalCapital: operationalCapital,
    pendingContributionCapital,
    pendingProfitCapital,
    pendingCapital,
    amountUntilNextReinvestment: amountUntilBotOperaReinvestment(
      pendingCapital,
      normalizedInvestment.reinvestmentMinimum,
    ),
    currentMonthResult: currentMonth?.result ?? 0,
    monthlyReturnPercent: currentMonth?.monthlyReturnPercent ?? 0,
    accumulatedReturnPercent: currentMonth?.accumulatedReturnPercent ?? 0,
    accumulatedResult,
    history,
  };
}

export function normalizeBotOpera24hsInvestment(
  investment: Partial<BotOpera24hsInvestment> = {},
): BotOpera24hsInvestment {
  const monthlyContribution = Math.max(0, investment.monthlyContribution ?? 0);

  return {
    name: "Bot especulacion (trading algoritmico)",
    botNumber:
      typeof investment.botNumber === "string" && investment.botNumber.trim()
        ? investment.botNumber
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.botNumber,
    startDate:
      typeof investment.startDate === "string" && investment.startDate.trim()
        ? investment.startDate
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.startDate,
    initialCapital: Math.max(0, investment.initialCapital ?? 0),
    monthlyContribution,
    reinvestmentRule:
      typeof investment.reinvestmentRule === "string" &&
      investment.reinvestmentRule.trim()
        ? investment.reinvestmentRule
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.reinvestmentRule,
    reinvestmentMinimum: Math.max(0, investment.reinvestmentMinimum ?? 0),
    monthlyResults: (investment.monthlyResults ?? [])
      .filter((result) => typeof result.month === "string" && result.month.trim())
      .map((result) => {
        const contribution = result.contribution;
        const normalizedContribution =
          typeof contribution === "number" &&
          Number.isFinite(contribution) &&
          contribution >= 0
            ? contribution
            : monthlyContribution;

        return {
          month: result.month,
          contribution: normalizedContribution,
          amount: Number.isFinite(result.amount) ? result.amount : 0,
        };
      })
      .sort((first, second) => first.month.localeCompare(second.month)),
  };
}

function calculateBotOperaReinvestment({
  pendingContributionCapital,
  pendingProfitCapital,
  reinvestmentMinimum,
}: {
  pendingContributionCapital: number;
  pendingProfitCapital: number;
  reinvestmentMinimum: number;
}) {
  if (reinvestmentMinimum <= 0) {
    return 0;
  }

  const pendingCapital = pendingContributionCapital + pendingProfitCapital;

  return Math.floor(pendingCapital / reinvestmentMinimum) * reinvestmentMinimum;
}

function consumePendingCapital({
  pendingContributionCapital,
  pendingProfitCapital,
  amount,
}: {
  pendingContributionCapital: number;
  pendingProfitCapital: number;
  amount: number;
}) {
  const contributionUsed = Math.min(pendingContributionCapital, amount);
  const remainingAmount = amount - contributionUsed;
  const profitUsed = Math.min(pendingProfitCapital, remainingAmount);

  return {
    pendingContributionCapital: pendingContributionCapital - contributionUsed,
    pendingProfitCapital: pendingProfitCapital - profitUsed,
  };
}

function amountUntilBotOperaReinvestment(
  pendingCapital: number,
  reinvestmentMinimum: number,
) {
  if (reinvestmentMinimum <= 0) {
    return 0;
  }

  if (pendingCapital <= 0) {
    return reinvestmentMinimum;
  }

  const remainder = pendingCapital % reinvestmentMinimum;

  return remainder === 0 ? reinvestmentMinimum : reinvestmentMinimum - remainder;
}
