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
    text: "12 cuotas de 200",
    type: "deuda",
    intent: "real",
    confirmable: true,
    amount: 2400,
    freedomImpact: 60000,
    antiErrorEnemies: ["deuda", "financiacion"],
    antiErrorSignals: ["Cuotas o financiacion"],
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

console.log(`Parser regression tests passed: ${cases.length}`);
