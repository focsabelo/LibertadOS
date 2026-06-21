export type FreedomInputs = {
  netWorth: number;
  investedCapital: number;
  estimatedMonthlyIncome: number;
  desiredMonthlySpend: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
};

export const DEFAULT_FREEDOM_INPUTS: FreedomInputs = {
  netWorth: 0,
  investedCapital: 0,
  estimatedMonthlyIncome: 0,
  desiredMonthlySpend: 0,
  monthlyContribution: 0,
  expectedAnnualReturn: 7,
};

export type EffectiveInputsTransactionSummary = {
  netWorthDelta: number;
  investedDelta: number;
  recurringMonthlyExpenses: number;
};

export type ConfirmedSummaryTransaction = {
  type: string;
  amount: number;
  currency?: string;
  date?: string;
  category?: string;
  recurring?: boolean;
  intent?: string;
  ignored?: boolean;
  usdConversion?: UsdConvertedAmount;
  debt?: Partial<DebtAnalysis>;
};

export type ConfirmedTransactionsSummary = EffectiveInputsTransactionSummary & {
  confirmedExpenses: number;
  monthlyConfirmedExpenses: number;
  annualConfirmedExpenses: number;
  confirmedFireNumber: number;
  coreMonthlyExpenses: Record<CoreExpenseCategory, number>;
};

export const CORE_EXPENSE_CATEGORIES = ["vivienda", "transporte", "comida"] as const;
export const FIRE_REDUCTION_LEVELS = [10, 50, 100, 250] as const;
export const DEFAULT_EMERGENCY_FUND_RATE = 0.05;
export const DEFAULT_INVESTMENT_RATE = 0.15;
export const LIFESTYLE_BIG_PURCHASE_THRESHOLD = 1000;
export const LIFESTYLE_HIGH_CORE_EXPENSE_SHARE = 50;

export type CoreExpenseCategory = (typeof CORE_EXPENSE_CATEGORIES)[number];
export type LifestyleInflationRisk = "bajo" | "medio" | "alto" | "sin-datos";
export type DebtKind =
  | "tarjeta"
  | "compra_cuotas"
  | "prestamo"
  | "hipoteca"
  | "auto"
  | "deuda_informal"
  | "financiacion"
  | "pago_minimo"
  | "gasto_tarjeta";
export type DebtUse = "herramienta" | "consumo" | "mixta" | "desconocida";
export type DebtRisk = "bajo" | "medio" | "alto" | "sin_datos";
export type DebtPressureRisk = "bajo" | "medio" | "alto" | "sin_datos";
export type FinancialMarginState = "fragil" | "ajustado" | "estable" | "fuerte";
export type ChangeJobCapacity = "baja" | "limitada" | "moderada" | "alta";

export type IncomeRuleSuggestion = {
  emergencyFund: number;
  suggestedInvestment: number;
  savingRate: number;
  lifestyleUpgrade: number;
  personalTreat: number;
  isIncreaseRule: boolean;
};

export type DebtAnalysis = {
  kind: DebtKind;
  principal?: number;
  installmentAmount?: number;
  termMonths?: number;
  annualRate?: number;
  effectiveAnnualRate?: number;
  totalCost?: number;
  totalInterest?: number;
  annualCost?: number;
  monthlyMarginImpact: number;
  fireImpact: number;
  salaryDependencyIncrease?: number;
  use: DebtUse;
  risk: DebtRisk;
  signals: string[];
  missingFields: string[];
};

export type LifestyleInflationTransaction = {
  type: string;
  amount: number;
  currency?: string;
  date: string;
  category?: string;
  recurring?: boolean;
  intent?: string;
  ignored?: boolean;
  usdConversion?: UsdConvertedAmount;
  antiErrorReview?: {
    applies?: boolean;
    signals?: string[];
  };
  debt?: {
    monthlyMarginImpact?: number;
  };
};

export type LifestyleInflationMonth = {
  monthKey: string;
  income: number;
  expenses: number;
  estimatedSavings: number;
  savingRate: number;
  coreExpenses: Record<CoreExpenseCategory, number>;
  bigPurchases: number;
};

export type LifestyleInflationAnalysis = {
  risk: LifestyleInflationRisk;
  hasComparison: boolean;
  current: LifestyleInflationMonth;
  previous: LifestyleInflationMonth;
  incomeIncrease: number;
  expenseIncrease: number;
  capturedForFreedom: number;
  absorbedByExpensesPercent: number;
  savingRateChange: number;
  alert: boolean;
  signals: string[];
  recommendation: string;
  increaseRule?: IncomeRuleSuggestion;
};

export type ConfirmedDebtLoadTransaction = {
  type: string;
  amount: number;
  date?: string;
  intent?: string;
  ignored?: boolean;
  debt?: DebtAnalysis;
};

export type ConfirmedDebtLoadAnalysis = {
  count: number;
  monthlyMarginImpact: number;
  annualCost: number;
  totalCost: number;
  totalInterest: number;
  fireImpact: number;
  principalBalance: number;
  highRiskCount: number;
  minimumPaymentCount: number;
  salaryDependencyIncrease: number;
  monthlyDecisionMargin: number;
  debtPressureRisk: DebtPressureRisk;
  debtPressurePercent: number;
  freedomWarning?: string;
  signals: string[];
};

export type FinancialMarginTransaction = {
  type: string;
  amount: number;
  currency?: string;
  date: string;
  category?: string;
  recurring?: boolean;
  intent?: string;
  ignored?: boolean;
  usdConversion?: UsdConvertedAmount;
  debt?: Partial<DebtAnalysis>;
};

export type FinancialMarginFixedExpense = {
  name?: string;
  category?: string;
  monthlyAmount: number;
  currency?: string;
  active?: boolean;
};

export type FinancialMarginAnalysis = {
  monthKey: string;
  monthlyIncome: number;
  estimatedMonthlyIncome: number;
  marginIncomeSource: "confirmed" | "estimated" | "none";
  availableMonthlyMarginTone: "green" | "red";
  fixedMonthlyExpenses: number;
  variableMonthlyExpenses: number;
  debtMonthlyPayments: number;
  availableMonthlyMargin: number;
  estimatedAvailableMonthlyMargin: number;
  emergencyFund: number;
  monthlyBurnRate: number;
  monthsCovered: number;
  savingRate: number;
  debtPressurePercent: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
  calmPointAmount: number;
  calmPointDistance: number;
  state: FinancialMarginState;
  changeJobCapacity: ChangeJobCapacity;
  paycheckDependency: "alta" | "media" | "baja";
  signals: string[];
  recommendation: string;
};

export type WeeklyExecutionItemId =
  | "review_income"
  | "review_expenses"
  | "review_saving_rate"
  | "separate_emergency_fund"
  | "confirm_monthly_investment"
  | "detect_emotional_purchases"
  | "detect_fomo_impulse"
  | "review_new_debt"
  | "review_roadmap"
  | "define_weekly_action";

export type WeeklyExecutionStatus = "pendiente" | "incompleto" | "cumplido";

export type WeeklyExecutionItem = {
  id: WeeklyExecutionItemId;
  label: string;
};

export type WeeklyExecutionReview = {
  weekKey: string;
  completedItemIds: WeeklyExecutionItemId[];
};

export type WeeklyExecutionTransaction = {
  type: string;
  amount: number;
  currency?: string;
  date: string;
  category?: string;
  recurring?: boolean;
  intent?: string;
  ignored?: boolean;
  impulse?: boolean;
  usdConversion?: UsdConvertedAmount;
  debt?: {
    monthlyMarginImpact?: number;
    risk?: string;
  };
  antiErrorReview?: {
    applies?: boolean;
    signals?: string[];
    detectedEnemies?: string[];
  };
};

export type UsdConvertedAmount = {
  originalAmount?: number;
  originalCurrency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  rate?: number;
  date?: string;
  source?: string;
};

export type WeeklyExecutionAnalysisItem = WeeklyExecutionItem & {
  completed: boolean;
  detail: string;
};

export type WeeklyExecutionAnalysis = {
  weekKey: string;
  status: WeeklyExecutionStatus;
  scorePercent: number;
  completedCount: number;
  totalCount: number;
  items: WeeklyExecutionAnalysisItem[];
  overdueActions: string[];
  recommendation: string;
  weekIncome: number;
  weekExpenses: number;
  weekSavings: number;
  savingRate: number;
  investmentCount: number;
  emotionalPurchaseCount: number;
  newDebtCount: number;
};

export type PortfolioAssetClass =
  | "etf_usa"
  | "etf_europa"
  | "emergentes"
  | "oro"
  | "bitcoin"
  | "bienes_raices";

export type PortfolioCurrentSource = "manual" | "derivado";
export type PortfolioBalanceStatus = "sobrepeso" | "bajo_peso" | "alineado";

export type TargetPortfolioTransaction = {
  type: string;
  amount: number;
  category?: string;
  intent?: string;
  ignored?: boolean;
};

export type TargetPortfolioSettings = {
  targets: Record<PortfolioAssetClass, number>;
  manualAmounts: Record<PortfolioAssetClass, number>;
  policy?: Partial<InvestmentPolicySettings>;
};

export type PolicyChangeFriction = "none" | "review" | "wait_48h";

export type InvestmentPolicySettings = {
  monthlyContributionTarget: number;
  salaryInvestmentPercent: number;
  emergencyFundMonths: number;
  rebalanceTolerancePercent: number;
  rebalanceFrequency: "mensual" | "trimestral" | "semestral" | "anual";
  drawdownRule: string;
  strongRallyRule: string;
  bitcoinRule: string;
  goldRule: string;
  individualStocksRule: string;
  realEstateRule: string;
  noTouchRule: string;
  lastReviewedAt?: string;
  changeFriction: PolicyChangeFriction;
};

export type InvestmentPolicyRuleStatus = {
  id: string;
  label: string;
  status: "alineada" | "advertencia" | "violada";
  detail: string;
};

export type InvestmentPolicyWarning = {
  id: string;
  label: string;
  severity: "media" | "alta";
  action: string;
};

export type InvestmentPolicyDecisionContext = {
  detectedType?: string;
  category?: string;
  emotionalSignals?: string[];
  riskFactors?: { id: string; severity?: string }[];
};

export type InvestmentPolicyAnalysis = {
  policy: InvestmentPolicySettings;
  rules: InvestmentPolicyRuleStatus[];
  activeWarnings: InvestmentPolicyWarning[];
  violatedRuleCount: number;
  warningRuleCount: number;
  alignedRuleCount: number;
  summary: string;
  primaryAction: string;
};

export type TargetPortfolioAsset = {
  assetClass: PortfolioAssetClass;
  label: string;
  targetPercent: number;
  currentAmount: number;
  currentSource: PortfolioCurrentSource;
  currentPercent: number;
  expectedAmount: number;
  imbalanceAmount: number;
  imbalancePercent: number;
  status: PortfolioBalanceStatus;
};

export type TargetPortfolioAnalysis = {
  assets: TargetPortfolioAsset[];
  policy: InvestmentPolicySettings;
  targetTotalPercent: number;
  targetWarning: boolean;
  totalCurrentAmount: number;
  alignedCount: number;
  overweightCount: number;
  underweightCount: number;
  largestImbalance?: TargetPortfolioAsset;
};

export type BotOpera24hsMonthlyResult = {
  month: string;
  amount: number;
};

export type BotOpera24hsInvestment = {
  name: "Bot Opera24hs";
  botNumber: string;
  startDate: string;
  initialCapital: number;
  monthlyContribution: number;
  reinvestmentRule: string;
  reinvestmentMinimum: number;
  monthlyResults: BotOpera24hsMonthlyResult[];
};

export type BotOpera24hsHistoryMonth = {
  month: string;
  contribution: number;
  result: number;
  operationalCapitalStart: number;
  operationalCapitalEnd: number;
  pendingContributionCapital: number;
  pendingProfitCapital: number;
  pendingCapital: number;
  reinvestedAmount: number;
  monthlyReturnPercent: number;
  accumulatedReturnPercent: number;
};

export type BotOpera24hsAnalysis = {
  investment: BotOpera24hsInvestment;
  capitalTotalContributed: number;
  currentOperationalCapital: number;
  pendingContributionCapital: number;
  pendingProfitCapital: number;
  pendingCapital: number;
  amountUntilNextReinvestment: number;
  currentMonthResult: number;
  monthlyReturnPercent: number;
  accumulatedReturnPercent: number;
  accumulatedResult: number;
  history: BotOpera24hsHistoryMonth[];
};

export type WealthMilestoneBasis = "invested_capital" | "net_worth";

export type WealthMilestone = {
  id: string;
  label: string;
  targetAmount: number;
  basis: WealthMilestoneBasis;
};

export type RoadmapProjection = {
  monthlyContribution: number;
  annualReturnPercent: number;
  simulatedMonthlyContribution?: number;
};

export type MilestoneProgress = {
  milestone: WealthMilestone;
  currentAmount: number;
  distanceAmount: number;
  progressPercent: number;
  estimatedMonths: number;
  simulatedEstimatedMonths?: number;
  isReached: boolean;
  isNext: boolean;
};

export type WealthRoadmapInputs = RoadmapProjection & {
  netWorth: number;
  investedCapital: number;
  milestones?: WealthMilestone[];
};

export type WealthRoadmapAnalysis = {
  milestones: MilestoneProgress[];
  nextMilestone?: MilestoneProgress;
};

export const PORTFOLIO_ASSET_CLASSES: readonly {
  assetClass: PortfolioAssetClass;
  label: string;
}[] = [
  { assetClass: "etf_usa", label: "ETF USA" },
  { assetClass: "etf_europa", label: "ETF Europa" },
  { assetClass: "emergentes", label: "Emergentes" },
  { assetClass: "oro", label: "Oro" },
  { assetClass: "bitcoin", label: "Bitcoin" },
  { assetClass: "bienes_raices", label: "Bienes raices" },
];

export const DEFAULT_TARGET_PORTFOLIO_SETTINGS: TargetPortfolioSettings = {
  targets: {
    etf_usa: 45,
    etf_europa: 20,
    emergentes: 15,
    oro: 10,
    bitcoin: 5,
    bienes_raices: 5,
  },
  manualAmounts: {
    etf_usa: 0,
    etf_europa: 0,
    emergentes: 0,
    oro: 0,
    bitcoin: 0,
    bienes_raices: 0,
  },
  policy: {
    monthlyContributionTarget: 1800,
    salaryInvestmentPercent: 20,
    emergencyFundMonths: 6,
    rebalanceTolerancePercent: 5,
    rebalanceFrequency: "trimestral",
    drawdownRule: "No vender por caidas de mercado sin esperar 48 horas.",
    strongRallyRule: "No aumentar riesgo por euforia sin revisar la politica.",
    bitcoinRule: "Mantener BTC dentro del objetivo y no aumentar por FOMO.",
    goldRule: "Usar oro como proteccion, no como apuesta de rendimiento.",
    individualStocksRule: "Solo permitir acciones individuales fuera del plan base.",
    realEstateRule: "Evaluar inmuebles por flujo, deuda y margen mensual.",
    noTouchRule:
      "No tocar el plan por panico, FOMO o comparacion sin esperar 48 horas.",
    lastReviewedAt: undefined,
    changeFriction: "review",
  },
};

export const DEFAULT_BOT_OPERA24HS_INVESTMENT: BotOpera24hsInvestment = {
  name: "Bot Opera24hs",
  botNumber: "Bot 1",
  startDate: "2026-01-01",
  initialCapital: 1000,
  monthlyContribution: 100,
  reinvestmentRule: "Reinvertir cuando el capital pendiente alcance el minimo.",
  reinvestmentMinimum: 500,
  monthlyResults: [
    { month: "2026-01", amount: 0 },
    { month: "2026-02", amount: 0 },
    { month: "2026-03", amount: 0 },
  ],
};

export const DEFAULT_WEALTH_MILESTONES: readonly WealthMilestone[] = [
  {
    id: "invested_50k",
    label: "US$50.000 invertidos",
    targetAmount: 50000,
    basis: "invested_capital",
  },
  {
    id: "first_property",
    label: "Primer inmueble",
    targetAmount: 100000,
    basis: "net_worth",
  },
  {
    id: "five_properties",
    label: "5 propiedades",
    targetAmount: 350000,
    basis: "net_worth",
  },
  {
    id: "net_worth_500k",
    label: "US$500.000 de patrimonio",
    targetAmount: 500000,
    basis: "net_worth",
  },
  {
    id: "partial_retirement_5pct",
    label: "Retiro parcial del 5% anual",
    targetAmount: 750000,
    basis: "net_worth",
  },
  {
    id: "net_worth_1m",
    label: "US$1.000.000 de patrimonio",
    targetAmount: 1000000,
    basis: "net_worth",
  },
];

export const WEEKLY_EXECUTION_ITEMS: readonly WeeklyExecutionItem[] = [
  { id: "review_income", label: "Revisar ingresos confirmados" },
  { id: "review_expenses", label: "Revisar gastos confirmados" },
  { id: "review_saving_rate", label: "Revisar tasa de ahorro" },
  { id: "separate_emergency_fund", label: "Separar 5% para colchon" },
  { id: "confirm_monthly_investment", label: "Confirmar aporte del mes" },
  { id: "detect_emotional_purchases", label: "Detectar compras emocionales" },
  { id: "detect_fomo_impulse", label: "Detectar FOMO o impulso" },
  { id: "review_new_debt", label: "Revisar deuda nueva" },
  { id: "review_roadmap", label: "Revisar avance del roadmap" },
  { id: "define_weekly_action", label: "Definir accion financiera semanal" },
];

const PORTFOLIO_ALIGNMENT_TOLERANCE = 2;

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

export function calculateEffectiveInputs(
  inputs: FreedomInputs,
  transactionSummary: EffectiveInputsTransactionSummary,
): FreedomInputs {
  return {
    ...inputs,
    netWorth: inputs.netWorth + transactionSummary.netWorthDelta,
    investedCapital: inputs.investedCapital + transactionSummary.investedDelta,
    desiredMonthlySpend:
      inputs.desiredMonthlySpend + transactionSummary.recurringMonthlyExpenses,
  };
}

export function confirmedTransactionsSummary(
  transactions: ConfirmedSummaryTransaction[],
): ConfirmedTransactionsSummary {
  return transactions.reduce<ConfirmedTransactionsSummary>(
    (summary, transaction) => {
      const amount = transactionAmountForUsdAnalysis(transaction);

      if (transaction.type === "gasto") {
        summary.confirmedExpenses += amount;
      }

      if (transaction.type === "deuda") {
        summary.netWorthDelta -= amount;
        summary.confirmedExpenses += amount;
      }

      if (transaction.type === "ingreso" || transaction.type === "ahorro") {
        summary.netWorthDelta += amount;
      }

      if (transaction.type === "inversion") {
        summary.netWorthDelta += amount;
        summary.investedDelta += amount;
      }

      if (transaction.type === "gasto" && transaction.recurring) {
        summary.recurringMonthlyExpenses += amount;
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

export function calculateDebtPayment({
  principal,
  annualRate,
  termMonths,
}: {
  principal: number;
  annualRate: number;
  termMonths: number;
}) {
  const principalAmount = Math.max(0, principal);
  const months = Math.max(0, Math.round(termMonths));

  if (principalAmount <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = Math.pow(1 + Math.max(0, annualRate) / 100, 1 / 12) - 1;

  if (monthlyRate <= 0) {
    return principalAmount / months;
  }

  return (
    (principalAmount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -months))
  );
}

export function estimateEffectiveAnnualRate({
  principal,
  installmentAmount,
  termMonths,
}: {
  principal: number;
  installmentAmount: number;
  termMonths: number;
}) {
  const principalAmount = Math.max(0, principal);
  const payment = Math.max(0, installmentAmount);
  const months = Math.max(0, Math.round(termMonths));

  if (principalAmount <= 0 || payment <= 0 || months <= 0) {
    return 0;
  }

  if (payment * months <= principalAmount) {
    return 0;
  }

  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const presentValue =
      (payment * (1 - Math.pow(1 + mid, -months))) / mid;

    if (presentValue > principalAmount) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (Math.pow(1 + (low + high) / 2, 12) - 1) * 100;
}

export function calculateDebtTotals({
  principal,
  installmentAmount,
  termMonths,
  annualRate,
  monthlyContribution,
}: {
  principal?: number;
  installmentAmount?: number;
  termMonths?: number;
  annualRate?: number;
  monthlyContribution?: number;
}) {
  const principalAmount = Math.max(0, principal ?? 0);
  const months = Math.max(0, Math.round(termMonths ?? 0));
  const payment =
    installmentAmount && installmentAmount > 0
      ? installmentAmount
      : principalAmount > 0 && annualRate !== undefined && months > 0
        ? calculateDebtPayment({
            principal: principalAmount,
            annualRate,
            termMonths: months,
          })
        : 0;
  const totalCost = payment > 0 && months > 0 ? payment * months : undefined;
  const totalInterest =
    totalCost !== undefined && principalAmount > 0
      ? Math.max(0, totalCost - principalAmount)
      : undefined;
  const annualCost =
    payment > 0 ? payment * (months > 0 ? Math.min(months, 12) : 12) : 0;
  const fireImpact = payment > 0 ? freedomNumber(payment) : 0;
  const effectiveAnnualRate =
    principalAmount > 0 && payment > 0 && months > 0
      ? estimateEffectiveAnnualRate({
          principal: principalAmount,
          installmentAmount: payment,
          termMonths: months,
        })
      : annualRate;
  const salaryDependencyIncrease =
    payment > 0 && (monthlyContribution ?? 0) > 0
      ? (payment / Math.max(1, monthlyContribution ?? 0)) * 100
      : undefined;

  return {
    installmentAmount: payment,
    totalCost,
    totalInterest,
    annualCost,
    monthlyMarginImpact: payment,
    fireImpact,
    effectiveAnnualRate,
    salaryDependencyIncrease,
  };
}

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

export function analyzeFinancialMargin({
  transactions,
  fixedExpenses = [],
  today = new Date(),
  calmPointMonths = 6,
  estimatedMonthlyIncome = 0,
  uyuPerUsdRate,
}: {
  transactions: FinancialMarginTransaction[];
  fixedExpenses?: FinancialMarginFixedExpense[];
  today?: Date;
  calmPointMonths?: number;
  estimatedMonthlyIncome?: number;
  uyuPerUsdRate?: number;
}): FinancialMarginAnalysis {
  const monthKey = toMonthKey(today);
  const realTransactions = transactions.filter(isRealFinancialMarginTransaction);
  const currentMonthTransactions = realTransactions.filter(
    (transaction) => toMonthKey(transaction.date) === monthKey,
  );
  const fixedAssumptions = fixedExpenses.reduce((total, expense) => {
    if (expense.active === false) {
      return total;
    }

    return total + fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate);
  }, 0);
  const confirmedRecurringExpenses = currentMonthTransactions.reduce(
    (total, transaction) => {
      if (transaction.type !== "gasto" || !transaction.recurring) {
        return total;
      }

      return total + transactionAmountForUsdAnalysis(transaction);
    },
    0,
  );
  const fixedMonthlyExpenses = fixedAssumptions + confirmedRecurringExpenses;
  const variableMonthlyExpenses = currentMonthTransactions.reduce(
    (total, transaction) => {
      if (
        transaction.type !== "gasto" ||
        transaction.recurring ||
        transaction.debt?.monthlyMarginImpact
      ) {
        return total;
      }

      return total + transactionAmountForUsdAnalysis(transaction);
    },
    0,
  );
  const debtMonthlyPayments = realTransactions.reduce((total, transaction) => {
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
  }, 0);
  const monthlyIncome = currentMonthTransactions.reduce((total, transaction) => {
    if (transaction.type !== "ingreso") {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
  const emergencyFund = realTransactions.reduce((total, transaction) => {
    if (transaction.type !== "ahorro" || !isEmergencyFundCategory(transaction.category)) {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
  const essentialExpenses =
    debtMonthlyPayments +
    sumFixedExpensesByEssentialCategory(fixedExpenses, uyuPerUsdRate) +
    currentMonthTransactions.reduce((total, transaction) => {
      if (
        transaction.type !== "gasto" ||
        !isEssentialMarginCategory(transaction.category)
      ) {
        return total;
      }

      return total + transactionAmountForUsdAnalysis(transaction);
    }, 0);
  const totalOutflow =
    fixedMonthlyExpenses + variableMonthlyExpenses + debtMonthlyPayments;
  const nonEssentialExpenses = Math.max(0, totalOutflow - essentialExpenses);
  const normalizedEstimatedMonthlyIncome =
    normalizePositiveNumber(estimatedMonthlyIncome);
  const marginMonthlyIncome =
    monthlyIncome > 0 ? monthlyIncome : normalizedEstimatedMonthlyIncome;
  const marginIncomeSource =
    monthlyIncome > 0
      ? "confirmed"
      : normalizedEstimatedMonthlyIncome > 0
        ? "estimated"
        : "none";
  const availableMonthlyMargin = marginMonthlyIncome - totalOutflow;
  const availableMonthlyMarginTone = financialMarginAvailableTone({
    availableMonthlyMargin,
    marginMonthlyIncome,
  });
  const estimatedAvailableMonthlyMargin =
    normalizedEstimatedMonthlyIncome - totalOutflow;
  const monthsCovered =
    totalOutflow > 0 ? roundToTwo(emergencyFund / totalOutflow) : 0;
  const savingRate =
    marginMonthlyIncome > 0
      ? roundToTwo((availableMonthlyMargin / marginMonthlyIncome) * 100)
      : 0;
  const debtPressurePercent =
    marginMonthlyIncome > 0
      ? roundToTwo((debtMonthlyPayments / marginMonthlyIncome) * 100)
      : 0;
  const calmPointAmount = totalOutflow * Math.max(0, calmPointMonths);
  const calmPointDistance = Math.max(0, calmPointAmount - emergencyFund);
  const state = financialMarginState({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
    savingRate,
    monthsCovered,
    debtPressurePercent,
  });
  const changeJobCapacity = marginChangeJobCapacity(monthsCovered);
  const paycheckDependency = marginPaycheckDependency({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
    monthsCovered,
  });

  return {
    monthKey,
    monthlyIncome,
    estimatedMonthlyIncome: normalizedEstimatedMonthlyIncome,
    marginIncomeSource,
    availableMonthlyMarginTone,
    fixedMonthlyExpenses,
    variableMonthlyExpenses,
    debtMonthlyPayments,
    availableMonthlyMargin,
    estimatedAvailableMonthlyMargin,
    emergencyFund,
    monthlyBurnRate: totalOutflow,
    monthsCovered,
    savingRate,
    debtPressurePercent,
    essentialExpenses,
    nonEssentialExpenses,
    calmPointAmount,
    calmPointDistance,
    state,
    changeJobCapacity,
    paycheckDependency,
    signals: financialMarginSignals({
      monthlyIncome,
      estimatedMonthlyIncome: normalizedEstimatedMonthlyIncome,
      marginIncomeSource,
      availableMonthlyMargin,
      monthsCovered,
      debtPressurePercent,
      emergencyFund,
    }),
    recommendation: financialMarginRecommendation(state),
  };
}

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
      weekIncome,
      completedItemIds,
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

  if (itemId === "separate_emergency_fund") {
    return "Marca este punto despues de separar el dinero.";
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
  weekIncome,
  completedItemIds,
}: {
  status: WeeklyExecutionStatus;
  weekTransactions: WeeklyExecutionTransaction[];
  emotionalPurchaseCount: number;
  newDebtCount: number;
  investmentCount: number;
  weekIncome: number;
  completedItemIds: Set<WeeklyExecutionItemId>;
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

  if (!completedItemIds.has("separate_emergency_fund") && weekIncome > 0) {
    return `Separar ${Math.round(DEFAULT_EMERGENCY_FUND_RATE * 100)}% del ingreso confirmado para colchon.`;
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

export function analyzeTargetPortfolio(
  settings: TargetPortfolioSettings,
  transactions: TargetPortfolioTransaction[] = [],
): TargetPortfolioAnalysis {
  const normalizedSettings = normalizeTargetPortfolioSettings(settings);
  const derivedAmounts = targetPortfolioDerivedAmounts(transactions);
  const targetTotalPercent = PORTFOLIO_ASSET_CLASSES.reduce(
    (total, asset) => total + normalizedSettings.targets[asset.assetClass],
    0,
  );
  const currentAmounts = PORTFOLIO_ASSET_CLASSES.map((asset) => {
    const derivedAmount = derivedAmounts[asset.assetClass];
    const manualAmount = normalizedSettings.manualAmounts[asset.assetClass];

    return {
      ...asset,
      currentAmount: derivedAmount > 0 ? derivedAmount : manualAmount,
      currentSource:
        derivedAmount > 0 ? ("derivado" as const) : ("manual" as const),
    };
  });
  const totalCurrentAmount = currentAmounts.reduce(
    (total, asset) => total + asset.currentAmount,
    0,
  );
  const assets = currentAmounts.map((asset) => {
    const targetPercent = normalizedSettings.targets[asset.assetClass];
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
      targetPercent,
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
      "emergency_fund_months",
      "Colchon objetivo",
      policy.emergencyFundMonths,
      "Definir cuantos meses de colchon proteger.",
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

export function analyzeBotOpera24hs(
  investment: BotOpera24hsInvestment,
): BotOpera24hsAnalysis {
  const normalizedInvestment = normalizeBotOpera24hsInvestment(investment);
  let operationalCapital = normalizedInvestment.initialCapital;
  let pendingContributionCapital = 0;
  let pendingProfitCapital = 0;
  let accumulatedResult = 0;
  const history: BotOpera24hsHistoryMonth[] = [];

  for (const monthlyResult of normalizedInvestment.monthlyResults) {
    const operationalCapitalStart = operationalCapital;
    const contribution = normalizedInvestment.monthlyContribution;
    const result = monthlyResult.amount;

    pendingContributionCapital += contribution;
    pendingProfitCapital = Math.max(0, pendingProfitCapital + Math.max(0, result));
    accumulatedResult += result;

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
    const capitalTotalContributed =
      normalizedInvestment.initialCapital + contribution * history.length + contribution;

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

  const capitalTotalContributed =
    normalizedInvestment.initialCapital +
    normalizedInvestment.monthlyContribution *
      normalizedInvestment.monthlyResults.length;
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

export function normalizeTargetPortfolioSettings(
  settings: Partial<TargetPortfolioSettings> = {},
): TargetPortfolioSettings {
  return {
    targets: PORTFOLIO_ASSET_CLASSES.reduce(
      (targets, asset) => ({
        ...targets,
        [asset.assetClass]: Math.max(
          0,
          settings.targets?.[asset.assetClass] ??
            DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets[asset.assetClass],
        ),
      }),
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
    policy: normalizeInvestmentPolicySettings(settings.policy),
  };
}

export function normalizeBotOpera24hsInvestment(
  investment: Partial<BotOpera24hsInvestment> = {},
): BotOpera24hsInvestment {
  return {
    name: "Bot Opera24hs",
    botNumber:
      typeof investment.botNumber === "string" && investment.botNumber.trim()
        ? investment.botNumber
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.botNumber,
    startDate:
      typeof investment.startDate === "string" && investment.startDate.trim()
        ? investment.startDate
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.startDate,
    initialCapital: Math.max(0, investment.initialCapital ?? 0),
    monthlyContribution: Math.max(0, investment.monthlyContribution ?? 0),
    reinvestmentRule:
      typeof investment.reinvestmentRule === "string" &&
      investment.reinvestmentRule.trim()
        ? investment.reinvestmentRule
        : DEFAULT_BOT_OPERA24HS_INVESTMENT.reinvestmentRule,
    reinvestmentMinimum: Math.max(0, investment.reinvestmentMinimum ?? 0),
    monthlyResults: (investment.monthlyResults ?? [])
      .filter((result) => typeof result.month === "string" && result.month.trim())
      .map((result) => ({
        month: result.month,
        amount: Number.isFinite(result.amount) ? result.amount : 0,
      }))
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
    emergencyFundMonths: Math.max(
      0,
      settings.emergencyFundMonths ?? defaultPolicy.emergencyFundMonths,
    ),
    rebalanceTolerancePercent: clampPercent(
      settings.rebalanceTolerancePercent ??
        defaultPolicy.rebalanceTolerancePercent,
    ),
    rebalanceFrequency,
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
      amounts[assetClass] += transaction.amount;
    }
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

function normalizePortfolioCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function incomeRuleSuggestion(
  amount: number,
  isIncrease = false,
): IncomeRuleSuggestion {
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

export function analyzeLifestyleInflation(
  transactions: LifestyleInflationTransaction[],
  today = new Date(),
): LifestyleInflationAnalysis {
  const currentMonthKey = toMonthKey(today);
  const previousMonthKey = previousMonth(currentMonthKey);
  const current = summarizeLifestyleMonth(transactions, currentMonthKey);
  const previous = summarizeLifestyleMonth(transactions, previousMonthKey);
  const hasComparison = previous.income > 0 || previous.expenses > 0;
  const incomeIncrease = current.income - previous.income;
  const expenseIncrease = current.expenses - previous.expenses;
  const absorbedByExpensesPercent =
    incomeIncrease > 0 ? Math.max(0, (expenseIncrease / incomeIncrease) * 100) : 0;
  const savingRateChange = current.savingRate - previous.savingRate;
  const risk = lifestyleRisk({
    hasComparison,
    incomeIncrease,
    expenseIncrease,
  });
  const signals = lifestyleSignals({
    current,
    previous,
    incomeIncrease,
    expenseIncrease,
    absorbedByExpensesPercent,
    savingRateChange,
    risk,
  });
  const alert =
    hasComparison &&
    incomeIncrease > 0 &&
    expenseIncrease >= incomeIncrease * 0.8;

  return {
    risk,
    hasComparison,
    current,
    previous,
    incomeIncrease,
    expenseIncrease,
    capturedForFreedom: incomeIncrease - expenseIncrease,
    absorbedByExpensesPercent: clampPercent(absorbedByExpensesPercent),
    savingRateChange,
    alert,
    signals,
    recommendation: lifestyleRecommendation(risk, signals),
    increaseRule:
      incomeIncrease > 0 ? incomeRuleSuggestion(incomeIncrease, true) : undefined,
  };
}

function summarizeLifestyleMonth(
  transactions: LifestyleInflationTransaction[],
  monthKey: string,
): LifestyleInflationMonth {
  const summary: LifestyleInflationMonth = {
    monthKey,
    income: 0,
    expenses: 0,
    estimatedSavings: 0,
    savingRate: 0,
    coreExpenses: {
      vivienda: 0,
      transporte: 0,
      comida: 0,
    },
    bigPurchases: 0,
  };

  for (const transaction of transactions) {
    if (!isRealTransaction(transaction) || toMonthKey(transaction.date) !== monthKey) {
      continue;
    }

    const amount =
      transaction.type === "deuda" && transaction.debt?.monthlyMarginImpact
        ? transactionValueForUsdAnalysis(
            transaction,
            transaction.debt.monthlyMarginImpact,
          )
        : transactionAmountForUsdAnalysis(transaction);

    if (transaction.type === "ingreso") {
      summary.income += amount;
    }

    if (transaction.type === "gasto" || transaction.type === "deuda") {
      summary.expenses += amount;

      if (
        CORE_EXPENSE_CATEGORIES.includes(
          transaction.category as CoreExpenseCategory,
        )
      ) {
        summary.coreExpenses[transaction.category as CoreExpenseCategory] +=
          amount;
      }

      if (isLifestyleBigPurchase(transaction)) {
        summary.bigPurchases += amount;
      }
    }
  }

  summary.estimatedSavings = summary.income - summary.expenses;
  summary.savingRate =
    summary.income > 0 ? (summary.estimatedSavings / summary.income) * 100 : 0;

  return summary;
}

function isRealTransaction(transaction: LifestyleInflationTransaction) {
  return (
    !transaction.ignored &&
    (transaction.intent === undefined || transaction.intent === "real") &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0
  );
}

function isRealFinancialMarginTransaction(
  transaction: FinancialMarginTransaction,
) {
  return (
    !transaction.ignored &&
    transaction.intent === "real" &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0
  );
}

function normalizeCurrencyCode(currency?: string) {
  return (currency ?? "USD").trim().toUpperCase();
}

function transactionAmountForUsdAnalysis(transaction: {
  amount: number;
  currency?: string;
  usdConversion?: UsdConvertedAmount;
}) {
  return transactionValueForUsdAnalysis(transaction, transaction.amount);
}

function transactionValueForUsdAnalysis(
  transaction: {
    currency?: string;
    usdConversion?: UsdConvertedAmount;
  },
  value: number,
) {
  const amount = normalizePositiveNumber(value);
  const currency = normalizeCurrencyCode(transaction.currency);

  if (currency === "USD") {
    return amount;
  }

  if (currency === "UYU") {
    const conversion = transaction.usdConversion;
    const convertedCurrency = normalizeCurrencyCode(conversion?.convertedCurrency);

    if (
      convertedCurrency === "USD" &&
      Number.isFinite(conversion?.convertedAmount) &&
      Number.isFinite(conversion?.originalAmount) &&
      conversion?.originalAmount === amount
    ) {
      return normalizePositiveNumber(conversion.convertedAmount ?? 0);
    }

    if (Number.isFinite(conversion?.rate) && (conversion?.rate ?? 0) > 0) {
      return roundToTwo(amount / (conversion?.rate ?? 1));
    }
  }

  return 0;
}

function fixedExpenseAmountForUsdAnalysis(
  expense: FinancialMarginFixedExpense,
  uyuPerUsdRate?: number,
) {
  const amount = normalizePositiveNumber(expense.monthlyAmount);
  const currency = normalizeCurrencyCode(expense.currency);

  if (currency === "USD") {
    return amount;
  }

  if (currency === "UYU") {
    const rate = normalizePositiveNumber(uyuPerUsdRate ?? 0);

    if (rate > 0) {
      return roundToTwo(amount / rate);
    }
  }

  return 0;
}

function normalizePositiveNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function isEmergencyFundCategory(category?: string) {
  const normalized = normalizeMarginCategory(category);

  return ["colchon", "emergencia", "liquidez", "fondo"].some((keyword) =>
    normalized.includes(keyword),
  );
}

function isEssentialMarginCategory(category?: string) {
  return [
    "vivienda",
    "transporte",
    "comida",
    "servicios",
    "salud",
    "seguros",
    "impuestos",
  ].includes(normalizeMarginCategory(category));
}

function sumFixedExpensesByEssentialCategory(
  fixedExpenses: FinancialMarginFixedExpense[],
  uyuPerUsdRate?: number,
) {
  return fixedExpenses.reduce((total, expense) => {
    if (
      expense.active === false ||
      !isEssentialMarginCategory(expense.category)
    ) {
      return total;
    }

    return total + fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate);
  }, 0);
}

function normalizeMarginCategory(category?: string) {
  return (category ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function financialMarginState({
  monthlyIncome,
  availableMonthlyMargin,
  savingRate,
  monthsCovered,
  debtPressurePercent,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
  savingRate: number;
  monthsCovered: number;
  debtPressurePercent: number;
}): FinancialMarginState {
  if (
    monthlyIncome <= 0 ||
    availableMonthlyMargin < 0 ||
    monthsCovered < 1 ||
    debtPressurePercent >= 35
  ) {
    return "fragil";
  }

  if (savingRate < 10 || monthsCovered < 3 || debtPressurePercent >= 20) {
    return "ajustado";
  }

  if (savingRate >= 25 && monthsCovered >= 6 && debtPressurePercent < 10) {
    return "fuerte";
  }

  return "estable";
}

function financialMarginAvailableTone({
  availableMonthlyMargin,
  marginMonthlyIncome,
}: {
  availableMonthlyMargin: number;
  marginMonthlyIncome: number;
}): FinancialMarginAnalysis["availableMonthlyMarginTone"] {
  if (availableMonthlyMargin <= 0) {
    return "red";
  }

  if (
    marginMonthlyIncome > 0 &&
    availableMonthlyMargin / marginMonthlyIncome < 0.05
  ) {
    return "red";
  }

  return "green";
}

function marginChangeJobCapacity(monthsCovered: number): ChangeJobCapacity {
  if (monthsCovered >= 9) {
    return "alta";
  }

  if (monthsCovered >= 3) {
    return "moderada";
  }

  if (monthsCovered >= 1) {
    return "limitada";
  }

  return "baja";
}

function marginPaycheckDependency({
  monthlyIncome,
  availableMonthlyMargin,
  monthsCovered,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
  monthsCovered: number;
}) {
  if (monthlyIncome <= 0 || availableMonthlyMargin < 0 || monthsCovered < 1) {
    return "alta";
  }

  if (availableMonthlyMargin / monthlyIncome < 0.15 || monthsCovered < 3) {
    return "media";
  }

  return "baja";
}

function financialMarginSignals({
  monthlyIncome,
  estimatedMonthlyIncome,
  marginIncomeSource,
  availableMonthlyMargin,
  monthsCovered,
  debtPressurePercent,
  emergencyFund,
}: {
  monthlyIncome: number;
  estimatedMonthlyIncome: number;
  marginIncomeSource: FinancialMarginAnalysis["marginIncomeSource"];
  availableMonthlyMargin: number;
  monthsCovered: number;
  debtPressurePercent: number;
  emergencyFund: number;
}) {
  const signals: string[] = [];

  if (marginIncomeSource === "estimated") {
    signals.push(
      "Margen disponible usa ingreso fijo estimado hasta confirmar el sueldo del mes.",
    );
  }

  if (monthlyIncome <= 0 && estimatedMonthlyIncome <= 0) {
    signals.push("Falta ingreso confirmado del mes.");
  }

  if (availableMonthlyMargin < 0) {
    signals.push("El mes queda por debajo de cero antes de invertir.");
  }

  if (emergencyFund <= 0) {
    signals.push("No hay colchon confirmado.");
  } else if (monthsCovered < 3) {
    signals.push("El colchon todavia cubre menos de 3 meses.");
  }

  if (debtPressurePercent >= 20) {
    signals.push("La deuda consume una parte importante del ingreso confirmado.");
  }

  if (signals.length === 0) {
    signals.push("Margen mensual positivo con colchon operativo.");
  }

  return signals;
}

function financialMarginRecommendation(state: FinancialMarginState) {
  if (state === "fragil") {
    return "Bajar gasto fijo o deuda antes de asumir decisiones nuevas.";
  }

  if (state === "ajustado") {
    return "Separar primero colchon y revisar gastos fijos esta semana.";
  }

  if (state === "estable") {
    return "Mantener margen positivo y acercar el colchon al punto de tranquilidad.";
  }

  return "Proteger el margen y evitar que nuevos gastos fijos absorban la ventaja.";
}

function isLifestyleBigPurchase(transaction: LifestyleInflationTransaction) {
  return (
    !transaction.recurring &&
    (transaction.amount >= LIFESTYLE_BIG_PURCHASE_THRESHOLD ||
      transaction.antiErrorReview?.signals?.includes("Compra grande") ||
      Boolean(transaction.antiErrorReview?.applies))
  );
}

function lifestyleRisk({
  hasComparison,
  incomeIncrease,
  expenseIncrease,
}: {
  hasComparison: boolean;
  incomeIncrease: number;
  expenseIncrease: number;
}) {
  if (!hasComparison) {
    return "sin-datos";
  }

  if (incomeIncrease <= 0) {
    return "bajo";
  }

  if (expenseIncrease >= incomeIncrease) {
    return "alto";
  }

  if (expenseIncrease > 0) {
    return "medio";
  }

  return "bajo";
}

function lifestyleSignals({
  current,
  previous,
  incomeIncrease,
  expenseIncrease,
  absorbedByExpensesPercent,
  savingRateChange,
  risk,
}: {
  current: LifestyleInflationMonth;
  previous: LifestyleInflationMonth;
  incomeIncrease: number;
  expenseIncrease: number;
  absorbedByExpensesPercent: number;
  savingRateChange: number;
  risk: LifestyleInflationRisk;
}) {
  const signals: string[] = [];

  if (risk === "sin-datos") {
    return signals;
  }

  if (incomeIncrease > 0 && expenseIncrease > 0) {
    signals.push("Ingreso subió, pero gasto también subió.");
  }

  if (savingRateChange < 0) {
    signals.push("La tasa de ahorro cayó.");
  }

  if (incomeIncrease > 0 && absorbedByExpensesPercent >= 70) {
    signals.push("Gran parte del aumento se convirtio en consumo.");
  }

  if (coreExpenseShare(totalCoreExpenses(current), current.expenses) >= LIFESTYLE_HIGH_CORE_EXPENSE_SHARE) {
    signals.push("Gastos críticos siguen altos.");
  }

  if (
    current.bigPurchases > 0 &&
    incomeIncrease > 0 &&
    current.bigPurchases >= Math.max(1, incomeIncrease * 0.25)
  ) {
    signals.push("Compras grandes recientes pueden estar absorbiendo el aumento.");
  }

  if (
    risk === "alto" ||
    (risk === "medio" && expenseIncrease > 0 && current.savingRate < previous.savingRate)
  ) {
    signals.push("Posible inflación del estilo de vida.");
  }

  return signals;
}

function lifestyleRecommendation(
  risk: LifestyleInflationRisk,
  signals: string[],
) {
  if (risk === "sin-datos") {
    return "Confirmar movimientos de este mes y del mes anterior antes de sacar conclusiones.";
  }

  if (risk === "alto") {
    return "Congelar gastos nuevos por 30 días y no subir estilo de vida hasta estabilizar tasa de ahorro.";
  }

  if (signals.includes("Gastos críticos siguen altos.")) {
    return "Revisar vivienda, transporte y comida antes de asumir nuevos gastos fijos.";
  }

  if (risk === "medio") {
    return "Aplicar 70/20/10 al próximo aumento y enviar primero el 5% al colchón.";
  }

  return "Mantener gastos nuevos congelados y capturar el aumento para inversión o libertad.";
}

function totalCoreExpenses(month: LifestyleInflationMonth) {
  return CORE_EXPENSE_CATEGORIES.reduce(
    (total, category) => total + month.coreExpenses[category],
    0,
  );
}

function previousMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));

  return toMonthKey(date);
}

function toMonthKey(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 7);
  }

  return value.slice(0, 7);
}
