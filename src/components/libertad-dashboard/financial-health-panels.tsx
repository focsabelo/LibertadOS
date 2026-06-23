import {
  analyzeConfirmedDebtLoad,
  analyzeFinancialMargin,
  analyzeLifestyleInflation,
} from "@/lib/finance";
import { currencyFormatter, percentFormatter } from "./formatting";
import { FireRow, MetricCard } from "./shared-components";

export function FinancialMarginPanel({
  analysis,
  compact = false,
  onOpenSettings,
}: {
  analysis: ReturnType<typeof analyzeFinancialMargin>;
  compact?: boolean;
  onOpenSettings: () => void;
}) {
  const state = financialMarginStateCopy(analysis.state);

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Margen financiero
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Mide libertad mensual operativa: ingreso confirmado o base cargada
            en Config, gastos activos, deuda mensual y margen disponible.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${state.classes}`}
        >
          Estado {state.label}
        </div>
      </div>

      <div className="libertad-card-grid mt-5 grid gap-3">
        <MetricCard
          label="Margen disponible"
          value={currencyFormatter.format(analysis.availableMonthlyMargin)}
          detail={financialMarginIncomeSourceDetail(analysis.marginIncomeSource)}
          tone={analysis.availableMonthlyMarginTone}
        />
        {analysis.estimatedMonthlyIncome > 0 &&
        analysis.marginIncomeSource === "confirmed" ? (
          <MetricCard
            label="Margen estimado"
            value={currencyFormatter.format(
              analysis.estimatedAvailableMonthlyMargin,
            )}
            tone={
              analysis.estimatedAvailableMonthlyMargin < 0 ? "red" : "green"
            }
          />
        ) : null}
        <MetricCard
          label="Presion de deuda"
          value={`${percentFormatter.format(analysis.debtPressurePercent)}%`}
          tone={analysis.debtPressurePercent >= 20 ? "red" : "neutral"}
        />
        <MetricCard
          label="Tasa de ahorro"
          value={`${percentFormatter.format(analysis.savingRate)}%`}
          tone={analysis.savingRate >= 10 ? "green" : "amber"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <div className="libertad-soft-panel rounded-md p-4">
          <div className="flex items-center justify-between gap-4 text-sm font-medium">
            <span className="text-stone-700">Margen operativo</span>
            <span className="libertad-number text-base font-semibold text-stone-950">
              {currencyFormatter.format(analysis.availableMonthlyMargin)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Lectura del dinero que queda despues de gastos fijos, variables y
            deuda confirmada del mes.
          </p>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-800">
            Lectura practica
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {state.body}
          </p>
          <p className="mt-3 text-sm font-semibold text-stone-950">
            {analysis.recommendation}
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Composicion mensual
            </p>
            <div className="mt-3 grid gap-2">
              <FireRow
                label="Ingreso confirmado en Notas"
                value={currencyFormatter.format(analysis.monthlyIncome)}
                detail={`Mes ${analysis.monthKey}; solo movimientos reales.`}
              />
              {analysis.estimatedMonthlyIncome > 0 ? (
                <FireRow
                  label="Ingreso base mensual"
                  value={currencyFormatter.format(analysis.estimatedMonthlyIncome)}
                  detail={
                    analysis.monthlyIncome > 0
                      ? "Referencia cargada en Config; no se suma al ingreso confirmado."
                      : "Base cargada en Config para calcular el margen disponible."
                  }
                />
              ) : null}
              <FireRow
                label="Gastos fijos"
                value={currencyFormatter.format(analysis.fixedMonthlyExpenses)}
                detail="Supuestos activos mas gastos recurrentes confirmados."
              />
              <FireRow
                label="Gastos variables"
                value={currencyFormatter.format(analysis.variableMonthlyExpenses)}
                detail="Gastos no recurrentes confirmados este mes."
              />
              <FireRow
                label="Deuda mensual"
                value={currencyFormatter.format(analysis.debtMonthlyPayments)}
                detail="Cuotas confirmadas, aunque hayan nacido en meses anteriores."
              />
              {analysis.estimatedMonthlyIncome > 0 ? (
                <FireRow
                  label="Margen estimado"
                  value={currencyFormatter.format(
                    analysis.estimatedAvailableMonthlyMargin,
                  )}
                  detail={
                    analysis.marginIncomeSource === "estimated"
                      ? "Base usada para el margen disponible hasta confirmar el sueldo en Notas."
                      : "Referencia separada con ingreso base mensual."
                  }
                />
              ) : null}
            </div>
          </div>

          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Libertad de decision
            </p>
            <div className="mt-3 grid gap-2">
              <FireRow
                label="Esenciales"
                value={currencyFormatter.format(analysis.essentialExpenses)}
                detail="Vivienda, transporte, comida, servicios, salud y deuda."
              />
              <FireRow
                label="No esenciales"
                value={currencyFormatter.format(analysis.nonEssentialExpenses)}
                detail="Lo que puede revisarse antes de tocar el plan."
              />
              <FireRow
                label="Dependencia del sueldo"
                value={financialMarginDependencyLabel(
                  analysis.paycheckDependency,
                )}
                detail="Cuanto pesa el siguiente ingreso para sostener el mes."
              />
            </div>
          </div>

          <div className="rounded-md border border-stone-200 bg-white p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Senales
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
              <button
                className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                type="button"
                onClick={onOpenSettings}
              >
                Revisar gastos fijos
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function financialMarginStateCopy(state: ReturnType<typeof analyzeFinancialMargin>["state"]) {
  const copy = {
    fragil: {
      label: "fragil",
      classes: "border-red-200 bg-red-50 text-red-950",
      metricTone: "red",
      body: "Tu margen actual es fragil: dependes demasiado del siguiente sueldo o el mes queda negativo.",
    },
    ajustado: {
      label: "ajustado",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
      metricTone: "amber",
      body: "Tu margen es positivo, pero todavia hay poca holgura para errores, deuda o cambios de ingreso.",
    },
    estable: {
      label: "estable",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
      metricTone: "green",
      body: "Tu margen sostiene el mes y ya existe capacidad de decir no sin romper el plan.",
    },
    fuerte: {
      label: "fuerte",
      classes: "border-emerald-300 bg-emerald-100 text-emerald-950",
      metricTone: "green",
      body: "Tu margen da buena libertad mensual; el riesgo principal es agregar gastos fijos nuevos.",
    },
  } as const;

  return copy[state];
}

function financialMarginIncomeSourceDetail(
  source: ReturnType<typeof analyzeFinancialMargin>["marginIncomeSource"],
) {
  const details = {
    confirmed: "Calculado con ingreso confirmado en Notas este mes.",
    estimated: "Calculado con ingreso base mensual de Config.",
    none: "Sin ingreso confirmado ni ingreso base mensual.",
  };

  return details[source];
}

function financialMarginDependencyLabel(
  dependency: ReturnType<typeof analyzeFinancialMargin>["paycheckDependency"],
) {
  const labels = {
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  return labels[dependency];
}

export function DebtLoadPanel({
  analysis,
}: {
  analysis: ReturnType<typeof analyzeConfirmedDebtLoad>;
}) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Carga de deuda confirmada
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Solo usa deudas confirmadas. Las intenciones y analisis potenciales
            quedan fuera del dashboard.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${
            analysis.highRiskCount > 0
              ? "border-red-200 bg-red-50 text-red-950"
              : analysis.count > 0
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-stone-200 bg-stone-50 text-stone-700"
          }`}
        >
          {analysis.count > 0
            ? `${analysis.count} deuda(s)`
            : "Sin deuda confirmada"}
        </div>
      </div>

      {analysis.count === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          Cuando confirmes una deuda real, aca vas a ver cuota mensual, costo
          anual e impacto sobre tu numero de libertad.
        </div>
      ) : (
        <>
          <div className="libertad-card-grid mt-5 grid gap-3">
            <MetricCard
              label="Presion mensual"
              value={currencyFormatter.format(analysis.monthlyMarginImpact)}
              tone={analysis.monthlyMarginImpact > 0 ? "amber" : "neutral"}
            />
            <MetricCard
              label="Costo anual"
              value={currencyFormatter.format(analysis.annualCost)}
            />
            <MetricCard
              label="Deuda total"
              value={currencyFormatter.format(analysis.principalBalance)}
              tone="red"
            />
            <MetricCard
              label="Impacto en numero de libertad"
              value={currencyFormatter.format(analysis.fireImpact)}
              tone="green"
            />
            <MetricCard
              label="Margen disponible"
              value={currencyFormatter.format(analysis.monthlyDecisionMargin)}
              tone={
                analysis.debtPressureRisk === "alto"
                  ? "red"
                  : analysis.debtPressureRisk === "medio"
                    ? "amber"
                    : "green"
              }
            />
            <MetricCard
              label="Presion sobre margen"
              value={
                analysis.debtPressureRisk === "sin_datos"
                  ? "Sin aporte base"
                  : `${percentFormatter.format(analysis.debtPressurePercent)}%`
              }
              tone={
                analysis.debtPressureRisk === "alto"
                  ? "red"
                  : analysis.debtPressureRisk === "medio"
                    ? "amber"
                    : "neutral"
              }
            />
          </div>

          {analysis.freedomWarning ? (
            <div
              aria-live="polite"
              className={`mt-5 rounded-md border px-4 py-3 text-sm leading-6 ${
                analysis.debtPressureRisk === "alto"
                  ? "border-red-200 bg-red-50 text-red-950"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {analysis.freedomWarning}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Dependencia del sueldo
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Las cuotas confirmadas consumen{" "}
                {percentFormatter.format(analysis.salaryDependencyIncrease)}%
                del aporte mensual cargado en tus datos base. Quedan{" "}
                {currencyFormatter.format(analysis.monthlyDecisionMargin)} para
                decidir sin tocar el plan.
              </p>
              <div className="mt-3 grid gap-2">
                <FireRow
                  label="Pago minimo"
                  value={analysis.minimumPaymentCount.toString()}
                  detail="Senal de tarjeta con presion alta."
                />
                <FireRow
                  label="Riesgo alto"
                  value={analysis.highRiskCount.toString()}
                  detail="Lectura descriptiva, no recomendacion automatica."
                />
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">
                Senales de deuda
              </p>
              {analysis.signals.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {analysis.signals.slice(0, 4).map((signal) => (
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
              ) : (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No hay senales fuertes ademas del costo mensual confirmado.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function LifestyleInflationPanel({
  analysis,
}: {
  analysis: ReturnType<typeof analyzeLifestyleInflation>;
}) {
  const riskCopy = {
    bajo: {
      label: "Bajo",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    medio: {
      label: "Medio",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    alto: {
      label: "Alto",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
    "sin-datos": {
      label: "Sin datos",
      classes: "border-stone-200 bg-stone-50 text-stone-700",
    },
  } as const;
  const currentSavingRate = `${percentFormatter.format(
    analysis.current.savingRate,
  )}%`;
  const previousSavingRate = `${percentFormatter.format(
    analysis.previous.savingRate,
  )}%`;
  const absorbedPercent = `${percentFormatter.format(
    analysis.absorbedByExpensesPercent,
  )}%`;
  const risk = riskCopy[analysis.risk];
  const hasPositiveIncomeIncrease = analysis.incomeIncrease > 0;
  const absorbedExpense = Math.max(0, analysis.expenseIncrease);
  const increaseRule = analysis.increaseRule;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Inflación del Estilo de Vida
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Compara solo transacciones confirmadas para ver si un aumento de
            ingreso se está convirtiendo en libertad o en consumo.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${risk.classes}`}
        >
          Riesgo {risk.label}
        </div>
      </div>

      {!analysis.hasComparison ? (
        <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          No hay suficiente historial para detectar inflación del estilo de vida
          todavía.
        </div>
      ) : (
        <>
          <div className="libertad-card-grid mt-5 grid gap-3">
            <MetricCard
              label="Ingreso confirmado"
              value={currencyFormatter.format(analysis.current.income)}
              tone="green"
            />
            <MetricCard
              label="Gasto confirmado"
              value={currencyFormatter.format(analysis.current.expenses)}
              tone="amber"
            />
            <MetricCard
              label="Ahorro estimado"
              value={currencyFormatter.format(analysis.current.estimatedSavings)}
              tone={analysis.current.estimatedSavings >= 0 ? "blue" : "red"}
            />
            <MetricCard label="Tasa de ahorro" value={currentSavingRate} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Comparación contra mes anterior
              </p>
              <div className="mt-3 grid gap-2">
                <FireRow
                  label="Aumento de ingresos"
                  value={currencyFormatter.format(analysis.incomeIncrease)}
                  detail={`Antes: ${currencyFormatter.format(
                    analysis.previous.income,
                  )}`}
                />
                <FireRow
                  label="Aumento de gastos"
                  value={currencyFormatter.format(analysis.expenseIncrease)}
                  detail={`Antes: ${currencyFormatter.format(
                    analysis.previous.expenses,
                  )}`}
                />
                <FireRow
                  label="Aumento absorbido por gasto"
                  value={absorbedPercent}
                  detail={`Tasa previa: ${previousSavingRate}`}
                />
              </div>
            </div>

            <div
              className={`rounded-md border p-4 ${
                analysis.alert
                  ? "border-red-200 bg-red-50/70 text-red-950"
                  : "border-stone-200 bg-stone-50 text-stone-800"
              }`}
            >
              <p className="text-sm font-semibold">Lectura práctica</p>
              <p className="mt-2 text-sm leading-6">
                {hasPositiveIncomeIncrease
                  ? `${currencyFormatter.format(
                      absorbedExpense,
                    )} de tu aumento fueron absorbidos por nuevos gastos. Capturaste ${currencyFormatter.format(
                      analysis.capturedForFreedom,
                    )} para libertad.`
                  : "No hay aumento de ingreso confirmado este mes. El detector queda atento a cambios reales."}
              </p>
              <p className="mt-3 text-sm font-semibold">
                {analysis.recommendation}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">
                Señales detectadas
              </p>
              {analysis.signals.length > 0 ? (
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
              ) : (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No aparecen señales fuertes de inflación del estilo de vida en
                  la comparación actual.
                </p>
              )}
            </div>

            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Conexiones con libertad financiera
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Muestra como aumentos y gastos criticos acercan o alejan la
                meta de libertad financiera.
              </p>
              <div className="mt-3 grid gap-2">
                {increaseRule ? (
                  <>
                    <FireRow
                      label="70% ahorro/inversion"
                      value={currencyFormatter.format(
                        increaseRule.suggestedInvestment,
                      )}
                      detail="Parte del aumento protegida para libertad."
                    />
                    <FireRow
                      label="20% mejora de vida"
                      value={currencyFormatter.format(
                        increaseRule.lifestyleUpgrade,
                      )}
                      detail="Disfrute controlado sin absorber todo el aumento."
                    />
                    <FireRow
                      label="10% gusto personal"
                      value={currencyFormatter.format(
                        increaseRule.personalTreat,
                      )}
                      detail="Permiso acotado, separado del plan."
                    />
                  </>
                ) : (
                  <FireRow
                    label="70/20/10"
                    value="Sin aumento"
                    detail="Aparece cuando hay aumento confirmado."
                  />
                )}
                <FireRow
                  label="Vivienda, transporte, comida"
                  value={currencyFormatter.format(
                    analysis.current.coreExpenses.vivienda +
                      analysis.current.coreExpenses.transporte +
                      analysis.current.coreExpenses.comida,
                  )}
                  detail="Gastos críticos confirmados este mes."
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
