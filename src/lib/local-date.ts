function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toLocalDateKey(value: Date | string) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return formatLocalDate(parsed);
  }

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return formatLocalDate(value);
}

export function toLocalMonthKey(value: Date | string) {
  return toLocalDateKey(value).slice(0, 7);
}

export function previousLocalMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return "";
  }

  return toLocalMonthKey(new Date(year, month - 2, 1));
}

export function addLocalDays(value: Date, days: number) {
  const date = new Date(value);

  date.setDate(date.getDate() + days);

  return date;
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-");
}
