import { currencyFormatter, percentFormatter } from "./formatting";
import { inputClass } from "./form-styles";
import { MetricCard } from "./shared-components";
import type {
  OwnedBusiness,
  OwnedBusinessesSummary,
  OwnedBusinessStatus,
} from "@/lib/finance";

const statusOptions: { value: OwnedBusinessStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "validando", label: "Validando" },
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "cerrado", label: "Cerrado" },
];

export function OwnedBusinessesPanel({
  businesses,
  summary,
  onAdd,
  onChange,
  onRemove,
}: {
  businesses: OwnedBusiness[];
  summary: OwnedBusinessesSummary;
  onAdd: () => void;
  onChange: (id: string, key: keyof OwnedBusiness, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const marginPercent =
    summary.totalMonthlyRevenue > 0
      ? (summary.totalMonthlyProfit / summary.totalMonthlyRevenue) * 100
      : 0;

  return (
    <section className="grid gap-5">
      <section className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-800">
              Activos operativos
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950 text-balance">
              Negocios propios
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Registra negocios que requieren gestion activa. Sus valores se
              mantienen separados de Inversiones y no modifican el patrimonio
              principal de forma automatica.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            type="button"
            onClick={onAdd}
          >
            Agregar negocio
          </button>
        </div>

        <div className="libertad-card-grid mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Negocios cargados"
            value={summary.count.toString()}
            detail={`${summary.activeCount} activos`}
          />
          <MetricCard
            label="Ganancia mensual"
            value={currencyFormatter.format(summary.totalMonthlyProfit)}
            detail={`${percentFormatter.format(marginPercent)}% margen neto`}
            tone={summary.totalMonthlyProfit > 0 ? "green" : "neutral"}
          />
          <MetricCard
            label="Caja operativa"
            value={currencyFormatter.format(summary.totalCashBalance)}
            detail="Dinero dentro de los negocios."
            tone="blue"
          />
          <MetricCard
            label="Valor prudente"
            value={currencyFormatter.format(summary.totalEstimatedValue)}
            detail="Estimacion separada del patrimonio liquido."
            tone="amber"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SummaryValue
            label="Ingresos mensuales"
            value={currencyFormatter.format(summary.totalMonthlyRevenue)}
          />
          <SummaryValue
            label="Costos mensuales"
            value={currencyFormatter.format(summary.totalMonthlyCosts)}
          />
          <SummaryValue
            label="Capital aportado"
            value={currencyFormatter.format(summary.totalCapitalContributed)}
          />
          <SummaryValue
            label="Retiros del dueno"
            value={currencyFormatter.format(summary.totalOwnerWithdrawals)}
          />
          <SummaryValue
            label="Deuda del negocio"
            value={currencyFormatter.format(summary.totalDebtBalance)}
          />
        </div>
      </section>

      <section className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">
              Fichas operativas
            </h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Separa facturacion, ganancia, caja, retiros y valoracion para no
              confundir ingreso del negocio con ingreso personal.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {businesses.length === 0 ? (
            <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 px-4 py-5">
              <p className="text-sm font-semibold text-stone-800">
                Sin negocios cargados
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Agrega un negocio para medir su flujo operativo sin mezclarlo
                con tus inversiones pasivas.
              </p>
            </div>
          ) : (
            businesses.map((business) => (
              <BusinessRow
                key={business.id}
                business={business}
                onChange={onChange}
                onRemove={onRemove}
              />
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function BusinessRow({
  business,
  onChange,
  onRemove,
}: {
  business: OwnedBusiness;
  onChange: (id: string, key: keyof OwnedBusiness, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const monthlyProfit = business.monthlyRevenue - business.monthlyCosts;
  const operationalNetWorth =
    business.cashBalance + business.estimatedValue - business.debtBalance;
  const compactInputShellClass =
    "libertad-field flex h-11 min-w-0 w-full items-center rounded-md bg-white px-3";

  return (
    <article className="rounded-md border border-stone-200 bg-white p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(220px,1.1fr)_150px_auto] xl:items-end">
        <label className="grid min-w-0 gap-2">
          <span className="text-xs font-semibold text-stone-600">Nombre</span>
          <div className={compactInputShellClass}>
            <input
              autoComplete="off"
              className={inputClass}
              name={`business-name-${business.id}`}
              placeholder="Agencia, producto, marca"
              type="text"
              value={business.name}
              onChange={(event) =>
                onChange(business.id, "name", event.target.value)
              }
            />
          </div>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-xs font-semibold text-stone-600">Estado</span>
          <select
            className="libertad-field h-11 min-w-0 w-full rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
            name={`business-status-${business.id}`}
            value={business.status}
            onChange={(event) =>
              onChange(business.id, "status", event.target.value)
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="inline-flex h-11 min-w-0 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-900 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          type="button"
          onClick={() => onRemove(business.id)}
        >
          Quitar
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MoneyInput
          business={business}
          field="monthlyRevenue"
          label="Ingresos mes"
          step="100"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="monthlyCosts"
          label="Costos mes"
          step="50"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="cashBalance"
          label="Caja"
          step="100"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="estimatedValue"
          label="Valor estimado"
          step="500"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="capitalContributed"
          label="Capital aportado"
          step="100"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="ownerWithdrawals"
          label="Retiros"
          step="50"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="reinvestedAmount"
          label="Reinvertido"
          step="50"
          onChange={onChange}
        />
        <MoneyInput
          business={business}
          field="debtBalance"
          label="Deuda"
          step="100"
          onChange={onChange}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_minmax(220px,0.45fr)]">
        <label className="grid min-w-0 gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Horas mes
          </span>
          <div className={compactInputShellClass}>
            <input
              autoComplete="off"
              className={inputClass}
              inputMode="decimal"
              min="0"
              name={`business-hours-${business.id}`}
              step="1"
              type="number"
              value={business.monthlyHours === 0 ? "" : business.monthlyHours}
              onChange={(event) =>
                onChange(business.id, "monthlyHours", event.target.value)
              }
            />
          </div>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-xs font-semibold text-stone-600">Notas</span>
          <textarea
            autoComplete="off"
            className="libertad-field min-h-11 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900"
            name={`business-notes-${business.id}`}
            placeholder="Riesgos, decisiones, foco del mes"
            value={business.notes}
            onChange={(event) =>
              onChange(business.id, "notes", event.target.value)
            }
          />
        </label>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-semibold text-stone-600">
            Lectura rapida
          </p>
          <p className="libertad-number mt-1 text-sm font-semibold text-stone-950">
            {currencyFormatter.format(monthlyProfit)} / mes
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Neto operativo estimado:{" "}
            {currencyFormatter.format(operationalNetWorth)}
          </p>
        </div>
      </div>
    </article>
  );
}

function MoneyInput({
  business,
  field,
  label,
  step,
  onChange,
}: {
  business: OwnedBusiness;
  field:
    | "monthlyRevenue"
    | "monthlyCosts"
    | "cashBalance"
    | "capitalContributed"
    | "ownerWithdrawals"
    | "reinvestedAmount"
    | "debtBalance"
    | "estimatedValue";
  label: string;
  step: string;
  onChange: (id: string, key: keyof OwnedBusiness, value: string) => void;
}) {
  const compactInputShellClass =
    "libertad-field flex h-11 min-w-0 w-full items-center rounded-md bg-white px-3";
  const value = business[field];

  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold text-stone-600">{label}</span>
      <div className={compactInputShellClass}>
        <span className="mr-2 text-sm font-semibold text-stone-500">USD</span>
        <input
          autoComplete="off"
          className={inputClass}
          inputMode="decimal"
          min="0"
          name={`business-${field}-${business.id}`}
          step={step}
          type="number"
          value={value === 0 ? "" : value}
          onChange={(event) =>
            onChange(business.id, field, event.target.value)
          }
        />
      </div>
    </label>
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
