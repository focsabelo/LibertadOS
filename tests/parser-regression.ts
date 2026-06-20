import {
  analyzeWealthRoadmap,
  analyzeBotOpera24hs,
  analyzeTargetPortfolio,
  analyzeWeeklyExecution,
  analyzeLifestyleInflation,
  analyzeConfirmedDebtLoad,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  WEEKLY_EXECUTION_ITEMS,
  incomeRuleSuggestion,
  freedomNumber,
  type ConfirmedDebtLoadTransaction,
  type LifestyleInflationRisk,
  type LifestyleInflationTransaction,
  type TargetPortfolioSettings,
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
      missingFields: ["capital original", "tasa anual"],
    },
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
      missingFields: ["cuota mensual", "plazo", "tasa anual"],
      signals: ["Faltan cuota, plazo o tasa para estimar presion mensual."],
    },
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

function firstItem(text: string) {
  const analysis = analyzeFinancialNote(text, new Date("2026-06-18T12:00:00Z"));
  assert(analysis.length > 0, `Expected at least one detected item for "${text}"`);
  return analysis[0];
}

function runCase(expected: ExpectedCase) {
  const item = firstItem(expected.text);

  assertEqual(item.type, expected.type, expected.text, "type");
  assertEqual(item.intent, expected.intent, expected.text, "intent");
  assertEqual(isConfirmable(item), expected.confirmable, expected.text, "confirmable");

  assertOptionalEqual(item, expected, "amount");
  assertOptionalEqual(item, expected, "currency");
  assertOptionalEqual(item, expected, "category");
  assertOptionalEqual(item, expected, "incomeIncrease");
  assertOptionalEqual(item, expected, "freedomImpact");

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
      tx("ahorro", incomeRuleSuggestion(500, true).emergencyFund, "2026-06-12"),
    ],
    risk: "bajo",
    currentExpenses: 500,
    estimatedSavings: 1000,
  },
];

for (const testCase of lifestyleCases) {
  runLifestyleCase(testCase);
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
  settings: TargetPortfolioSettings;
  transactions: TargetPortfolioTransaction[];
  targetTotalPercent: number;
  targetWarning: boolean;
  totalCurrentAmount: number;
  asset: string;
  currentAmount: number;
  currentSource: "manual" | "derivado";
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
    currentSource: "manual",
    status: "alineado",
    policyMonthlyContributionTarget: 1800,
    policyRebalanceTolerancePercent: 5,
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
    currentSource: "manual",
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
    currentSource: "manual",
    status: "alineado",
  },
  {
    name: "Inversion confirmada alimenta actual derivado",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [portfolioTx("etf_usa", 3000)],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 3000,
    asset: "etf_usa",
    currentAmount: 3000,
    currentSource: "derivado",
    status: "sobrepeso",
  },
  {
    name: "Monto manual alimenta actual sin derivado",
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
    currentSource: "manual",
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
      },
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 820,
    asset: "etf_europa",
    currentAmount: 20,
    currentSource: "manual",
    status: "bajo_peso",
  },
];

for (const testCase of portfolioCases) {
  runPortfolioCase(testCase);
}

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
      name: "Bot Opera24hs",
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
      name: "Bot Opera24hs",
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
    scorePercent: 20,
    completedCount: 2,
    recommendation: "Revisar compra emocional y esperar 48 horas antes de repetirla.",
    overdueAction: "Separar 5% para colchon",
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

console.log(
  `Parser regression tests passed: ${cases.length}. Lifestyle inflation tests passed: ${lifestyleCases.length}. Debt load tests passed: ${debtLoadCases.length}. Portfolio tests passed: ${portfolioCases.length}. Wealth roadmap tests passed: ${roadmapCases.length}. Bot Opera24hs tests passed: ${botOperaCases.length}. Weekly execution tests passed: ${weeklyExecutionCases.length}`,
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
