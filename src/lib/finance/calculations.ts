import type {
  FreedomInputs,
  WealthAsset,
  EffectiveInputsTransactionSummary,
  ConfirmedSummaryTransaction,
  ConfirmedTransactionsSummary,
  CoreExpenseCategory,
  FireLeversSummaryOptions,
  MonthlyReviewAnalysis,
  PortfolioAssetClass,
  PortfolioCurrentSource,
  PortfolioBalanceStatus,
  TargetPortfolioCustomAsset,
  TargetPortfolioTransaction,
  TargetPortfolioSettings,
  TargetPortfolioSettingsInput,
  PolicyChangeFriction,
  InvestmentPolicySettings,
  InvestmentPolicyRuleStatus,
  InvestmentPolicyWarning,
  InvestmentPolicyDecisionContext,
  InvestmentPolicyAnalysis,
  TargetPortfolioAnalysis,
  BotOpera24hsInvestment,
} from "./types";
import {
  CORE_EXPENSE_CATEGORIES,
  PORTFOLIO_ASSET_CLASSES,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
} from "./constants";
import { analyzeBotOpera24hs } from "./bot-opera24hs";
import {
  consumeMatchingFixedExpense,
  fixedExpenseAmountForUsdAnalysis,
} from "./fixed-expenses";
import {
  clampPercent,
  freedomNumber,
  monthlyEquivalentExpense,
} from "./fire";
import {
  transactionAmountForUsdAnalysis,
  transactionValueForUsdAnalysis,
} from "./transactions";
import { normalizePositiveNumber } from "./utils";
import { analyzeWealthAssets } from "./wealth-assets";

const PORTFOLIO_ALIGNMENT_TOLERANCE = 2;

export function calculateEffectiveInputs(
  inputs: FreedomInputs,
  transactionSummary: EffectiveInputsTransactionSummary,
  options: {
    investmentCapitalAmount?: number;
    wealthAssets?: WealthAsset[];
  } = {},
): FreedomInputs {
  const wealthAssets = options.wealthAssets ?? [];
  const wealthAssetsSummary = analyzeWealthAssets(wealthAssets);
  const hasExplicitWealthAssets = wealthAssets.length > 0;
  const hasDerivedInvestmentCapital =
    Number.isFinite(options.investmentCapitalAmount) &&
    options.investmentCapitalAmount !== undefined &&
    options.investmentCapitalAmount > 0;
  const portfolioInvestmentCapital = hasDerivedInvestmentCapital
    ? Math.max(0, options.investmentCapitalAmount ?? 0)
    : inputs.investedCapital + transactionSummary.investedDelta;
  const effectiveInvestmentCapital =
    portfolioInvestmentCapital + wealthAssetsSummary.investmentCapitalAmount;
  const nonInvestmentNetWorth = hasExplicitWealthAssets
    ? wealthAssetsSummary.netWorthAmount -
      wealthAssetsSummary.investmentCapitalAmount
    : Math.max(0, inputs.netWorth - inputs.investedCapital);

  return {
    ...inputs,
    netWorth:
      nonInvestmentNetWorth +
      effectiveInvestmentCapital +
      (transactionSummary.monthlyNetResult ?? transactionSummary.netWorthDelta),
    investedCapital: effectiveInvestmentCapital,
    desiredMonthlySpend:
      inputs.desiredMonthlySpend + transactionSummary.recurringMonthlyExpenses,
  };
}

export function monthlyNetResultForEffectiveInputs({
  monthlyIncome,
  savingsAmount,
}: Pick<MonthlyReviewAnalysis, "monthlyIncome" | "savingsAmount">) {
  return monthlyIncome > 0 ? savingsAmount : 0;
}

export function confirmedTransactionsSummary(
  transactions: ConfirmedSummaryTransaction[],
  options: FireLeversSummaryOptions = {},
): ConfirmedTransactionsSummary {
  const fixedExpenses = options.fixedMonthlyExpenses ?? [];
  const coveredFixedExpenseIndexes = new Set<number>();
  const summary = transactions.reduce<ConfirmedTransactionsSummary>(
    (summary, transaction) => {
      const amount = transactionAmountForUsdAnalysis(transaction);

      if (transaction.type === "gasto") {
        summary.netWorthDelta -= amount;
        summary.confirmedExpenses += amount;
      }

      if (transaction.type === "deuda") {
        summary.netWorthDelta -= amount;
        summary.debtDelta = (summary.debtDelta ?? 0) - amount;
        summary.confirmedExpenses += amount;
      }

      if (transaction.type === "ingreso" || transaction.type === "ahorro") {
        summary.netWorthDelta += amount;
      }

      if (transaction.type === "inversion") {
        summary.investedDelta += amount;
      }

      if (transaction.type === "gasto" && transaction.recurring) {
        summary.recurringMonthlyExpenses += amount;
        consumeMatchingFixedExpense({
          transaction,
          fixedExpenses,
          coveredFixedExpenseIndexes,
          uyuPerUsdRate: options.uyuPerUsdRate,
        });
      }

      if (transaction.type === "gasto") {
        const monthlyExpense = monthlyEquivalentExpense(
          amount,
          Boolean(transaction.recurring),
        );

        summary.monthlyConfirmedExpenses += monthlyExpense;
        summary.annualConfirmedExpenses += monthlyExpense * 12;
        summary.confirmedFireNumber += freedomNumber(monthlyExpense);

        if (
          CORE_EXPENSE_CATEGORIES.includes(
            transaction.category as CoreExpenseCategory,
          )
        ) {
          summary.coreMonthlyExpenses[
            transaction.category as CoreExpenseCategory
          ] += monthlyExpense;
        }
      }

      if (transaction.type === "deuda") {
        const monthlyDebt = transactionValueForUsdAnalysis(
          transaction,
          transaction.debt?.monthlyMarginImpact ?? 0,
        );

        if (monthlyDebt > 0) {
          summary.recurringMonthlyExpenses += monthlyDebt;
          summary.monthlyConfirmedExpenses += monthlyDebt;
          summary.annualConfirmedExpenses += transaction.debt?.annualCost
            ? transactionValueForUsdAnalysis(transaction, transaction.debt.annualCost)
            : monthlyDebt * 12;
          summary.confirmedFireNumber += transaction.debt?.fireImpact
            ? transactionValueForUsdAnalysis(transaction, transaction.debt.fireImpact)
            : freedomNumber(monthlyDebt);

          if (
            CORE_EXPENSE_CATEGORIES.includes(
              transaction.category as CoreExpenseCategory,
            )
          ) {
            summary.coreMonthlyExpenses[
              transaction.category as CoreExpenseCategory
            ] += monthlyDebt;
          }
        }
      }

      return summary;
    },
    {
      netWorthDelta: 0,
      investedDelta: 0,
      debtDelta: 0,
      confirmedExpenses: 0,
      recurringMonthlyExpenses: 0,
      monthlyConfirmedExpenses: 0,
      annualConfirmedExpenses: 0,
      confirmedFireNumber: 0,
      coreMonthlyExpenses: {
        vivienda: 0,
        transporte: 0,
        comida: 0,
      },
    },
  );

  fixedExpenses.forEach((expense, index) => {
    if (expense.active === false || coveredFixedExpenseIndexes.has(index)) {
      return;
    }

    const monthlyExpense = fixedExpenseAmountForUsdAnalysis(
      expense,
      options.uyuPerUsdRate,
    );

    summary.monthlyConfirmedExpenses += monthlyExpense;
    summary.annualConfirmedExpenses += monthlyExpense * 12;
    summary.confirmedFireNumber += freedomNumber(monthlyExpense);

    if (
      CORE_EXPENSE_CATEGORIES.includes(
        expense.category as CoreExpenseCategory,
      )
    ) {
      summary.coreMonthlyExpenses[expense.category as CoreExpenseCategory] +=
        monthlyExpense;
    }
  });

  return summary;
}

export function analyzeTargetPortfolio(
  settings: TargetPortfolioSettingsInput,
  transactions: TargetPortfolioTransaction[] = [],
  botInvestment?: BotOpera24hsInvestment,
): TargetPortfolioAnalysis {
  const normalizedSettings = normalizeTargetPortfolioSettings(settings);
  const derivedAmounts = targetPortfolioDerivedAmounts(
    transactions,
    botInvestment,
  );
  const visibleAssetClasses = PORTFOLIO_ASSET_CLASSES.filter(
    (asset) => !normalizedSettings.hiddenAssetClasses.includes(asset.assetClass),
  );
  const fixedTargetTotalPercent = visibleAssetClasses.reduce(
    (total, asset) => total + normalizedSettings.targets[asset.assetClass],
    0,
  );
  const customTargetTotalPercent = normalizedSettings.customAssets.reduce(
    (total, asset) => total + asset.targetPercent,
    0,
  );
  const targetTotalPercent = fixedTargetTotalPercent + customTargetTotalPercent;
  const fixedCurrentAmounts = visibleAssetClasses.map((asset) => {
    const movementAmount = derivedAmounts[asset.assetClass];
    const snapshotAmount = normalizedSettings.manualAmounts[asset.assetClass];

    return {
      ...asset,
      isCustom: false,
      targetPercent: normalizedSettings.targets[asset.assetClass],
      snapshotAmount,
      movementAmount,
      currentAmount: snapshotAmount + movementAmount,
      currentSource: portfolioCurrentSource({
        snapshotAmount,
        movementAmount,
      }),
    };
  });
  const customCurrentAmounts = normalizedSettings.customAssets.map((asset) => ({
    assetClass: asset.id,
    label: asset.label,
    isCustom: true,
    targetPercent: asset.targetPercent,
    snapshotAmount: asset.currentAmount,
    movementAmount: 0,
    currentAmount: asset.currentAmount,
    currentSource: "snapshot" as const,
  }));
  const currentAmounts = [...fixedCurrentAmounts, ...customCurrentAmounts];
  const totalCurrentAmount = currentAmounts.reduce(
    (total, asset) => total + asset.currentAmount,
    0,
  );
  const assets = currentAmounts.map((asset) => {
    const targetPercent = asset.targetPercent;
    const currentPercent =
      totalCurrentAmount > 0
        ? (asset.currentAmount / totalCurrentAmount) * 100
        : 0;
    const expectedAmount = (totalCurrentAmount * targetPercent) / 100;
    const imbalanceAmount = asset.currentAmount - expectedAmount;
    const imbalancePercent = currentPercent - targetPercent;
    const status = portfolioBalanceStatus(
      imbalancePercent,
      totalCurrentAmount,
    );

    return {
      assetClass: asset.assetClass,
      label: asset.label,
      isCustom: asset.isCustom,
      targetPercent,
      snapshotAmount: asset.snapshotAmount,
      movementAmount: asset.movementAmount,
      currentAmount: asset.currentAmount,
      currentSource: asset.currentSource,
      currentPercent,
      expectedAmount,
      imbalanceAmount,
      imbalancePercent,
      status,
    };
  });
  const largestImbalance = [...assets].sort(
    (first, second) =>
      Math.abs(second.imbalancePercent) - Math.abs(first.imbalancePercent),
  )[0];

  return {
    assets,
    policy: normalizedSettings.policy as InvestmentPolicySettings,
    targetTotalPercent,
    targetWarning: Math.abs(targetTotalPercent - 100) > 0.1,
    totalCurrentAmount,
    alignedCount: assets.filter((asset) => asset.status === "alineado").length,
    overweightCount: assets.filter((asset) => asset.status === "sobrepeso")
      .length,
    underweightCount: assets.filter((asset) => asset.status === "bajo_peso")
      .length,
    largestImbalance:
      largestImbalance && totalCurrentAmount > 0 ? largestImbalance : undefined,
  };
}

export function analyzeInvestmentPolicy({
  portfolio,
  decision,
}: {
  portfolio: TargetPortfolioAnalysis;
  decision?: InvestmentPolicyDecisionContext;
}): InvestmentPolicyAnalysis {
  const policy = normalizeInvestmentPolicySettings(portfolio.policy);
  const rules: InvestmentPolicyRuleStatus[] = [];
  const warnings: InvestmentPolicyWarning[] = [];

  function addRule(rule: InvestmentPolicyRuleStatus) {
    rules.push(rule);

    if (rule.status === "alineada") {
      return;
    }

    warnings.push({
      id: rule.id,
      label: rule.label,
      severity: rule.status === "violada" ? "alta" : "media",
      action:
        rule.status === "violada"
          ? "Revisar la politica antes de actuar."
          : "Verificar si la decision sigue dentro del plan.",
    });
  }

  addRule(
    policyNumberRule(
      "monthly_contribution_target",
      "Aporte mensual objetivo",
      policy.monthlyContributionTarget,
      "Definir un aporte mensual objetivo.",
    ),
  );
  addRule(
    policyNumberRule(
      "salary_investment_percent",
      "Porcentaje de salario",
      policy.salaryInvestmentPercent,
      "Definir que parte del ingreso se invierte.",
    ),
  );
  addRule(
    policyNumberRule(
      "rebalance_tolerance",
      "Tolerancia de rebalanceo",
      policy.rebalanceTolerancePercent,
      "Definir tolerancia antes de rebalancear.",
    ),
  );
  addRule(
    policyTextRule(
      "automatic_investment_rule",
      "Inversion automatica",
      policy.automaticInvestmentRule,
      "Escribir regla para invertir sin depender de motivacion.",
    ),
  );
  addRule(
    policyTextRule(
      "index_core_rule",
      "Indices primero",
      policy.indexCoreRule,
      "Escribir regla para priorizar cartera indexada simple.",
    ),
  );
  addRule(
    policyTextRule(
      "income_increase_rule",
      "Aumentos 70/20/10",
      policy.incomeIncreaseRule,
      "Escribir regla para aumentos de ingreso.",
    ),
  );
  addRule(
    policyTextRule(
      "weekly_review_rule",
      "Revision semanal",
      policy.weeklyReviewRule,
      "Escribir regla de revision semanal.",
    ),
  );
  addRule(
    policyTextRule(
      "drawdown_rule",
      "Caidas fuertes",
      policy.drawdownRule,
      "Escribir regla ante caidas fuertes.",
    ),
  );
  addRule(
    policyTextRule(
      "strong_rally_rule",
      "Subidas fuertes",
      policy.strongRallyRule,
      "Escribir regla ante subidas fuertes.",
    ),
  );
  addRule(
    policyTextRule(
      "bitcoin_rule",
      "Bitcoin",
      policy.bitcoinRule,
      "Escribir regla para BTC.",
    ),
  );
  addRule(
    policyTextRule(
      "gold_rule",
      "Oro",
      policy.goldRule,
      "Escribir regla para oro.",
    ),
  );
  addRule(
    policyTextRule(
      "individual_stocks_rule",
      "Acciones individuales",
      policy.individualStocksRule,
      "Escribir regla para acciones individuales.",
    ),
  );
  addRule(
    policyTextRule(
      "real_estate_rule",
      "Inmuebles",
      policy.realEstateRule,
      "Escribir regla para inmuebles.",
    ),
  );
  addRule(
    policyTextRule(
      "no_touch_rule",
      "No tocar el plan",
      policy.noTouchRule,
      "Escribir regla para no cambiar el plan en caliente.",
    ),
  );

  if (portfolio.totalCurrentAmount > 0) {
    for (const asset of portfolio.assets) {
      if (Math.abs(asset.imbalancePercent) <= policy.rebalanceTolerancePercent) {
        continue;
      }

      addRule({
        id: `rebalance_${asset.assetClass}`,
        label: `Desbalance ${asset.label}`,
        status: asset.assetClass === "bitcoin" ? "violada" : "advertencia",
        detail: `${asset.label} esta fuera de la tolerancia definida.`,
      });
    }
  }

  if (decisionHasImpulse(decision)) {
    addRule({
      id: "decision_48h",
      label: "Decision en caliente",
      status: "advertencia",
      detail:
        "La decision tiene impulso, FOMO o comparacion; conviene esperar 48 horas.",
    });
  }

  const violatedRuleCount = rules.filter(
    (rule) => rule.status === "violada",
  ).length;
  const warningRuleCount = rules.filter(
    (rule) => rule.status === "advertencia",
  ).length;
  const alignedRuleCount = rules.filter(
    (rule) => rule.status === "alineada",
  ).length;

  return {
    policy,
    rules,
    activeWarnings: warnings,
    violatedRuleCount,
    warningRuleCount,
    alignedRuleCount,
    summary:
      violatedRuleCount > 0
        ? "Hay reglas importantes fuera del plan."
        : warningRuleCount > 0
          ? "El plan tiene advertencias para revisar."
          : "La politica esta escrita y operativa.",
    primaryAction:
      violatedRuleCount > 0
        ? "Revisar politica antes de actuar."
        : warningRuleCount > 0
          ? "Revisar advertencias y esperar si hay impulso."
          : "Mantener el plan y revisar periodicamente.",
  };
}

export function normalizeTargetPortfolioSettings(
  settings: TargetPortfolioSettingsInput = {},
): TargetPortfolioSettings {
  const rawTargets = settings.targets ?? {};
  const customAssets = normalizeTargetPortfolioCustomAssets(settings);
  const hiddenAssetClasses = normalizeHiddenPortfolioAssetClasses(settings);
  const legacyAssetClasses: PortfolioAssetClass[] = [
    "etf_usa",
    "etf_europa",
    "emergentes",
    "oro",
    "bitcoin",
    "bienes_raices",
  ];
  const hasExplicitBotTarget = Object.prototype.hasOwnProperty.call(
    rawTargets,
    "bot_especulacion",
  );
  const hasCompleteLegacyTargets = legacyAssetClasses.every((assetClass) =>
    Object.prototype.hasOwnProperty.call(rawTargets, assetClass),
  );
  const shouldMigrateLegacyTargets =
    !hasExplicitBotTarget && hasCompleteLegacyTargets;
  const legacyBotTarget = shouldMigrateLegacyTargets
    ? DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets.bot_especulacion
    : 0;

  return {
    targets: PORTFOLIO_ASSET_CLASSES.reduce(
      (targets, asset) => {
        const defaultTarget =
          DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets[asset.assetClass];
        const configuredTarget = rawTargets[asset.assetClass];
        const target =
          shouldMigrateLegacyTargets && asset.assetClass === "bot_especulacion"
            ? legacyBotTarget
            : shouldMigrateLegacyTargets && asset.assetClass === "etf_usa"
              ? Math.max(
                  0,
                  (configuredTarget ?? defaultTarget) - legacyBotTarget,
                )
              : (configuredTarget ?? defaultTarget);

        return {
          ...targets,
          [asset.assetClass]: Math.max(0, target),
        };
      },
      {} as Record<PortfolioAssetClass, number>,
    ),
    manualAmounts: PORTFOLIO_ASSET_CLASSES.reduce(
      (manualAmounts, asset) => ({
        ...manualAmounts,
        [asset.assetClass]: Math.max(
          0,
          settings.manualAmounts?.[asset.assetClass] ??
            DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts[asset.assetClass],
        ),
      }),
      {} as Record<PortfolioAssetClass, number>,
    ),
    customAssets,
    hiddenAssetClasses,
    policy: normalizeInvestmentPolicySettings(settings.policy),
  };
}

function normalizeHiddenPortfolioAssetClasses(
  settings: TargetPortfolioSettingsInput,
): PortfolioAssetClass[] {
  if (!Array.isArray(settings.hiddenAssetClasses)) {
    return [];
  }

  const validAssetClasses = new Set(
    PORTFOLIO_ASSET_CLASSES.map((asset) => asset.assetClass),
  );
  const hiddenAssetClasses = settings.hiddenAssetClasses.filter(
    (assetClass): assetClass is PortfolioAssetClass =>
      typeof assetClass === "string" &&
      validAssetClasses.has(assetClass as PortfolioAssetClass),
  );

  return Array.from(new Set(hiddenAssetClasses));
}

function normalizeTargetPortfolioCustomAssets(
  settings: TargetPortfolioSettingsInput,
): TargetPortfolioCustomAsset[] {
  const rawTargets = settings.targets as
    | (Partial<Record<PortfolioAssetClass, number>> & {
        customAssets?: unknown;
      })
    | undefined;
  const rawCustomAssets = settings.customAssets ?? rawTargets?.customAssets;

  if (!Array.isArray(rawCustomAssets)) {
    return [];
  }

  const usedIds = new Set<string>();

  return rawCustomAssets.map((rawAsset, index) => {
    const asset =
      rawAsset && typeof rawAsset === "object"
        ? (rawAsset as Partial<TargetPortfolioCustomAsset>)
        : {};
    const baseId =
      typeof asset.id === "string" && asset.id.trim()
        ? asset.id.trim()
        : `custom-${index + 1}`;
    let id = baseId;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);

    return {
      id,
      label:
        typeof asset.label === "string" ? asset.label : "Inversion personalizada",
      targetPercent: Math.max(0, Number(asset.targetPercent) || 0),
      currentAmount: Math.max(0, Number(asset.currentAmount) || 0),
    };
  });
}

export function normalizeInvestmentPolicySettings(
  settings: Partial<InvestmentPolicySettings> = {},
): InvestmentPolicySettings {
  const defaultPolicy = DEFAULT_TARGET_PORTFOLIO_SETTINGS
    .policy as InvestmentPolicySettings;
  const rebalanceFrequencies: InvestmentPolicySettings["rebalanceFrequency"][] = [
    "mensual",
    "trimestral",
    "semestral",
    "anual",
  ];
  const rebalanceFrequency: InvestmentPolicySettings["rebalanceFrequency"] =
    rebalanceFrequencies.includes(
    settings.rebalanceFrequency as InvestmentPolicySettings["rebalanceFrequency"],
  )
      ? (settings.rebalanceFrequency as InvestmentPolicySettings["rebalanceFrequency"])
      : defaultPolicy.rebalanceFrequency;
  const frictionValues: PolicyChangeFriction[] = [
    "none",
    "review",
    "wait_48h",
  ];
  const changeFriction = frictionValues.includes(
    settings.changeFriction as PolicyChangeFriction,
  )
    ? (settings.changeFriction as PolicyChangeFriction)
    : defaultPolicy.changeFriction;

  return {
    monthlyContributionTarget: Math.max(
      0,
      settings.monthlyContributionTarget ??
        defaultPolicy.monthlyContributionTarget,
    ),
    salaryInvestmentPercent: clampPercent(
      settings.salaryInvestmentPercent ?? defaultPolicy.salaryInvestmentPercent,
    ),
    rebalanceTolerancePercent: clampPercent(
      settings.rebalanceTolerancePercent ??
        defaultPolicy.rebalanceTolerancePercent,
    ),
    rebalanceFrequency,
    automaticInvestmentRule: normalizeTextSetting(
      settings.automaticInvestmentRule,
      defaultPolicy.automaticInvestmentRule,
    ),
    indexCoreRule: normalizeTextSetting(
      settings.indexCoreRule,
      defaultPolicy.indexCoreRule,
    ),
    incomeIncreaseRule: normalizeTextSetting(
      settings.incomeIncreaseRule,
      defaultPolicy.incomeIncreaseRule,
    ),
    weeklyReviewRule: normalizeTextSetting(
      settings.weeklyReviewRule,
      defaultPolicy.weeklyReviewRule,
    ),
    drawdownRule: normalizeTextSetting(
      settings.drawdownRule,
      defaultPolicy.drawdownRule,
    ),
    strongRallyRule: normalizeTextSetting(
      settings.strongRallyRule,
      defaultPolicy.strongRallyRule,
    ),
    bitcoinRule: normalizeTextSetting(
      settings.bitcoinRule,
      defaultPolicy.bitcoinRule,
    ),
    goldRule: normalizeTextSetting(settings.goldRule, defaultPolicy.goldRule),
    individualStocksRule:
      normalizeTextSetting(
        settings.individualStocksRule,
        defaultPolicy.individualStocksRule,
      ),
    realEstateRule: normalizeTextSetting(
      settings.realEstateRule,
      defaultPolicy.realEstateRule,
    ),
    noTouchRule: normalizeTextSetting(
      settings.noTouchRule,
      defaultPolicy.noTouchRule,
    ),
    lastReviewedAt: normalizeOptionalDate(settings.lastReviewedAt),
    changeFriction,
  };
}

function policyNumberRule(
  id: string,
  label: string,
  value: number,
  missing: string,
): InvestmentPolicyRuleStatus {
  return normalizePositiveNumber(value) > 0
    ? { id, label, status: "alineada", detail: "Regla definida." }
    : { id, label, status: "violada", detail: missing };
}

function policyTextRule(
  id: string,
  label: string,
  value: string,
  missing: string,
): InvestmentPolicyRuleStatus {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0
    ? { id, label, status: "alineada", detail: normalizedValue }
    : { id, label, status: "violada", detail: missing };
}

function decisionHasImpulse(decision?: InvestmentPolicyDecisionContext) {
  const signals = decision?.emotionalSignals ?? [];
  const factors = decision?.riskFactors?.map((factor) => factor.id) ?? [];

  return [...signals, ...factors].some((value) =>
    ["impulso", "fomo", "comparacion", "senal emocional"].includes(value),
  );
}

function normalizeTextSetting(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function normalizeOptionalDate(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function targetPortfolioDerivedAmounts(
  transactions: TargetPortfolioTransaction[],
  botInvestment?: BotOpera24hsInvestment,
) {
  const amounts = { ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts };

  for (const transaction of transactions) {
    if (
      transaction.type !== "inversion" ||
      transaction.intent !== "real" ||
      transaction.ignored ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      continue;
    }

    const assetClass = portfolioAssetClassFromCategory(transaction.category);

    if (assetClass) {
      amounts[assetClass] += transactionAmountForUsdAnalysis(transaction);
    }
  }

  if (botInvestment) {
    const botAnalysis = analyzeBotOpera24hs(botInvestment);

    amounts.bot_especulacion +=
      botAnalysis.currentOperationalCapital + botAnalysis.pendingCapital;
  }

  return amounts;
}

export function portfolioAssetClassFromCategory(
  category?: string,
): PortfolioAssetClass | undefined {
  if (!category) {
    return undefined;
  }

  const normalizedCategory = normalizePortfolioCategory(category);
  const matches: Record<PortfolioAssetClass, string[]> = {
    etf_usa: ["etf usa", "sp500", "s&p500", "s&p 500", "voo", "vti", "qqq"],
    etf_europa: ["etf europa", "europa", "vwcg", "imeu"],
    emergentes: ["emergentes", "mercados emergentes", "emerging", "eem", "iemg"],
    oro: ["oro", "gold", "gld"],
    bitcoin: ["bitcoin", "btc"],
    bienes_raices: [
      "bienes raices",
      "real estate",
      "reits",
      "reit",
      "inmueble",
      "propiedad",
    ],
    bot_especulacion: [
      "bot especulacion",
      "bot especulativo",
      "bot opera24hs",
      "botopera24hs",
      "opera24hs",
      "trading algoritmico",
    ],
  };

  return PORTFOLIO_ASSET_CLASSES.find((asset) =>
    matches[asset.assetClass].includes(normalizedCategory),
  )?.assetClass;
}

function portfolioBalanceStatus(
  imbalancePercent: number,
  totalCurrentAmount: number,
): PortfolioBalanceStatus {
  if (totalCurrentAmount <= 0) {
    return "alineado";
  }

  if (imbalancePercent > PORTFOLIO_ALIGNMENT_TOLERANCE) {
    return "sobrepeso";
  }

  if (imbalancePercent < -PORTFOLIO_ALIGNMENT_TOLERANCE) {
    return "bajo_peso";
  }

  return "alineado";
}

function portfolioCurrentSource({
  snapshotAmount,
  movementAmount,
}: {
  snapshotAmount: number;
  movementAmount: number;
}): PortfolioCurrentSource {
  if (snapshotAmount > 0 && movementAmount > 0) {
    return "snapshot_movimientos";
  }

  if (movementAmount > 0) {
    return "movimientos";
  }

  return "snapshot";
}

function normalizePortfolioCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

