export function normalizePositiveNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatCompactCurrency(value: number) {
  return `USD ${roundToTwo(Math.max(0, value)).toLocaleString("en-US")}`;
}

export function nonNegativeNumber(value: unknown) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}
