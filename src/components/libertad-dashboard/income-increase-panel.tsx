"use client";

import {
  currencyFormatter,
  percentFormatter,
} from "@/components/libertad-dashboard/formatting";
import {
  inputClass,
  inputShellClass,
} from "@/components/libertad-dashboard/form-styles";
import {
  FireRow,
  MetricCard,
} from "@/components/libertad-dashboard/shared-components";
import type {
  IncomeIncreaseAnalysis,
  IncomeIncreaseRuleSettings,
} from "@/lib/finance";

type Props = {
  analysis: IncomeIncreaseAnalysis;
  settings: IncomeIncreaseRuleSettings;
  onOpenNotes: () => void;
  onSettingsChange: (
    key: keyof IncomeIncreaseRuleSettings,
    value: string,
  ) => void;
};

export function IncomeIncreasePanel({
  analysis,
  settings,
  onOpenNotes,
  onSettingsChange,
}: Props) {
  const totalPercent =
    settings.investmentPercent +
    settings.lifestylePercent +
    settings.treatPercent;
  const hasInvalidRule = Math.abs(totalPercent - 100) > 0.01;

  return (
    <section className="grid gap-5">
      <div className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Reglas de aumentos e ingresos extra
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Que el aumento no se vuelva ruido
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Usa ingresos confirmados para separar el dinero nuevo antes de que
              se mezcle con gastos recurrentes. Todo aca es simulacion hasta que
              lo confirmes desde Notas.
            </p>
          </div>
          <button
            className="min-h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            type="button"
            onClick={onOpenNotes}
          >
            Abrir Notas
          </button>
        </div>

        <div className="libertad-card-grid mt-5 grid gap-3">
          <MetricCard
            label="Aumento confirmado"
            value={currencyFormatter.format(analysis.increaseAmount)}
            tone={analysis.hasIncrease ? "green" : "neutral"}
          />
          <MetricCard
            label="Absorbido por gasto"
            value={currencyFormatter.format(analysis.absorbedByExpenses)}
            detail={`${percentFormatter.format(
              analysis.absorbedByExpensesPercent,
            )}% del aumento`}
            tone={analysis.absorbedByExpenses > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            label="Capturado para libertad"
            value={currencyFormatter.format(analysis.capturedForFreedom)}
            tone={analysis.capturedForFreedom > 0 ? "blue" : "neutral"}
          />
        </div>

        {!analysis.hasIncrease ? (
          <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            No hay aumento confirmado contra el mes anterior. Confirma ingresos
            reales y gastos del mes para activar esta lectura.
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-stone-950">
                Regla editable
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Los porcentajes deben sumar 100. La separacion de colchon usa el
                5% existente como recordatorio, no como movimiento real.
              </p>
            </div>
            <span
              className={`inline-flex min-h-8 items-center rounded-md border px-3 text-sm font-semibold ${
                hasInvalidRule
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
              }`}
            >
              Total {percentFormatter.format(totalPercent)}%
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <PercentField
              label="Inversion"
              value={settings.investmentPercent}
              onChange={(value) => onSettingsChange("investmentPercent", value)}
            />
            <PercentField
              label="Mejora de vida"
              value={settings.lifestylePercent}
              onChange={(value) => onSettingsChange("lifestylePercent", value)}
            />
            <PercentField
              label="Gusto personal"
              value={settings.treatPercent}
              onChange={(value) => onSettingsChange("treatPercent", value)}
            />
          </div>

          {hasInvalidRule ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              Mientras la regla no sume 100, el calculo usa 70/20/10 para evitar
              una lectura rota.
            </p>
          ) : null}
        </section>

        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-stone-950">
            Distribucion simulada
          </h3>
          <div className="mt-4 grid gap-2">
            <FireRow
              label="Inversion sugerida"
              value={currencyFormatter.format(analysis.plan.investment)}
              detail="Aporte mensual simulado para libertad."
            />
            <FireRow
              label="Mejora de vida"
              value={currencyFormatter.format(analysis.plan.lifestyleUpgrade)}
              detail="Disfrute controlado sin fijarlo como gasto automatico."
            />
            <FireRow
              label="Gusto personal"
              value={currencyFormatter.format(analysis.plan.personalTreat)}
              detail="Permiso acotado separado del plan."
            />
            <FireRow
              label="Separar al colchon"
              value={currencyFormatter.format(analysis.plan.emergencyFund)}
              detail="Recordatorio del 5% antes de decidir el resto."
            />
          </div>
        </section>
      </div>

      <section className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Impacto simulado
            </p>
            <div className="mt-3 grid gap-2">
              <FireRow
                label="Aporte mensual resultante"
                value={currencyFormatter.format(
                  analysis.simulatedMonthlyContribution,
                )}
                detail={`Sube ${currencyFormatter.format(
                  analysis.monthlyContributionDelta,
                )} si ejecutas la regla.`}
              />
              <FireRow
                label="Impacto FIRE potencial"
                value={currencyFormatter.format(analysis.fireImpact)}
                detail="Lectura simulada; no cambia el numero real."
              />
            </div>
          </div>

          <div className="rounded-md border border-stone-200 bg-white p-4">
            <p className="text-sm font-semibold text-stone-800">
              Accion principal
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {analysis.primaryAction}
            </p>
            <ul className="mt-3 grid gap-2">
              {analysis.signals.map((signal) => (
                <li
                  key={signal}
                  className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                  />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-stone-600">{label}</span>
      <div className={inputShellClass}>
        <input
          className={inputClass}
          inputMode="decimal"
          min="0"
          name={`income-rule-${label}`}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="ml-2 text-sm font-semibold text-stone-500">%</span>
      </div>
    </label>
  );
}
