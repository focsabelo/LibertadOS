import type {
  OwnedBusiness,
  OwnedBusinessesSummary,
  OwnedBusinessStatus,
  OwnedBusinessValuationConfidence,
} from "./types";
import { nonNegativeNumber } from "./utils";

export function analyzeOwnedBusinesses(
  businesses: OwnedBusiness[] = [],
): OwnedBusinessesSummary {
  const summary = businesses.reduce<OwnedBusinessesSummary>(
    (current, business) => {
      const monthlyRevenue = nonNegativeNumber(business.monthlyRevenue);
      const monthlyCosts = nonNegativeNumber(business.monthlyCosts);
      const monthlyProfit = monthlyRevenue - monthlyCosts;
      const cashBalance = nonNegativeNumber(business.cashBalance);
      const debtBalance = nonNegativeNumber(business.debtBalance);
      const estimatedValue = nonNegativeNumber(business.estimatedValue);
      const monthlyHours = nonNegativeNumber(business.monthlyHours);

      return {
        count: current.count + 1,
        activeCount:
          business.status === "activo" ? current.activeCount + 1 : current.activeCount,
        profitableCount:
          monthlyProfit > 0 ? current.profitableCount + 1 : current.profitableCount,
        totalMonthlyRevenue: current.totalMonthlyRevenue + monthlyRevenue,
        totalMonthlyCosts: current.totalMonthlyCosts + monthlyCosts,
        totalMonthlyProfit: current.totalMonthlyProfit + monthlyProfit,
        totalCashBalance: current.totalCashBalance + cashBalance,
        totalCapitalContributed:
          current.totalCapitalContributed +
          nonNegativeNumber(business.capitalContributed),
        totalOwnerWithdrawals:
          current.totalOwnerWithdrawals + nonNegativeNumber(business.ownerWithdrawals),
        totalReinvestedAmount:
          current.totalReinvestedAmount + nonNegativeNumber(business.reinvestedAmount),
        totalDebtBalance: current.totalDebtBalance + debtBalance,
        totalEstimatedValue: current.totalEstimatedValue + estimatedValue,
        totalOperationalNetWorth:
          current.totalOperationalNetWorth + cashBalance + estimatedValue - debtBalance,
        totalMonthlyHours: current.totalMonthlyHours + monthlyHours,
        averageProfitPerHour: 0,
      };
    },
    {
      count: 0,
      activeCount: 0,
      profitableCount: 0,
      totalMonthlyRevenue: 0,
      totalMonthlyCosts: 0,
      totalMonthlyProfit: 0,
      totalCashBalance: 0,
      totalCapitalContributed: 0,
      totalOwnerWithdrawals: 0,
      totalReinvestedAmount: 0,
      totalDebtBalance: 0,
      totalEstimatedValue: 0,
      totalOperationalNetWorth: 0,
      totalMonthlyHours: 0,
      averageProfitPerHour: 0,
    },
  );

  return {
    ...summary,
    averageProfitPerHour:
      summary.totalMonthlyHours > 0
        ? summary.totalMonthlyProfit / summary.totalMonthlyHours
        : 0,
  };
}

export function normalizeOwnedBusinesses(businesses: unknown): OwnedBusiness[] {
  if (!Array.isArray(businesses)) {
    return [];
  }

  return businesses
    .map((business, index) => {
      if (!business || typeof business !== "object") {
        return undefined;
      }

      const record = business as Partial<OwnedBusiness>;

      return {
        id:
          typeof record.id === "string" && record.id.trim()
            ? record.id
            : `business-${index + 1}`,
        name:
          typeof record.name === "string" && record.name.trim()
            ? record.name.trim()
            : "Negocio propio",
        status: normalizeOwnedBusinessStatus(record.status),
        monthlyRevenue: nonNegativeNumber(record.monthlyRevenue),
        monthlyCosts: nonNegativeNumber(record.monthlyCosts),
        cashBalance: nonNegativeNumber(record.cashBalance),
        capitalContributed: nonNegativeNumber(record.capitalContributed),
        ownerWithdrawals: nonNegativeNumber(record.ownerWithdrawals),
        reinvestedAmount: nonNegativeNumber(record.reinvestedAmount),
        debtBalance: nonNegativeNumber(record.debtBalance),
        estimatedValue: nonNegativeNumber(record.estimatedValue),
        valuationConfidence: normalizeOwnedBusinessValuationConfidence(
          record.valuationConfidence,
        ),
        monthlyHours: nonNegativeNumber(record.monthlyHours),
        notes: typeof record.notes === "string" ? record.notes : "",
      };
    })
    .filter((business): business is OwnedBusiness => Boolean(business));
}

function normalizeOwnedBusinessStatus(status: unknown): OwnedBusinessStatus {
  const statuses: OwnedBusinessStatus[] = [
    "idea",
    "validando",
    "activo",
    "pausado",
    "cerrado",
  ];

  return statuses.includes(status as OwnedBusinessStatus)
    ? (status as OwnedBusinessStatus)
    : "idea";
}

function normalizeOwnedBusinessValuationConfidence(
  confidence: unknown,
): OwnedBusinessValuationConfidence {
  const values: OwnedBusinessValuationConfidence[] = ["baja", "media", "alta"];

  return values.includes(confidence as OwnedBusinessValuationConfidence)
    ? (confidence as OwnedBusinessValuationConfidence)
    : "baja";
}

export function createOwnedBusiness(): OwnedBusiness {
  return {
    id: `business-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    status: "idea",
    monthlyRevenue: 0,
    monthlyCosts: 0,
    cashBalance: 0,
    capitalContributed: 0,
    ownerWithdrawals: 0,
    reinvestedAmount: 0,
    debtBalance: 0,
    estimatedValue: 0,
    valuationConfidence: "baja",
    monthlyHours: 0,
    notes: "",
  };
}
