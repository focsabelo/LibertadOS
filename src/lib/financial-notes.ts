import { freedomNumber } from "./finance";

export type FinancialType =
  | "gasto"
  | "ingreso"
  | "inversion"
  | "ahorro"
  | "deuda"
  | "decision";

export type TransactionIntent = "real" | "intencion" | "pensado" | "negado";
export type AntiErrorRiskLevel = "bajo" | "medio" | "alto";

export type AntiErrorReview = {
  applies: boolean;
  riskLevel: AntiErrorRiskLevel;
  detectedEnemies: string[];
  signals: string[];
  checklist: string[];
  monthlyCost: number;
  annualCost: number;
  fireImpact: number;
  investmentAlternative: number;
  recommendation?: string;
  confirmableBlockReason?: string;
};

export type FinancialFolder =
  | "Captura rapida"
  | "Gastos"
  | "Ingresos"
  | "Inversiones"
  | "Compras grandes"
  | "Errores financieros"
  | "Resumen mensual"
  | "Numero libertad financiera"
  | "Macro / Liquidez";

export type DetectedFinancialItem = {
  id: string;
  type: FinancialType;
  amount: number;
  currency: string;
  category: string;
  date: string;
  recurring: boolean;
  impulse: boolean;
  coreExpense: boolean;
  intent: TransactionIntent;
  freedomImpact: number;
  sourceText: string;
  incomeIncrease?: boolean;
  ignored?: boolean;
  antiErrorReview?: AntiErrorReview;
};

export type FinancialNote = {
  id: string;
  folder: FinancialFolder;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  analysis: DetectedFinancialItem[];
  confirmedTransactionIds: string[];
  pendingReconfirmation?: boolean;
};

export type ConfirmedFinancialTransaction = DetectedFinancialItem & {
  noteId: string;
  noteTitle: string;
  confirmedAt: string;
};

export const NOTE_FOLDERS: FinancialFolder[] = [
  "Captura rapida",
  "Gastos",
  "Ingresos",
  "Inversiones",
  "Compras grandes",
  "Errores financieros",
  "Resumen mensual",
  "Numero libertad financiera",
  "Macro / Liquidez",
];

const typeLabels: Record<FinancialType, string> = {
  gasto: "Gasto",
  ingreso: "Ingreso",
  inversion: "Inversion",
  ahorro: "Ahorro",
  deuda: "Deuda",
  decision: "Decision",
};

const intentLabels: Record<TransactionIntent, string> = {
  real: "Real",
  intencion: "Intencion",
  pensado: "Pensado",
  negado: "Negado",
};

export function financialTypeLabel(type: FinancialType) {
  return typeLabels[type];
}

export function intentLabel(intent: TransactionIntent) {
  return intentLabels[intent];
}

export function createEmptyNote(folder: FinancialFolder = "Captura rapida") {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    folder,
    title: "Nueva captura",
    body: "",
    createdAt: now,
    updatedAt: now,
    analysis: [],
    confirmedTransactionIds: [],
  } satisfies FinancialNote;
}

export function analyzeFinancialNote(text: string, today = new Date()) {
  const normalizedText = normalize(text);
  const date = detectDate(normalizedText, today);
  const currency = detectCurrency(normalizedText);
  const incomeBase = detectIncomeBase(normalizedText);
  const items: DetectedFinancialItem[] = [];

  const segments = splitSegments(text);

  for (const [segmentIndex, segment] of segments.entries()) {
    const previousSegment = segments[segmentIndex - 1] ?? "";
    const nextSegment = segments[segmentIndex + 1] ?? "";
    const segmentContext = shouldCarryNextSegmentIntent(segment, nextSegment)
      ? `${segment} ${nextSegment}`
      : segment;
    const normalizedSegmentContext = normalize(segmentContext);
    const amountMatches = Array.from(
      segment.matchAll(
        /(?:US\$|USD|UYU|\$)?\s*(\d+(?:[.,]\d+)?)\s*(?!%)(?:USD|UYU|pesos?|dolares?|dólares?)?/gi,
      ),
    );

    for (const [matchIndex, match] of amountMatches.entries()) {
      if (shouldIgnoreNumberMatch(segment, match)) {
        continue;
      }

      const amount = parseAmount(match[1]);

      if (amount <= 0) {
        continue;
      }

      items.push(
        buildItem({
          id: `det-${items.length + 1}`,
          amount,
          currency: detectCurrency(segment) || currency,
          date,
          text: segment.trim(),
          normalizedText: normalizedSegmentContext,
          indexHint: matchIndex,
        }),
      );
    }

    if (
      !shouldCarryNextSegmentIntent(previousSegment, segment) &&
      !items.some((item) => item.sourceText === segment.trim()) &&
      shouldCreateAmountlessDecision(normalizedSegmentContext)
    ) {
      items.push(
        buildItem({
          id: `det-${items.length + 1}`,
          amount: 0,
          currency: detectCurrency(segment) || currency,
          date,
          text: segment.trim(),
          normalizedText: normalizedSegmentContext,
          indexHint: items.length,
        }),
      );
    }

    const percentMatches = Array.from(
      segment.matchAll(/(\d+(?:[.,]\d+)?)\s*%\s*(?:para|a|en)?\s*([a-záéíóúñ\s]*)/gi),
    );

    for (const match of percentMatches) {
      if (!incomeBase) {
        continue;
      }

      const percentage = parseAmount(match[1]);
      const categoryHint = normalize(match[2] || segment);
      const amount = (incomeBase * percentage) / 100;

      items.push(
        buildItem({
          id: `det-${items.length + 1}`,
          amount,
          currency,
          date,
          text: segment.trim(),
          normalizedText: `${normalizedSegmentContext} ${categoryHint}`,
          indexHint: items.length,
        }),
      );
    }
  }

  return mergeDuplicatedIncome(items);
}

export function deriveNoteTitle(body: string) {
  const firstLine = body.trim().split(/\n/)[0]?.trim();

  if (!firstLine) {
    return "Nueva captura";
  }

  return firstLine.length > 42 ? `${firstLine.slice(0, 39)}...` : firstLine;
}

export function inferFolderFromAnalysis(
  analysis: DetectedFinancialItem[],
): FinancialFolder {
  if (analysis.some((item) => item.antiErrorReview?.riskLevel === "alto")) {
    return "Errores financieros";
  }

  if (analysis.some((item) => item.impulse)) {
    return "Errores financieros";
  }

  if (
    analysis.some(
      (item) => item.type === "deuda" || item.antiErrorReview?.applies,
    )
  ) {
    return "Compras grandes";
  }

  if (analysis.some((item) => item.type === "inversion")) {
    return "Inversiones";
  }

  if (analysis.some((item) => item.type === "ingreso")) {
    return "Ingresos";
  }

  if (analysis.some((item) => item.type === "gasto")) {
    return "Gastos";
  }

  return "Captura rapida";
}

export function isConfirmable(item: DetectedFinancialItem) {
  return (
    item.intent === "real" &&
    item.type !== "decision" &&
    item.amount > 0 &&
    !item.ignored
  );
}

export function recalculateDetectedFinancialItem(item: DetectedFinancialItem) {
  const normalizedText = normalize(item.sourceText);
  const impulse =
    item.impulse ||
    detectImpulse(normalizedText, item.category, item.amount);
  const freedomImpact = calculateFreedomImpact({
    amount: item.amount,
    type: item.type,
    intent: item.intent,
    recurring: item.recurring,
    normalizedText,
  });

  return {
    ...item,
    impulse,
    freedomImpact,
    antiErrorReview: buildAntiErrorReview({
      amount: item.amount,
      currency: item.currency,
      category: item.category,
      type: item.type,
      recurring: item.recurring,
      intent: item.intent,
      text: item.sourceText,
      normalizedText,
      freedomImpact,
    }),
  };
}

function buildItem({
  id,
  amount,
  currency,
  date,
  text,
  normalizedText,
  indexHint,
}: {
  id: string;
  amount: number;
  currency: string;
  date: string;
  text: string;
  normalizedText: string;
  indexHint: number;
}): DetectedFinancialItem {
  const installments = detectInstallments(normalizedText);
  const installmentAmount = detectInstallmentAmount(text);
  const effectiveAmount =
    installments > 0 && installmentAmount > 0 && amount === installmentAmount
      ? installmentAmount * installments
      : amount;
  let type = detectType(normalizedText);
  const category = detectCategory(normalizedText, type, indexHint);

  if (category === "inversion") {
    type = "inversion";
  }

  if (category === "colchon") {
    type = "ahorro";
  }

  if (
    effectiveAmount === 0 &&
    type !== "deuda" &&
    shouldCreateAmountlessDecision(normalizedText)
  ) {
    type = "decision";
  }

  const recurring = detectRecurring(normalizedText, category);
  const impulse = detectImpulse(normalizedText, category, effectiveAmount);
  const coreExpense = ["vivienda", "transporte", "comida"].includes(category);
  const incomeIncrease = type === "ingreso" && detectIncomeIncrease(normalizedText);
  const detectedIntent = detectIntent(normalizedText);
  const intent =
    effectiveAmount === 0 && detectedIntent === "real" ? "pensado" : detectedIntent;
  const freedomImpact = calculateFreedomImpact({
    amount: effectiveAmount,
    type,
    intent,
    recurring,
    normalizedText,
  });

  return {
    id,
    type,
    amount: effectiveAmount,
    currency,
    category,
    date,
    recurring,
    impulse,
    coreExpense,
    intent,
    freedomImpact,
    sourceText: text || "Captura sin texto",
    incomeIncrease,
    antiErrorReview: buildAntiErrorReview({
      amount: effectiveAmount,
      currency,
      category,
      type,
      recurring,
      intent,
      text,
      normalizedText,
      freedomImpact,
    }),
  };
}

const incomeWords = [
  "cobre",
  "cobré",
  "sueldo",
  "salario",
  "ingreso",
  "me pagaron",
  "aumentaron",
  "aumento de sueldo",
  "aumento salarial",
  "subieron el sueldo",
];

function detectType(text: string): FinancialType {
  if (
    hasAny(text, [
      "deuda",
      "prestamo",
      "tarjeta",
      "tarjeta de credito",
      "compre en cuotas",
      "compre con tarjeta",
      "compre con credito",
      "cuota",
      "cuotas",
      "financie",
      "financiar",
      "financiado",
      "financiacion",
      "credito",
    ])
  ) {
    return "deuda";
  }

  if (hasAny(text, ["invert", "etf", "bitcoin", "acciones", "bonos"])) {
    return "inversion";
  }

  if (hasAny(text, ["ahorr", "colchon", "liquidez", "fondo"])) {
    return "ahorro";
  }

  if (hasAny(text, incomeWords)) {
    return "ingreso";
  }

  if (
    hasAny(text, [
      "quiero",
      "pense",
      "pense en",
      "deberia",
      "conviene",
      "evaluando",
      "considerando",
    ])
  ) {
    return "decision";
  }

  return "gasto";
}

function detectCategory(text: string, type: FinancialType, indexHint: number) {
  if (
    hasAny(text, ["auto", "coche", "vehiculo", "moto"]) &&
    hasAny(text, ["compr", "financ", "cuota", "credito", "cambiar"])
  ) {
    return "auto";
  }

  if (hasAny(text, ["alquiler", "hipoteca", "expensas", "luz", "agua", "vivienda"])) {
    return "vivienda";
  }

  if (hasAny(text, ["transporte", "uber", "nafta", "bus", "taxi", "auto"])) {
    return "transporte";
  }

  if (hasAny(text, ["comida", "super", "restaurante", "almuerzo", "cena", "delivery"])) {
    return "comida";
  }

  if (hasAny(text, ["ropa", "zapat", "shopping", "lujo", "cartera cara"])) {
    return "ropa";
  }

  if (hasAny(text, ["celular", "iphone", "telefono", "notebook", "laptop", "macbook"])) {
    return "tecnologia";
  }

  if (hasAny(text, ["viaje", "pasaje", "hotel", "vacaciones", "escapada"])) {
    return "viaje";
  }

  if (hasAny(text, ["salida", "boliche", "bar caro", "cena cara", "restaurante caro"])) {
    return "salida";
  }

  if (hasAny(text, incomeWords)) {
    return "salario";
  }

  if (hasAny(text, ["colchon", "liquidez", "emergencia"])) {
    return "colchon";
  }

  if (hasAny(text, ["etf", "bitcoin", "acciones", "bonos", "inversion"])) {
    return "inversion";
  }

  if (type === "ingreso") {
    return "ingreso";
  }

  if (type === "decision") {
    return "decision";
  }

  return indexHint > 0 ? "varios" : "sin categoria";
}

function detectIntent(text: string): TransactionIntent {
  if (
    hasAny(text, [
      "no gaste",
      "no gasté",
      "no compre",
      "no compré",
      "no pague",
      "no pagué",
      "no lo hice",
      "no lo compre",
      "no lo compré",
      "no lo pague",
      "no lo pagué",
      "no lo compre",
      "no lo compre",
      "no lo financie",
      "no tome deuda",
      "pero no",
      "pero no lo hice",
      "pero no compre",
      "pero no compre",
      "evite",
      "evité",
      "lo deje pasar",
    ])
  ) {
    return "negado";
  }

  if (
    hasAny(text, [
      "estoy considerando",
      "estuve pensando",
      "estoy evaluando",
      "lo estoy evaluando",
      "evaluo comprar",
      "estoy viendo si",
    ])
  ) {
    return "pensado";
  }

  if (
    hasAny(text, [
      "pense en",
      "estoy pensando",
      "considere",
      "estuve por comprar",
      "estuve por gastar",
    ])
  ) {
    return "pensado";
  }

  if (
    hasAny(text, [
      "quiero",
      "voy a",
      "planeo",
      "me gustaria",
      "deberia",
      "tengo ganas de",
      "me tienta comprar",
      "quiero financiar",
    ])
  ) {
    return "intencion";
  }

  return "real";
}

function detectRecurring(text: string, category: string) {
  return (
    hasAny(text, ["mensual", "cada mes", "todos los meses", "recurrente", "suscripcion", "suscripción"]) ||
    ["vivienda"].includes(category)
  );
}

function detectImpulse(text: string, category: string, amount: number) {
  return (
    hasAny(text, ["ansiedad", "comparacion", "comparación", "ego", "impulso", "capricho", "antojo"]) ||
    (["ropa", "varios", "sin categoria"].includes(category) && amount >= 300)
  );
}

const antiErrorChecklist = [
  "Esto aumenta mi patrimonio o mi ego?",
  "Lo puedo pagar sin deuda?",
  "Cual es el costo real mensual y anual?",
  "Estoy comprando por ansiedad, comparacion, FOMO o estatus?",
  "Que pasa si invierto este dinero?",
  "Esto me acerca o me aleja de mi numero de libertad financiera?",
  "Conviene esperar 48 horas antes de decidir?",
];

type AntiErrorSignal = {
  label: string;
  enemy: string;
  weight: number;
  emotional?: boolean;
  debt?: boolean;
};

function buildAntiErrorReview({
  amount,
  currency,
  category,
  type,
  recurring,
  intent,
  text,
  normalizedText,
  freedomImpact,
}: {
  amount: number;
  currency: string;
  category: string;
  type: FinancialType;
  recurring: boolean;
  intent: TransactionIntent;
  text: string;
  normalizedText: string;
  freedomImpact: number;
}): AntiErrorReview | undefined {
  const signals = detectAntiErrorSignals({
    amount,
    currency,
    category,
    type,
    text: normalizedText,
    intent,
  });

  if (signals.length === 0) {
    return undefined;
  }

  const installments = detectInstallments(normalizedText);
  const installmentAmount = detectInstallmentAmount(text);
  const monthlyCost =
    installmentAmount > 0
      ? installmentAmount
      : installments > 0 && amount > 0
        ? amount / installments
        : recurring
          ? amount
          : amount / 12;
  const annualCost =
    installments > 0 && monthlyCost > 0
      ? monthlyCost * Math.min(installments, 12)
      : recurring
        ? amount * 12
        : amount;
  const score = signals.reduce((total, signal) => total + signal.weight, 0);
  const hasDebtSignal = signals.some((signal) => signal.debt);
  const emotionalCount = signals.filter((signal) => signal.emotional).length;
  const riskLevel: AntiErrorRiskLevel =
    score >= 6 || (hasDebtSignal && emotionalCount > 0)
      ? "alto"
      : score >= 3
        ? "medio"
        : "bajo";
  const detectedEnemies = Array.from(
    new Set(signals.map((signal) => signal.enemy)),
  );
  const confirmableBlockReason =
    intent === "intencion"
      ? "Es una compra futura o intencion. No se guarda como gasto real."
      : intent === "pensado"
        ? "Es una idea o decision en evaluacion. No se guarda como movimiento real."
        : intent === "negado"
          ? "La nota dice que no ocurrio. No se guarda como movimiento real."
          : undefined;

  return {
    applies: true,
    riskLevel,
    detectedEnemies,
    signals: signals.map((signal) => signal.label),
    checklist: antiErrorChecklist,
    monthlyCost,
    annualCost,
    fireImpact: freedomImpact,
    investmentAlternative: amount,
    recommendation:
      emotionalCount >= 2 || hasDebtSignal || riskLevel === "alto"
        ? "esperar 48 horas antes de decidir o confirmar"
        : undefined,
    confirmableBlockReason,
  };
}

function detectAntiErrorSignals({
  amount,
  currency,
  category,
  type,
  text,
  intent,
}: {
  amount: number;
  currency: string;
  category: string;
  type: FinancialType;
  text: string;
  intent: TransactionIntent;
}) {
  const signals: AntiErrorSignal[] = [];
  const bigPurchaseThreshold = currency === "UYU" ? 40000 : 1000;
  const sensitiveCategoryLabels: Record<string, string> = {
    auto: "auto",
    tecnologia: "celular o tecnologia cara",
    ropa: "ropa cara",
    viaje: "viaje",
    salida: "salida cara",
  };
  const sensitiveCategory = sensitiveCategoryLabels[category];
  const purchaseLikeType =
    type === "gasto" || type === "deuda" || type === "decision";

  if (
    purchaseLikeType &&
    (amount >= bigPurchaseThreshold ||
      hasAny(text, ["compra grande", "compra importante"]))
  ) {
    signals.push({
      label: "Compra grande",
      enemy: "compra grande",
      weight: amount >= bigPurchaseThreshold ? 2 : 1,
    });
  }

  if (purchaseLikeType && sensitiveCategory) {
    signals.push({
      label: "Categoria sensible: " + sensitiveCategory,
      enemy: sensitiveCategory,
      weight: category === "auto" ? 2 : 1,
    });
  }

  if (
    type === "deuda" ||
    hasAny(text, ["deuda", "prestamo", "credito", "financiar"])
  ) {
    signals.push({
      label: "Deuda o credito detectado",
      enemy: "deuda",
      weight: 3,
      debt: true,
    });
  }

  if (
    hasAny(text, [
      "cuota",
      "cuotas",
      "financie",
      "financiado",
      "financiacion",
      "financiada",
      "financiar",
      "compre en cuotas",
    ])
  ) {
    signals.push({
      label: "Cuotas o financiacion",
      enemy: "financiacion",
      weight: 3,
      debt: true,
    });
  }

  if (hasAny(text, ["tarjeta", "tarjeta de credito", "visa", "mastercard"])) {
    signals.push({
      label: "Tarjeta de credito",
      enemy: "tarjeta de credito",
      weight: 2,
      debt: true,
    });
  }

  if (
    hasAny(text, [
      "me lo merezco",
      "me merezco",
      "porque me lo gane",
      "me lo gane",
      "me quiero premiar",
    ])
  ) {
    signals.push({
      label: "Narrativa de merecimiento",
      enemy: "me lo merezco",
      weight: 2,
      emotional: true,
    });
  }

  if (
    hasAny(text, [
      "comparacion",
      "todos tienen",
      "todos lo tienen",
      "todos van",
      "como otros",
      "como mi amigo",
      "como mis amigos",
      "para no quedarme atras",
      "los demas",
    ])
  ) {
    signals.push({
      label: "Comparacion con otros",
      enemy: "comparacion",
      weight: 2,
      emotional: true,
    });
  }

  if (
    hasAny(text, [
      "estatus",
      "status",
      "aparentar",
      "marca",
      "lujo",
      "premium",
      "imagen",
    ])
  ) {
    signals.push({
      label: "Estatus o imagen",
      enemy: "estatus",
      weight: 2,
      emotional: true,
    });
  }

  if (
    hasAny(text, [
      "ansiedad",
      "ansioso",
      "aburrimiento",
      "aburrido",
      "triste",
      "estres",
      "estresado",
      "enojo",
      "consumo emocional",
      "para sentirme mejor",
    ])
  ) {
    signals.push({
      label: "Consumo emocional",
      enemy: "ansiedad o aburrimiento",
      weight: 2,
      emotional: true,
    });
  }

  if (
    hasAny(text, [
      "fomo",
      "oportunidad unica",
      "se acaba",
      "ultima oportunidad",
      "oferta limitada",
      "black friday",
      "descuento solo hoy",
      "solo por hoy",
    ])
  ) {
    signals.push({
      label: "FOMO o urgencia artificial",
      enemy: "FOMO",
      weight: 2,
      emotional: true,
    });
  }

  if (
    hasAny(text, [
      "impulso",
      "impulsivo",
      "capricho",
      "antojo",
      "me tienta",
      "calentura",
    ])
  ) {
    signals.push({
      label: "Impulso o capricho",
      enemy: "impulso",
      weight: 2,
      emotional: true,
    });
  }

  if (
    intent !== "real" &&
    hasAny(text, ["compr", "gastar", "financ", "cambiar", "deberia", "conviene"])
  ) {
    signals.push({
      label: "Decision todavia no ejecutada",
      enemy: "decision no confirmada",
      weight: 1,
    });
  }

  return signals;
}

function shouldCreateAmountlessDecision(text: string) {
  return (
    detectAntiErrorSignals({
      amount: 0,
      currency: "USD",
      category: detectCategory(text, detectType(text), 0),
      type: detectType(text),
      text,
      intent: detectIntent(text),
    }).length > 0
  );
}

function shouldIgnoreNumberMatch(segment: string, match: RegExpMatchArray) {
  const matchIndex = match.index ?? 0;
  const after = normalize(
    segment.slice(matchIndex + match[0].length, matchIndex + match[0].length + 20),
  );
  const before = normalize(segment.slice(Math.max(0, matchIndex - 12), matchIndex));

  return (
    /^\s*(cuota|cuotas|mes|meses|hora|horas|dia|dias|semana|semanas)/.test(
      after,
    ) ||
    (/(en|a)\s*$/.test(before) && /^\s*(cuota|cuotas)/.test(after))
  );
}

function detectInstallments(text: string) {
  const match = normalize(text).match(/(?:en|a)?\s*(\d{1,3})\s*cuotas?/);

  return match ? parseAmount(match[1]) : 0;
}

function detectInstallmentAmount(text: string) {
  const match = normalize(text).match(
    /cuotas?\s*(?:de|x|por)?\s*(?:us\$|usd|uyu|\$)?\s*(\d+(?:[.,]\d+)?)/,
  );

  return match ? parseAmount(match[1]) : 0;
}

function detectDate(text: string, today: Date) {
  const date = new Date(today);

  if (text.includes("ayer")) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().slice(0, 10);
}

function detectCurrency(text: string) {
  const normalized = normalize(text);

  if (hasAny(normalized, ["uyu", "pesos", "$u"])) {
    return "UYU";
  }

  return "USD";
}

function detectIncomeBase(text: string) {
  const incomeMatch = text.match(
    /(?:cobre|cobré|sueldo|salario|ingreso|me pagaron|aumentaron(?: el sueldo)?|aumento(?: de sueldo)?|aumento salarial|subieron el sueldo)\s*(?:de)?\s*(?:US\$|USD|UYU|\$)?\s*(\d+(?:[.,]\d+)?)/i,
  );

  return incomeMatch ? parseAmount(incomeMatch[1]) : 0;
}

function detectIncomeIncrease(text: string) {
  return hasAny(text, [
    "aumentaron",
    "aumento de sueldo",
    "aumento salarial",
    "subieron el sueldo",
  ]);
}

function splitSegments(text: string) {
  return text
    .split(/[\n.;,]+|\s+y\s+|\s+e\s+|\s+tambien\s+|\s+también\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function shouldCarryNextSegmentIntent(segment: string, nextSegment: string) {
  if (!nextSegment) {
    return false;
  }

  const segmentHasAmount = /\d/.test(segment);
  const nextHasAmount = /\d/.test(nextSegment);
  const nextIsNegation = detectIntent(nextSegment) === "negado";

  if (!nextHasAmount && nextIsNegation) {
    return true;
  }

  return (
    segmentHasAmount &&
    !nextHasAmount &&
    isContextualAntiErrorContext(nextSegment)
  );
}

function isContextualAntiErrorContext(text: string) {
  return (
    detectIntent(text) === "real" &&
    hasAny(text, [
      "ansiedad",
      "ansioso",
      "aburrimiento",
      "aburrido",
      "comparacion",
      "todos tienen",
      "todos lo tienen",
      "todos van",
      "estatus",
      "status",
      "fomo",
      "impulso",
      "capricho",
      "me lo merezco",
      "me merezco",
    ])
  );
}

function mergeDuplicatedIncome(items: DetectedFinancialItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.type}-${item.amount}-${item.category}-${item.sourceText}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateFreedomImpact({
  amount,
  type,
  intent,
  recurring,
  normalizedText,
}: {
  amount: number;
  type: FinancialType;
  intent: TransactionIntent;
  recurring: boolean;
  normalizedText: string;
}) {
  if (
    amount <= 0 ||
    intent === "negado" ||
    !shouldShowFireImpact({ type, normalizedText })
  ) {
    return 0;
  }

  return freedomNumber(recurring ? amount : amount / 12);
}

function shouldShowFireImpact({
  type,
  normalizedText,
}: {
  type: FinancialType;
  normalizedText: string;
}) {
  if (type === "gasto" || type === "deuda") {
    return true;
  }

  return (
    type === "decision" &&
    hasAny(normalizedText, [
      "compr",
      "gastar",
      "pagar",
      "financ",
      "cuota",
      "cambiar el auto",
      "cambiar la moto",
    ])
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(text: string, words: string[]) {
  const normalized = normalize(text);

  return words.some((word) => normalized.includes(normalize(word)));
}
