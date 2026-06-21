import {
  analyzeWealthRoadmap,
  freedomNumber,
  type FreedomInputs,
} from "./finance";
import {
  analyzeFinancialNote,
  type DetectedFinancialItem,
  type TransactionIntent,
} from "./financial-notes";

export type DecisionModeType =
  | "gasto_potencial"
  | "deuda_potencial"
  | "inversion_potencial"
  | "ahorro_potencial"
  | "intencion"
  | "pensamiento"
  | "negacion"
  | "mixta"
  | "desconocida";

export type DecisionModeIntent =
  | "real"
  | "intencion"
  | "pensamiento"
  | "negacion";

export type DecisionModeRiskLevel = "bajo" | "medio" | "alto" | "sin_datos";
export type DecisionModeRiskSeverity = "baja" | "media" | "alta";

export type DecisionModeAction =
  | "esperar_48h"
  | "guardar_como_intencion"
  | "convertir_a_nota_borrador"
  | "pedir_mas_datos"
  | "descartar";

export type DecisionModeRiskFactor = {
  id: string;
  label: string;
  severity: DecisionModeRiskSeverity;
  explanation: string;
};

export type DecisionModeRoadmapImpact = {
  hasEnoughData: boolean;
  monthlyContributionDelta: number;
  currentEstimatedMonths?: number;
  simulatedEstimatedMonths?: number;
  label: string;
};

export type DecisionModeAnalysis = {
  originalText: string;
  detectedType: DecisionModeType;
  amount?: number;
  currency?: string;
  installments?: number;
  termMonths?: number;
  interestRate?: number;
  category?: string;
  recurring: boolean;
  intent: DecisionModeIntent;
  emotionalSignals: string[];
  missingFields: string[];
  estimatedMonthlyImpact: number;
  estimatedFireImpact: number;
  roadmapImpact: DecisionModeRoadmapImpact;
  riskLevel: DecisionModeRiskLevel;
  riskFactors: DecisionModeRiskFactor[];
  checklist: string[];
  availableActions: DecisionModeAction[];
};

const EMPTY_ROADMAP_IMPACT: DecisionModeRoadmapImpact = {
  hasEnoughData: false,
  monthlyContributionDelta: 0,
  label: "Faltan datos para leer impacto roadmap.",
};

export function analyzeDecisionMode(
  text: string,
  context?: FreedomInputs,
): DecisionModeAnalysis {
  const originalText = text;
  const normalizedText = normalize(text);
  const detectedItems = analyzeFinancialNote(text, new Date(), {
    defaultCurrency: "USD",
  });
  const primaryItem = detectedItems[0];
  const intent = normalizeDecisionIntent(
    primaryItem?.intent ?? detectFallbackIntent(normalizedText),
  );
  const detectedType = detectDecisionType(normalizedText, detectedItems, intent);
  const amount = primaryItem?.amount && primaryItem.amount > 0
    ? primaryItem.amount
    : detectFallbackAmount(normalizedText);
  const currency = primaryItem?.currency ?? detectFallbackCurrency(normalizedText);
  const installments = detectInstallments(normalizedText);
  const termMonths = primaryItem?.debt?.termMonths ?? installments;
  const interestRate = detectInterestRate(normalizedText);
  const category = primaryItem?.category;
  const recurring = Boolean(primaryItem?.recurring);
  const emotionalSignals = detectEmotionalSignals(
    normalizedText,
    primaryItem,
  );
  const estimatedMonthlyImpact = estimateMonthlyImpact({
    amount,
    detectedType,
    installments,
    intent,
    item: primaryItem,
    recurring,
  });
  const estimatedFireImpact = estimateFireImpact({
    amount,
    detectedType,
    estimatedMonthlyImpact,
    installments,
    intent,
    item: primaryItem,
    recurring,
  });
  const missingFields = detectMissingFields({
    amount,
    currency,
    detectedType,
    hasExplicitCurrency: hasExplicitCurrency(normalizedText),
    installments,
    interestRate,
    item: primaryItem,
  });
  const riskFactors = detectRiskFactors({
    amount,
    category,
    detectedType,
    emotionalSignals,
    estimatedMonthlyImpact,
    installments,
    interestRate,
    missingFields,
    normalizedText,
    item: primaryItem,
  });
  const riskLevel = calculateRiskLevel({
    amount,
    detectedType,
    intent,
    missingFields,
    riskFactors,
  });
  const roadmapImpact = estimateRoadmapImpact({
    context,
    detectedType,
    estimatedMonthlyImpact,
    intent,
  });

  return {
    originalText,
    detectedType,
    amount: amount > 0 ? amount : undefined,
    currency,
    installments: installments > 0 ? installments : undefined,
    termMonths: termMonths > 0 ? termMonths : undefined,
    interestRate,
    category,
    recurring,
    intent,
    emotionalSignals,
    missingFields,
    estimatedMonthlyImpact,
    estimatedFireImpact,
    roadmapImpact,
    riskLevel,
    riskFactors,
    checklist: buildChecklist(detectedType, missingFields, emotionalSignals),
    availableActions: availableActions(intent, missingFields),
  };
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDecisionIntent(intent: TransactionIntent): DecisionModeIntent {
  if (intent === "pensado") {
    return "pensamiento";
  }

  if (intent === "negado") {
    return "negacion";
  }

  return intent;
}

function detectFallbackIntent(text: string): TransactionIntent {
  if (hasAny(text, ["no compre", "no gaste", "no saque", "no pedi", "no inverti"])) {
    return "negado";
  }

  if (hasAny(text, ["pense", "estoy pensando", "casi", "tal vez"])) {
    return "pensado";
  }

  if (hasAny(text, ["quiero", "me gustaria", "voy a", "deberia", "conviene"])) {
    return "intencion";
  }

  return "real";
}

function detectDecisionType(
  text: string,
  items: DetectedFinancialItem[],
  intent: DecisionModeIntent,
): DecisionModeType {
  if (intent === "negacion") {
    return "negacion";
  }

  const types = new Set(items.map((item) => item.type));

  if (types.size > 1) {
    return "mixta";
  }

  const type = items[0]?.type;

  if (
    type === "deuda" ||
    hasAny(text, ["prestamo", "credito", "financ", "cuota", "tarjeta"])
  ) {
    return "deuda_potencial";
  }

  if (type === "inversion" || hasAny(text, ["invertir", "inversion", "btc", "etf"])) {
    return "inversion_potencial";
  }

  if (type === "ahorro" || hasAny(text, ["ahorrar", "colchon", "emergencia"])) {
    return "ahorro_potencial";
  }

  if (
    type === "gasto" ||
    type === "decision" ||
    hasAny(text, ["compr", "gastar", "cambiar", "viaje"])
  ) {
    return "gasto_potencial";
  }

  if (intent === "intencion") {
    return "intencion";
  }

  if (intent === "pensamiento") {
    return "pensamiento";
  }

  return "desconocida";
}

function detectFallbackAmount(text: string) {
  const match = text.match(/(?:us\$|usd|uyu|\$)?\s*(\d+(?:[.,]\d+)?)/i);

  return match ? parseNumber(match[1]) : 0;
}

function detectFallbackCurrency(text: string) {
  if (hasAny(text, ["usd", "us$", "dolar", "dolares"])) {
    return "USD";
  }

  if (hasAny(text, ["uyu", "peso", "pesos"])) {
    return "UYU";
  }

  return "USD";
}

function hasExplicitCurrency(text: string) {
  return hasAny(text, ["usd", "us$", "uyu", "peso", "pesos", "dolar", "dolares"]);
}

function detectInstallments(text: string) {
  const match = text.match(/(?:en|a)?\s*(\d{1,3})\s*cuotas?/);

  return match ? Math.max(0, Math.round(parseNumber(match[1]))) : 0;
}

function detectInterestRate(text: string) {
  const match = text.match(/(?:tasa|interes|tea|anual)\D{0,8}(\d+(?:[.,]\d+)?)\s*%/);

  return match ? parseNumber(match[1]) : undefined;
}

function detectEmotionalSignals(text: string, item?: DetectedFinancialItem) {
  const signals = new Set<string>();

  if (item?.impulse || hasAny(text, ["impulso", "impulsivo", "capricho", "antojo"])) {
    signals.add("impulso");
  }

  if (hasAny(text, ["fomo", "sube", "todos estan", "me voy a quedar afuera"])) {
    signals.add("fomo");
  }

  if (hasAny(text, ["todos tienen", "comparacion", "compararme", "mejor que yo"])) {
    signals.add("comparacion");
  }

  if (hasAny(text, ["me lo merezco", "merecido", "premio"])) {
    signals.add("merecimiento");
  }

  if (hasAny(text, ["ansiedad", "estres", "cansado", "cansancio", "triste"])) {
    signals.add("consumo emocional");
  }

  return Array.from(signals);
}

function estimateMonthlyImpact({
  amount,
  detectedType,
  installments,
  intent,
  item,
  recurring,
}: {
  amount: number;
  detectedType: DecisionModeType;
  installments: number;
  intent: DecisionModeIntent;
  item?: DetectedFinancialItem;
  recurring: boolean;
}) {
  if (intent === "negacion" || amount <= 0) {
    return 0;
  }

  if (detectedType === "deuda_potencial") {
    if (item?.debt?.monthlyMarginImpact && item.debt.monthlyMarginImpact > 0) {
      return roundToTwo(item.debt.monthlyMarginImpact);
    }

    if (installments > 0) {
      return roundToTwo(amount / installments);
    }

    return 0;
  }

  if (detectedType === "gasto_potencial") {
    return roundToTwo(recurring ? amount : amount / 12);
  }

  if (detectedType === "inversion_potencial" || detectedType === "ahorro_potencial") {
    return roundToTwo(recurring ? amount : amount / 12);
  }

  return 0;
}

function estimateFireImpact({
  amount,
  detectedType,
  estimatedMonthlyImpact,
  installments,
  intent,
  item,
  recurring,
}: {
  amount: number;
  detectedType: DecisionModeType;
  estimatedMonthlyImpact: number;
  installments: number;
  intent: DecisionModeIntent;
  item?: DetectedFinancialItem;
  recurring: boolean;
}) {
  if (intent === "negacion" || estimatedMonthlyImpact <= 0 || amount <= 0) {
    return 0;
  }

  if (detectedType === "deuda_potencial") {
    if (item?.debt?.fireImpact && item.debt.fireImpact > 0) {
      return roundToTwo(item.debt.fireImpact);
    }

    if (installments > 0) {
      return roundToTwo(freedomNumber(amount / installments));
    }

    return 0;
  }

  return roundToTwo(freedomNumber(recurring ? amount : amount / 12));
}

function detectMissingFields({
  amount,
  currency,
  detectedType,
  hasExplicitCurrency,
  installments,
  interestRate,
  item,
}: {
  amount: number;
  currency?: string;
  detectedType: DecisionModeType;
  hasExplicitCurrency: boolean;
  installments: number;
  interestRate?: number;
  item?: DetectedFinancialItem;
}) {
  const fields = new Set<string>();

  if (detectedType === "desconocida") {
    fields.add("tipo de decision");
  }

  if (amount <= 0) {
    fields.add("monto");
  }

  if (!currency || !hasExplicitCurrency) {
    fields.add("moneda");
  }

  if (detectedType === "deuda_potencial") {
    if (installments <= 0 && !item?.debt?.termMonths) {
      fields.add("plazo");
    }

    if (!interestRate && !item?.debt?.annualRate) {
      fields.add("tasa anual");
    }
  }

  return Array.from(fields);
}

function detectRiskFactors({
  amount,
  category,
  detectedType,
  emotionalSignals,
  estimatedMonthlyImpact,
  installments,
  interestRate,
  missingFields,
  normalizedText,
  item,
}: {
  amount: number;
  category?: string;
  detectedType: DecisionModeType;
  emotionalSignals: string[];
  estimatedMonthlyImpact: number;
  installments: number;
  interestRate?: number;
  missingFields: string[];
  normalizedText: string;
  item?: DetectedFinancialItem;
}) {
  const factors: DecisionModeRiskFactor[] = [];

  function add(
    id: string,
    label: string,
    severity: DecisionModeRiskSeverity,
    explanation: string,
  ) {
    if (!factors.some((factor) => factor.id === id)) {
      factors.push({ id, label, severity, explanation });
    }
  }

  if (
    amount >= 1000 ||
    (["tecnologia", "auto"].includes(category ?? "") && amount >= 700) ||
    item?.antiErrorReview?.detectedEnemies.includes("compra grande")
  ) {
    add("compra grande", "Compra grande", "media", "El monto merece una pausa antes de ejecutar.");
  }

  if (estimatedMonthlyImpact >= 250) {
    add(
      "impacto mensual alto",
      "Impacto mensual alto",
      "alta",
      "La decision puede presionar el margen mensual.",
    );
  }

  if (detectedType === "deuda_potencial") {
    add("deuda", "Deuda o credito", "alta", "Aparece una obligacion futura.");
  }

  if (installments > 0 || hasAny(normalizedText, ["financ", "cuota", "tarjeta"])) {
    add(
      "cuotas/financiacion",
      "Cuotas o financiacion",
      "alta",
      "Las cuotas comprometen meses futuros.",
    );
  }

  if (missingFields.includes("tasa anual") && detectedType === "deuda_potencial") {
    add(
      "tasa desconocida",
      "Tasa desconocida",
      "alta",
      "Falta la tasa para leer el costo real de la deuda.",
    );
  }

  if (interestRate !== undefined && interestRate >= 30) {
    add("tasa alta", "Tasa alta", "alta", "La tasa declarada es elevada.");
  }

  if (["vivienda", "transporte", "comida"].includes(category ?? "")) {
    add(
      "categoria critica",
      "Categoria critica",
      "media",
      "Vivienda, transporte y comida mueven el numero de libertad.",
    );
  }

  if (
    ["tecnologia", "auto"].includes(category ?? "") ||
    hasAny(normalizedText, ["iphone", "celular", "auto", "moto", "estatus"])
  ) {
    add(
      "tecnologia/estatus",
      "Tecnologia, auto o estatus",
      "media",
      "Categoria sensible para compras grandes o comparacion.",
    );
  }

  if (detectedType === "inversion_potencial" && hasAny(normalizedText, ["btc", "bitcoin", "cripto"])) {
    add(
      "inversion especulativa",
      "Inversion concentrada",
      "media",
      "La inversion parece concentrada o especulativa.",
    );
  }

  if (emotionalSignals.length > 0) {
    add(
      "senal emocional",
      "Senal emocional",
      "media",
      "Hay lenguaje de impulso, FOMO, comparacion o premio personal.",
    );
  }

  if (missingFields.length > 0) {
    add(
      "datos faltantes",
      "Datos faltantes",
      "media",
      "La lectura todavia necesita informacion antes de actuar.",
    );
  }

  return factors;
}

function calculateRiskLevel({
  amount,
  detectedType,
  intent,
  missingFields,
  riskFactors,
}: {
  amount: number;
  detectedType: DecisionModeType;
  intent: DecisionModeIntent;
  missingFields: string[];
  riskFactors: DecisionModeRiskFactor[];
}) {
  if (intent === "negacion") {
    return "bajo";
  }

  if (amount <= 0 && missingFields.includes("monto")) {
    return "sin_datos";
  }

  if (
    detectedType === "deuda_potencial" &&
    (missingFields.includes("tasa anual") ||
      riskFactors.some((factor) => factor.severity === "alta"))
  ) {
    return "alto";
  }

  if (riskFactors.some((factor) => factor.severity === "alta")) {
    return "alto";
  }

  if (riskFactors.length > 0) {
    return "medio";
  }

  return "bajo";
}

function estimateRoadmapImpact({
  context,
  detectedType,
  estimatedMonthlyImpact,
  intent,
}: {
  context?: FreedomInputs;
  detectedType: DecisionModeType;
  estimatedMonthlyImpact: number;
  intent: DecisionModeIntent;
}): DecisionModeRoadmapImpact {
  if (!context || intent === "negacion" || estimatedMonthlyImpact <= 0) {
    return EMPTY_ROADMAP_IMPACT;
  }

  const monthlyContributionDelta =
    detectedType === "gasto_potencial" || detectedType === "deuda_potencial"
      ? -estimatedMonthlyImpact
      : estimatedMonthlyImpact;
  const currentRoadmap = analyzeWealthRoadmap({
    netWorth: context.netWorth,
    investedCapital: context.investedCapital,
    monthlyContribution: context.monthlyContribution,
    annualReturnPercent: context.expectedAnnualReturn,
  });
  const simulatedRoadmap = analyzeWealthRoadmap({
    netWorth: context.netWorth,
    investedCapital: context.investedCapital,
    monthlyContribution: context.monthlyContribution,
    annualReturnPercent: context.expectedAnnualReturn,
    simulatedMonthlyContribution: Math.max(
      0,
      context.monthlyContribution + monthlyContributionDelta,
    ),
  });

  return {
    hasEnoughData: true,
    monthlyContributionDelta: roundToTwo(monthlyContributionDelta),
    currentEstimatedMonths: currentRoadmap.nextMilestone?.estimatedMonths,
    simulatedEstimatedMonths: simulatedRoadmap.nextMilestone?.simulatedEstimatedMonths,
    label:
      monthlyContributionDelta < 0
        ? "Podria atrasar el proximo hito si reduce tu aporte mensual."
        : "Podria adelantar el roadmap si reemplaza consumo y se ejecuta como aporte real.",
  };
}

function buildChecklist(
  detectedType: DecisionModeType,
  missingFields: string[],
  emotionalSignals: string[],
) {
  const checklist = [
    "Esta lectura es simulada y no modifica datos confirmados.",
    "Separar intencion de accion real antes de confirmar cualquier movimiento.",
  ];

  if (missingFields.length > 0) {
    checklist.push("Completar datos faltantes antes de ejecutar.");
  }

  if (detectedType === "deuda_potencial") {
    checklist.push("Ver cuota, plazo, tasa y costo total antes de aceptar deuda.");
  }

  if (emotionalSignals.length > 0) {
    checklist.push("Esperar 48 horas si la decision viene con impulso o comparacion.");
  }

  checklist.push("Convertir en nota borrador solo si queres revisarla despues.");

  return checklist;
}

function availableActions(
  intent: DecisionModeIntent,
  missingFields: string[],
): DecisionModeAction[] {
  const actions = new Set<DecisionModeAction>();

  if (missingFields.length > 0) {
    actions.add("pedir_mas_datos");
  }

  if (intent !== "negacion") {
    actions.add("esperar_48h");
    actions.add("guardar_como_intencion");
    actions.add("convertir_a_nota_borrador");
  }

  actions.add("descartar");

  return Array.from(actions);
}

function hasAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
