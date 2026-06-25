import type {
  WealthAsset,
  WealthAssetCategory,
  WealthAssetsSummary,
} from "./types";

export function analyzeWealthAssets(
  assets: WealthAsset[] = [],
): WealthAssetsSummary {
  return assets.reduce<WealthAssetsSummary>(
    (summary, asset) => {
      const estimatedValue = Math.max(
        0,
        Number.isFinite(asset.estimatedValue) ? asset.estimatedValue : 0,
      );
      const debtBalance = Math.max(
        0,
        Number.isFinite(asset.debtBalance) ? asset.debtBalance : 0,
      );
      const netAmount = estimatedValue - debtBalance;

      return {
        totalEstimatedValue: summary.totalEstimatedValue + estimatedValue,
        totalDebtBalance: summary.totalDebtBalance + debtBalance,
        netWorthAmount: summary.netWorthAmount + netAmount,
        investmentCapitalAmount: asset.countsAsInvestmentCapital
          ? summary.investmentCapitalAmount + netAmount
          : summary.investmentCapitalAmount,
      };
    },
    {
      totalEstimatedValue: 0,
      totalDebtBalance: 0,
      netWorthAmount: 0,
      investmentCapitalAmount: 0,
    },
  );
}

export function normalizeWealthAssets(assets: unknown): WealthAsset[] {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((asset, index) => {
      if (!asset || typeof asset !== "object") {
        return undefined;
      }

      const record = asset as Partial<WealthAsset>;
      const name =
        typeof record.name === "string" && record.name.trim()
          ? record.name.trim()
          : "Activo patrimonial";
      const category = normalizeWealthAssetCategory(record.category);
      const estimatedValue = Number(record.estimatedValue);
      const debtBalance = Number(record.debtBalance);

      return {
        id:
          typeof record.id === "string" && record.id.trim()
            ? record.id
            : `asset-${index + 1}`,
        name,
        category,
        estimatedValue: Number.isFinite(estimatedValue)
          ? Math.max(0, estimatedValue)
          : 0,
        debtBalance: Number.isFinite(debtBalance) ? Math.max(0, debtBalance) : 0,
        countsAsInvestmentCapital: Boolean(record.countsAsInvestmentCapital),
      };
    })
    .filter((asset): asset is WealthAsset => Boolean(asset));
}

function normalizeWealthAssetCategory(
  category: unknown,
): WealthAssetCategory {
  const categories: WealthAssetCategory[] = [
    "vivienda",
    "vehiculo",
    "efectivo",
    "inmueble_inversion",
    "otro",
  ];

  return categories.includes(category as WealthAssetCategory)
    ? (category as WealthAssetCategory)
    : "otro";
}

export function createWealthAsset(): WealthAsset {
  return {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    category: "otro",
    estimatedValue: 0,
    debtBalance: 0,
    countsAsInvestmentCapital: false,
  };
}
