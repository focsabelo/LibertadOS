export const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

export const numberFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

export function formatCurrencyAmount(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${numberFormatter.format(amount)}`;
  }
}