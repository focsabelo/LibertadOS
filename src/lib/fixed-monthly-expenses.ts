import { createMoney, type Money } from "./money";

type JsonRecord = Record<string, unknown>;

export const FIXED_MONTHLY_EXPENSE_CATEGORIES = [
  "vivienda",
  "transporte",
  "comida",
  "servicios",
  "suscripciones",
  "salud",
  "educacion",
  "impuestos",
  "seguros",
  "otros",
] as const;

export const FIXED_MONTHLY_EXPENSE_CURRENCIES = [
  "USD",
  "UYU",
  "ARS",
  "EUR",
] as const;

export type FixedMonthlyExpenseCategory =
  (typeof FIXED_MONTHLY_EXPENSE_CATEGORIES)[number];

export type FixedMonthlyExpenseCurrency =
  (typeof FIXED_MONTHLY_EXPENSE_CURRENCIES)[number] | string;

export type FixedMonthlyExpense = {
  id: string;
  name: string;
  category: FixedMonthlyExpenseCategory;
  monthlyAmount: number;
  currency: FixedMonthlyExpenseCurrency;
  active: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type FixedMonthlyExpenseDraft = Omit<
  FixedMonthlyExpense,
  "id" | "createdAt" | "updatedAt"
>;

export type FixedMonthlyExpenseTotal = {
  currency: FixedMonthlyExpenseCurrency;
  amount: number;
  money: Money;
};

export type FixedMonthlyExpenseSummaryOptions = {
  uyuPerUsdRate?: number;
};

const categoryKeywords: Record<FixedMonthlyExpenseCategory, string[]> = {
  vivienda: [
    "alquiler",
    "apartamento",
    "casa",
    "hipoteca",
    "expensas",
    "vivienda",
    "renta",
  ],
  transporte: [
    "transporte",
    "combustible",
    "nafta",
    "auto",
    "bus",
    "uber",
    "taxi",
    "garage",
    "estacionamiento",
  ],
  comida: ["comida", "supermercado", "almuerzo", "cena", "delivery"],
  servicios: [
    "internet",
    "fibra",
    "luz",
    "agua",
    "gas",
    "telefono",
    "celular",
    "electricidad",
  ],
  suscripciones: [
    "netflix",
    "spotify",
    "youtube",
    "icloud",
    "google",
    "apple",
    "prime",
    "suscripcion",
    "membresia",
  ],
  salud: ["salud", "medico", "mutualista", "seguro medico", "farmacia"],
  educacion: ["educacion", "curso", "universidad", "colegio", "clase"],
  impuestos: ["impuesto", "tributo", "bps", "dgi", "patente"],
  seguros: ["seguro"],
  otros: [],
};

const amountPattern =
  /(?:(US\$|U\$S|\$|USD|UYU|ARS|EUR)\s*)?(\d+(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)(?:\s*(USD|UYU|ARS|EUR|dolares?|pesos?))?/i;

export function createFixedMonthlyExpenseDraft(
  text: string,
): FixedMonthlyExpenseDraft {
  const source = text.trim();
  const amountMatch = source.match(amountPattern);
  const prefixCurrency = amountMatch?.[1];
  const amountText = amountMatch?.[2];
  const suffixCurrency = amountMatch?.[3];
  const monthlyAmount = amountText ? parseLocalizedAmount(amountText) : 0;
  const currency = normalizeCurrency(prefixCurrency ?? suffixCurrency);
  const name = inferName(source, amountMatch?.[0] ?? "");

  return {
    name,
    category: inferFixedExpenseCategory(source || name),
    monthlyAmount,
    currency,
    active: true,
    note: "",
  };
}

export function fixedMonthlyExpenseToRow(
  userId: string,
  expense: FixedMonthlyExpense,
) {
  return {
    id: expense.id,
    user_id: userId,
    ...fixedMonthlyExpenseDraftToRow(expense),
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
  };
}

export function fixedMonthlyExpenseDraftToRow(
  expense: FixedMonthlyExpenseDraft,
) {
  const normalized = normalizeFixedMonthlyExpenseDraft(expense);

  return {
    name: normalized.name,
    category: normalized.category,
    monthly_amount: normalized.monthlyAmount,
    currency: normalized.currency,
    is_active: normalized.active,
    note: normalized.note,
  };
}

export function fixedMonthlyExpenseFromRow(row: JsonRecord): FixedMonthlyExpense {
  const createdAt = String(row.created_at ?? new Date().toISOString());
  const updatedAt = String(row.updated_at ?? createdAt);

  return {
    id: String(row.id),
    name: normalizeName(String(row.name ?? "")),
    category: normalizeCategory(String(row.category ?? "")),
    monthlyAmount: normalizeAmount(Number(row.monthly_amount ?? 0)),
    currency: normalizeCurrency(String(row.currency ?? "")),
    active: Boolean(row.is_active),
    note: String(row.note ?? ""),
    createdAt,
    updatedAt,
  };
}

export function summarizeActiveFixedExpenses(
  expenses: Pick<FixedMonthlyExpenseDraft, "active" | "monthlyAmount" | "currency">[],
  options: FixedMonthlyExpenseSummaryOptions = {},
): FixedMonthlyExpenseTotal[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    if (!expense.active) {
      continue;
    }

    const currency = normalizeCurrency(expense.currency);
    const current = totals.get(currency) ?? 0;
    totals.set(currency, current + normalizeAmount(expense.monthlyAmount));
  }

  return Array.from(totals.entries()).map(([currency, amount]) => {
    const normalizedCurrency = normalizeCurrency(currency);

    return {
      currency: normalizedCurrency,
      amount,
      money: createMoney({
        amount,
        currency: normalizedCurrency,
        fallbackRates:
          normalizedCurrency === "UYU" && options.uyuPerUsdRate
            ? { UYU: options.uyuPerUsdRate }
            : {},
      }),
    };
  });
}

export function fixedMonthlyExpenseUsdEquivalent(
  totals: FixedMonthlyExpenseTotal[],
  uyuPerUsdRate?: number,
) {
  let equivalent = 0;
  let hasConvertedAmount = false;

  for (const total of totals) {
    const amount = normalizeAmount(total.amount);
    const currency = normalizeCurrency(total.currency);

    if (total.money.conversionStatus !== "missing") {
      equivalent += total.money.usdAmount;
      if (currency !== "USD") {
        hasConvertedAmount = true;
      }
      continue;
    }

    if (currency === "UYU") {
      const rate = normalizeAmount(uyuPerUsdRate ?? 0);

      if (rate > 0) {
        equivalent += amount / rate;
        hasConvertedAmount = true;
      }
    }
  }

  return hasConvertedAmount ? roundToTwo(equivalent) : undefined;
}

export function normalizeFixedMonthlyExpenseDraft(
  expense: FixedMonthlyExpenseDraft,
): FixedMonthlyExpenseDraft {
  return {
    name: normalizeName(expense.name),
    category: normalizeCategory(expense.category),
    monthlyAmount: normalizeAmount(expense.monthlyAmount),
    currency: normalizeCurrency(expense.currency),
    active: Boolean(expense.active),
    note: expense.note.trim(),
  };
}

function inferName(source: string, matchedAmount: string) {
  const cleaned = source
    .replace(matchedAmount, " ")
    .replace(/\b(USD|UYU|ARS|EUR|dolares?|pesos?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.:;\-\s]+|[,.:;\-\s]+$/g, "")
    .trim();

  return normalizeName(cleaned);
}

function inferFixedExpenseCategory(source: string): FixedMonthlyExpenseCategory {
  const normalized = source.toLowerCase();

  for (const category of FIXED_MONTHLY_EXPENSE_CATEGORIES) {
    if (category === "otros") {
      continue;
    }

    if (
      categoryKeywords[category].some((keyword) =>
        includesKeyword(normalized, keyword),
      )
    ) {
      return category;
    }
  }

  return "otros";
}

function includesKeyword(source: string, keyword: string) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, "i");

  return matcher.test(source);
}

function normalizeName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Gasto fijo";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeCategory(category: string): FixedMonthlyExpenseCategory {
  return FIXED_MONTHLY_EXPENSE_CATEGORIES.includes(
    category as FixedMonthlyExpenseCategory,
  )
    ? (category as FixedMonthlyExpenseCategory)
    : "otros";
}

function normalizeCurrency(currency?: string) {
  const normalized = (currency ?? "").trim().toUpperCase();

  if (normalized === "PESO" || normalized === "PESOS") {
    return "UYU";
  }

  if (normalized === "DOLAR" || normalized === "DOLARES" || normalized === "US$") {
    return "USD";
  }

  if (normalized === "U$S") {
    return "USD";
  }

  if (normalized === "$") {
    return "USD";
  }

  return normalized || "USD";
}

function normalizeAmount(amount: number) {
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function roundToTwo(amount: number) {
  return Math.round(amount * 100) / 100;
}

function parseLocalizedAmount(value: string) {
  const trimmed = value.trim();
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";

    return Number(
      trimmed
        .split(thousandsSeparator)
        .join("")
        .replace(decimalSeparator, "."),
    );
  }

  const separator = lastComma >= 0 ? "," : lastDot >= 0 ? "." : "";

  if (!separator) {
    return Number(trimmed);
  }

  const [whole, decimals] = trimmed.split(separator);

  if (decimals?.length === 3) {
    return Number(`${whole}${decimals}`);
  }

  return Number(trimmed.replace(separator, "."));
}
