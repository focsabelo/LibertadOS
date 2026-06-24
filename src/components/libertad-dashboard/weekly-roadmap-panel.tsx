import type {
  MilestoneProgress,
  WeeklyExecutionAnalysis,
  WeeklyExecutionItemId,
  WeeklyExecutionStatus,
  WealthRoadmapAnalysis,
} from "@/lib/finance";
import { currencyFormatter, numberFormatter, percentFormatter } from "./formatting";
import { inputClass, inputShellClass } from "./form-styles";
import { MetricCard, SignalRow } from "./shared-components";

export function WeeklyExecutionPanel({
  analysis,
  onOpenNotes,
  onToggleItem,
}: {
  analysis: WeeklyExecutionAnalysis;
  onOpenNotes: () => void;
  onToggleItem: (itemId: WeeklyExecutionItemId) => void;
}) {
  const status = weeklyExecutionStatusCopy(analysis.status);

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-stone-950">
            Sistema semanal de ejecucion
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Revision operativa de la semana en curso. El checklist no crea
            transacciones: solo ayuda a cerrar conducta, datos confirmados y
            proxima accion.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${status.classes}`}
        >
          {status.label}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">
            Semana {analysis.weekKey}
          </p>
          <p className="libertad-number mt-3 text-4xl font-semibold">
            {analysis.scorePercent}%
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {analysis.completedCount} de {analysis.totalCount} puntos cerrados.
          </p>
          <div
            aria-label={`Ejecucion semanal ${analysis.scorePercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={analysis.scorePercent}
            className="libertad-meter mt-5 h-4 bg-white/15"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${analysis.scorePercent}%` }}
            />
          </div>
          <div className="mt-5 grid gap-2">
            <SignalRow
              label="Ingreso semanal"
              value={currencyFormatter.format(analysis.weekIncome)}
            />
            <SignalRow
              label="Gasto semanal"
              value={currencyFormatter.format(analysis.weekExpenses)}
            />
            <SignalRow
              label="Tasa de ahorro"
              value={`${percentFormatter.format(analysis.savingRate)}%`}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="libertad-soft-panel rounded-md p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Accion principal
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {analysis.recommendation}
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                type="button"
                onClick={onOpenNotes}
              >
                Capturar nota
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Aportes"
              value={analysis.investmentCount.toString()}
              tone={analysis.investmentCount > 0 ? "green" : "neutral"}
            />
            <MetricCard
              label="Compras emocionales"
              value={analysis.emotionalPurchaseCount.toString()}
              tone={analysis.emotionalPurchaseCount > 0 ? "amber" : "neutral"}
            />
            <MetricCard
              label="Deuda nueva"
              value={analysis.newDebtCount.toString()}
              tone={analysis.newDebtCount > 0 ? "red" : "neutral"}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {analysis.items.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.completed}
            className={`min-h-16 rounded-md border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              item.completed
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50"
            }`}
            type="button"
            onClick={() => onToggleItem(item.id)}
          >
            <span className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                  item.completed
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-stone-300 bg-white text-transparent"
                }`}
              >
                OK
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 opacity-75">
                  {item.detail}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {analysis.overdueActions.length > 0 ? (
        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">
            Pendiente para cerrar
          </p>
          <ul className="mt-3 grid gap-2">
            {analysis.overdueActions.slice(0, 4).map((action) => (
              <li
                key={action}
                className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function weeklyExecutionStatusCopy(status: WeeklyExecutionStatus) {
  const copy = {
    pendiente: {
      label: "Pendiente",
      classes: "border-stone-200 bg-stone-50 text-stone-800",
    },
    incompleto: {
      label: "Incompleto",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    cumplido: {
      label: "Cumplido",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
  };

  return copy[status];
}

export function WealthRoadmapPanel({
  analysis,
  confirmedExpenseImpact,
  monthlyContribution,
  simulatedContribution,
  onSimulatedContributionChange,
}: {
  analysis: WealthRoadmapAnalysis;
  confirmedExpenseImpact: number;
  monthlyContribution: number;
  simulatedContribution: number;
  onSimulatedContributionChange: (value: string) => void;
}) {
  const nextMilestone = analysis.nextMilestone;
  const expenseDelayMonths =
    monthlyContribution > 0 ? confirmedExpenseImpact / monthlyContribution : 0;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Roadmap patrimonial
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Hitos patrimoniales calculados con datos confirmados. La simulacion
            queda separada de la realidad.
          </p>
        </div>
        <label className="grid gap-2 sm:min-w-[260px]">
          <span className="text-sm font-semibold text-stone-700">
            Simular aporte mensual
          </span>
          <div className={inputShellClass}>
            <span className="mr-2 text-sm font-semibold text-stone-500">
              USD
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              inputMode="decimal"
              min="0"
              name="roadmap-simulated-contribution"
              step="100"
              type="number"
              value={simulatedContribution}
              onChange={(event) =>
                onSimulatedContributionChange(event.target.value)
              }
            />
          </div>
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">
            Proximo hito
          </p>
          {nextMilestone ? (
            <>
              <h3 className="mt-3 text-3xl font-semibold text-balance">
                {nextMilestone.milestone.label}
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Te faltan{" "}
                {currencyFormatter.format(nextMilestone.distanceAmount)} para
                llegar a este hito.
              </p>
              <div
                aria-label={`${nextMilestone.milestone.label}: ${percentFormatter.format(
                  nextMilestone.progressPercent,
                )}% completado`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.min(
                  100,
                  Math.max(0, nextMilestone.progressPercent),
                )}
                className="libertad-meter mt-5 h-4 bg-white/15"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, nextMilestone.progressPercent),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-5 grid gap-2">
                <SignalRow
                  label="Aporte actual"
                  value={formatMonths(nextMilestone.estimatedMonths)}
                />
                <SignalRow
                  label="Aporte simulado"
                  value={formatMonths(nextMilestone.simulatedEstimatedMonths)}
                />
                <SignalRow
                  label="Progreso"
                  value={`${percentFormatter.format(
                    nextMilestone.progressPercent,
                  )}%`}
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Todos los hitos base aparecen alcanzados con los supuestos
              actuales.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <MetricCard
            label="Gastos confirmados"
            value={currencyFormatter.format(confirmedExpenseImpact)}
            tone={confirmedExpenseImpact > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            label="Impacto sobre hito"
            value={
              expenseDelayMonths > 0
                ? `${numberFormatter.format(expenseDelayMonths)} meses`
                : "Sin retraso detectado"
            }
            tone={expenseDelayMonths > 0 ? "amber" : "green"}
          />
          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Regla de lectura
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              El progreso real usa patrimonio e inversion confirmados. La
              simulacion solo cambia el aporte mensual supuesto.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {analysis.milestones.map((milestone) => (
          <MilestoneRow key={milestone.milestone.id} milestone={milestone} />
        ))}
      </div>
    </section>
  );
}

function MilestoneRow({ milestone }: { milestone: MilestoneProgress }) {
  const statusClasses = milestone.isReached
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : milestone.isNext
      ? "border-stone-900 bg-stone-950 text-white"
      : "border-stone-200 bg-white text-stone-800";

  return (
    <div className={`rounded-md border p-4 ${statusClasses}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_130px_150px_150px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{milestone.milestone.label}</p>
            {milestone.isNext ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                Prioritario
              </span>
            ) : null}
            {milestone.isReached ? (
              <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-950">
                Alcanzado
              </span>
            ) : null}
          </div>
          <p
            className={`mt-1 text-xs leading-5 ${
              milestone.isNext ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Base: {roadmapBasisLabel(milestone.milestone.basis)}
          </p>
          <div
            aria-label={`${milestone.milestone.label}: ${percentFormatter.format(
              milestone.progressPercent,
            )}% completado`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.min(100, Math.max(0, milestone.progressPercent))}
            className={`libertad-meter mt-3 h-3 ${
              milestone.isNext ? "bg-white/15" : ""
            }`}
            role="progressbar"
          >
            <div
              className={`h-full rounded-full ${
                milestone.isNext ? "bg-emerald-400" : "bg-emerald-700"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, milestone.progressPercent),
                )}%`,
              }}
            />
          </div>
        </div>

        <RoadmapValue label="Actual" value={currencyFormatter.format(milestone.currentAmount)} />
        <RoadmapValue label="Faltan" value={currencyFormatter.format(milestone.distanceAmount)} />
        <RoadmapValue label="Fecha estimada" value={formatMonths(milestone.estimatedMonths)} />
      </div>
    </div>
  );
}

function RoadmapValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="libertad-number mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function roadmapBasisLabel(basis: MilestoneProgress["milestone"]["basis"]) {
  return basis === "invested_capital"
    ? "capital de inversiones"
    : "patrimonio neto";
}

function formatMonths(months?: number) {
  if (months === undefined || !Number.isFinite(months)) {
    return "Sin fecha";
  }

  if (months <= 0) {
    return "Alcanzado";
  }

  if (months < 1) {
    return "Menos de 1 mes";
  }

  return `${numberFormatter.format(months)} meses`;
}
