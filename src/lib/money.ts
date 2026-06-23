export type MoneyConversionStatus = "exact" | "fallback" | "missing";

export type Money = {
  amount: number;
  currency: string;
  usdAmount: number;
  conversionStatus: MoneyConversionStatus;
};

export type UsdConversionLike = {
  originalAmount?: number;
  originalCurrency?: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  rate?: number;
  date?: string;
  source?: string;
};

export type MoneyInput = {
  amount: number;
  currency?: string;
  usdConversion?: UsdConversionLike;
  fallbackRates?: Partial<Record<string, number>>;
};

export const DEFAULT_UYU_PER_USD_ANALYSIS_RATE = 40;

const DEFAULT_FALLBACK_RATES: Record<string, number> = {
  UYU: DEFAULT_UYU_PER_USD_ANALYSIS_RATE,
};

export function createMoney({
  amount,
  currency,
  usdConversion,
  fallbackRates = DEFAULT_FALLBACK_RATES,
}: MoneyInput): Money {
  const normalizedAmount = normalizePositiveNumber(amount);
  const normalizedCurrency = normalizeCurrencyCode(currency);

  if (normalizedCurrency === "USD") {
    return {
      amount: normalizedAmount,
      currency: normalizedCurrency,
      usdAmount: normalizedAmount,
      conversionStatus: "exact",
    };
  }

  const exactUsdAmount = exactUsdAmountFromConversion({
    amount: normalizedAmount,
    currency: normalizedCurrency,
    usdConversion,
  });

  if (exactUsdAmount !== undefined) {
    return {
      amount: normalizedAmount,
      currency: normalizedCurrency,
      usdAmount: exactUsdAmount,
      conversionStatus: "exact",
    };
  }

  const fallbackRate = normalizePositiveNumber(
    fallbackRates[normalizedCurrency] ?? 0,
  );

  if (fallbackRate > 0) {
    return {
      amount: normalizedAmount,
      currency: normalizedCurrency,
      usdAmount: roundToTwo(normalizedAmount / fallbackRate),
      conversionStatus: "fallback",
    };
  }

  return {
    amount: normalizedAmount,
    currency: normalizedCurrency,
    usdAmount: 0,
    conversionStatus: "missing",
  };
}

export function usdAmountForCalculation(money: Money, label = "Money") {
  if (money.conversionStatus === "missing") {
    throw new Error(
      `${label} cannot be used in USD calculations without a conversion rate.`,
    );
  }

  return money.usdAmount;
}

export function normalizeCurrencyCode(currency?: string) {
  return (currency ?? "USD").trim().toUpperCase();
}

function exactUsdAmountFromConversion({
  amount,
  currency,
  usdConversion,
}: {
  amount: number;
  currency: string;
  usdConversion?: UsdConversionLike;
}) {
  const convertedCurrency = normalizeCurrencyCode(
    usdConversion?.convertedCurrency,
  );

  if (convertedCurrency !== "USD") {
    return undefined;
  }

  if (
    Number.isFinite(usdConversion?.convertedAmount) &&
    Number.isFinite(usdConversion?.originalAmount) &&
    normalizeCurrencyCode(usdConversion?.originalCurrency) === currency &&
    usdConversion?.originalAmount === amount
  ) {
    return normalizePositiveNumber(usdConversion.convertedAmount ?? 0);
  }

  if (Number.isFinite(usdConversion?.rate) && (usdConversion?.rate ?? 0) > 0) {
    return roundToTwo(amount / (usdConversion?.rate ?? 1));
  }

  return undefined;
}

function normalizePositiveNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
