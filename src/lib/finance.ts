import {
  DEFAULT_UYU_PER_USD_ANALYSIS_RATE,
  createMoney,
  normalizeCurrencyCode,
  usdAmountForCalculation,
  type Money,
} from "./money";
import { previousLocalMonthKey, toLocalMonthKey } from "./local-date";
export {
  calculateDebtPayment,
  calculateDebtTotals,
  estimateEffectiveAnnualRate,
} from "./debt-finance";

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
  money?: Money;
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
export const DEFAULT_INVESTMENT_RATE = 0.15;
export const LIFESTYLE_BIG_PURCHASE_THRESHOLD = 1000;
export const LIFESTYLE_HIGH_CORE_EXPENSE_SHARE = 50;
export { DEFAULT_UYU_PER_USD_ANALYSIS_RATE };

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
export type DebtCertainty = "completa" | "parcial" | "insuficiente";
export type DebtPressureRisk = "bajo" | "medio" | "alto" | "sin_datos";
export type FinancialMarginState = "fragil" | "ajustado" | "estable" | "fuerte";

export type IncomeRuleSuggestion = {
  suggestedInvestment: number;
  savingRate: number;
  lifestyleUpgrade: number;
  personalTreat: number;
  isIncreaseRule: boolean;
};

export type IncomeIncreaseRuleSettings = {
  investmentPercent: number;
  lifestylePercent: number;
  treatPercent: number;
};

export type IncomeIncreasePlan = {
  investment: number;
  lifestyleUpgrade: number;
  personalTreat: number;
  totalPlanned: number;
};

export type IncomeIncreaseAnalysis = {
  hasIncrease: boolean;
  hasComparison: boolean;
  currentMonthKey: string;
  previousMonthKey: string;
  increaseAmount: number;
  absorbedByExpenses: number;
  absorbedByExpensesPercent: number;
  capturedForFreedom: number;
  plan: IncomeIncreasePlan;
  fireImpact: number;
  simulatedMonthlyContribution: number;
  monthlyContributionDelta: number;
  signals: string[];
  primaryAction: string;
};

export const DEFAULT_INCOME_INCREASE_RULE_SETTINGS: IncomeIncreaseRuleSettings = {
  investmentPercent: 70,
  lifestylePercent: 20,
  treatPercent: 10,
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
  certainty?: DebtCertainty;
  signals: string[];
  missingFields: string[];
};

export type LifestyleInflationTransaction = {
  type: string;
  amount: number;
  currency?: string;
  money?: Money;
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
  money?: Money;
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
  monthlyBurnRate: number;
  savingRate: number;
  debtPressurePercent: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
  state: FinancialMarginState;
  paycheckDependency: "alta" | "media" | "baja";
  signals: string[];
  recommendation: string;
};

export type FireLeversSummaryOptions = {
  fixedMonthlyExpenses?: FinancialMarginFixedExpense[];
  uyuPerUsdRate?: number;
};

export type MonthlyReviewStatus = "fuerte" | "correcto" | "debil" | "alerta";

export type MonthlyReviewTransaction = {
  type: string;
  amount: number;
  currency?: string;
  money?: Money;
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
  debt?: Partial<DebtAnalysis>;
};

export type MonthlyReviewAnalysis = {
  monthKey: string;
  hasConfirmedData: boolean;
  status: MonthlyReviewStatus;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentAmount: number;
  savingsAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
  savingRate: number;
  primaryAction: string;
  signals: string[];
  nextMonthFocus: string;
};

export type WeeklyExecutionItemId =
  | "review_income"
  | "review_expenses"
  | "review_saving_rate"
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
  money?: Money;
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
  | "bienes_raices"
  | "bot_especulacion";

export type PortfolioCurrentSource =
  | "snapshot"
  | "movimientos"
  | "snapshot_movimientos";
export type PortfolioBalanceStatus = "sobrepeso" | "bajo_peso" | "alineado";

export type TargetPortfolioTransaction = {
  type: string;
  amount: number;
  currency?: string;
  money?: Money;
  usdConversion?: UsdConvertedAmount;
  category?: string;
  intent?: string;
  ignored?: boolean;
};

export type TargetPortfolioSettings = {
  targets: Record<PortfolioAssetClass, number>;
  manualAmounts: Record<PortfolioAssetClass, number>;
  policy?: Partial<InvestmentPolicySettings>;
};

export type TargetPortfolioSettingsInput = {
  targets?: Partial<Record<PortfolioAssetClass, number>>;
  manualAmounts?: Partial<Record<PortfolioAssetClass, number>>;
  policy?: Partial<InvestmentPolicySettings>;
};

export type PolicyChangeFriction = "none" | "review" | "wait_48h";

export type InvestmentPolicySettings = {
  monthlyContributionTarget: number;
  salaryInvestmentPercent: number;
  rebalanceTolerancePercent: number;
  rebalanceFrequency: "mensual" | "trimestral" | "semestral" | "anual";
  automaticInvestmentRule: string;
  indexCoreRule: string;
  incomeIncreaseRule: string;
  weeklyReviewRule: string;
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
  snapshotAmount: number;
  movementAmount: number;
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
  name: "Bot especulacion (trading algoritmico)";
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
  {
    assetClass: "bot_especulacion",
    label: "Bot especulacion (trading algoritmico)",
  },
];

export const DEFAULT_TARGET_PORTFOLIO_SETTINGS: TargetPortfolioSettings = {
  targets: {
    etf_usa: 40,
    etf_europa: 20,
    emergentes: 15,
    oro: 10,
    bitcoin: 5,
    bienes_raices: 5,
    bot_especulacion: 5,
  },
  manualAmounts: {
    etf_usa: 0,
    etf_europa: 0,
    emergentes: 0,
    oro: 0,
    bitcoin: 0,
    bienes_raices: 0,
    bot_especulacion: 0,
  },
  policy: {
    monthlyContributionTarget: 1800,
    salaryInvestmentPercent: 20,
    rebalanceTolerancePercent: 5,
    rebalanceFrequency: "trimestral",
    automaticInvestmentRule:
      "Invertir mediante transferencia automatica apenas entra el dinero; no depender de motivacion ni fuerza de voluntad.",
    indexCoreRule:
      "La base son indices simples: ETF USA, ETF Europa y emergentes. El bot especulativo queda acotado por su porcentaje objetivo.",
    incomeIncreaseRule:
      "Aplicar 70/20/10 a aumentos: 70% ahorro o inversion, 20% mejora de vida y 10% gusto personal.",
    weeklyReviewRule:
      "Revisar numeros una vez por semana: ingresos, gastos, deuda, aporte, impulsos y proximo hito.",
    drawdownRule: "No vender por caidas de mercado sin esperar 48 horas.",
    strongRallyRule: "No aumentar riesgo por euforia sin revisar la politica.",
    bitcoinRule:
      "Comprar BTC directo como activo, mantenerlo dentro del objetivo y no aumentarlo por FOMO.",
    goldRule:
      "Usar oro preferentemente via ETF con replica fisica como proteccion, no como apuesta de rendimiento.",
    individualStocksRule:
      "Acciones individuales y trading fuera del bot especulativo requieren analisis, seguimiento y regla explicita.",
    realEstateRule:
      "Inmuebles despues de construir capital: evaluar garantia, deuda, flujo, TAE y margen mensual.",
    noTouchRule:
      "No tocar el plan por panico, FOMO o comparacion sin esperar 48 horas.",
    lastReviewedAt: undefined,
    changeFriction: "review",
  },
};

export const DEFAULT_BOT_OPERA24HS_INVESTMENT: BotOpera24hsInvestment = {
  name: "Bot especulacion (trading algoritmico)",
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
  estimatedMonthlyIncome = 0,
  uyuPerUsdRate,
}: {
  transactions: FinancialMarginTransaction[];
  fixedExpenses?: FinancialMarginFixedExpense[];
  today?: Date;
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
  const coveredFixedExpenseIndexes = new Set<number>();
  const uncoveredRecurringTransactions = currentMonthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transaction.recurring &&
      !consumeMatchingFixedExpense({
        transaction,
        fixedExpenses,
        coveredFixedExpenseIndexes,
        uyuPerUsdRate,
      }),
  );
  const uncoveredRecurringTransactionSet = new Set(uncoveredRecurringTransactions);
  const confirmedRecurringExpenses = uncoveredRecurringTransactions.reduce(
    (total, transaction) => {
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
  const essentialExpenses =
    debtMonthlyPayments +
    sumFixedExpensesByEssentialCategory(fixedExpenses, uyuPerUsdRate) +
    currentMonthTransactions.reduce((total, transaction) => {
      if (
        transaction.type !== "gasto" ||
        !isEssentialMarginCategory(transaction.category) ||
        (transaction.recurring && !uncoveredRecurringTransactionSet.has(transaction))
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
  const savingRate =
    marginMonthlyIncome > 0
      ? roundToTwo((availableMonthlyMargin / marginMonthlyIncome) * 100)
      : 0;
  const debtPressurePercent =
    marginMonthlyIncome > 0
      ? roundToTwo((debtMonthlyPayments / marginMonthlyIncome) * 100)
      : 0;
  const state = financialMarginState({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
    savingRate,
    debtPressurePercent,
  });
  const paycheckDependency = marginPaycheckDependency({
    monthlyIncome: marginMonthlyIncome,
    availableMonthlyMargin,
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
    monthlyBurnRate: totalOutflow,
    savingRate,
    debtPressurePercent,
    essentialExpenses,
    nonEssentialExpenses,
    state,
    paycheckDependency,
    signals: financialMarginSignals({
      monthlyIncome,
      estimatedMonthlyIncome: normalizedEstimatedMonthlyIncome,
      marginIncomeSource,
      availableMonthlyMargin,
      debtPressurePercent,
    }),
    recommendation: financialMarginRecommendation(state),
  };
}

export function analyzeMonthlyReview({
  transactions,
  today = new Date(),
}: {
  transactions: MonthlyReviewTransaction[];
  today?: Date;
}): MonthlyReviewAnalysis {
  const monthKey = toMonthKey(today);
  const monthTransactions = transactions.filter(
    (transaction) =>
      isRealTransaction(transaction) && toMonthKey(transaction.date) === monthKey,
  );
  const monthlyIncome = roundToTwo(
    sumMonthlyReviewTransactions(monthTransactions, "ingreso"),
  );
  const monthlyExpenses = roundToTwo(
    sumMonthlyReviewTransactions(monthTransactions, "gasto"),
  );
  const investmentAmount = roundToTwo(
    sumMonthlyReviewTransactions(monthTransactions, "inversion"),
  );
  const debtAdded = roundToTwo(
    monthTransactions.reduce((total, transaction) => {
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
    }, 0),
  );
  const savingsAmount = roundToTwo(
    Math.max(0, monthlyIncome - monthlyExpenses - debtAdded),
  );
  const savingRate =
    monthlyIncome > 0 ? roundToTwo((savingsAmount / monthlyIncome) * 100) : 0;
  const bigPurchaseCount = monthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transactionAmountForUsdAnalysis(transaction) >=
        LIFESTYLE_BIG_PURCHASE_THRESHOLD,
  ).length;
  const emotionalPurchaseCount = monthTransactions.filter(
    (transaction) =>
      transaction.type === "gasto" &&
      transaction.antiErrorReview?.applies === true,
  ).length;
  const hasConfirmedData = monthTransactions.length > 0;
  const status = monthlyReviewStatus({
    hasConfirmedData,
    monthlyIncome,
    savingRate,
    investmentAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
  });
  const signals = monthlyReviewSignals({
    hasConfirmedData,
    monthlyIncome,
    monthlyExpenses,
    investmentAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
    savingRate,
  });

  return {
    monthKey,
    hasConfirmedData,
    status,
    monthlyIncome,
    monthlyExpenses,
    investmentAmount,
    savingsAmount,
    debtAdded,
    bigPurchaseCount,
    emotionalPurchaseCount,
    savingRate,
    primaryAction: monthlyReviewPrimaryAction({
      status,
      hasConfirmedData,
      debtAdded,
      emotionalPurchaseCount,
      investmentAmount,
    }),
    signals,
    nextMonthFocus: monthlyReviewNextMonthFocus(status),
  };
}

function sumMonthlyReviewTransactions(
  transactions: MonthlyReviewTransaction[],
  type: string,
) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type !== type) {
      return total;
    }

    return total + transactionAmountForUsdAnalysis(transaction);
  }, 0);
}

function monthlyReviewStatus({
  hasConfirmedData,
  monthlyIncome,
  savingRate,
  investmentAmount,
  debtAdded,
  bigPurchaseCount,
  emotionalPurchaseCount,
}: {
  hasConfirmedData: boolean;
  monthlyIncome: number;
  savingRate: number;
  investmentAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
}): MonthlyReviewStatus {
  if (!hasConfirmedData || monthlyIncome <= 0) {
    return "alerta";
  }

  if (debtAdded > 0 && (emotionalPurchaseCount > 0 || savingRate < 15)) {
    return "alerta";
  }

  if (savingRate < 0) {
    return "alerta";
  }

  if (savingRate < 15 || emotionalPurchaseCount > 0 || bigPurchaseCount >= 2) {
    return "debil";
  }

  if (savingRate >= 30 && investmentAmount > 0 && debtAdded === 0) {
    return "fuerte";
  }

  return "correcto";
}

function monthlyReviewSignals({
  hasConfirmedData,
  monthlyIncome,
  monthlyExpenses,
  investmentAmount,
  debtAdded,
  bigPurchaseCount,
  emotionalPurchaseCount,
  savingRate,
}: {
  hasConfirmedData: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
  savingRate: number;
}) {
  if (!hasConfirmedData) {
    return ["No hay movimientos reales confirmados para cerrar este mes."];
  }

  const signals = [
    `Ingreso confirmado del mes: ${formatCompactCurrency(monthlyIncome)}.`,
    `Gasto confirmado del mes: ${formatCompactCurrency(monthlyExpenses)}.`,
    `Tasa de ahorro estimada: ${roundToTwo(savingRate)}%.`,
  ];

  if (investmentAmount > 0) {
    signals.push(`Inversion realizada: ${formatCompactCurrency(investmentAmount)}.`);
  }

  if (debtAdded > 0) {
    signals.push(`Deuda nueva o presion mensual: ${formatCompactCurrency(debtAdded)}.`);
  }

  if (bigPurchaseCount > 0) {
    signals.push(`${bigPurchaseCount} compra(s) grande(s) confirmada(s).`);
  }

  if (emotionalPurchaseCount > 0) {
    signals.push(`${emotionalPurchaseCount} compra(s) con senales de impulso.`);
  }

  return signals;
}

function monthlyReviewPrimaryAction({
  status,
  hasConfirmedData,
  debtAdded,
  emotionalPurchaseCount,
  investmentAmount,
}: {
  status: MonthlyReviewStatus;
  hasConfirmedData: boolean;
  debtAdded: number;
  emotionalPurchaseCount: number;
  investmentAmount: number;
}) {
  if (!hasConfirmedData) {
    return "Confirmar ingresos y gastos reales del mes antes de sacar conclusiones.";
  }

  if (debtAdded > 0 || emotionalPurchaseCount > 0) {
    return "Revisar deuda nueva y compras impulsivas antes de planear el mes siguiente.";
  }

  if (status === "fuerte" && investmentAmount > 0) {
    return "Cerrar el mes y sostener el aporte antes de subir gastos fijos.";
  }

  if (status === "debil") {
    return "Elegir un gasto revisable y proteger el aporte del mes siguiente.";
  }

  if (status === "alerta") {
    return "Cerrar datos faltantes y congelar gastos nuevos hasta entender el mes.";
  }

  return "Mantener captura semanal y definir una accion concreta para el mes siguiente.";
}

function monthlyReviewNextMonthFocus(status: MonthlyReviewStatus) {
  const focus = {
    fuerte: "Sostener aporte, no subir gastos fijos y revisar cartera.",
    correcto: "Cerrar una mejora concreta sin cambiar el plan base.",
    debil: "Reducir una fuga de gasto y preservar margen mensual.",
    alerta: "Ordenar datos, deuda y compras grandes antes de avanzar.",
  };

  return focus[status];
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
  settings: TargetPortfolioSettingsInput,
  transactions: TargetPortfolioTransaction[] = [],
  botInvestment?: BotOpera24hsInvestment,
): TargetPortfolioAnalysis {
  const normalizedSettings = normalizeTargetPortfolioSettings(settings);
  const derivedAmounts = targetPortfolioDerivedAmounts(
    transactions,
    botInvestment,
  );
  const targetTotalPercent = PORTFOLIO_ASSET_CLASSES.reduce(
    (total, asset) => total + normalizedSettings.targets[asset.assetClass],
    0,
  );
  const currentAmounts = PORTFOLIO_ASSET_CLASSES.map((asset) => {
    const movementAmount = derivedAmounts[asset.assetClass];
    const snapshotAmount = normalizedSettings.manualAmounts[asset.assetClass];

    return {
      ...asset,
      snapshotAmount,
      movementAmount,
      currentAmount: snapshotAmount + movementAmount,
      currentSource: portfolioCurrentSource({
        snapshotAmount,
        movementAmount,
      }),
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
  settings: TargetPortfolioSettingsInput = {},
): TargetPortfolioSettings {
  const rawTargets = settings.targets ?? {};
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
    policy: normalizeInvestmentPolicySettings(settings.policy),
  };
}

export function normalizeBotOpera24hsInvestment(
  investment: Partial<BotOpera24hsInvestment> = {},
): BotOpera24hsInvestment {
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

function formatCompactCurrency(value: number) {
  return `USD ${roundToTwo(Math.max(0, value)).toLocaleString("en-US")}`;
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

function transactionAmountForUsdAnalysis(transaction: {
  amount: number;
  currency?: string;
  money?: Money;
  usdConversion?: UsdConvertedAmount;
}) {
  return transactionValueForUsdAnalysis(transaction, transaction.amount);
}

function transactionValueForUsdAnalysis(
  transaction: {
    amount?: number;
    currency?: string;
    money?: Money;
    usdConversion?: UsdConvertedAmount;
  },
  value: number,
) {
  if (
    transaction.money &&
    normalizePositiveNumber(transaction.amount ?? 0) ===
      normalizePositiveNumber(value)
  ) {
    return usdAmountForCalculation(transaction.money, "Transaction money");
  }

  return usdAmountForCalculation(
    createMoney({
      amount: value,
      currency: transaction.currency,
      usdConversion: transaction.usdConversion,
    }),
    "Transaction amount",
  );
}

function fixedExpenseAmountForUsdAnalysis(
  expense: FinancialMarginFixedExpense,
  uyuPerUsdRate?: number,
) {
  const currency = normalizeCurrencyCode(expense.currency);

  return usdAmountForCalculation(
    createMoney({
      amount: expense.monthlyAmount,
      currency,
      fallbackRates:
        currency === "UYU" && uyuPerUsdRate
          ? { UYU: uyuPerUsdRate }
          : undefined,
    }),
    "Fixed monthly expense",
  );
}

function consumeMatchingFixedExpense({
  transaction,
  fixedExpenses,
  coveredFixedExpenseIndexes,
  uyuPerUsdRate,
}: {
  transaction: {
    amount: number;
    currency?: string;
    money?: Money;
    category?: string;
    usdConversion?: UsdConvertedAmount;
  };
  fixedExpenses: FinancialMarginFixedExpense[];
  coveredFixedExpenseIndexes: Set<number>;
  uyuPerUsdRate?: number;
}) {
  const transactionCategory = normalizeMarginCategory(transaction.category);
  const transactionAmount = transactionAmountForUsdAnalysis(transaction);

  for (const [index, expense] of fixedExpenses.entries()) {
    if (expense.active === false || coveredFixedExpenseIndexes.has(index)) {
      continue;
    }

    if (normalizeMarginCategory(expense.category) !== transactionCategory) {
      continue;
    }

    if (
      Math.abs(
        fixedExpenseAmountForUsdAnalysis(expense, uyuPerUsdRate) -
          transactionAmount,
      ) > 0.01
    ) {
      continue;
    }

    coveredFixedExpenseIndexes.add(index);
    return true;
  }

  return false;
}

function normalizePositiveNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
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
  debtPressurePercent,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
  savingRate: number;
  debtPressurePercent: number;
}): FinancialMarginState {
  if (
    monthlyIncome <= 0 ||
    availableMonthlyMargin < 0 ||
    debtPressurePercent >= 35
  ) {
    return "fragil";
  }

  if (savingRate < 10 || debtPressurePercent >= 20) {
    return "ajustado";
  }

  if (savingRate >= 25 && debtPressurePercent < 10) {
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

function marginPaycheckDependency({
  monthlyIncome,
  availableMonthlyMargin,
}: {
  monthlyIncome: number;
  availableMonthlyMargin: number;
}) {
  if (monthlyIncome <= 0 || availableMonthlyMargin < 0) {
    return "alta";
  }

  if (availableMonthlyMargin / monthlyIncome < 0.15) {
    return "media";
  }

  return "baja";
}

function financialMarginSignals({
  monthlyIncome,
  estimatedMonthlyIncome,
  marginIncomeSource,
  availableMonthlyMargin,
  debtPressurePercent,
}: {
  monthlyIncome: number;
  estimatedMonthlyIncome: number;
  marginIncomeSource: FinancialMarginAnalysis["marginIncomeSource"];
  availableMonthlyMargin: number;
  debtPressurePercent: number;
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

  if (debtPressurePercent >= 20) {
    signals.push("La deuda consume una parte importante del ingreso confirmado.");
  }

  if (signals.length === 0) {
    signals.push("Margen mensual positivo y deuda bajo control.");
  }

  return signals;
}

function financialMarginRecommendation(state: FinancialMarginState) {
  if (state === "fragil") {
    return "Bajar gasto fijo o deuda antes de asumir decisiones nuevas.";
  }

  if (state === "ajustado") {
    return "Revisar gastos fijos y deuda antes de asumir decisiones nuevas.";
  }

  if (state === "estable") {
    return "Mantener margen positivo y evitar que nuevos gastos fijos absorban la ventaja.";
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
    return "Aplicar 70/20/10 al próximo aumento y capturar la parte de inversion antes de subir gastos.";
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
  return previousLocalMonthKey(monthKey);
}

function toMonthKey(value: Date | string) {
  return toLocalMonthKey(value);
}
