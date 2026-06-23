"use client";

import {
  currencyFormatter,
  percentFormatter,
} from "@/components/libertad-dashboard/formatting";
import {
  FireRow,
  MetricCard,
} from "@/components/libertad-dashboard/shared-components";
import type { MonthlyReviewAnalysis, MonthlyReviewStatus } from "@/lib/finance";

type Props = {
  analysis: MonthlyReviewAnalysis;
  onOpenNotes: () => void;
};

export function MonthlyReviewPanel({ analysis, onOpenNotes }: Props) {
  const status = monthlyReviewStatusCopy(analysis.status);

  return (
    <section className="grid gap-5">
      <div className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Revision mensual
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Cerrar el mes antes de decidir el siguiente
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Resume solo movimientos reales confirmados del mes. No crea
              transacciones, no modifica patrimonio y no cambia el roadmap.
            </p>
          </div>
          <span
            className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${status.classes}`}
          >
            Mes {status.label}
          </span>
        </div>

        <div className="libertad-card-grid mt-5 grid gap-3">
          <MetricCard
            label="Ingresos del mes"
            value={currencyFormatter.format(analysis.monthlyIncome)}
            detail={analysis.monthKey}
            tone={analysis.monthlyIncome > 0 ? "green" : "neutral"}
          />
          <MetricCard
            label="Gastos del mes"
            value={currencyFormatter.format(analysis.monthlyExpenses)}
            tone={analysis.monthlyExpenses > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            label="Tasa de ahorro"
            value={`${percentFormatter.format(analysis.savingRate)}%`}
            tone={analysis.savingRate >= 20 ? "green" : "amber"}
          />
          <MetricCard
            label="Inversion realizada"
            value={currencyFormatter.format(analysis.investmentAmount)}
            tone={analysis.investmentAmount > 0 ? "green" : "neutral"}
          />
        </div>

        {!analysis.hasConfirmedData ? (
          <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            No hay movimientos reales confirmados para este mes. Confirma
            ingresos y gastos desde Notas antes de cerrar la lectura mensual.
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white sm:p-6">
          <p className="text-sm font-semibold text-emerald-300">
            Accion principal
          </p>
          <p className="mt-4 text-2xl font-semibold leading-tight text-balance">
            {analysis.primaryAction}
          </p>
          <p className="mt-4 text-sm leading-6 text-stone-300">
            Foco del proximo mes: {analysis.nextMonthFocus}
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            type="button"
            onClick={onOpenNotes}
          >
            Abrir Notas
          </button>
        </section>

        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-stone-950">
            Cierre operativo
          </h3>
          <div className="mt-4 grid gap-2">
            <FireRow
              label="Ahorro estimado"
              value={currencyFormatter.format(analysis.savingsAmount)}
              detail="Ingreso menos gastos y presion mensual de deuda."
            />
            <FireRow
              label="Deuda agregada"
              value={currencyFormatter.format(analysis.debtAdded)}
              detail="Presion mensual confirmada de deuda nueva del mes."
            />
            <FireRow
              label="Compras grandes"
              value={analysis.bigPurchaseCount.toString()}
              detail="Gastos reales por encima del umbral de compra grande."
            />
            <FireRow
              label="Compras con impulso"
              value={analysis.emotionalPurchaseCount.toString()}
              detail="Senales anti-error confirmadas en gastos reales."
            />
          </div>
        </section>
      </div>

      <section className="libertad-surface rounded-lg p-5 sm:p-6">
        <h3 className="text-xl font-semibold text-stone-950">
          Senales del mes
        </h3>
        <ul className="mt-4 grid gap-2 lg:grid-cols-2">
          {analysis.signals.map((signal) => (
            <li
              key={signal}
              className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 rounded-md border border-stone-200 bg-white p-3 text-sm leading-6 text-stone-700"
            >
              <span
                aria-hidden="true"
                className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
              />
              <span>{signal}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function monthlyReviewStatusCopy(status: MonthlyReviewStatus) {
  const copy = {
    fuerte: {
      label: "fuerte",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    correcto: {
      label: "correcto",
      classes: "border-sky-200 bg-sky-50 text-sky-950",
    },
    debil: {
      label: "debil",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    alerta: {
      label: "de alerta",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
  } as const;

  return copy[status];
}
