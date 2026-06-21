"use client";

import { useMemo, useState } from "react";
import {
  analyzeDecisionMode,
  type DecisionModeAction,
  type DecisionModeAnalysis,
  type DecisionModeRiskLevel,
  type DecisionModeRiskSeverity,
} from "@/lib/decision-mode";
import type { FreedomInputs } from "@/lib/finance";
import {
  formatCurrencyAmount,
  numberFormatter,
} from "@/components/libertad-dashboard/formatting";
import { MetricCard } from "@/components/libertad-dashboard/shared-components";

const DEFAULT_DECISION_TEXT =
  "Quiero comprar un iPhone de USD 900 en cuotas porque me lo merezco";
const LOCAL_INTENTIONS_KEY = "libertad-os:decision-intentions";
const LOCAL_DRAFTS_KEY = "libertad-os:decision-drafts";

export function DecisionModePanel({ context }: { context: FreedomInputs }) {
  const [decisionText, setDecisionText] = useState(DEFAULT_DECISION_TEXT);
  const [actionMessage, setActionMessage] = useState("");
  const analysis = useMemo(
    () => analyzeDecisionMode(decisionText, context),
    [context, decisionText],
  );
  const hasText = decisionText.trim().length > 0;

  function handleAction(action: DecisionModeAction) {
    if (!hasText) {
      setActionMessage("Escribi una decision antes de elegir una accion.");
      return;
    }

    if (action === "esperar_48h") {
      const reviewAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      setActionMessage(
        `Espera marcada hasta ${reviewAt.toLocaleDateString("es-UY")}. No se guardo ningun dato real.`,
      );
      return;
    }

    if (action === "guardar_como_intencion") {
      appendLocalRecord(LOCAL_INTENTIONS_KEY, {
        kind: "decision_intention",
        originalText: analysis.originalText,
        decisionSnapshot: analysis,
        createdAt: new Date().toISOString(),
        confirmed: false,
        syncTarget: "none",
      });
      setActionMessage(
        "Intencion guardada localmente como no confirmada. El dashboard no cambia.",
      );
      return;
    }

    if (action === "convertir_a_nota_borrador") {
      appendLocalRecord(LOCAL_DRAFTS_KEY, {
        kind: "decision_note_draft",
        title: "Borrador de decision",
        body: analysis.originalText,
        decisionSnapshot: analysis,
        createdAt: new Date().toISOString(),
        confirmed: false,
        syncTarget: "none",
      });
      setActionMessage(
        "Borrador local preparado. Sigue sin ser una nota confirmada.",
      );
      return;
    }

    if (action === "pedir_mas_datos") {
      setActionMessage(
        analysis.missingFields.length > 0
          ? `Falta revisar: ${analysis.missingFields.join(", ")}.`
          : "No aparecen datos criticos faltantes en esta lectura.",
      );
      return;
    }

    setDecisionText("");
    setActionMessage("Decision descartada. No se guardo nada.");
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Modo Decision v1.8.0
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Evaluar antes de ejecutar
            </h2>
          </div>
          <span className="inline-flex min-h-9 items-center rounded-md border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700">
            Simulacion
          </span>
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-medium text-stone-700">
            Decision en lenguaje natural
          </span>
          <textarea
            className="libertad-field min-h-44 resize-y rounded-md bg-white px-4 py-3 text-base leading-7 text-stone-950 placeholder:text-stone-500"
            spellCheck={false}
            value={decisionText}
            onChange={(event) => {
              setDecisionText(event.target.value);
              setActionMessage("");
            }}
          />
        </label>

        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-900">
            Datos interpretados
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DetectedField label="Tipo" value={typeCopy(analysis.detectedType)} />
            <DetectedField label="Intent" value={intentCopy(analysis.intent)} />
            <DetectedField
              label="Monto"
              value={
                analysis.amount && analysis.currency
                  ? formatCurrencyAmount(analysis.currency, analysis.amount)
                  : "Sin monto"
              }
            />
            <DetectedField label="Moneda" value={analysis.currency ?? "Sin moneda"} />
            <DetectedField
              label="Cuotas"
              value={
                analysis.installments
                  ? `${analysis.installments} cuotas`
                  : "Sin cuotas"
              }
            />
            <DetectedField
              label="Tasa"
              value={
                analysis.interestRate !== undefined
                  ? `${numberFormatter.format(analysis.interestRate)}%`
                  : "Sin tasa"
              }
            />
            <DetectedField
              label="Categoria"
              value={analysis.category ?? "Sin categoria"}
            />
            <DetectedField
              label="Recurrencia"
              value={analysis.recurring ? "Recurrente" : "No recurrente"}
            />
          </div>
        </div>

        <DecisionActions
          actions={analysis.availableActions}
          onAction={handleAction}
        />

        {actionMessage ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950"
          >
            {actionMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5">
        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-stone-950">
                Lectura simulada
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                No modifica patrimonio, gasto mensual, cartera, deuda ni notas
                confirmadas.
              </p>
            </div>
            <span
              className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${riskCopy(
                analysis.riskLevel,
              ).classes}`}
            >
              Riesgo {riskCopy(analysis.riskLevel).label}
            </span>
          </div>

          <div className="libertad-card-grid mt-5 grid gap-3">
            <MetricCard
              label="Impacto mensual"
              value={formatCurrencyAmount("USD", analysis.estimatedMonthlyImpact)}
              tone={analysis.estimatedMonthlyImpact > 0 ? "amber" : "neutral"}
            />
            <MetricCard
              label="Impacto FIRE"
              value={formatCurrencyAmount("USD", analysis.estimatedFireImpact)}
              tone={analysis.estimatedFireImpact > 0 ? "red" : "neutral"}
            />
            <MetricCard
              label="Impacto roadmap"
              value={roadmapMetricValue(analysis)}
              tone={
                analysis.roadmapImpact.monthlyContributionDelta < 0
                  ? "amber"
                  : analysis.roadmapImpact.monthlyContributionDelta > 0
                    ? "green"
                    : "neutral"
              }
            />
          </div>

          <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            {analysis.roadmapImpact.label}
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DecisionList
            empty="Sin datos faltantes."
            items={analysis.missingFields}
            title="Datos faltantes"
          />
          <DecisionList
            empty="Sin senales emocionales visibles."
            items={analysis.emotionalSignals}
            title="Senales emocionales"
          />
        </section>

        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-stone-950">
            Factores de riesgo
          </h3>
          {analysis.riskFactors.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {analysis.riskFactors.map((factor) => (
                <div
                  key={factor.id}
                  className={`rounded-md border p-4 ${severityCopy(factor.severity).classes}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-semibold">{factor.label}</p>
                    <span className="text-xs font-semibold">
                      {severityCopy(factor.severity).label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 opacity-80">
                    {factor.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
              No aparecen factores fuertes con los datos actuales.
            </p>
          )}
        </section>

        <section className="libertad-surface rounded-lg p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-stone-950">
            Checklist anti-error
          </h3>
          <ul className="mt-4 grid gap-2">
            {analysis.checklist.map((item) => (
              <li
                key={item}
                className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm leading-6 text-stone-700"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border border-emerald-700 bg-emerald-50 text-xs font-semibold text-emerald-900"
                >
                  OK
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function appendLocalRecord(key: string, record: unknown) {
  const currentValue = window.localStorage.getItem(key);
  const currentRecords = currentValue ? JSON.parse(currentValue) : [];

  window.localStorage.setItem(key, JSON.stringify([record, ...currentRecords]));
}

function DetectedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function DecisionActions({
  actions,
  onAction,
}: {
  actions: DecisionModeAction[];
  onAction: (action: DecisionModeAction) => void;
}) {
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      {actions.map((action) => (
        <button
          key={action}
          className={
            action === "descartar"
              ? "min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              : "min-h-11 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          }
          type="button"
          onClick={() => onAction(action)}
        >
          {actionCopy(action)}
        </button>
      ))}
    </div>
  );
}

function DecisionList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <h3 className="text-base font-semibold text-stone-950">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
          {empty}
        </p>
      )}
    </section>
  );
}

function roadmapMetricValue(analysis: DecisionModeAnalysis) {
  if (!analysis.roadmapImpact.hasEnoughData) {
    return "Sin calcular";
  }

  const delta = analysis.roadmapImpact.monthlyContributionDelta;
  const prefix = delta > 0 ? "+" : "";

  return `${prefix}${formatCurrencyAmount("USD", delta)}/mes`;
}

function typeCopy(type: DecisionModeAnalysis["detectedType"]) {
  const copy: Record<DecisionModeAnalysis["detectedType"], string> = {
    gasto_potencial: "Gasto potencial",
    deuda_potencial: "Deuda potencial",
    inversion_potencial: "Inversion potencial",
    ahorro_potencial: "Ahorro potencial",
    intencion: "Intencion",
    pensamiento: "Pensamiento",
    negacion: "Negacion",
    mixta: "Mixta",
    desconocida: "Desconocida",
  };

  return copy[type];
}

function intentCopy(intent: DecisionModeAnalysis["intent"]) {
  const copy: Record<DecisionModeAnalysis["intent"], string> = {
    real: "Real",
    intencion: "Intencion",
    pensamiento: "Pensamiento",
    negacion: "Negacion",
  };

  return copy[intent];
}

function riskCopy(risk: DecisionModeRiskLevel) {
  const copy = {
    bajo: {
      label: "bajo",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    medio: {
      label: "medio",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    alto: {
      label: "alto",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
    sin_datos: {
      label: "sin datos",
      classes: "border-stone-200 bg-stone-50 text-stone-700",
    },
  } satisfies Record<
    DecisionModeRiskLevel,
    { label: string; classes: string }
  >;

  return copy[risk];
}

function severityCopy(severity: DecisionModeRiskSeverity) {
  const copy = {
    baja: {
      label: "Baja",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    media: {
      label: "Media",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    alta: {
      label: "Alta",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
  } satisfies Record<
    DecisionModeRiskSeverity,
    { label: string; classes: string }
  >;

  return copy[severity];
}

function actionCopy(action: DecisionModeAction) {
  const copy: Record<DecisionModeAction, string> = {
    esperar_48h: "Esperar 48 horas",
    guardar_como_intencion: "Guardar intencion local",
    convertir_a_nota_borrador: "Convertir en borrador",
    pedir_mas_datos: "Pedir mas datos",
    descartar: "Descartar",
  };

  return copy[action];
}
