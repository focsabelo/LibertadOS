import type { Money } from "../money";

export type FreedomInputs = {
  netWorth: number;
  investedCapital: number;
  estimatedMonthlyIncome: number;
  desiredMonthlySpend: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
};

export type WealthAssetCategory =
  | "vivienda"
  | "vehiculo"
  | "efectivo"
  | "inmueble_inversion"
  | "otro";

export type WealthAsset = {
  id: string;
  name: string;
  category: WealthAssetCategory;
  estimatedValue: number;
  debtBalance: number;
  countsAsInvestmentCapital: boolean;
};

export type WealthAssetsSummary = {
  totalEstimatedValue: number;
  totalDebtBalance: number;
  netWorthAmount: number;
  investmentCapitalAmount: number;
};

export type OwnedBusinessStatus =
  | "idea"
  | "validando"
  | "activo"
  | "pausado"
  | "cerrado";

export type OwnedBusinessValuationConfidence = "baja" | "media" | "alta";

export type OwnedBusiness = {
  id: string;
  name: string;
  status: OwnedBusinessStatus;
  monthlyRevenue: number;
  monthlyCosts: number;
  cashBalance: number;
  capitalContributed: number;
  ownerWithdrawals: number;
  reinvestedAmount: number;
  debtBalance: number;
  estimatedValue: number;
  valuationConfidence: OwnedBusinessValuationConfidence;
  monthlyHours: number;
  notes: string;
};

export type OwnedBusinessesSummary = {
  count: number;
  activeCount: number;
  profitableCount: number;
  totalMonthlyRevenue: number;
  totalMonthlyCosts: number;
  totalMonthlyProfit: number;
  totalCashBalance: number;
  totalCapitalContributed: number;
  totalOwnerWithdrawals: number;
  totalReinvestedAmount: number;
  totalDebtBalance: number;
  totalEstimatedValue: number;
  totalOperationalNetWorth: number;
  totalMonthlyHours: number;
  averageProfitPerHour: number;
};

export type EffectiveInputsTransactionSummary = {
  netWorthDelta: number;
  investedDelta: number;
  debtDelta?: number;
  monthlyNetResult?: number;
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

export type CoreExpenseCategory = "vivienda" | "transporte" | "comida";

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

export type TargetPortfolioCustomAsset = {
  id: string;
  label: string;
  targetPercent: number;
  currentAmount: number;
};

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
  customAssets: TargetPortfolioCustomAsset[];
  hiddenAssetClasses: PortfolioAssetClass[];
  policy?: Partial<InvestmentPolicySettings>;
};

export type TargetPortfolioSettingsInput = {
  targets?: Partial<Record<PortfolioAssetClass, number>>;
  manualAmounts?: Partial<Record<PortfolioAssetClass, number>>;
  customAssets?: TargetPortfolioCustomAsset[];
  hiddenAssetClasses?: unknown;
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
  assetClass: string;
  label: string;
  isCustom: boolean;
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
  contribution?: number;
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
