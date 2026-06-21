"use client";

import {
  analyzeInvestmentPolicy,
  type InvestmentPolicyAnalysis,
  type InvestmentPolicyRuleStatus,
  type InvestmentPolicySettings,
  type TargetPortfolioAnalysis,
} from "@/lib/finance";
import {
  inputClass,
  inputShellClass,
} from "@/components/libertad-dashboard/form-styles";
import { MetricCard } from "@/components/libertad-dashboard/shared-components";

type InvestmentPolicyPanelProps = {
  portfolio: TargetPortfolioAnalysis;
  policy: InvestmentPolicySettings;
  onMarkReviewed: () => void;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
};

export function InvestmentPolicyPanel({
  portfolio,
  policy,
  onMarkReviewed,
  onPolicyChange,
}: InvestmentPolicyPanelProps) {
  const analysis = analyzeInvestmentPolicy({ portfolio });
  const reviewedLabel = policy.lastReviewedAt
    ? new Intl.DateTimeFormat("es-UY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(policy.lastReviewedAt))
    : "Sin revision marcada";

  return (
    <section className="grid gap-5">
      <div className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-emerald-800">
              Politica personal de inversion
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Plan escrito antes del mercado
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Reglas de largo plazo para revisar inversiones, rebalanceos y
              cambios de estrategia sin convertir simulaciones en datos reales.
            </p>
          </div>
          <button
            className="min-h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 active:translate-y-px"
            type="button"
            onClick={onMarkReviewed}
          >
            Marcar revision
          </button>
        </div>

        <div className="libertad-card-grid mt-5 grid gap-3">
          <MetricCard
            label="Alineadas"
            value={String(analysis.alignedRuleCount)}
            tone="green"
          />
          <MetricCard
            label="Advertencias"
            value={String(analysis.warningRuleCount)}
            tone={analysis.warningRuleCount > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            label="Violaciones"
            value={String(analysis.violatedRuleCount)}
            tone={analysis.violatedRuleCount > 0 ? "red" : "neutral"}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            {analysis.summary} {analysis.primaryAction}
          </p>
          <p className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-600">
            Ultima revision:{" "}
            <span className="font-semibold text-stone-950">
              {reviewedLabel}
            </span>
          </p>
        </div>
      </div>

      <PolicyRules analysis={analysis} />
      <PolicyEditor policy={policy} onPolicyChange={onPolicyChange} />
    </section>
  );
}

function PolicyRules({ analysis }: { analysis: InvestmentPolicyAnalysis }) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-stone-950">
            Cumplimiento
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Lectura descriptiva del plan. No compra, vende ni rebalancea por
            vos.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-md border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700">
          Plan, no opinion macro
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {analysis.rules.map((rule) => (
          <RuleStatusCard key={rule.id} rule={rule} />
        ))}
      </div>
    </section>
  );
}

function RuleStatusCard({ rule }: { rule: InvestmentPolicyRuleStatus }) {
  return (
    <div className={`rounded-md border p-4 ${ruleStatusClass(rule.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{rule.label}</p>
        <span className="shrink-0 text-xs font-semibold">
          {ruleStatusLabel(rule.status)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 opacity-80">{rule.detail}</p>
    </div>
  );
}

function PolicyEditor({
  policy,
  onPolicyChange,
}: {
  policy: InvestmentPolicySettings;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
}) {
  const numericFields: {
    key: keyof InvestmentPolicySettings;
    label: string;
    suffix: string;
    step: string;
  }[] = [
    {
      key: "monthlyContributionTarget",
      label: "Aporte mensual objetivo",
      suffix: "USD",
      step: "100",
    },
    {
      key: "salaryInvestmentPercent",
      label: "Salario a invertir",
      suffix: "%",
      step: "1",
    },
    {
      key: "emergencyFundMonths",
      label: "Colchon objetivo",
      suffix: "meses",
      step: "1",
    },
    {
      key: "rebalanceTolerancePercent",
      label: "Tolerancia desbalance",
      suffix: "pp",
      step: "0.5",
    },
  ];
  const ruleFields: {
    key: keyof InvestmentPolicySettings;
    label: string;
  }[] = [
    { key: "drawdownRule", label: "Caidas fuertes" },
    { key: "strongRallyRule", label: "Subidas fuertes" },
    { key: "bitcoinRule", label: "Bitcoin" },
    { key: "goldRule", label: "Oro" },
    { key: "individualStocksRule", label: "Acciones individuales" },
    { key: "realEstateRule", label: "Inmuebles" },
    { key: "noTouchRule", label: "No tocar el plan" },
  ];

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <h3 className="text-xl font-semibold text-stone-950">
        Reglas editables
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
        Cambiar reglas no crea movimientos ni modifica datos confirmados. Usalo
        como revision consciente del plan.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {numericFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
              {field.label}
            </span>
            <div className={inputShellClass}>
              <input
                autoComplete="off"
                className={inputClass}
                inputMode="decimal"
                min="0"
                step={field.step}
                type="number"
                value={policy[field.key] as number}
                onChange={(event) =>
                  onPolicyChange(field.key, event.target.value)
                }
              />
              <span className="ml-2 text-sm font-semibold text-stone-500">
                {field.suffix}
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Frecuencia de rebalanceo
          </span>
          <select
            autoComplete="off"
            className="libertad-field h-12 rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
            value={policy.rebalanceFrequency}
            onChange={(event) =>
              onPolicyChange("rebalanceFrequency", event.target.value)
            }
          >
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold text-stone-600">
            Friccion para cambios
          </span>
          <select
            autoComplete="off"
            className="libertad-field h-12 rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
            value={policy.changeFriction}
            onChange={(event) =>
              onPolicyChange("changeFriction", event.target.value)
            }
          >
            <option value="none">Sin friccion extra</option>
            <option value="review">Revisar antes de guardar</option>
            <option value="wait_48h">Esperar 48 horas</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {ruleFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
              {field.label}
            </span>
            <textarea
              autoComplete="off"
              className="libertad-field min-h-20 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900"
              value={policy[field.key] as string}
              onChange={(event) =>
                onPolicyChange(field.key, event.target.value)
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function ruleStatusClass(status: InvestmentPolicyRuleStatus["status"]) {
  if (status === "violada") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (status === "advertencia") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}

function ruleStatusLabel(status: InvestmentPolicyRuleStatus["status"]) {
  const labels: Record<InvestmentPolicyRuleStatus["status"], string> = {
    alineada: "Alineada",
    advertencia: "Advertencia",
    violada: "Violada",
  };

  return labels[status];
}
