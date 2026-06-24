import {
  currencyFormatter,
} from "@/components/libertad-dashboard/formatting";
import {
  inputClass,
  inputShellClass,
} from "@/components/libertad-dashboard/form-styles";
import type {
  WealthAsset,
  WealthAssetCategory,
  WealthAssetsSummary,
} from "@/lib/finance";

const assetCategoryOptions: {
  value: WealthAssetCategory;
  label: string;
}[] = [
  { value: "vivienda", label: "Vivienda" },
  { value: "vehiculo", label: "Vehiculo" },
  { value: "efectivo", label: "Efectivo" },
  { value: "inmueble_inversion", label: "Inmueble inversion" },
  { value: "otro", label: "Otro" },
];

export function WealthAssetsPanel({
  assets,
  summary,
  onAdd,
  onChange,
  onRemove,
}: {
  assets: WealthAsset[];
  summary: WealthAssetsSummary;
  onAdd: () => void;
  onChange: (
    id: string,
    key: keyof WealthAsset,
    value: string | boolean,
  ) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-stone-950">
            Activos patrimoniales
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Casa, auto, efectivo u otros activos. Suman al patrimonio; solo los
            marcados como productivos suman al capital de inversiones.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onAdd}
        >
          Agregar activo
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SummaryValue
          label="Valor estimado"
          value={currencyFormatter.format(summary.totalEstimatedValue)}
        />
        <SummaryValue
          label="Deuda asociada"
          value={currencyFormatter.format(summary.totalDebtBalance)}
        />
        <SummaryValue
          label="Neto patrimonial"
          value={currencyFormatter.format(summary.netWorthAmount)}
        />
      </div>

      <div className="mt-5 grid gap-3">
        {assets.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 px-4 py-5">
            <p className="text-sm font-semibold text-stone-800">
              Sin activos cargados
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Agrega activos grandes o saldos importantes para que el
              patrimonio sea mas fiel a tu realidad.
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AssetRow({
  asset,
  onChange,
  onRemove,
}: {
  asset: WealthAsset;
  onChange: (
    id: string,
    key: keyof WealthAsset,
    value: string | boolean,
  ) => void;
  onRemove: (id: string) => void;
}) {
  const netAmount = asset.estimatedValue - asset.debtBalance;

  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(160px,1.2fr)_150px_150px_150px_minmax(150px,1fr)_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">Nombre</span>
          <div className={inputShellClass}>
            <input
              autoComplete="off"
              className={inputClass}
              name={`wealth-name-${asset.id}`}
              placeholder="Casa, auto, efectivo"
              type="text"
              value={asset.name}
              onChange={(event) =>
                onChange(asset.id, "name", event.target.value)
              }
            />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">Tipo</span>
          <select
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950"
            name={`wealth-category-${asset.id}`}
            value={asset.category}
            onChange={(event) =>
              onChange(asset.id, "category", event.target.value)
            }
          >
            {assetCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">Valor</span>
          <div className={inputShellClass}>
            <span className="mr-2 text-sm font-semibold text-stone-500">
              USD
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              inputMode="decimal"
              min="0"
              name={`wealth-value-${asset.id}`}
              step="500"
              type="number"
              value={asset.estimatedValue === 0 ? "" : asset.estimatedValue}
              onChange={(event) =>
                onChange(asset.id, "estimatedValue", event.target.value)
              }
            />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">Deuda</span>
          <div className={inputShellClass}>
            <span className="mr-2 text-sm font-semibold text-stone-500">
              USD
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              inputMode="decimal"
              min="0"
              name={`wealth-debt-${asset.id}`}
              step="500"
              type="number"
              value={asset.debtBalance === 0 ? "" : asset.debtBalance}
              onChange={(event) =>
                onChange(asset.id, "debtBalance", event.target.value)
              }
            />
          </div>
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Neto: {currencyFormatter.format(netAmount)}
          </span>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-800">
            <input
              className="size-4 accent-emerald-700"
              checked={asset.countsAsInvestmentCapital}
              type="checkbox"
              onChange={(event) =>
                onChange(
                  asset.id,
                  "countsAsInvestmentCapital",
                  event.target.checked,
                )
              }
            />
            Cuenta como inversion
          </label>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-900 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          type="button"
          onClick={() => onRemove(asset.id)}
        >
          Quitar
        </button>
      </div>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold text-stone-600">{label}</p>
      <p className="libertad-number mt-2 text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}
