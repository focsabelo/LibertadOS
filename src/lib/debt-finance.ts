export function calculateDebtPayment({
  principal,
  annualRate,
  termMonths,
}: {
  principal: number;
  annualRate: number;
  termMonths: number;
}) {
  const principalAmount = Math.max(0, principal);
  const months = Math.max(0, Math.round(termMonths));

  if (principalAmount <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = Math.pow(1 + Math.max(0, annualRate) / 100, 1 / 12) - 1;

  if (monthlyRate <= 0) {
    return principalAmount / months;
  }

  return (
    (principalAmount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -months))
  );
}

export function estimateEffectiveAnnualRate({
  principal,
  installmentAmount,
  termMonths,
}: {
  principal: number;
  installmentAmount: number;
  termMonths: number;
}) {
  const principalAmount = Math.max(0, principal);
  const payment = Math.max(0, installmentAmount);
  const months = Math.max(0, Math.round(termMonths));

  if (principalAmount <= 0 || payment <= 0 || months <= 0) {
    return 0;
  }

  if (payment * months <= principalAmount) {
    return 0;
  }

  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const presentValue =
      (payment * (1 - Math.pow(1 + mid, -months))) / mid;

    if (presentValue > principalAmount) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (Math.pow(1 + (low + high) / 2, 12) - 1) * 100;
}

export function calculateDebtTotals({
  principal,
  installmentAmount,
  termMonths,
  annualRate,
  monthlyContribution,
}: {
  principal?: number;
  installmentAmount?: number;
  termMonths?: number;
  annualRate?: number;
  monthlyContribution?: number;
}) {
  const principalAmount = Math.max(0, principal ?? 0);
  const months = Math.max(0, Math.round(termMonths ?? 0));
  const payment =
    installmentAmount && installmentAmount > 0
      ? installmentAmount
      : principalAmount > 0 && annualRate !== undefined && months > 0
        ? calculateDebtPayment({
            principal: principalAmount,
            annualRate,
            termMonths: months,
          })
        : 0;
  const totalCost = payment > 0 && months > 0 ? payment * months : undefined;
  const totalInterest =
    totalCost !== undefined && principalAmount > 0
      ? Math.max(0, totalCost - principalAmount)
      : undefined;
  const annualCost =
    payment > 0 ? payment * (months > 0 ? Math.min(months, 12) : 12) : 0;
  const fireImpact = payment > 0 ? debtFreedomNumber(payment) : 0;
  const effectiveAnnualRate =
    principalAmount > 0 && payment > 0 && months > 0
      ? estimateEffectiveAnnualRate({
          principal: principalAmount,
          installmentAmount: payment,
          termMonths: months,
        })
      : annualRate;
  const salaryDependencyIncrease =
    payment > 0 && (monthlyContribution ?? 0) > 0
      ? (payment / Math.max(1, monthlyContribution ?? 0)) * 100
      : undefined;

  return {
    installmentAmount: payment,
    totalCost,
    totalInterest,
    annualCost,
    monthlyMarginImpact: payment,
    fireImpact,
    effectiveAnnualRate,
    salaryDependencyIncrease,
  };
}

function debtFreedomNumber(monthlySpend: number) {
  return Math.max(0, monthlySpend) * 12 * 25;
}
