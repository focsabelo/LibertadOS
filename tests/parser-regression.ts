import {
  analyzeWealthRoadmap,
  analyzeBotOpera24hs,
  analyzeTargetPortfolio,
  analyzeWeeklyExecution,
  analyzeLifestyleInflation,
  analyzeIncomeIncrease,
  analyzeMonthlyReview,
  analyzeFinancialMargin,
  analyzeConfirmedDebtLoad,
  analyzeInvestmentPolicy,
  calculateEffectiveInputs,
  confirmedTransactionsSummary,
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_INCOME_INCREASE_RULE_SETTINGS,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  WEEKLY_EXECUTION_ITEMS,
  incomeRuleSuggestion,
  normalizeIncomeIncreaseRuleSettings,
  normalizeInvestmentPolicySettings,
  freedomNumber,
  type ConfirmedDebtLoadTransaction,
  type FinancialMarginFixedExpense,
  type FinancialMarginTransaction,
  type MonthlyReviewTransaction,
  type InvestmentPolicyDecisionContext,
  type LifestyleInflationRisk,
  type LifestyleInflationTransaction,
  type TargetPortfolioSettingsInput,
  type TargetPortfolioTransaction,
  type WeeklyExecutionReview,
  type WeeklyExecutionTransaction,
  type WealthMilestone,
  type BotOpera24hsInvestment,
} from "../src/lib/finance";
import {
  analyzeFinancialNote,
  isConfirmable,
  type DetectedFinancialItem,
  type FinancialType,
  type TransactionIntent,
} from "../src/lib/financial-notes";
import {
  analyzeDecisionMode,
  type DecisionModeAnalysis,
  type DecisionModeRiskLevel,
  type DecisionModeType,
} from "../src/lib/decision-mode";
import { createMoney } from "../src/lib/money";

type ExpectedCase = {
  text: string;
  type: FinancialType;
  intent: TransactionIntent;
  confirmable: boolean;
  amount?: number;
  currency?: string;
  category?: string;
  incomeIncrease?: boolean;
  freedomImpact?: number;
  freedomImpactGreaterThan?: number;
  confidence?: "alta" | "media" | "baja";
  antiErrorEnemies?: string[];
  antiErrorSignals?: string[];
  antiErrorAction?: string;
  debt?: {
    kind?: string;
    principal?: number;
    installmentAmount?: number;
    termMonths?: number;
    totalCost?: number;
    totalInterest?: number;
    annualCost?: number;
    monthlyMarginImpact?: number;
    fireImpact?: number;
    certainty?: string;
    risk?: string;
    missingFields?: string[];
    signals?: string[];
  };
};

type ItemComparableKey =
  | "amount"
  | "currency"
  | "category"
  | "incomeIncrease"
  | "freedomImpact";

const cases: ExpectedCase[] = [
  {
    text: "Gaste 350 en comida",
    type: "gasto",
    intent: "real",
    confirmable: true,
    amount: 350,
    category: "comida",
    freedomImpact: 8750,
    confidence: "alta",
  },
  {
    text: "Gaste 350 en comida",
    type: "gasto",
    intent: "real",
    confirmable: true,
    amount: 350,
    currency: "UYU",
    category: "comida",
    freedomImpact: 8750,
  },
  {
    text: "Gaste USD 1.50 en comida",
    type: "gasto",
    intent: "real",
    confirmable: true,
    amount: 1.5,
    currency: "USD",
    category: "comida",
    freedomImpact: 37.5,
  },
  {
    text: "Gaste UYU 1.500 en comida",
    type: "gasto",
    intent: "real",
    confirmable: true,
    amount: 1500,
    currency: "UYU",
    category: "comida",
    freedomImpact: 37500,
  },
  {
    text: "Pense en gastar 5000 en un celular, pero no lo hice",
    type: "decision",
    intent: "negado",
    confirmable: false,
    amount: 5000,
    category: "tecnologia",
    freedomImpact: 0,
  },
  {
    text: "Pense en comprar, pero no lo hice",
    type: "decision",
    intent: "negado",
    confirmable: false,
    amount: 0,
    freedomImpact: 0,
  },
  {
    text: "Quiero comprar un celular de 5000",
    type: "decision",
    intent: "intencion",
    confirmable: false,
    amount: 5000,
    category: "tecnologia",
    freedomImpact: 125000,
    antiErrorEnemies: ["celular o tecnologia cara", "decision no confirmada"],
    antiErrorAction: "esperar",
  },
  {
    text: "Gaste 500 en viaje a Europa",
    type: "gasto",
    intent: "real",
    confirmable: true,
    amount: 500,
    category: "viaje",
    freedomImpact: 12500,
  },
  {
    text: "Cobre 28000 de sueldo",
    type: "ingreso",
    intent: "real",
    confirmable: true,
    amount: 28000,
    category: "salario",
    freedomImpact: 0,
  },
  {
    text: "Me aumentaron el sueldo 5000",
    type: "ingreso",
    intent: "real",
    confirmable: true,
    amount: 5000,
    category: "salario",
    incomeIncrease: true,
    freedomImpact: 0,
  },
  {
    text: "Inverti 1000 en ETF USA VOO",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 1000,
    category: "etf_usa",
    freedomImpact: 0,
  },
  {
    text: "Inverti 700 en ETF Europa",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 700,
    category: "etf_europa",
    freedomImpact: 0,
  },
  {
    text: "Inverti 100 en botopera24hs",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 100,
    category: "bot_especulacion",
    freedomImpact: 0,
  },
  {
    text: "Inverti 300 en Bitcoin BTC",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 300,
    category: "bitcoin",
    freedomImpact: 0,
  },
  {
    text: "Quiero invertir 500 en oro",
    type: "inversion",
    intent: "intencion",
    confirmable: false,
    amount: 500,
    category: "oro",
    freedomImpact: 0,
  },
  {
    text: "Quiero comprarme un iPhone nuevo en cuotas porque me lo merezco",
    type: "deuda",
    intent: "intencion",
    confirmable: false,
    amount: 0,
    category: "tecnologia",
    freedomImpact: 0,
    antiErrorEnemies: [
      "celular o tecnologia cara",
      "financiacion",
      "me lo merezco",
      "decision no confirmada",
    ],
  },
  {
    text: "Pense en cambiar el auto porque todos tienen uno mejor, pero no lo hice",
    type: "decision",
    intent: "negado",
    confirmable: false,
    amount: 0,
    category: "auto",
    freedomImpact: 0,
    antiErrorEnemies: ["auto", "comparacion", "decision no confirmada"],
  },
  {
    text: "Compre un celular de 800 USD con tarjeta",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 800,
    currency: "USD",
    category: "tecnologia",
    freedomImpact: 20000,
    antiErrorEnemies: ["celular o tecnologia cara", "deuda"],
    antiErrorAction: "revisar",
  },
  {
    text: "Quiero financiar 3000 USD en una moto",
    type: "deuda",
    intent: "intencion",
    confirmable: false,
    amount: 3000,
    currency: "USD",
    category: "auto",
    freedomImpact: 75000,
    antiErrorEnemies: ["compra grande", "auto", "deuda", "decision no confirmada"],
  },
  {
    text: "Compre en 12 cuotas de 200",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 2400,
    freedomImpact: 60000,
    antiErrorEnemies: ["deuda", "financiacion"],
    antiErrorSignals: ["Cuotas o financiacion"],
    debt: {
      kind: "compra_cuotas",
      installmentAmount: 200,
      termMonths: 12,
      totalCost: 2400,
      annualCost: 2400,
      monthlyMarginImpact: 200,
      fireImpact: 60000,
      certainty: "parcial",
      missingFields: ["capital original", "tasa anual"],
    },
    confidence: "media",
  },
  {
    text: "12 cuotas de 200",
    type: "deuda",
    intent: "pensado",
    confirmable: false,
    amount: 2400,
    freedomImpact: 60000,
    antiErrorEnemies: ["deuda", "financiacion", "decision no confirmada"],
    antiErrorSignals: ["Cuotas o financiacion"],
    debt: {
      kind: "compra_cuotas",
      installmentAmount: 200,
      termMonths: 12,
      totalCost: 2400,
      monthlyMarginImpact: 200,
      fireImpact: 60000,
      risk: "medio",
    },
  },
  {
    text: "Quiero sacar un prestamo de 5000",
    type: "deuda",
    intent: "intencion",
    confirmable: false,
    amount: 5000,
    debt: {
      kind: "prestamo",
      principal: 5000,
      monthlyMarginImpact: 0,
      certainty: "insuficiente",
      missingFields: ["cuota mensual", "plazo", "tasa anual"],
      signals: ["Faltan cuota, plazo o tasa para estimar presion mensual."],
    },
    confidence: "baja",
  },
  {
    text: "No saque el prestamo de 5000",
    type: "deuda",
    intent: "negado",
    confirmable: false,
    amount: 5000,
    freedomImpact: 0,
    debt: {
      kind: "prestamo",
      principal: 5000,
      monthlyMarginImpact: 0,
    },
  },
  {
    text: "Compre 800 con tarjeta",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 800,
    debt: {
      kind: "gasto_tarjeta",
      principal: 800,
      monthlyMarginImpact: 0,
      missingFields: ["cuota mensual", "tasa anual"],
    },
  },
  {
    text: "Compre 800 en 6 cuotas con tarjeta",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 800,
    debt: {
      kind: "compra_cuotas",
      principal: 800,
      termMonths: 6,
      monthlyMarginImpact: 0,
      certainty: "insuficiente",
      missingFields: ["cuota mensual", "tasa anual"],
      signals: ["Faltan cuota, plazo o tasa para estimar presion mensual."],
    },
  },
  {
    text: "Pague solo el minimo de la tarjeta 100",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 100,
    debt: {
      kind: "pago_minimo",
      installmentAmount: 100,
      monthlyMarginImpact: 100,
      risk: "alto",
      signals: ["Pago minimo de tarjeta detectado."],
    },
  },
  {
    text: "Hipoteca de 800 por mes",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 800,
    freedomImpact: 240000,
    debt: {
      kind: "hipoteca",
      installmentAmount: 800,
      monthlyMarginImpact: 800,
      fireImpact: 240000,
    },
  },
  {
    text: "Cuota del auto 350",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 350,
    debt: {
      kind: "auto",
      installmentAmount: 350,
      monthlyMarginImpact: 350,
      fireImpact: 105000,
    },
  },
  {
    text: "Saque un prestamo de 5000 a 24 meses",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 5000,
    debt: {
      kind: "prestamo",
      principal: 5000,
      termMonths: 24,
      monthlyMarginImpact: 0,
      missingFields: ["cuota mensual", "tasa anual"],
      signals: ["Faltan cuota, plazo o tasa para estimar presion mensual."],
    },
  },
];

function firstItem(
  text: string,
  defaultCurrency = "USD",
  dailyUsdQuote?: {
    uyuPerUsd: number;
    date: string;
    source: string;
  },
) {
  const analysis = analyzeFinancialNote(
    text,
    new Date("2026-06-18T12:00:00Z"),
    { defaultCurrency, dailyUsdQuote },
  );
  assert(analysis.length > 0, `Expected at least one detected item for "${text}"`);
  return analysis[0];
}

function runCase(expected: ExpectedCase) {
  const item = firstItem(expected.text, expected.currency === "UYU" ? "UYU" : "USD");

  assertEqual(item.type, expected.type, expected.text, "type");
  assertEqual(item.intent, expected.intent, expected.text, "intent");
  assertEqual(isConfirmable(item), expected.confirmable, expected.text, "confirmable");

  assertOptionalEqual(item, expected, "amount");
  assertOptionalEqual(item, expected, "currency");
  assertOptionalEqual(item, expected, "category");
  assertOptionalEqual(item, expected, "incomeIncrease");
  assertOptionalEqual(item, expected, "freedomImpact");

  if (expected.confidence !== undefined) {
    assertEqual(item.confidence, expected.confidence, expected.text, "confidence");
  }

  if (expected.freedomImpactGreaterThan !== undefined) {
    assert(
      item.freedomImpact > expected.freedomImpactGreaterThan,
      `${expected.text}: expected freedomImpact > ${expected.freedomImpactGreaterThan}, received ${item.freedomImpact}`,
    );
  }

  for (const enemy of expected.antiErrorEnemies ?? []) {
    assertIncludes(
      item.antiErrorReview?.detectedEnemies ?? [],
      enemy,
      expected.text,
      "antiErrorReview.detectedEnemies",
    );
  }

  for (const signal of expected.antiErrorSignals ?? []) {
    assertIncludes(
      item.antiErrorReview?.signals ?? [],
      signal,
      expected.text,
      "antiErrorReview.signals",
    );
  }

  if (expected.antiErrorAction !== undefined) {
    assertEqual(
      item.antiErrorReview?.suggestedAction,
      expected.antiErrorAction,
      expected.text,
      "antiErrorReview.suggestedAction",
    );
  }

  if (expected.debt) {
    assert(item.debt, `${expected.text}: expected debt analysis`);
    assertDebt(item, expected);
  }
}

function runDecisionModeCase(expected: DecisionModeCase) {
  const analysis = analyzeDecisionMode(expected.text, {
    netWorth: 10000,
    investedCapital: 3000,
    estimatedMonthlyIncome: 0,
    desiredMonthlySpend: 1200,
    monthlyContribution: 500,
    expectedAnnualReturn: 7,
  });

  assertEqual(analysis.detectedType, expected.type, expected.name, "detectedType");
  assertEqual(analysis.intent, expected.intent, expected.name, "intent");
  assertEqual(analysis.riskLevel, expected.riskLevel, expected.name, "riskLevel");

  if (expected.amount !== undefined) {
    assertEqual(analysis.amount, expected.amount, expected.name, "amount");
  }

  if (expected.currency !== undefined) {
    assertEqual(analysis.currency, expected.currency, expected.name, "currency");
  }

  if (expected.category !== undefined) {
    assertEqual(analysis.category, expected.category, expected.name, "category");
  }

  if (expected.installments !== undefined) {
    assertEqual(
      analysis.installments,
      expected.installments,
      expected.name,
      "installments",
    );
  }

  if (expected.monthlyImpact !== undefined) {
    assertAlmostEqual(
      analysis.estimatedMonthlyImpact,
      expected.monthlyImpact,
      expected.name,
      "estimatedMonthlyImpact",
    );
  }

  if (expected.fireImpact !== undefined) {
    assertAlmostEqual(
      analysis.estimatedFireImpact,
      expected.fireImpact,
      expected.name,
      "estimatedFireImpact",
    );
  }

  for (const field of expected.missingFields ?? []) {
    assertIncludes(analysis.missingFields, field, expected.name, "missingFields");
  }

  for (const signal of expected.emotionalSignals ?? []) {
    assertIncludes(
      analysis.emotionalSignals,
      signal,
      expected.name,
      "emotionalSignals",
    );
  }

  for (const factor of expected.riskFactors ?? []) {
    assertIncludes(
      analysis.riskFactors.map((item) => item.id),
      factor,
      expected.name,
      "riskFactors",
    );
  }

  for (const action of expected.actions ?? []) {
    assertIncludes(
      analysis.availableActions,
      action,
      expected.name,
      "availableActions",
    );
  }
}

function assertDebt(item: DetectedFinancialItem, expected: ExpectedCase) {
  const debt = item.debt;

  assert(debt, `${expected.text}: expected debt analysis`);

  for (const [key, value] of Object.entries(expected.debt ?? {})) {
    if (key === "missingFields" || key === "signals") {
      continue;
    }

    assertEqual(
      debt[key as keyof typeof debt],
      value,
      expected.text,
      `debt.${key}`,
    );
  }

  for (const field of expected.debt?.missingFields ?? []) {
    assertIncludes(debt.missingFields, field, expected.text, "debt.missingFields");
  }

  for (const signal of expected.debt?.signals ?? []) {
    assertIncludes(debt.signals, signal, expected.text, "debt.signals");
  }
}

function assertOptionalEqual(
  item: DetectedFinancialItem,
  expected: ExpectedCase,
  key: ItemComparableKey,
) {
  if (expected[key] !== undefined) {
    assertEqual(item[key], expected[key], expected.text, key);
  }
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  text: string,
  field: string,
) {
  assert(
    Object.is(actual, expected),
    `${text}: expected ${field} to be ${String(expected)}, received ${String(actual)}`,
  );
}

function assertAlmostEqual(
  actual: unknown,
  expected: number,
  text: string,
  field: string,
) {
  assert(
    typeof actual === "number" && Math.abs(actual - expected) < 0.01,
    `${text}: expected ${field} to be close to ${String(expected)}, received ${String(actual)}`,
  );
}

function assertIncludes(
  actual: string[],
  expected: string,
  text: string,
  field: string,
) {
  assert(
    actual.includes(expected),
    `${text}: expected ${field} to include "${expected}", received [${actual.join(", ")}]`,
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const testCase of cases) {
  runCase(testCase);
}

const localYesterdayItem = analyzeFinancialNote(
  "Ayer gaste 100 en comida",
  new Date("2026-06-01T02:30:00Z"),
)[0];

assertEqual(
  localYesterdayItem.date,
  "2026-05-30",
  "Fecha relativa usa dia local de Montevideo",
  "date",
);

const localMonthMargin = analyzeFinancialMargin({
  transactions: [marginTx("ingreso", 2500, "2026-06-30")],
  today: new Date("2026-07-01T02:30:00Z"),
});

assertEqual(
  localMonthMargin.monthKey,
  "2026-06",
  "Mes financiero usa timezone local",
  "monthKey",
);
assertEqual(
  localMonthMargin.monthlyIncome,
  2500,
  "Mes financiero incluye movimientos del mes local",
  "monthlyIncome",
);

type DecisionModeCase = {
  name: string;
  text: string;
  type: DecisionModeType;
  intent: DecisionModeAnalysis["intent"];
  riskLevel: DecisionModeRiskLevel;
  amount?: number;
  currency?: string;
  category?: string;
  installments?: number;
  monthlyImpact?: number;
  fireImpact?: number;
  missingFields?: string[];
  emotionalSignals?: string[];
  riskFactors?: string[];
  actions?: DecisionModeAnalysis["availableActions"][number][];
};

const decisionModeCases: DecisionModeCase[] = [
  {
    name: "Quiero comprar iPhone en cuotas queda como deuda potencial",
    text: "quiero comprar un iPhone de USD 900 en 12 cuotas",
    type: "deuda_potencial",
    intent: "intencion",
    riskLevel: "alto",
    amount: 900,
    currency: "USD",
    category: "tecnologia",
    installments: 12,
    monthlyImpact: 75,
    fireImpact: 22500,
    missingFields: ["tasa anual"],
    riskFactors: ["cuotas/financiacion", "tasa desconocida"],
  },
  {
    name: "Compra potencial simple queda como intencion simulada",
    text: "Quiero comprar un iPhone de USD 900 porque me lo merezco",
    type: "gasto_potencial",
    intent: "intencion",
    riskLevel: "medio",
    amount: 900,
    currency: "USD",
    category: "tecnologia",
    monthlyImpact: 75,
    fireImpact: 22500,
    emotionalSignals: ["merecimiento"],
    riskFactors: ["compra grande", "tecnologia/estatus", "senal emocional"],
    actions: [
      "esperar_48h",
      "guardar_como_intencion",
      "convertir_a_nota_borrador",
      "descartar",
    ],
  },
  {
    name: "Deuda con cuotas muestra presion mensual y datos faltantes",
    text: "Quiero financiar 1200 USD en 12 cuotas con tarjeta",
    type: "deuda_potencial",
    intent: "intencion",
    riskLevel: "alto",
    amount: 1200,
    currency: "USD",
    installments: 12,
    monthlyImpact: 100,
    fireImpact: 30000,
    missingFields: ["tasa anual"],
    riskFactors: ["cuotas/financiacion", "tasa desconocida"],
    actions: ["pedir_mas_datos", "esperar_48h"],
  },
  {
    name: "Negacion no genera impacto financiero",
    text: "no compré el iPhone de USD 700",
    type: "negacion",
    intent: "negacion",
    riskLevel: "bajo",
    amount: 700,
    currency: "USD",
    monthlyImpact: 0,
    fireImpact: 0,
    actions: ["descartar"],
  },
  {
    name: "Pensamiento de auto no queda como compra real",
    text: "pensé en comprar un auto",
    type: "gasto_potencial",
    intent: "pensamiento",
    riskLevel: "sin_datos",
    missingFields: ["monto", "moneda"],
    riskFactors: ["tecnologia/estatus"],
  },
  {
    name: "Casi compra de tele queda como pensamiento",
    text: "casi compro una tele",
    type: "gasto_potencial",
    intent: "pensamiento",
    riskLevel: "sin_datos",
    missingFields: ["monto", "moneda"],
  },
  {
    name: "Prestamo ofrecido pide datos sin crear deuda real",
    text: "me ofrecieron un préstamo",
    type: "deuda_potencial",
    intent: "pensamiento",
    riskLevel: "sin_datos",
    missingFields: ["monto", "moneda", "plazo", "tasa anual"],
    actions: ["pedir_mas_datos", "esperar_48h"],
  },
  {
    name: "Inversion ya ejecutada se lee real pero sigue simulada",
    text: "invertí USD 500 en BTC",
    type: "inversion_potencial",
    intent: "real",
    riskLevel: "medio",
    amount: 500,
    currency: "USD",
    category: "bitcoin",
    monthlyImpact: 41.67,
    fireImpact: 12500,
    riskFactors: ["inversion especulativa"],
  },
  {
    name: "Voy a invertir BTC queda como intencion",
    text: "voy a invertir USD 500 en BTC",
    type: "inversion_potencial",
    intent: "intencion",
    riskLevel: "medio",
    amount: 500,
    currency: "USD",
    category: "bitcoin",
    riskFactors: ["inversion especulativa"],
  },
  {
    name: "Compra real de laptop se distingue de intencion",
    text: "compré una laptop de USD 800",
    type: "gasto_potencial",
    intent: "real",
    riskLevel: "medio",
    amount: 800,
    currency: "USD",
    category: "tecnologia",
    monthlyImpact: 66.67,
    fireImpact: 20000,
    riskFactors: ["compra grande", "tecnologia/estatus"],
  },
];

for (const testCase of decisionModeCases) {
  runDecisionModeCase(testCase);
}

type LifestyleCase = {
  name: string;
  transactions: LifestyleInflationTransaction[];
  risk: LifestyleInflationRisk;
  currentExpenses?: number;
  estimatedSavings?: number;
  absorbedByExpensesPercent?: number;
  increaseRuleInvestment?: number;
  increaseRuleLifestyle?: number;
  increaseRuleTreat?: number;
};

type IncomeIncreaseCase = {
  name: string;
  transactions: LifestyleInflationTransaction[];
  hasIncrease: boolean;
  increaseAmount?: number;
  investment?: number;
  lifestyle?: number;
  treat?: number;
  absorbedByExpenses?: number;
  capturedForFreedom?: number;
  fireImpact?: number;
};

const lifestyleCases: LifestyleCase[] = [
  {
    name: "Ingreso sube y gasto no sube",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 600, "2026-06-11"),
    ],
    risk: "bajo",
    absorbedByExpensesPercent: 0,
  },
  {
    name: "Ingreso sube 500 y gasto sube 200",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 800, "2026-06-11"),
    ],
    risk: "medio",
    absorbedByExpensesPercent: 40,
    increaseRuleInvestment: 350,
    increaseRuleLifestyle: 100,
    increaseRuleTreat: 50,
  },
  {
    name: "Ingreso sube 500 y gasto sube 500",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 1100, "2026-06-11"),
    ],
    risk: "alto",
    absorbedByExpensesPercent: 100,
  },
  {
    name: "Gasto sube mas que ingreso",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 1200, "2026-06-11"),
    ],
    risk: "alto",
    absorbedByExpensesPercent: 100,
  },
  {
    name: "No hay mes anterior",
    transactions: [tx("ingreso", 1500, "2026-06-10")],
    risk: "sin-datos",
  },
  {
    name: "Intenciones y compras futuras no cuentan",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 500, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 500, "2026-06-11"),
      tx("gasto", 3000, "2026-06-12", { intent: "intencion" }),
      tx("gasto", 2000, "2026-06-13", { intent: "pensado" }),
    ],
    risk: "bajo",
    currentExpenses: 500,
  },
  {
    name: "Sugerencias 70/20/10 no cuentan como movimientos reales",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 500, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 500, "2026-06-11"),
      tx("inversion", incomeRuleSuggestion(500, true).suggestedInvestment, "2026-06-12"),
    ],
    risk: "bajo",
    currentExpenses: 500,
    estimatedSavings: 1000,
  },
];

for (const testCase of lifestyleCases) {
  runLifestyleCase(testCase);
}

const normalizedIncreaseRule = normalizeIncomeIncreaseRuleSettings({
  investmentPercent: 120,
  lifestylePercent: -10,
  treatPercent: 5,
});

assertEqual(
  DEFAULT_INCOME_INCREASE_RULE_SETTINGS.investmentPercent,
  70,
  "income increase defaults",
  "investmentPercent",
);
assertEqual(
  DEFAULT_INCOME_INCREASE_RULE_SETTINGS.lifestylePercent,
  20,
  "income increase defaults",
  "lifestylePercent",
);
assertEqual(
  DEFAULT_INCOME_INCREASE_RULE_SETTINGS.treatPercent,
  10,
  "income increase defaults",
  "treatPercent",
);
assertEqual(
  normalizedIncreaseRule.investmentPercent,
  70,
  "invalid income increase rule",
  "investmentPercent",
);
assertEqual(
  normalizedIncreaseRule.lifestylePercent,
  20,
  "invalid income increase rule",
  "lifestylePercent",
);
assertEqual(
  normalizedIncreaseRule.treatPercent,
  10,
  "invalid income increase rule",
  "treatPercent",
);

const incomeIncreaseCases: IncomeIncreaseCase[] = [
  {
    name: "Aumento confirmado aplica regla 70/20/10",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 600, "2026-06-11"),
    ],
    hasIncrease: true,
    increaseAmount: 500,
    investment: 350,
    lifestyle: 100,
    treat: 50,
    absorbedByExpenses: 0,
    capturedForFreedom: 500,
    fireImpact: 105000,
  },
  {
    name: "Gasto confirmado absorbe parte del aumento",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1500, "2026-06-10"),
      tx("gasto", 800, "2026-06-11"),
    ],
    hasIncrease: true,
    increaseAmount: 500,
    absorbedByExpenses: 200,
    capturedForFreedom: 300,
  },
  {
    name: "Sin aumento confirmado queda inactivo",
    transactions: [
      tx("ingreso", 1000, "2026-05-10"),
      tx("gasto", 600, "2026-05-11"),
      tx("ingreso", 1000, "2026-06-10"),
      tx("gasto", 600, "2026-06-11"),
    ],
    hasIncrease: false,
  },
];

for (const testCase of incomeIncreaseCases) {
  runIncomeIncreaseCase(testCase);
}

type DebtLoadCase = {
  name: string;
  transactions: ConfirmedDebtLoadTransaction[];
  monthlyContribution?: number;
  monthlyMarginImpact: number;
  annualCost: number;
  fireImpact: number;
  principalBalance: number;
  monthlyDecisionMargin?: number;
  debtPressureRisk?: string;
  freedomWarning?: string;
};

type PortfolioCase = {
  name: string;
  settings: TargetPortfolioSettingsInput;
  transactions: TargetPortfolioTransaction[];
  botInvestment?: BotOpera24hsInvestment;
  targetTotalPercent: number;
  targetWarning: boolean;
  totalCurrentAmount: number;
  asset: string;
  currentAmount: number;
  currentSource: "snapshot" | "movimientos" | "snapshot_movimientos";
  targetPercent?: number;
  status: "sobrepeso" | "bajo_peso" | "alineado";
  policyMonthlyContributionTarget?: number;
  policyRebalanceTolerancePercent?: number;
};

type WealthRoadmapCase = {
  name: string;
  inputs: {
    netWorth: number;
    investedCapital: number;
    monthlyContribution: number;
    annualReturnPercent: number;
    simulatedMonthlyContribution?: number;
    milestones?: WealthMilestone[];
  };
  milestoneId: string;
  currentAmount: number;
  distanceAmount: number;
  progressPercent: number;
  estimatedMonths: number;
  simulatedEstimatedMonths?: number;
  isNext: boolean;
};

type BotOperaCase = {
  name: string;
  investment: BotOpera24hsInvestment;
  capitalTotalContributed: number;
  currentOperationalCapital: number;
  pendingCapital: number;
  amountUntilNextReinvestment: number;
  currentMonthResult: number;
  monthlyReturnPercent: number;
  accumulatedReturnPercent: number;
  month: string;
  monthOperationalCapitalStart: number;
  monthOperationalCapitalEnd: number;
  monthPendingContributionCapital: number;
  monthPendingProfitCapital: number;
  monthReinvestedAmount: number;
};

type WeeklyExecutionCase = {
  name: string;
  transactions: WeeklyExecutionTransaction[];
  review: WeeklyExecutionReview;
  status: "pendiente" | "incompleto" | "cumplido";
  scorePercent: number;
  completedCount: number;
  recommendation: string;
  overdueAction: string;
};

type MonthlyReviewCase = {
  name: string;
  transactions: MonthlyReviewTransaction[];
  status: "fuerte" | "correcto" | "debil" | "alerta";
  monthlyIncome: number;
  monthlyExpenses: number;
  investmentAmount: number;
  debtAdded: number;
  bigPurchaseCount: number;
  emotionalPurchaseCount: number;
  savingRate: number;
  primaryAction: string;
};

type FinancialMarginCase = {
  name: string;
  transactions: FinancialMarginTransaction[];
  fixedExpenses: FinancialMarginFixedExpense[];
  uyuPerUsdRate?: number;
  monthlyIncome: number;
  fixedMonthlyExpenses: number;
  variableMonthlyExpenses: number;
  debtMonthlyPayments: number;
  availableMonthlyMargin: number;
  savingRate: number;
  debtPressurePercent: number;
  essentialExpenses?: number;
  nonEssentialExpenses?: number;
  state: "fragil" | "ajustado" | "estable" | "fuerte";
};

type EffectiveInputsCase = {
  name: string;
  inputs: {
    netWorth: number;
    investedCapital: number;
    estimatedMonthlyIncome: number;
    desiredMonthlySpend: number;
    monthlyContribution: number;
    expectedAnnualReturn: number;
  };
  transactionSummary: {
    netWorthDelta: number;
    investedDelta: number;
    recurringMonthlyExpenses: number;
    expenseDelta: number;
  };
  netWorth: number;
  investedCapital: number;
  desiredMonthlySpend: number;
};

type TransactionSummaryCase = {
  name: string;
  transactions: Parameters<typeof confirmedTransactionsSummary>[0];
  netWorthDelta: number;
  investedDelta?: number;
  confirmedExpenses: number;
  monthlyConfirmedExpenses: number;
};

const debtLoadCases: DebtLoadCase[] = [
  {
    name: "Intencion de deuda no cambia dashboard",
    transactions: [
      debtTx(5000, {
        intent: "intencion",
        debt: {
          kind: "prestamo",
          principal: 5000,
          monthlyMarginImpact: 0,
          annualCost: 0,
          fireImpact: 0,
          totalCost: 0,
          totalInterest: 0,
          use: "desconocida",
          risk: "sin_datos",
          signals: [],
          missingFields: ["cuota mensual", "plazo", "tasa anual"],
        },
      }),
    ],
    monthlyMarginImpact: 0,
    annualCost: 0,
    fireImpact: 0,
    principalBalance: 0,
  },
  {
    name: "Deuda confirmada con cuota cambia margen y FIRE",
    transactions: [
      debtTx(2400, {
        debt: {
          kind: "compra_cuotas",
          principal: 0,
          installmentAmount: 200,
          termMonths: 12,
          monthlyMarginImpact: 200,
          annualCost: 2400,
          fireImpact: freedomNumber(200),
          totalCost: 2400,
          totalInterest: 0,
          use: "consumo",
          risk: "medio",
          signals: [],
          missingFields: ["capital original", "tasa anual"],
        },
      }),
    ],
    monthlyMarginImpact: 200,
    annualCost: 2400,
    fireImpact: 60000,
    principalBalance: 2400,
    monthlyContribution: 300,
    monthlyDecisionMargin: 100,
    debtPressureRisk: "medio",
    freedomWarning: "La deuda ya consume una parte importante de tu margen mensual.",
  },
];

for (const testCase of debtLoadCases) {
  runDebtLoadCase(testCase);
}

const portfolioCases: PortfolioCase[] = [
  {
    name: "Objetivos suman 100",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 0,
    asset: "etf_usa",
    currentAmount: 0,
    currentSource: "snapshot",
    status: "alineado",
    policyMonthlyContributionTarget: 1800,
    policyRebalanceTolerancePercent: 5,
  },
  {
    name: "Bot especulacion cuenta como clase de activo derivada",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
    botInvestment: {
      ...DEFAULT_BOT_OPERA24HS_INVESTMENT,
      initialCapital: 1000,
      monthlyContribution: 100,
      reinvestmentMinimum: 500,
      monthlyResults: [{ month: "2026-06", amount: 50 }],
    },
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 1150,
    asset: "bot_especulacion",
    currentAmount: 1150,
    currentSource: "movimientos",
    status: "sobrepeso",
  },
  {
    name: "Cartera legada agrega bot sin pasar de 100",
    settings: {
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
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 0,
    asset: "bot_especulacion",
    currentAmount: 0,
    currentSource: "snapshot",
    targetPercent: 5,
    status: "alineado",
  },
  {
    name: "Objetivos no suman 100",
    settings: {
      targets: {
        ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
        bitcoin: 10,
      },
      manualAmounts: DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts,
    },
    transactions: [],
    targetTotalPercent: 105,
    targetWarning: true,
    totalCurrentAmount: 0,
    asset: "bitcoin",
    currentAmount: 0,
    currentSource: "snapshot",
    status: "alineado",
  },
  {
    name: "Cartera vacia queda alineada",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 0,
    asset: "oro",
    currentAmount: 0,
    currentSource: "snapshot",
    status: "alineado",
  },
  {
    name: "Inversion confirmada alimenta movimientos",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [portfolioTx("etf_usa", 3000)],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 3000,
    asset: "etf_usa",
    currentAmount: 3000,
    currentSource: "movimientos",
    status: "sobrepeso",
  },
  {
    name: "Snapshot base alimenta actual sin movimientos",
    settings: {
      targets: DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
      manualAmounts: {
        ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts,
        oro: 500,
      },
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 500,
    asset: "oro",
    currentAmount: 500,
    currentSource: "snapshot",
    status: "sobrepeso",
  },
  {
    name: "Estados bajo peso y alineado",
    settings: {
      targets: DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
      manualAmounts: {
        etf_usa: 450,
        etf_europa: 20,
        emergentes: 150,
        oro: 100,
        bitcoin: 50,
        bienes_raices: 50,
        bot_especulacion: 0,
      },
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 820,
    asset: "etf_europa",
    currentAmount: 20,
    currentSource: "snapshot",
    status: "bajo_peso",
  },
  {
    name: "Cartera suma snapshot base y movimientos confirmados",
    settings: {
      targets: DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
      manualAmounts: {
        ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts,
        etf_usa: 1000,
      },
    },
    transactions: [portfolioTx("etf_usa", 250)],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 1250,
    asset: "etf_usa",
    currentAmount: 1250,
    currentSource: "snapshot_movimientos",
    status: "sobrepeso",
  },
  {
    name: "Cartera usa Money para inversiones confirmadas en UYU",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [
      portfolioTx("etf_usa", 40000, {
        currency: "UYU",
        money: createMoney({
          amount: 40000,
          currency: "UYU",
          fallbackRates: { UYU: 40 },
        }),
      }),
    ],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 1000,
    asset: "etf_usa",
    currentAmount: 1000,
    currentSource: "movimientos",
    status: "sobrepeso",
  },
];

for (const testCase of portfolioCases) {
  runPortfolioCase(testCase);
}

const normalizedPolicy = normalizeInvestmentPolicySettings({
  noTouchRule: "",
  strongRallyRule: "",
  lastReviewedAt: "2026-06-21T12:00:00.000Z",
  changeFriction: "wait_48h",
});

assertEqual(
  normalizedPolicy.noTouchRule.length > 0,
  true,
  "policy normalization fills no-touch rule",
  "noTouchRule",
);
assertEqual(
  normalizedPolicy.strongRallyRule.length > 0,
  true,
  "policy normalization fills rally rule",
  "strongRallyRule",
);
assertEqual(
  normalizedPolicy.changeFriction,
  "wait_48h",
  "policy normalization preserves valid friction",
  "changeFriction",
);
assertEqual(
  normalizedPolicy.automaticInvestmentRule.includes("transferencia automatica"),
  true,
  "policy normalization fills automatic investment rule",
  "automaticInvestmentRule",
);
assertEqual(
  normalizedPolicy.indexCoreRule.includes("indices simples"),
  true,
  "policy normalization fills index core rule",
  "indexCoreRule",
);
assertEqual(
  normalizedPolicy.incomeIncreaseRule.includes("70/20/10"),
  true,
  "policy normalization fills income increase rule",
  "incomeIncreaseRule",
);

const basePolicyAnalysis = analyzeInvestmentPolicy({
  portfolio: analyzeTargetPortfolio(DEFAULT_TARGET_PORTFOLIO_SETTINGS, []),
});

assertEqual(
  basePolicyAnalysis.violatedRuleCount,
  0,
  "complete default policy has no violations",
  "violatedRuleCount",
);
assertIncludes(
  basePolicyAnalysis.rules.map((rule) => rule.id),
  "no_touch_rule",
  "policy analysis includes no-touch rule",
  "rules",
);
assertIncludes(
  basePolicyAnalysis.rules.map((rule) => rule.id),
  "automatic_investment_rule",
  "policy analysis includes automatic investment rule",
  "rules",
);
assertIncludes(
  basePolicyAnalysis.rules.map((rule) => rule.id),
  "income_increase_rule",
  "policy analysis includes 70/20/10 rule",
  "rules",
);

const bitcoinHeavyPolicyAnalysis = analyzeInvestmentPolicy({
  portfolio: analyzeTargetPortfolio(
    DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    [portfolioTx("bitcoin", 1000)],
  ),
});

assertIncludes(
  bitcoinHeavyPolicyAnalysis.rules.map((rule) => rule.id),
  "rebalance_bitcoin",
  "bitcoin overweight creates policy warning",
  "rules",
);
assertEqual(
  bitcoinHeavyPolicyAnalysis.violatedRuleCount > 0,
  true,
  "bitcoin overweight is a high-priority policy violation",
  "violatedRuleCount",
);

const hotDecisionPolicyContext: InvestmentPolicyDecisionContext = {
  detectedType: "inversion_potencial",
  category: "bitcoin",
  emotionalSignals: ["fomo"],
  riskFactors: [{ id: "senal emocional", severity: "media" }],
};
const hotDecisionPolicyAnalysis = analyzeInvestmentPolicy({
  portfolio: analyzeTargetPortfolio(DEFAULT_TARGET_PORTFOLIO_SETTINGS, []),
  decision: hotDecisionPolicyContext,
});

assertIncludes(
  hotDecisionPolicyAnalysis.rules.map((rule) => rule.id),
  "decision_48h",
  "hot investment decision creates wait rule",
  "rules",
);

const roadmapCases: WealthRoadmapCase[] = [
  {
    name: "Primer hito invertido usa capital invertido confirmado",
    inputs: {
      netWorth: 85000,
      investedCapital: 38000,
      monthlyContribution: 1000,
      annualReturnPercent: 0,
      simulatedMonthlyContribution: 2000,
    },
    milestoneId: "invested_50k",
    currentAmount: 38000,
    distanceAmount: 12000,
    progressPercent: 76,
    estimatedMonths: 12,
    simulatedEstimatedMonths: 6,
    isNext: true,
  },
  {
    name: "Hito alcanzado deja de ser prioritario",
    inputs: {
      netWorth: 85000,
      investedCapital: 62000,
      monthlyContribution: 1500,
      annualReturnPercent: 0,
    },
    milestoneId: "invested_50k",
    currentAmount: 62000,
    distanceAmount: 0,
    progressPercent: 100,
    estimatedMonths: 0,
    isNext: false,
  },
  {
    name: "Siguiente hito usa patrimonio neto",
    inputs: {
      netWorth: 85000,
      investedCapital: 62000,
      monthlyContribution: 1500,
      annualReturnPercent: 0,
    },
    milestoneId: "first_property",
    currentAmount: 85000,
    distanceAmount: 15000,
    progressPercent: 85,
    estimatedMonths: 10,
    isNext: true,
  },
];

for (const testCase of roadmapCases) {
  runWealthRoadmapCase(testCase);
}

const botOperaCases: BotOperaCase[] = [
  {
    name: "Aportes quedan pendientes hasta llegar al minimo",
    investment: {
      name: "Bot especulacion (trading algoritmico)",
      botNumber: "Bot 1",
      startDate: "2026-01-01",
      initialCapital: 1000,
      monthlyContribution: 100,
      reinvestmentRule: "Reinvertir cuando el pendiente llegue al minimo.",
      reinvestmentMinimum: 500,
      monthlyResults: [
        { month: "2026-01", amount: 20 },
        { month: "2026-02", amount: 20 },
        { month: "2026-03", amount: 20 },
        { month: "2026-04", amount: 20 },
      ],
    },
    capitalTotalContributed: 1400,
    currentOperationalCapital: 1000,
    pendingCapital: 480,
    amountUntilNextReinvestment: 20,
    currentMonthResult: 20,
    monthlyReturnPercent: 2,
    accumulatedReturnPercent: 5.71,
    month: "2026-04",
    monthOperationalCapitalStart: 1000,
    monthOperationalCapitalEnd: 1000,
    monthPendingContributionCapital: 400,
    monthPendingProfitCapital: 80,
    monthReinvestedAmount: 0,
  },
  {
    name: "Al llegar al minimo pasa a capital operativo",
    investment: {
      name: "Bot especulacion (trading algoritmico)",
      botNumber: "Bot 1",
      startDate: "2026-01-01",
      initialCapital: 1000,
      monthlyContribution: 100,
      reinvestmentRule: "Reinvertir cuando el pendiente llegue al minimo.",
      reinvestmentMinimum: 500,
      monthlyResults: [
        { month: "2026-01", amount: 0 },
        { month: "2026-02", amount: 0 },
        { month: "2026-03", amount: 0 },
        { month: "2026-04", amount: 0 },
        { month: "2026-05", amount: 0 },
      ],
    },
    capitalTotalContributed: 1500,
    currentOperationalCapital: 1500,
    pendingCapital: 0,
    amountUntilNextReinvestment: 500,
    currentMonthResult: 0,
    monthlyReturnPercent: 0,
    accumulatedReturnPercent: 0,
    month: "2026-05",
    monthOperationalCapitalStart: 1000,
    monthOperationalCapitalEnd: 1500,
    monthPendingContributionCapital: 0,
    monthPendingProfitCapital: 0,
    monthReinvestedAmount: 500,
  },
];

for (const testCase of botOperaCases) {
  runBotOperaCase(testCase);
}

const weeklyExecutionCases: WeeklyExecutionCase[] = [
  {
    name: "Semana sin checks queda pendiente con accion de captura",
    transactions: [],
    review: {
      weekKey: "2026-W25",
      completedItemIds: [],
    },
    status: "pendiente",
    scorePercent: 0,
    completedCount: 0,
    recommendation: "Capturar y confirmar al menos un movimiento real esta semana.",
    overdueAction: "Revisar ingresos confirmados",
  },
  {
    name: "Semana parcial prioriza compras emocionales",
    transactions: [
      weeklyTx("ingreso", 1000, "2026-06-17"),
      weeklyTx("gasto", 240, "2026-06-18", {
        impulse: true,
        antiErrorReview: { applies: true, signals: ["Compra grande"] },
      }),
    ],
    review: {
      weekKey: "2026-W25",
      completedItemIds: ["review_income", "review_expenses"],
    },
    status: "incompleto",
    scorePercent: 22,
    completedCount: 2,
    recommendation: "Revisar compra emocional y esperar 48 horas antes de repetirla.",
    overdueAction: "Revisar tasa de ahorro",
  },
  {
    name: "Semana completa queda cumplida sin gamificacion",
    transactions: [
      weeklyTx("ingreso", 1200, "2026-06-17"),
      weeklyTx("inversion", 300, "2026-06-18"),
    ],
    review: {
      weekKey: "2026-W25",
      completedItemIds: WEEKLY_EXECUTION_ITEMS.map((item) => item.id),
    },
    status: "cumplido",
    scorePercent: 100,
    completedCount: WEEKLY_EXECUTION_ITEMS.length,
    recommendation: "Semana cerrada. Mantener captura y revisar el proximo hito.",
    overdueAction: "",
  },
];

for (const testCase of weeklyExecutionCases) {
  runWeeklyExecutionCase(testCase);
}

const financialMarginCases: FinancialMarginCase[] = [
  {
    name: "Margen fuerte separa gastos fijos, variables y deuda",
    transactions: [
      marginTx("ingreso", 5000, "2026-06-02", { category: "salario" }),
      marginTx("gasto", 350, "2026-06-05", { category: "comida" }),
      marginTx("gasto", 250, "2026-06-06", { category: "salida" }),
      marginTx("deuda", 2400, "2026-05-10", {
        debt: {
          kind: "compra_cuotas",
          installmentAmount: 200,
          monthlyMarginImpact: 200,
          annualCost: 2400,
          fireImpact: freedomNumber(200),
          totalCost: 2400,
          totalInterest: 0,
          use: "consumo",
          risk: "medio",
          signals: [],
          missingFields: [],
        },
      }),
      marginTx("gasto", 900, "2026-06-12", { intent: "intencion" }),
    ],
    fixedExpenses: [
      fixedMarginExpense("Alquiler", "vivienda", 1400),
      fixedMarginExpense("Seguro medico", "salud", 300),
      fixedMarginExpense("Netflix", "suscripciones", 20),
      fixedMarginExpense("Gimnasio pausado", "otros", 50, false),
    ],
    monthlyIncome: 5000,
    fixedMonthlyExpenses: 1720,
    variableMonthlyExpenses: 600,
    debtMonthlyPayments: 200,
    availableMonthlyMargin: 2480,
    savingRate: 49.6,
    debtPressurePercent: 4,
    state: "fuerte",
  },
  {
    name: "Margen fragil ignora intenciones y expone dependencia del sueldo",
    transactions: [
      marginTx("ingreso", 2200, "2026-06-02"),
      marginTx("gasto", 500, "2026-06-08", { category: "comida" }),
      marginTx("deuda", 3000, "2026-05-10", {
        debt: {
          kind: "prestamo",
          installmentAmount: 650,
          monthlyMarginImpact: 650,
          annualCost: 7800,
          fireImpact: freedomNumber(650),
          totalCost: 7800,
          totalInterest: 4800,
          use: "consumo",
          risk: "alto",
          signals: [],
          missingFields: [],
        },
      }),
      marginTx("gasto", 900, "2026-06-12", { intent: "pensado" }),
    ],
    fixedExpenses: [fixedMarginExpense("Alquiler", "vivienda", 1250)],
    monthlyIncome: 2200,
    fixedMonthlyExpenses: 1250,
    variableMonthlyExpenses: 500,
    debtMonthlyPayments: 650,
    availableMonthlyMargin: -200,
    savingRate: -9.09,
    debtPressurePercent: 29.55,
    state: "fragil",
  },
  {
    name: "Margen convierte gastos UYU confirmados a USD",
    transactions: [
      marginTx("gasto", 248, "2026-06-21", {
        currency: "UYU",
        usdConversion: {
          originalAmount: 248,
          originalCurrency: "UYU",
          convertedAmount: 5.99,
          convertedCurrency: "USD",
          rate: 41.4,
          date: "2026-06-21",
          source: "DolarAPI Uruguay",
        },
      }),
      marginTx("gasto", 130, "2026-06-21", {
        currency: "UYU",
        usdConversion: {
          originalAmount: 130,
          originalCurrency: "UYU",
          convertedAmount: 3.14,
          convertedCurrency: "USD",
          rate: 41.4,
          date: "2026-06-21",
          source: "DolarAPI Uruguay",
        },
      }),
    ],
    fixedExpenses: [],
    monthlyIncome: 0,
    fixedMonthlyExpenses: 0,
    variableMonthlyExpenses: 9.13,
    debtMonthlyPayments: 0,
    availableMonthlyMargin: -9.13,
    savingRate: 0,
    debtPressurePercent: 0,
    state: "fragil",
  },
  {
    name: "Margen convierte gastos fijos UYU esenciales a USD",
    transactions: [marginTx("ingreso", 2000, "2026-06-02")],
    fixedExpenses: [fixedMarginExpense("Mama", "vivienda", 4000, true, "UYU")],
    uyuPerUsdRate: 40,
    monthlyIncome: 2000,
    fixedMonthlyExpenses: 100,
    variableMonthlyExpenses: 0,
    debtMonthlyPayments: 0,
    availableMonthlyMargin: 1900,
    savingRate: 95,
    debtPressurePercent: 0,
    essentialExpenses: 100,
    nonEssentialExpenses: 0,
    state: "fuerte",
  },
  {
    name: "Pago confirmado de gasto fijo no duplica margen mensual",
    transactions: [
      marginTx("ingreso", 3000, "2026-06-01"),
      marginTx("gasto", 1200, "2026-06-02", {
        category: "vivienda",
        recurring: true,
      }),
    ],
    fixedExpenses: [fixedMarginExpense("Alquiler", "vivienda", 1200)],
    monthlyIncome: 3000,
    fixedMonthlyExpenses: 1200,
    variableMonthlyExpenses: 0,
    debtMonthlyPayments: 0,
    availableMonthlyMargin: 1800,
    savingRate: 60,
    debtPressurePercent: 0,
    essentialExpenses: 1200,
    nonEssentialExpenses: 0,
    state: "fuerte",
  },
];

for (const testCase of financialMarginCases) {
  runFinancialMarginCase(testCase);
}

const monthlyReviewCases: MonthlyReviewCase[] = [
  {
    name: "Mes fuerte resume ingresos, gastos, inversion y accion",
    transactions: [
      monthlyTx("ingreso", 5000, "2026-06-02", { category: "salario" }),
      monthlyTx("gasto", 1200, "2026-06-05", { category: "vivienda" }),
      monthlyTx("gasto", 500, "2026-06-07", { category: "comida" }),
      monthlyTx("inversion", 1000, "2026-06-10", { category: "ETF USA" }),
      monthlyTx("ahorro", 300, "2026-06-12", { category: "broker" }),
    ],
    status: "fuerte",
    monthlyIncome: 5000,
    monthlyExpenses: 1700,
    investmentAmount: 1000,
    debtAdded: 0,
    bigPurchaseCount: 1,
    emotionalPurchaseCount: 0,
    savingRate: 66,
    primaryAction: "Cerrar el mes y sostener el aporte antes de subir gastos fijos.",
  },
  {
    name: "Mes de alerta detecta deuda nueva y compra emocional",
    transactions: [
      monthlyTx("ingreso", 2500, "2026-06-02"),
      monthlyTx("gasto", 900, "2026-06-05", { category: "vivienda" }),
      monthlyTx("gasto", 850, "2026-06-09", {
        antiErrorReview: {
          applies: true,
          signals: ["Compra impulsiva detectada."],
        },
      }),
      monthlyTx("deuda", 3000, "2026-06-10", {
        debt: {
          kind: "prestamo",
          monthlyMarginImpact: 450,
          annualCost: 5400,
          fireImpact: freedomNumber(450),
          use: "consumo",
          risk: "alto",
          signals: [],
          missingFields: [],
        },
      }),
      monthlyTx("gasto", 1000, "2026-06-14", { intent: "intencion" }),
    ],
    status: "alerta",
    monthlyIncome: 2500,
    monthlyExpenses: 1750,
    investmentAmount: 0,
    debtAdded: 450,
    bigPurchaseCount: 0,
    emotionalPurchaseCount: 1,
    savingRate: 12,
    primaryAction: "Revisar deuda nueva y compras impulsivas antes de planear el mes siguiente.",
  },
  {
    name: "Mes sin datos confirmados queda pendiente de cierre",
    transactions: [
      monthlyTx("gasto", 500, "2026-06-05", { intent: "pensado" }),
      monthlyTx("ingreso", 2500, "2026-05-02"),
    ],
    status: "alerta",
    monthlyIncome: 0,
    monthlyExpenses: 0,
    investmentAmount: 0,
    debtAdded: 0,
    bigPurchaseCount: 0,
    emotionalPurchaseCount: 0,
    savingRate: 0,
    primaryAction: "Confirmar ingresos y gastos reales del mes antes de sacar conclusiones.",
  },
];

for (const testCase of monthlyReviewCases) {
  runMonthlyReviewCase(testCase);
}

const estimatedIncomeMargin = analyzeFinancialMargin({
  transactions: [],
  fixedExpenses: [fixedMarginExpense("Alquiler", "vivienda", 1200)],
  estimatedMonthlyIncome: 3000,
  today: new Date("2026-06-18T12:00:00Z"),
});

assertEqual(
  estimatedIncomeMargin.monthlyIncome,
  0,
  "Ingreso fijo estimado no cuenta como ingreso confirmado",
  "monthlyIncome",
);
assertEqual(
  estimatedIncomeMargin.estimatedMonthlyIncome,
  3000,
  "Ingreso fijo estimado queda disponible como supuesto",
  "estimatedMonthlyIncome",
);
assertEqual(
  estimatedIncomeMargin.estimatedAvailableMonthlyMargin,
  1800,
  "Ingreso fijo estimado permite ver margen supuesto separado",
  "estimatedAvailableMonthlyMargin",
);
assertEqual(
  estimatedIncomeMargin.availableMonthlyMargin,
  1800,
  "Ingreso fijo estimado alimenta margen disponible si no hay ingreso confirmado",
  "availableMonthlyMargin",
);
assertEqual(
  estimatedIncomeMargin.marginIncomeSource,
  "estimated",
  "Margen disponible marca que usa ingreso estimado",
  "marginIncomeSource",
);
assertEqual(
  estimatedIncomeMargin.availableMonthlyMarginTone,
  "green",
  "Margen disponible positivo usa tono verde sin requisito extra",
  "availableMonthlyMarginTone",
);
assert(
  estimatedIncomeMargin.signals.includes(
    "Margen disponible usa ingreso fijo estimado hasta confirmar el sueldo del mes.",
  ),
  "Ingreso fijo estimado aparece como senal visible en margen disponible",
);

const effectiveInputsCases: EffectiveInputsCase[] = [
  {
    name: "Gastos confirmados reducen patrimonio efectivo",
    inputs: {
      netWorth: 10000,
      investedCapital: 3000,
      estimatedMonthlyIncome: 4500,
      desiredMonthlySpend: 1200,
      monthlyContribution: 500,
      expectedAnnualReturn: 7,
    },
    transactionSummary: {
      netWorthDelta: -700,
      investedDelta: 200,
      recurringMonthlyExpenses: 150,
      expenseDelta: 700,
    },
    netWorth: 9300,
    investedCapital: 3200,
    desiredMonthlySpend: 1350,
  },
];

for (const testCase of effectiveInputsCases) {
  runEffectiveInputsCase(testCase);
}

const transactionSummaryCases: TransactionSummaryCase[] = [
  {
    name: "Gasto confirmado baja patrimonio",
    transactions: [
      {
        type: "gasto",
        amount: 700,
        date: "2026-06-20",
        category: "comida",
        recurring: false,
        intent: "real",
        ignored: false,
      },
    ],
    netWorthDelta: -700,
    confirmedExpenses: 700,
    monthlyConfirmedExpenses: 700 / 12,
  },
  {
    name: "Inversion confirmada traspasa liquidez a capital invertido",
    transactions: [
      {
        type: "inversion",
        amount: 500,
        currency: "USD",
        date: "2026-06-20",
        category: "etf_usa",
        recurring: false,
        intent: "real",
        ignored: false,
      },
    ],
    netWorthDelta: 0,
    investedDelta: 500,
    confirmedExpenses: 0,
    monthlyConfirmedExpenses: 0,
  },
  {
    name: "Gasto UYU sin conversion usa fallback en vez de desaparecer",
    transactions: [
      {
        type: "gasto",
        amount: 1000,
        currency: "UYU",
        date: "2026-06-20",
        category: "comida",
        recurring: false,
        intent: "real",
        ignored: false,
      },
    ],
    netWorthDelta: -25,
    confirmedExpenses: 25,
    monthlyConfirmedExpenses: 25 / 12,
  },
];

for (const testCase of transactionSummaryCases) {
  runTransactionSummaryCase(testCase);
}

const uyuConversionItem = firstItem("Gaste UYU 1000 en comida", "UYU", {
  uyuPerUsd: 40,
  date: "2026-06-21",
  source: "DolarAPI",
});

assertEqual(
  uyuConversionItem.usdConversion?.convertedAmount,
  25,
  "UYU note item stores USD equivalent using the daily quote",
  "usdConversion.convertedAmount",
);
assertEqual(
  uyuConversionItem.usdConversion?.rate,
  40,
  "UYU note item stores the UYU per USD rate",
  "usdConversion.rate",
);
assertEqual(
  uyuConversionItem.usdConversion?.date,
  "2026-06-21",
  "UYU note item stores the quote date",
  "usdConversion.date",
);

console.log(
  `Parser regression tests passed: ${cases.length}. Decision mode tests passed: ${decisionModeCases.length}. Lifestyle inflation tests passed: ${lifestyleCases.length}. Income increase tests passed: ${incomeIncreaseCases.length}. Debt load tests passed: ${debtLoadCases.length}. Portfolio tests passed: ${portfolioCases.length}. Wealth roadmap tests passed: ${roadmapCases.length}. Bot Opera24hs tests passed: ${botOperaCases.length}. Weekly execution tests passed: ${weeklyExecutionCases.length}. Financial margin tests passed: ${financialMarginCases.length}. Monthly review tests passed: ${monthlyReviewCases.length}. Effective inputs tests passed: ${effectiveInputsCases.length}. Transaction summary tests passed: ${transactionSummaryCases.length}`,
);

function tx(
  type: string,
  amount: number,
  date: string,
  patch: Partial<LifestyleInflationTransaction> = {},
): LifestyleInflationTransaction {
  return {
    type,
    amount,
    date,
    category: "sin categoria",
    intent: "real",
    ...patch,
  };
}

function runLifestyleCase(expected: LifestyleCase) {
  const analysis = analyzeLifestyleInflation(
    expected.transactions,
    new Date("2026-06-18T12:00:00Z"),
  );

  assertEqual(analysis.risk, expected.risk, expected.name, "risk");

  if (expected.currentExpenses !== undefined) {
    assertEqual(
      analysis.current.expenses,
      expected.currentExpenses,
      expected.name,
      "current.expenses",
    );
  }

  if (expected.estimatedSavings !== undefined) {
    assertEqual(
      analysis.current.estimatedSavings,
      expected.estimatedSavings,
      expected.name,
      "current.estimatedSavings",
    );
  }

  if (expected.absorbedByExpensesPercent !== undefined) {
    assertEqual(
      analysis.absorbedByExpensesPercent,
      expected.absorbedByExpensesPercent,
      expected.name,
      "absorbedByExpensesPercent",
    );
  }

  if (expected.increaseRuleInvestment !== undefined) {
    assertEqual(
      analysis.increaseRule?.suggestedInvestment,
      expected.increaseRuleInvestment,
      expected.name,
      "increaseRule.suggestedInvestment",
    );
  }

  if (expected.increaseRuleLifestyle !== undefined) {
    assertEqual(
      analysis.increaseRule?.lifestyleUpgrade,
      expected.increaseRuleLifestyle,
      expected.name,
      "increaseRule.lifestyleUpgrade",
    );
  }

  if (expected.increaseRuleTreat !== undefined) {
    assertEqual(
      analysis.increaseRule?.personalTreat,
      expected.increaseRuleTreat,
      expected.name,
      "increaseRule.personalTreat",
    );
  }
}

function runIncomeIncreaseCase(expected: IncomeIncreaseCase) {
  const lifestyleAnalysis = analyzeLifestyleInflation(
    expected.transactions,
    new Date("2026-06-18T12:00:00Z"),
  );
  const analysis = analyzeIncomeIncrease({
    lifestyle: lifestyleAnalysis,
    monthlyContribution: 100,
  });

  assertEqual(
    analysis.hasIncrease,
    expected.hasIncrease,
    expected.name,
    "hasIncrease",
  );

  if (expected.increaseAmount !== undefined) {
    assertEqual(
      analysis.increaseAmount,
      expected.increaseAmount,
      expected.name,
      "increaseAmount",
    );
  }

  if (expected.investment !== undefined) {
    assertEqual(
      analysis.plan.investment,
      expected.investment,
      expected.name,
      "plan.investment",
    );
  }

  if (expected.lifestyle !== undefined) {
    assertEqual(
      analysis.plan.lifestyleUpgrade,
      expected.lifestyle,
      expected.name,
      "plan.lifestyleUpgrade",
    );
  }

  if (expected.treat !== undefined) {
    assertEqual(
      analysis.plan.personalTreat,
      expected.treat,
      expected.name,
      "plan.personalTreat",
    );
  }

  if (expected.absorbedByExpenses !== undefined) {
    assertEqual(
      analysis.absorbedByExpenses,
      expected.absorbedByExpenses,
      expected.name,
      "absorbedByExpenses",
    );
  }

  if (expected.capturedForFreedom !== undefined) {
    assertEqual(
      analysis.capturedForFreedom,
      expected.capturedForFreedom,
      expected.name,
      "capturedForFreedom",
    );
  }

  if (expected.fireImpact !== undefined) {
    assertEqual(
      analysis.fireImpact,
      expected.fireImpact,
      expected.name,
      "fireImpact",
    );
  }
}

function debtTx(
  amount: number,
  patch: Partial<ConfirmedDebtLoadTransaction> = {},
): ConfirmedDebtLoadTransaction {
  return {
    type: "deuda",
    amount,
    date: "2026-06-12",
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function portfolioTx(
  category: string,
  amount: number,
  patch: Partial<TargetPortfolioTransaction> = {},
): TargetPortfolioTransaction {
  return {
    type: "inversion",
    amount,
    category,
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function runDebtLoadCase(expected: DebtLoadCase) {
  const summary = analyzeConfirmedDebtLoad(
    expected.transactions,
    expected.monthlyContribution,
  );

  assertEqual(
    summary.monthlyMarginImpact,
    expected.monthlyMarginImpact,
    expected.name,
    "monthlyMarginImpact",
  );
  assertEqual(summary.annualCost, expected.annualCost, expected.name, "annualCost");
  assertEqual(summary.fireImpact, expected.fireImpact, expected.name, "fireImpact");
  assertEqual(
    summary.principalBalance,
    expected.principalBalance,
    expected.name,
    "principalBalance",
  );

  if (expected.monthlyDecisionMargin !== undefined) {
    assertEqual(
      summary.monthlyDecisionMargin,
      expected.monthlyDecisionMargin,
      expected.name,
      "monthlyDecisionMargin",
    );
  }

  if (expected.debtPressureRisk !== undefined) {
    assertEqual(
      summary.debtPressureRisk,
      expected.debtPressureRisk,
      expected.name,
      "debtPressureRisk",
    );
  }

  if (expected.freedomWarning !== undefined) {
    assertEqual(
      summary.freedomWarning,
      expected.freedomWarning,
      expected.name,
      "freedomWarning",
    );
  }
}

function runPortfolioCase(expected: PortfolioCase) {
  const analysis = analyzeTargetPortfolio(
    expected.settings,
    expected.transactions,
    expected.botInvestment,
  );
  const asset = analysis.assets.find(
    (item) => item.assetClass === expected.asset,
  );

  assert(asset, `${expected.name}: expected asset ${expected.asset}`);
  assertEqual(
    analysis.targetTotalPercent,
    expected.targetTotalPercent,
    expected.name,
    "targetTotalPercent",
  );
  assertEqual(
    analysis.targetWarning,
    expected.targetWarning,
    expected.name,
    "targetWarning",
  );
  assertEqual(
    analysis.totalCurrentAmount,
    expected.totalCurrentAmount,
    expected.name,
    "totalCurrentAmount",
  );
  assertEqual(
    asset.currentAmount,
    expected.currentAmount,
    expected.name,
    "asset.currentAmount",
  );
  assertEqual(
    asset.currentSource,
    expected.currentSource,
    expected.name,
    "asset.currentSource",
  );
  if (expected.targetPercent !== undefined) {
    assertEqual(
      asset.targetPercent,
      expected.targetPercent,
      expected.name,
      "asset.targetPercent",
    );
  }
  assertEqual(asset.status, expected.status, expected.name, "asset.status");

  if (expected.policyMonthlyContributionTarget !== undefined) {
    assertEqual(
      analysis.policy.monthlyContributionTarget,
      expected.policyMonthlyContributionTarget,
      expected.name,
      "policy.monthlyContributionTarget",
    );
  }

  if (expected.policyRebalanceTolerancePercent !== undefined) {
    assertEqual(
      analysis.policy.rebalanceTolerancePercent,
      expected.policyRebalanceTolerancePercent,
      expected.name,
      "policy.rebalanceTolerancePercent",
    );
  }
}

function runWealthRoadmapCase(expected: WealthRoadmapCase) {
  const analysis = analyzeWealthRoadmap(expected.inputs);
  const milestone = analysis.milestones.find(
    (item) => item.milestone.id === expected.milestoneId,
  );

  assert(
    milestone,
    `${expected.name}: expected milestone ${expected.milestoneId}`,
  );
  assertEqual(
    milestone.currentAmount,
    expected.currentAmount,
    expected.name,
    "milestone.currentAmount",
  );
  assertEqual(
    milestone.distanceAmount,
    expected.distanceAmount,
    expected.name,
    "milestone.distanceAmount",
  );
  assertAlmostEqual(
    milestone.progressPercent,
    expected.progressPercent,
    expected.name,
    "milestone.progressPercent",
  );
  assertAlmostEqual(
    milestone.estimatedMonths,
    expected.estimatedMonths,
    expected.name,
    "milestone.estimatedMonths",
  );
  assertEqual(milestone.isNext, expected.isNext, expected.name, "milestone.isNext");

  if (expected.simulatedEstimatedMonths !== undefined) {
    assertAlmostEqual(
      milestone.simulatedEstimatedMonths,
      expected.simulatedEstimatedMonths,
      expected.name,
      "milestone.simulatedEstimatedMonths",
    );
  }
}

function runBotOperaCase(expected: BotOperaCase) {
  const analysis = analyzeBotOpera24hs(expected.investment);
  const month = analysis.history.find(
    (item) => item.month === expected.month,
  );

  assert(month, `${expected.name}: expected month ${expected.month}`);
  assertEqual(
    analysis.capitalTotalContributed,
    expected.capitalTotalContributed,
    expected.name,
    "capitalTotalContributed",
  );
  assertEqual(
    analysis.currentOperationalCapital,
    expected.currentOperationalCapital,
    expected.name,
    "currentOperationalCapital",
  );
  assertEqual(
    analysis.pendingCapital,
    expected.pendingCapital,
    expected.name,
    "pendingCapital",
  );
  assertEqual(
    analysis.amountUntilNextReinvestment,
    expected.amountUntilNextReinvestment,
    expected.name,
    "amountUntilNextReinvestment",
  );
  assertEqual(
    analysis.currentMonthResult,
    expected.currentMonthResult,
    expected.name,
    "currentMonthResult",
  );
  assertAlmostEqual(
    analysis.monthlyReturnPercent,
    expected.monthlyReturnPercent,
    expected.name,
    "monthlyReturnPercent",
  );
  assertAlmostEqual(
    analysis.accumulatedReturnPercent,
    expected.accumulatedReturnPercent,
    expected.name,
    "accumulatedReturnPercent",
  );
  assertEqual(
    month.operationalCapitalStart,
    expected.monthOperationalCapitalStart,
    expected.name,
    "month.operationalCapitalStart",
  );
  assertEqual(
    month.operationalCapitalEnd,
    expected.monthOperationalCapitalEnd,
    expected.name,
    "month.operationalCapitalEnd",
  );
  assertEqual(
    month.pendingContributionCapital,
    expected.monthPendingContributionCapital,
    expected.name,
    "month.pendingContributionCapital",
  );
  assertEqual(
    month.pendingProfitCapital,
    expected.monthPendingProfitCapital,
    expected.name,
    "month.pendingProfitCapital",
  );
  assertEqual(
    month.reinvestedAmount,
    expected.monthReinvestedAmount,
    expected.name,
    "month.reinvestedAmount",
  );
}

function weeklyTx(
  type: string,
  amount: number,
  date: string,
  patch: Partial<WeeklyExecutionTransaction> = {},
): WeeklyExecutionTransaction {
  return {
    type,
    amount,
    date,
    category: "sin categoria",
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function marginTx(
  type: string,
  amount: number,
  date: string,
  patch: Partial<FinancialMarginTransaction> = {},
): FinancialMarginTransaction {
  return {
    type,
    amount,
    date,
    category: "sin categoria",
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function monthlyTx(
  type: string,
  amount: number,
  date: string,
  patch: Partial<MonthlyReviewTransaction> = {},
): MonthlyReviewTransaction {
  return {
    type,
    amount,
    date,
    category: "sin categoria",
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function fixedMarginExpense(
  name: string,
  category: FinancialMarginFixedExpense["category"],
  monthlyAmount: number,
  active = true,
  currency = "USD",
): FinancialMarginFixedExpense {
  return {
    name,
    category,
    monthlyAmount,
    currency,
    active,
  };
}

function runWeeklyExecutionCase(expected: WeeklyExecutionCase) {
  const analysis = analyzeWeeklyExecution({
    transactions: expected.transactions,
    review: expected.review,
    today: new Date("2026-06-18T12:00:00Z"),
  });

  assertEqual(analysis.status, expected.status, expected.name, "status");
  assertEqual(
    analysis.scorePercent,
    expected.scorePercent,
    expected.name,
    "scorePercent",
  );
  assertEqual(
    analysis.completedCount,
    expected.completedCount,
    expected.name,
    "completedCount",
  );
  assertEqual(
    analysis.recommendation,
    expected.recommendation,
    expected.name,
    "recommendation",
  );

  if (expected.overdueAction) {
    assertIncludes(
      analysis.overdueActions,
      expected.overdueAction,
      expected.name,
      "overdueActions",
    );
  } else {
    assertEqual(
      analysis.overdueActions.length,
      0,
      expected.name,
      "overdueActions.length",
    );
  }
}

function runFinancialMarginCase(expected: FinancialMarginCase) {
  const analysis = analyzeFinancialMargin({
    transactions: expected.transactions,
    fixedExpenses: expected.fixedExpenses,
    uyuPerUsdRate: expected.uyuPerUsdRate,
    today: new Date("2026-06-18T12:00:00Z"),
  });

  assertEqual(analysis.monthlyIncome, expected.monthlyIncome, expected.name, "monthlyIncome");
  assertEqual(
    analysis.fixedMonthlyExpenses,
    expected.fixedMonthlyExpenses,
    expected.name,
    "fixedMonthlyExpenses",
  );
  assertEqual(
    analysis.variableMonthlyExpenses,
    expected.variableMonthlyExpenses,
    expected.name,
    "variableMonthlyExpenses",
  );
  assertEqual(
    analysis.debtMonthlyPayments,
    expected.debtMonthlyPayments,
    expected.name,
    "debtMonthlyPayments",
  );
  assertEqual(
    analysis.availableMonthlyMargin,
    expected.availableMonthlyMargin,
    expected.name,
    "availableMonthlyMargin",
  );
  assertAlmostEqual(analysis.savingRate, expected.savingRate, expected.name, "savingRate");
  assertAlmostEqual(
    analysis.debtPressurePercent,
    expected.debtPressurePercent,
    expected.name,
    "debtPressurePercent",
  );
  if (expected.essentialExpenses !== undefined) {
    assertEqual(
      analysis.essentialExpenses,
      expected.essentialExpenses,
      expected.name,
      "essentialExpenses",
    );
  }
  if (expected.nonEssentialExpenses !== undefined) {
    assertEqual(
      analysis.nonEssentialExpenses,
      expected.nonEssentialExpenses,
      expected.name,
      "nonEssentialExpenses",
    );
  }
  assertEqual(analysis.state, expected.state, expected.name, "state");
}

function runMonthlyReviewCase(expected: MonthlyReviewCase) {
  const analysis = analyzeMonthlyReview({
    transactions: expected.transactions,
    today: new Date("2026-06-18T12:00:00Z"),
  });

  assertEqual(analysis.status, expected.status, expected.name, "status");
  assertEqual(
    analysis.monthlyIncome,
    expected.monthlyIncome,
    expected.name,
    "monthlyIncome",
  );
  assertEqual(
    analysis.monthlyExpenses,
    expected.monthlyExpenses,
    expected.name,
    "monthlyExpenses",
  );
  assertEqual(
    analysis.investmentAmount,
    expected.investmentAmount,
    expected.name,
    "investmentAmount",
  );
  assertEqual(analysis.debtAdded, expected.debtAdded, expected.name, "debtAdded");
  assertEqual(
    analysis.bigPurchaseCount,
    expected.bigPurchaseCount,
    expected.name,
    "bigPurchaseCount",
  );
  assertEqual(
    analysis.emotionalPurchaseCount,
    expected.emotionalPurchaseCount,
    expected.name,
    "emotionalPurchaseCount",
  );
  assertEqual(analysis.savingRate, expected.savingRate, expected.name, "savingRate");
  assertEqual(
    analysis.primaryAction,
    expected.primaryAction,
    expected.name,
    "primaryAction",
  );
}

function runEffectiveInputsCase(expected: EffectiveInputsCase) {
  const effectiveInputs = calculateEffectiveInputs(
    expected.inputs,
    expected.transactionSummary,
  );

  assertEqual(effectiveInputs.netWorth, expected.netWorth, expected.name, "netWorth");
  assertEqual(
    effectiveInputs.investedCapital,
    expected.investedCapital,
    expected.name,
    "investedCapital",
  );
  assertEqual(
    effectiveInputs.desiredMonthlySpend,
    expected.desiredMonthlySpend,
    expected.name,
    "desiredMonthlySpend",
  );
}

function runTransactionSummaryCase(expected: TransactionSummaryCase) {
  const summary = confirmedTransactionsSummary(expected.transactions);

  assertEqual(summary.netWorthDelta, expected.netWorthDelta, expected.name, "netWorthDelta");
  if (expected.investedDelta !== undefined) {
    assertEqual(
      summary.investedDelta,
      expected.investedDelta,
      expected.name,
      "investedDelta",
    );
  }
  assertEqual(
    summary.confirmedExpenses,
    expected.confirmedExpenses,
    expected.name,
    "confirmedExpenses",
  );
  assertAlmostEqual(
    summary.monthlyConfirmedExpenses,
    expected.monthlyConfirmedExpenses,
    expected.name,
    "monthlyConfirmedExpenses",
  );
}
