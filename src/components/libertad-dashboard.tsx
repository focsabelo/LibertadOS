"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FinancialNotesModule,
  confirmedTransactionsSummary,
} from "@/components/financial-notes-module";
import type { ConfirmedFinancialTransaction } from "@/lib/financial-notes";
import {
  annualSpend,
  completionPercent,
  coreExpenseShare,
  estimateYearsToTarget,
  fireReductionScenarios,
  freedomNumber,
  type FreedomInputs,
} from "@/lib/finance";

const STORAGE_KEY = "libertad-os-dashboard-v1";

const DEFAULT_INPUTS: FreedomInputs = {
  netWorth: 85000,
  investedCapital: 62000,
  desiredMonthlySpend: 3000,
  monthlyContribution: 1800,
  expectedAnnualReturn: 7,
};

const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

type Field = {
  id: keyof FreedomInputs;
  label: string;
  prefix?: string;
  suffix?: string;
  step?: string;
};

const fields: Field[] = [
  { id: "netWorth", label: "Patrimonio actual", prefix: "USD", step: "500" },
  {
    id: "investedCapital",
    label: "Capital invertido",
    prefix: "USD",
    step: "500",
  },
  {
    id: "desiredMonthlySpend",
    label: "Gasto mensual deseado",
    prefix: "USD",
    step: "100",
  },
  {
    id: "monthlyContribution",
    label: "Aporte mensual",
    prefix: "USD",
    step: "100",
  },
  {
    id: "expectedAnnualReturn",
    label: "Retorno anual esperado",
    suffix: "%",
    step: "0.1",
  },
];

const modules = [
  { label: "Dashboard", href: "#dashboard", active: true },
  { label: "Notas", href: "#notas", active: false },
  { label: "Simulador", href: "#notas", active: false },
  { label: "Gastos", href: "#notas", active: false },
  { label: "Cartera", href: "#notas", active: false },
  { label: "Anti-errores", href: "#notas", active: false },
];

type TransactionSummary = ReturnType<typeof confirmedTransactionsSummary>;

export function LibertadDashboard() {
  const [inputs, setInputs] = useState<FreedomInputs>(DEFAULT_INPUTS);
  const [confirmedTransactions, setConfirmedTransactions] = useState<
    ConfirmedFinancialTransaction[]
  >([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleTransactionsChange = useCallback(
    (transactions: ConfirmedFinancialTransaction[]) => {
      setConfirmedTransactions(transactions);
    },
    [],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setInputs({ ...DEFAULT_INPUTS, ...JSON.parse(stored) });
      }
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }
  }, [hasLoaded, inputs]);

  const transactionSummary = useMemo(
    () => confirmedTransactionsSummary(confirmedTransactions),
    [confirmedTransactions],
  );

  const effectiveInputs = useMemo(
    () => ({
      ...inputs,
      netWorth: inputs.netWorth + transactionSummary.netWorthDelta,
      investedCapital: inputs.investedCapital + transactionSummary.investedDelta,
      desiredMonthlySpend:
        inputs.desiredMonthlySpend + transactionSummary.recurringMonthlyExpenses,
    }),
    [inputs, transactionSummary],
  );

  const metrics = useMemo(() => {
    const target = freedomNumber(effectiveInputs.desiredMonthlySpend);
    const annual = annualSpend(effectiveInputs.desiredMonthlySpend);
    const completed = completionPercent(effectiveInputs.netWorth, target);
    const years = estimateYearsToTarget({
      currentAmount: effectiveInputs.netWorth,
      targetAmount: target,
      monthlyContribution: effectiveInputs.monthlyContribution,
      annualReturnPercent: effectiveInputs.expectedAnnualReturn,
    });
    const investRatio =
      effectiveInputs.netWorth > 0
        ? (effectiveInputs.investedCapital / effectiveInputs.netWorth) * 100
        : 0;

    return {
      annual,
      target,
      completed,
      years,
      investRatio,
      remaining: Math.max(0, target - effectiveInputs.netWorth),
    };
  }, [effectiveInputs]);

  const yearsLabel = Number.isFinite(metrics.years)
    ? `${numberFormatter.format(metrics.years)} anos`
    : "Sin fecha estimada";

  function updateInput(key: keyof FreedomInputs, value: string) {
    const parsedValue = Number(value);

    setInputs((current) => ({
      ...current,
      [key]: Number.isFinite(parsedValue) ? parsedValue : 0,
    }));
  }

  return (
    <main
      id="dashboard"
      className="min-h-screen bg-[#f6f5f1] text-stone-950"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Libertad OS
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
                Sistema personal de libertad financiera
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                Un panel sobrio para medir tu numero x25, capturar decisiones y
                convertir notas financieras en datos confirmados.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Modulos">
              {modules.map((module) => (
                <a
                  key={module.label}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                    module.active
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                  href={module.href}
                >
                  {module.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-stone-600">
                  Numero de libertad financiera
                </p>
                <p className="mt-2 text-4xl font-semibold text-stone-950 sm:text-5xl">
                  {currencyFormatter.format(metrics.target)}
                </p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                <p className="text-sm font-medium text-amber-950">
                  Falta para la meta
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-950">
                  {currencyFormatter.format(metrics.remaining)}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between gap-4 text-sm font-medium">
                <span className="text-stone-600">Progreso total</span>
                <span className="text-stone-950">
                  {percentFormatter.format(metrics.completed)}%
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-emerald-700"
                  style={{ width: `${metrics.completed}%` }}
                />
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Gasto anual"
                value={currencyFormatter.format(metrics.annual)}
              />
              <MetricCard
                label="Tiempo estimado"
                value={yearsLabel}
                tone="blue"
              />
              <MetricCard
                label="Patrimonio invertido"
                value={`${percentFormatter.format(metrics.investRatio)}%`}
                tone="green"
              />
            </div>
          </div>

          <aside className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white shadow-sm sm:p-6">
            <p className="text-sm font-medium text-stone-300">Lectura del mes</p>
            <p className="mt-4 text-3xl font-semibold">
              {metrics.completed >= 100
                ? "Meta alcanzada"
                : metrics.completed >= 50
                  ? "La bola de nieve ya pesa"
                  : "La maquina esta tomando forma"}
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              Con un aporte de {currencyFormatter.format(inputs.monthlyContribution)}
              {" "}y un retorno anual esperado de{" "}
              {percentFormatter.format(inputs.expectedAnnualReturn)}%, el tablero
              estima {yearsLabel.toLowerCase()} para llegar al numero x25.
            </p>
            <div className="mt-5 grid gap-2">
              <SignalRow
                label="Movimientos confirmados"
                value={confirmedTransactions.length.toString()}
              />
              <SignalRow
                label="Impacto de notas"
                value={currencyFormatter.format(transactionSummary.netWorthDelta)}
              />
              <SignalRow
                label="Gasto recurrente detectado"
                value={currencyFormatter.format(
                  transactionSummary.recurringMonthlyExpenses,
                )}
              />
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  Datos base
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Estos valores son tu escenario base. Las notas confirmadas se
                  suman encima sin pisar tus supuestos.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {fields.map((field) => (
                <label key={field.id} className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">
                    {field.label}
                  </span>
                  <div className="flex h-12 items-center rounded-md border border-stone-300 bg-stone-50 px-3 transition focus-within:border-emerald-700 focus-within:bg-white">
                    {field.prefix ? (
                      <span className="mr-2 text-sm font-semibold text-stone-500">
                        {field.prefix}
                      </span>
                    ) : null}
                    <input
                      className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-stone-950 outline-none"
                      min="0"
                      step={field.step}
                      type="number"
                      value={inputs[field.id]}
                      onChange={(event) =>
                        updateInput(field.id, event.target.value)
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
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  Pulso financiero
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Lectura combinada de tus datos base y lo que ya confirmaste.
                </p>
              </div>
              <a
                className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                href="#notas"
              >
                Capturar nota
              </a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Patrimonio actual"
                value={currencyFormatter.format(effectiveInputs.netWorth)}
                tone="green"
              />
              <MetricCard
                label="Capital invertido"
                value={currencyFormatter.format(effectiveInputs.investedCapital)}
                tone="blue"
              />
              <MetricCard
                label="Gasto mensual deseado"
                value={currencyFormatter.format(effectiveInputs.desiredMonthlySpend)}
              />
              <MetricCard
                label="Aporte mensual"
                value={currencyFormatter.format(inputs.monthlyContribution)}
                tone="amber"
              />
            </div>

            <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-800">
                Regla x25 activa
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Cada {currencyFormatter.format(100)} menos de gasto mensual baja
                tu numero de libertad en {currencyFormatter.format(30000)}.
              </p>
            </div>
          </div>
        </section>

        <FireLeversPanel summary={transactionSummary} />

        <FinancialNotesModule onTransactionsChange={handleTransactionsChange} />
      </div>
    </main>
  );
}

function FireLeversPanel({ summary }: { summary: TransactionSummary }) {
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
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
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

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
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

        <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
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

function FireRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs text-stone-500">{detail}</p>
      </div>
      <p className="text-sm font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "blue" | "amber";
}) {
  const toneClasses = {
    neutral: "border-stone-200 bg-stone-50 text-stone-950",
    green: "border-emerald-100 bg-emerald-50 text-emerald-950",
    blue: "border-sky-100 bg-sky-50 text-sky-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
  };

  return (
    <div className={`rounded-md border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white/8 px-3 py-2">
      <p className="text-sm text-stone-300">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
