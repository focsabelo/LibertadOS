import {
  analyzeBotOpera24hs,
  analyzeInvestmentPolicy,
  analyzeTargetPortfolio,
  type BotOpera24hsInvestment,
  type PortfolioAssetClass,
  type TargetPortfolioSettings,
} from "@/lib/finance";
import { currencyFormatter, percentFormatter } from "./formatting";
import { inputClass, inputShellClass } from "./form-styles";
import { FireRow, MetricCard } from "./shared-components";

export function SectionPlaceholder({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="libertad-surface rounded-lg p-6 sm:p-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-stone-950 text-balance">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{body}</p>
        <button
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      </div>
    </section>
  );
}

export function TargetPortfolioPanel({
  analysis,
  botAnalysis,
  botInvestment,
  manualAmounts,
  onBotFieldChange,
  onBotMonthlyResultChange,
  onBotMonthAdd,
  onBotMonthRemove,
  onManualAmountChange,
  onTargetChange,
}: {
  analysis: ReturnType<typeof analyzeTargetPortfolio>;
  botAnalysis: ReturnType<typeof analyzeBotOpera24hs>;
  botInvestment: BotOpera24hsInvestment;
  manualAmounts: TargetPortfolioSettings["manualAmounts"];
  onBotFieldChange: (
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">,
    value: string,
  ) => void;
  onBotMonthlyResultChange: (
    index: number,
    key: "month" | "amount",
    value: string,
  ) => void;
  onBotMonthAdd: () => void;
  onBotMonthRemove: (month: string) => void;
  onManualAmountChange: (assetClass: PortfolioAssetClass, value: string) => void;
  onTargetChange: (assetClass: PortfolioAssetClass, value: string) => void;
}) {
  const policyAnalysis = analyzeInvestmentPolicy({ portfolio: analysis });

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Cartera de inversiones
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Objetivo vs actual. Lectura descriptiva de asignacion patrimonial;
            no es recomendacion financiera.
          </p>
        </div>
        <div
          aria-live="polite"
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${
            analysis.targetWarning
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-emerald-200 bg-emerald-50 text-emerald-950"
          }`}
        >
          {analysis.targetWarning
            ? `${percentFormatter.format(analysis.targetTotalPercent)}% objetivo`
            : "100% objetivo"}
        </div>
      </div>

      {analysis.targetWarning ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
        >
          Los objetivos no suman 100%. Podes seguir editando sin perder la
          lectura actual.
        </div>
      ) : null}

      <div className="libertad-card-grid mt-5 grid gap-3">
        <MetricCard
          label="Total actual"
          value={currencyFormatter.format(analysis.totalCurrentAmount)}
          tone="green"
        />
        <MetricCard
          label="Clases alineadas"
          value={`${analysis.alignedCount}/${analysis.assets.length}`}
          tone="blue"
        />
      </div>

      <BotOpera24hsPanel
        analysis={botAnalysis}
        investment={botInvestment}
        onFieldChange={onBotFieldChange}
        onMonthAdd={onBotMonthAdd}
        onMonthRemove={onBotMonthRemove}
        onMonthlyResultChange={onBotMonthlyResultChange}
      />

      <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-950">
              Politica conectada
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
              La edicion completa vive en Politica. Esta cartera usa tolerancia,
              BTC, oro e inmuebles para detectar desalineaciones.
            </p>
          </div>
          <span
            className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold ${
              policyAnalysis.violatedRuleCount > 0
                ? "border-red-200 bg-red-50 text-red-950"
                : policyAnalysis.warningRuleCount > 0
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
          >
            {policyAnalysis.violatedRuleCount > 0
              ? "Revisar politica"
              : policyAnalysis.warningRuleCount > 0
                ? "Con advertencias"
                : "Alineada"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {analysis.assets.map((asset) => (
          <PortfolioAssetRow
            key={asset.assetClass}
            asset={asset}
            manualAmount={manualAmounts[asset.assetClass]}
            onManualAmountChange={onManualAmountChange}
            onTargetChange={onTargetChange}
          />
        ))}
      </div>
    </section>
  );
}

function BotOpera24hsPanel({
  analysis,
  investment,
  onFieldChange,
  onMonthAdd,
  onMonthRemove,
  onMonthlyResultChange,
}: {
  analysis: ReturnType<typeof analyzeBotOpera24hs>;
  investment: BotOpera24hsInvestment;
  onFieldChange: (
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">,
    value: string,
  ) => void;
  onMonthAdd: () => void;
  onMonthRemove: (month: string) => void;
  onMonthlyResultChange: (
    index: number,
    key: "month" | "amount",
    value: string,
  ) => void;
}) {
  const setupFields: {
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">;
    label: string;
    type: "text" | "date" | "number";
    prefix?: string;
    suffix?: string;
    step?: string;
  }[] = [
    { key: "botNumber", label: "Tipo / numero de bot", type: "text" },
    { key: "startDate", label: "Inicio de funcionamiento", type: "date" },
    {
      key: "initialCapital",
      label: "Capital inicial",
      type: "number",
      prefix: "USD",
      step: "100",
    },
    {
      key: "monthlyContribution",
      label: "Aporte mensual",
      type: "number",
      prefix: "USD",
      step: "50",
    },
    {
      key: "reinvestmentMinimum",
      label: "Minimo para reinvertir",
      type: "number",
      prefix: "USD",
      step: "50",
    },
  ];

  return (
    <section className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-950">
            Bot especulacion (trading algoritmico)
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Registro operativo para medir aportes, capital y ganancias. Su
            total asignado cuenta dentro de la cartera de inversiones.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700">
          Aportes pendientes hasta reinvertir
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setupFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
              {field.label}
            </span>
            <div className={inputShellClass}>
              {field.prefix ? (
                <span className="mr-2 text-sm font-semibold text-stone-500">
                  {field.prefix}
                </span>
              ) : null}
              <input
                autoComplete="off"
                className={
                  field.type === "number" ? inputClass : `${inputClass} text-sm`
                }
                inputMode={field.type === "number" ? "decimal" : undefined}
                min={field.type === "number" ? "0" : undefined}
                name={`bot-opera-${field.key}`}
                step={field.step}
                type={field.type}
                value={investment[field.key] as string | number}
                onChange={(event) =>
                  onFieldChange(field.key, event.target.value)
                }
              />
              {field.suffix ? (
                <span className="ml-2 text-sm font-semibold text-stone-500">
                  {field.suffix}
                </span>
              ) : null}
            </div>
          </label>
        ))}
      </div>

      <label className="mt-4 grid gap-2">
        <span className="text-xs font-semibold text-stone-600">
          Regla de reinversion
        </span>
        <textarea
          autoComplete="off"
          className="libertad-field min-h-20 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900"
          name="bot-opera-reinvestment-rule"
          value={investment.reinvestmentRule}
          onChange={(event) =>
            onFieldChange("reinvestmentRule", event.target.value)
          }
        />
      </label>

      <div className="libertad-card-grid mt-4 grid gap-3">
        <MetricCard
          label="Capital total aportado"
          value={currencyFormatter.format(analysis.capitalTotalContributed)}
          tone="blue"
        />
        <MetricCard
          label="Capital operativo actual"
          value={currencyFormatter.format(analysis.currentOperationalCapital)}
          tone="green"
        />
        <MetricCard
          label="Capital pendiente"
          value={currencyFormatter.format(analysis.pendingCapital)}
          tone="amber"
        />
        <MetricCard
          label="Falta para reinvertir"
          value={currencyFormatter.format(analysis.amountUntilNextReinvestment)}
        />
        <MetricCard
          label="Resultado del mes"
          value={currencyFormatter.format(analysis.currentMonthResult)}
          tone={analysis.currentMonthResult >= 0 ? "green" : "red"}
        />
        <MetricCard
          label="Rentabilidad mensual"
          value={`${percentFormatter.format(analysis.monthlyReturnPercent)}%`}
        />
        <MetricCard
          label="Rentabilidad acumulada"
          value={`${percentFormatter.format(
            analysis.accumulatedReturnPercent,
          )}%`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Historial mensual
              </p>
              <p className="text-xs leading-5 text-stone-500">
                Cada fila suma el aporte al pendiente antes de evaluar la
                reinversion.
              </p>
            </div>
            <button
              className="min-h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={onMonthAdd}
            >
              Agregar mes
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-600">
                <tr>
                  <th className="px-3 py-2">Mes</th>
                  <th className="px-3 py-2">Dejo</th>
                  <th className="px-3 py-2">Operativo</th>
                  <th className="px-3 py-2">Pendiente aporte</th>
                  <th className="px-3 py-2">Pendiente ganancia</th>
                  <th className="px-3 py-2">Reinvertido</th>
                  <th className="px-3 py-2">Rent.</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {analysis.history.map((month, index) => (
                  <tr key={`${month.month}-${index}`}>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Mes ${index + 1}`}
                        className="libertad-field h-10 w-32 rounded-md px-2 text-sm font-semibold text-stone-950"
                        type="month"
                        value={investment.monthlyResults[index]?.month ?? month.month}
                        onChange={(event) =>
                          onMonthlyResultChange(index, "month", event.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Resultado ${month.month}`}
                        className="libertad-field h-10 w-28 rounded-md px-2 text-sm font-semibold text-stone-950 libertad-number"
                        inputMode="decimal"
                        step="10"
                        type="number"
                        value={investment.monthlyResults[index]?.amount ?? 0}
                        onChange={(event) =>
                          onMonthlyResultChange(
                            index,
                            "amount",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="libertad-number px-3 py-2 font-semibold text-stone-900">
                      {currencyFormatter.format(month.operationalCapitalEnd)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.pendingContributionCapital)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.pendingProfitCapital)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.reinvestedAmount)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {percentFormatter.format(month.monthlyReturnPercent)}%
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="min-h-10 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Quitar el mes ${month.month} del historial?`,
                            )
                          ) {
                            onMonthRemove(month.month);
                          }
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-900">
            Separacion de capital
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            El aporte mensual no genera resultado hasta pasar al capital
            operativo. Las ganancias pendientes tambien se muestran aparte para
            no inflar el total aportado.
          </p>
          <div className="mt-3 grid gap-2">
            <FireRow
              label="Aportes pendientes"
              value={currencyFormatter.format(
                analysis.pendingContributionCapital,
              )}
              detail="Dinero aportado, todavia fuera del bot operativo."
            />
            <FireRow
              label="Ganancias pendientes"
              value={currencyFormatter.format(analysis.pendingProfitCapital)}
              detail="Resultado acumulado aun no reinvertido."
            />
            <FireRow
              label="Ganancia acumulada"
              value={currencyFormatter.format(analysis.accumulatedResult)}
              detail="No se suma al capital total aportado."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioAssetRow({
  asset,
  manualAmount,
  onManualAmountChange,
  onTargetChange,
}: {
  asset: ReturnType<typeof analyzeTargetPortfolio>["assets"][number];
  manualAmount: number;
  onManualAmountChange: (assetClass: PortfolioAssetClass, value: string) => void;
  onTargetChange: (assetClass: PortfolioAssetClass, value: string) => void;
}) {
  const status = portfolioStatusCopy(asset.status);

  return (
    <div className="libertad-soft-panel rounded-md p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_150px] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">
              {asset.label}
            </p>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${status.classes}`}
            >
              {status.label}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-600">
              {portfolioSourceCopy(asset.currentSource)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-600">
            Actual {percentFormatter.format(asset.currentPercent)}% vs objetivo{" "}
            {percentFormatter.format(asset.targetPercent)}%.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Objetivo %
          </span>
          <input
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950 libertad-number"
            inputMode="decimal"
            min="0"
            name={`target-${asset.assetClass}`}
            step="0.5"
            type="number"
            value={asset.targetPercent}
            onChange={(event) =>
              onTargetChange(asset.assetClass, event.target.value)
            }
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Valor actual
          </span>
          <input
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950 libertad-number"
            inputMode="decimal"
            min="0"
            name={`manual-${asset.assetClass}`}
            step="100"
            type="number"
            value={manualAmount}
            onChange={(event) =>
              onManualAmountChange(asset.assetClass, event.target.value)
            }
          />
        </label>
      </div>
    </div>
  );
}

function portfolioStatusCopy(status: "sobrepeso" | "bajo_peso" | "alineado") {
  const copy = {
    sobrepeso: {
      label: "Sobrepeso",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    bajo_peso: {
      label: "Bajo peso",
      classes: "border-sky-200 bg-sky-50 text-sky-950",
    },
    alineado: {
      label: "Alineado",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
  };

  return copy[status];
}

function portfolioSourceCopy(
  source: ReturnType<typeof analyzeTargetPortfolio>["assets"][number]["currentSource"],
) {
  if (source === "snapshot_movimientos") {
    return "Manual + movimientos";
  }

  if (source === "movimientos") {
    return "Movimientos confirmados";
  }

  return "Cargado manualmente";
}
