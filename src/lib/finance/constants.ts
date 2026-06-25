import { DEFAULT_UYU_PER_USD_ANALYSIS_RATE } from "../money";
import type {
  BotOpera24hsInvestment,
  IncomeIncreaseRuleSettings,
  PortfolioAssetClass,
  TargetPortfolioSettings,
  WealthMilestone,
  WeeklyExecutionItem,
  FreedomInputs,
} from "./types";

export { DEFAULT_UYU_PER_USD_ANALYSIS_RATE };

export const DEFAULT_FREEDOM_INPUTS: FreedomInputs = {
  netWorth: 0,
  investedCapital: 0,
  estimatedMonthlyIncome: 0,
  desiredMonthlySpend: 0,
  monthlyContribution: 0,
  expectedAnnualReturn: 7,
};

export const CORE_EXPENSE_CATEGORIES = ["vivienda", "transporte", "comida"] as const;

export const FIRE_REDUCTION_LEVELS = [10, 50, 100, 250] as const;

export const DEFAULT_INVESTMENT_RATE = 0.15;

export const LIFESTYLE_BIG_PURCHASE_THRESHOLD = 1000;

export const LIFESTYLE_HIGH_CORE_EXPENSE_SHARE = 50;

export const DEFAULT_INCOME_INCREASE_RULE_SETTINGS: IncomeIncreaseRuleSettings = {
  investmentPercent: 70,
  lifestylePercent: 20,
  treatPercent: 10,
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
  customAssets: [],
  hiddenAssetClasses: [],
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
  initialCapital: 0,
  monthlyContribution: 0,
  reinvestmentRule: "Reinvertir cuando el capital pendiente alcance el minimo.",
  reinvestmentMinimum: 500,
  monthlyResults: [],
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
    id: "invested_500k",
    label: "US$500.000 en capital de inversiones",
    targetAmount: 500000,
    basis: "invested_capital",
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
