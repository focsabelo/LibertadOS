import {
  confirmedTransactionsSummary,
  coreExpenseShare,
  fireReductionScenarios,
} from "@/lib/finance";
import { currencyFormatter, percentFormatter } from "./formatting";
import { FireRow, MetricCard } from "./shared-components";

type TransactionSummary = ReturnType<typeof confirmedTransactionsSummary>;

export function FireLeversPanel({ summary }: { summary: TransactionSummary }) {
  const coreCategories = [
    { key: "vivienda", label: "Vivienda" },
    { key: "transporte", label: "Transporte" },
    { key: "comida", label: "Comida" },
  ] as const;
  const totalCoreMonthly = coreCategories.reduce(
    (total, category) => total + summary.coreMonthlyExpenses[category.key],
    0,
  );

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Palancas FIRE
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Los gastos confirmados se convierten a una lectura mensual. Los
            gastos unicos se anualizan para medir su impacto sobre el numero x25.
          </p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Reducir gasto mensual baja la meta x25.
        </div>
      </div>

      <div className="libertad-card-grid mt-5 grid gap-3">
        <MetricCard
          label="Gasto mensual confirmado"
          value={currencyFormatter.format(summary.monthlyConfirmedExpenses)}
          tone="amber"
        />
        <MetricCard
          label="Gasto anual estimado"
          value={currencyFormatter.format(summary.annualConfirmedExpenses)}
        />
        <MetricCard
          label="Numero FIRE confirmado"
          value={currencyFormatter.format(summary.confirmedFireNumber)}
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="libertad-soft-panel rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-800">
              Categorias criticas
            </p>
            <p className="text-sm font-semibold text-stone-950">
              {currencyFormatter.format(totalCoreMonthly)}
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            {coreCategories.map((category) => {
              const amount = summary.coreMonthlyExpenses[category.key];
              const share = coreExpenseShare(
                amount,
                summary.monthlyConfirmedExpenses,
              );

              return (
                <FireRow
                  key={category.key}
                  label={category.label}
                  value={currencyFormatter.format(amount)}
                  detail={`${percentFormatter.format(share)}% del gasto`}
                />
              );
            })}
          </div>
        </div>

        <div className="libertad-soft-panel rounded-md p-4">
          <p className="text-sm font-semibold text-stone-800">
            Impacto de reducir gasto mensual
          </p>
          <div className="mt-3 grid gap-2">
            {fireReductionScenarios().map((scenario) => (
              <FireRow
                key={scenario.monthlyReduction}
                label={`${currencyFormatter.format(
                  scenario.monthlyReduction,
                )}/mes menos`}
                value={`-${currencyFormatter.format(scenario.fireReduction)}`}
                detail="menos de numero FIRE"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
