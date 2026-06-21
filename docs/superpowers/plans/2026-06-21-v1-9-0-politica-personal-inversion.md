# v1.9.0 Politica Personal de Inversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated investment policy module that turns the existing portfolio policy into a visible discipline layer for cartera and decision review.

**Architecture:** Extend the existing `InvestmentPolicySettings` inside target portfolio settings instead of adding a new table. Add pure policy analysis functions in `src/lib/finance.ts`, surface them through a focused `investment-policy-panel.tsx`, and pass policy warnings into Cartera and Modo Decision without creating confirmed financial records.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Tailwind CSS, existing Supabase persistence for dashboard settings, existing parser regression command.

---

### Task 1: Policy Model And Analyzer Tests

**Files:**
- Modify: `tests/parser-regression.ts`
- Modify: `src/lib/finance.ts`

- [ ] **Step 1: Add failing tests for policy normalization and analysis**

Add imports near the existing finance imports:

```ts
import {
  analyzeInvestmentPolicy,
  normalizeInvestmentPolicySettings,
  type InvestmentPolicyDecisionContext,
} from "../src/lib/finance";
```

Add cases near the existing portfolio cases:

```ts
const normalizedPolicy = normalizeInvestmentPolicySettings({
  noTouchRule: "",
  strongRallyRule: "",
  lastReviewedAt: "2026-06-21T12:00:00.000Z",
  changeFriction: "wait_48h",
});

assertEqual(
  normalizedPolicy.noTouchRule.length > 0,
  true,
  "policy normalization fills no-touch rule",
);
assertEqual(
  normalizedPolicy.strongRallyRule.length > 0,
  true,
  "policy normalization fills rally rule",
);
assertEqual(
  normalizedPolicy.changeFriction,
  "wait_48h",
  "policy normalization preserves valid friction",
);

const basePolicyAnalysis = analyzeInvestmentPolicy({
  portfolio: analyzeTargetPortfolio({
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
  }),
});

assertEqual(
  basePolicyAnalysis.violatedRuleCount,
  0,
  "complete default policy has no violations",
);
assertIncludes(
  basePolicyAnalysis.rules.map((rule) => rule.id),
  "no_touch_rule",
  "policy analysis includes no-touch rule",
  "rules",
);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:parser`

Expected: TypeScript fails because `analyzeInvestmentPolicy`, `InvestmentPolicyDecisionContext`, `noTouchRule`, `strongRallyRule`, `lastReviewedAt`, and `changeFriction` do not exist yet.

- [ ] **Step 3: Extend policy types and defaults**

In `src/lib/finance.ts`, extend the types:

```ts
export type PolicyChangeFriction = "none" | "review" | "wait_48h";

export type InvestmentPolicySettings = {
  monthlyContributionTarget: number;
  salaryInvestmentPercent: number;
  emergencyFundMonths: number;
  rebalanceTolerancePercent: number;
  rebalanceFrequency: "mensual" | "trimestral" | "semestral" | "anual";
  drawdownRule: string;
  strongRallyRule: string;
  bitcoinRule: string;
  goldRule: string;
  individualStocksRule: string;
  realEstateRule: string;
  noTouchRule: string;
  lastReviewedAt?: string;
  changeFriction: PolicyChangeFriction;
};
```

Update `DEFAULT_TARGET_PORTFOLIO_SETTINGS.policy`:

```ts
strongRallyRule: "No aumentar riesgo por euforia sin revisar la politica.",
noTouchRule: "No tocar el plan por panico, FOMO o comparacion sin esperar 48 horas.",
lastReviewedAt: undefined,
changeFriction: "review",
```

- [ ] **Step 4: Add policy analyzer types and function**

In `src/lib/finance.ts`, add:

```ts
export type InvestmentPolicyRuleStatus = {
  id: string;
  label: string;
  status: "alineada" | "advertencia" | "violada";
  detail: string;
};

export type InvestmentPolicyWarning = {
  id: string;
  label: string;
  severity: "media" | "alta";
  action: string;
};

export type InvestmentPolicyDecisionContext = {
  detectedType?: string;
  category?: string;
  emotionalSignals?: string[];
  riskFactors?: { id: string; severity?: string }[];
};

export type InvestmentPolicyAnalysis = {
  policy: InvestmentPolicySettings;
  rules: InvestmentPolicyRuleStatus[];
  activeWarnings: InvestmentPolicyWarning[];
  violatedRuleCount: number;
  warningRuleCount: number;
  alignedRuleCount: number;
  summary: string;
  primaryAction: string;
};
```

Add `analyzeInvestmentPolicy`:

```ts
export function analyzeInvestmentPolicy({
  portfolio,
  decision,
}: {
  portfolio: TargetPortfolioAnalysis;
  decision?: InvestmentPolicyDecisionContext;
}): InvestmentPolicyAnalysis {
  const policy = normalizeInvestmentPolicySettings(portfolio.policy);
  const rules: InvestmentPolicyRuleStatus[] = [];
  const warnings: InvestmentPolicyWarning[] = [];

  function addRule(rule: InvestmentPolicyRuleStatus) {
    rules.push(rule);
    if (rule.status === "advertencia" || rule.status === "violada") {
      warnings.push({
        id: rule.id,
        label: rule.label,
        severity: rule.status === "violada" ? "alta" : "media",
        action:
          rule.status === "violada"
            ? "Revisar la politica antes de actuar."
            : "Verificar si la decision sigue dentro del plan.",
      });
    }
  }

  addRule(policyNumberRule("monthly_contribution_target", "Aporte mensual objetivo", policy.monthlyContributionTarget, "Definir un aporte mensual objetivo."));
  addRule(policyNumberRule("salary_investment_percent", "Porcentaje de salario", policy.salaryInvestmentPercent, "Definir que parte del ingreso se invierte."));
  addRule(policyNumberRule("emergency_fund_months", "Colchon objetivo", policy.emergencyFundMonths, "Definir cuantos meses de colchon proteger."));
  addRule(policyNumberRule("rebalance_tolerance", "Tolerancia de rebalanceo", policy.rebalanceTolerancePercent, "Definir tolerancia antes de rebalancear."));
  addRule(policyTextRule("drawdown_rule", "Caidas fuertes", policy.drawdownRule, "Escribir regla ante caidas fuertes."));
  addRule(policyTextRule("strong_rally_rule", "Subidas fuertes", policy.strongRallyRule, "Escribir regla ante subidas fuertes."));
  addRule(policyTextRule("bitcoin_rule", "Bitcoin", policy.bitcoinRule, "Escribir regla para BTC."));
  addRule(policyTextRule("gold_rule", "Oro", policy.goldRule, "Escribir regla para oro."));
  addRule(policyTextRule("individual_stocks_rule", "Acciones individuales", policy.individualStocksRule, "Escribir regla para acciones individuales."));
  addRule(policyTextRule("real_estate_rule", "Inmuebles", policy.realEstateRule, "Escribir regla para inmuebles."));
  addRule(policyTextRule("no_touch_rule", "No tocar el plan", policy.noTouchRule, "Escribir regla para no cambiar el plan en caliente."));

  for (const asset of portfolio.assets) {
    const outsideTolerance =
      Math.abs(asset.imbalancePercent) > policy.rebalanceTolerancePercent;
    if (outsideTolerance) {
      addRule({
        id: `rebalance_${asset.assetClass}`,
        label: `Desbalance ${asset.label}`,
        status: asset.assetClass === "bitcoin" ? "violada" : "advertencia",
        detail: `${asset.label} esta fuera de la tolerancia definida.`,
      });
    }
  }

  if (decisionHasImpulse(decision)) {
    addRule({
      id: "decision_48h",
      label: "Decision en caliente",
      status: "advertencia",
      detail: "La decision tiene impulso, FOMO o comparacion; conviene esperar 48 horas.",
    });
  }

  const violatedRuleCount = rules.filter((rule) => rule.status === "violada").length;
  const warningRuleCount = rules.filter((rule) => rule.status === "advertencia").length;
  const alignedRuleCount = rules.filter((rule) => rule.status === "alineada").length;

  return {
    policy,
    rules,
    activeWarnings: warnings,
    violatedRuleCount,
    warningRuleCount,
    alignedRuleCount,
    summary:
      violatedRuleCount > 0
        ? "Hay reglas importantes fuera del plan."
        : warningRuleCount > 0
          ? "El plan tiene advertencias para revisar."
          : "La politica esta escrita y operativa.",
    primaryAction:
      violatedRuleCount > 0
        ? "Revisar politica antes de actuar."
        : warningRuleCount > 0
          ? "Revisar advertencias y esperar si hay impulso."
          : "Mantener el plan y revisar periodicamente.",
  };
}
```

Add helpers:

```ts
function policyNumberRule(id: string, label: string, value: number, missing: string): InvestmentPolicyRuleStatus {
  return normalizePositiveNumber(value) > 0
    ? { id, label, status: "alineada", detail: "Regla definida." }
    : { id, label, status: "violada", detail: missing };
}

function policyTextRule(id: string, label: string, value: string, missing: string): InvestmentPolicyRuleStatus {
  return value.trim().length > 0
    ? { id, label, status: "alineada", detail: value.trim() }
    : { id, label, status: "violada", detail: missing };
}

function decisionHasImpulse(decision?: InvestmentPolicyDecisionContext) {
  const signals = decision?.emotionalSignals ?? [];
  const factors = decision?.riskFactors?.map((factor) => factor.id) ?? [];
  return [...signals, ...factors].some((value) =>
    ["impulso", "fomo", "comparacion", "senal emocional"].includes(value),
  );
}
```

- [ ] **Step 5: Update normalization**

In `normalizeInvestmentPolicySettings`, normalize the new fields:

```ts
const frictionValues: PolicyChangeFriction[] = ["none", "review", "wait_48h"];
const changeFriction = frictionValues.includes(settings.changeFriction as PolicyChangeFriction)
  ? (settings.changeFriction as PolicyChangeFriction)
  : defaultPolicy.changeFriction;

return {
  ...existing,
  strongRallyRule: normalizeTextSetting(settings.strongRallyRule, defaultPolicy.strongRallyRule),
  noTouchRule: normalizeTextSetting(settings.noTouchRule, defaultPolicy.noTouchRule),
  lastReviewedAt: normalizeOptionalDate(settings.lastReviewedAt),
  changeFriction,
};
```

Add helpers:

```ts
function normalizeTextSetting(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function normalizeOptionalDate(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:parser`

Expected: parser regression passes.

Commit:

```bash
git add src/lib/finance.ts tests/parser-regression.ts
git commit -m "Agregar analisis de politica de inversion"
```

### Task 2: Decision Mode Policy Context

**Files:**
- Modify: `src/lib/decision-mode.ts`
- Modify: `tests/parser-regression.ts`

- [ ] **Step 1: Add failing test for policy warning from BTC FOMO decision**

Add to `decisionModeCases`:

```ts
{
  name: "Decision BTC con FOMO expone senal para politica",
  text: "voy a invertir USD 500 en BTC porque todos estan entrando y no quiero quedar afuera",
  type: "inversion_potencial",
  intent: "intencion",
  riskLevel: "medio",
  amount: 500,
  currency: "USD",
  category: "bitcoin",
  emotionalSignals: ["fomo"],
  riskFactors: ["inversion especulativa", "senal emocional"],
}
```

Add a policy decision assertion after decision mode cases:

```ts
const decisionPolicyAnalysis = analyzeInvestmentPolicy({
  portfolio: analyzeTargetPortfolio({
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
  }),
  decision: analyzeDecisionMode(
    "voy a invertir USD 500 en BTC porque todos estan entrando",
    DEFAULT_FREEDOM_INPUTS,
  ),
});

assertIncludes(
  decisionPolicyAnalysis.rules.map((rule) => rule.id),
  "decision_48h",
  "policy detects hot decision",
  "rules",
);
```

- [ ] **Step 2: Run tests and verify failure if context shape mismatches**

Run: `npm run test:parser`

Expected: fail until `DecisionModeAnalysis` is structurally compatible with `InvestmentPolicyDecisionContext` or the test import is corrected.

- [ ] **Step 3: Make decision analysis compatible**

If needed, export `DecisionModeAnalysis` fields already present:

```ts
emotionalSignals: string[];
riskFactors: DecisionModeRiskFactor[];
category?: string;
detectedType: DecisionModeType;
```

No new persistence or confirmed transaction behavior is allowed.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:parser`

Expected: parser regression passes.

Commit:

```bash
git add src/lib/decision-mode.ts tests/parser-regression.ts
git commit -m "Conectar decisiones con politica de inversion"
```

### Task 3: Dedicated Policy UI

**Files:**
- Create: `src/components/libertad-dashboard/investment-policy-panel.tsx`
- Modify: `src/components/libertad-dashboard/types.ts`
- Modify: `src/components/libertad-dashboard.tsx`

- [ ] **Step 1: Add navigation section**

In `src/components/libertad-dashboard/types.ts`, add `"politica"` to `AppSection` and secondary modules:

```ts
| "politica"
```

```ts
{
  id: "politica",
  label: "Politica",
  description: "Reglas del plan",
},
```

- [ ] **Step 2: Create the policy panel component**

Create `src/components/libertad-dashboard/investment-policy-panel.tsx`:

```tsx
"use client";

import {
  analyzeInvestmentPolicy,
  type InvestmentPolicyAnalysis,
  type InvestmentPolicySettings,
  type TargetPortfolioAnalysis,
} from "@/lib/finance";
import {
  inputClass,
  inputShellClass,
} from "@/components/libertad-dashboard/form-styles";
import { MetricCard } from "@/components/libertad-dashboard/shared-components";

type Props = {
  portfolio: TargetPortfolioAnalysis;
  policy: InvestmentPolicySettings;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
  onMarkReviewed: () => void;
};

export function InvestmentPolicyPanel({
  portfolio,
  policy,
  onPolicyChange,
  onMarkReviewed,
}: Props) {
  const analysis = analyzeInvestmentPolicy({ portfolio });

  return (
    <section className="grid gap-5">
      <div className="libertad-surface rounded-lg p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Politica personal de inversion
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Plan escrito antes del mercado
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Reglas de largo plazo para revisar inversiones, rebalanceos y cambios de estrategia sin convertir simulaciones en datos reales.
            </p>
          </div>
          <button
            className="min-h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            type="button"
            onClick={onMarkReviewed}
          >
            Marcar revision
          </button>
        </div>

        <div className="libertad-card-grid mt-5 grid gap-3">
          <MetricCard label="Alineadas" value={String(analysis.alignedRuleCount)} tone="green" />
          <MetricCard label="Advertencias" value={String(analysis.warningRuleCount)} tone="amber" />
          <MetricCard label="Violaciones" value={String(analysis.violatedRuleCount)} tone={analysis.violatedRuleCount > 0 ? "red" : "neutral"} />
        </div>

        <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          {analysis.summary} {analysis.primaryAction}
        </p>
      </div>

      <PolicyRules analysis={analysis} />
      <PolicyEditor policy={policy} onPolicyChange={onPolicyChange} />
    </section>
  );
}
```

Add `PolicyRules` and `PolicyEditor` in the same file using existing input styles:

```tsx
function PolicyRules({ analysis }: { analysis: InvestmentPolicyAnalysis }) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <h3 className="text-xl font-semibold text-stone-950">Cumplimiento</h3>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {analysis.rules.map((rule) => (
          <div key={rule.id} className={`rounded-md border p-4 ${ruleStatusClass(rule.status)}`}>
            <p className="text-sm font-semibold">{rule.label}</p>
            <p className="mt-2 text-sm leading-6 opacity-80">{rule.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PolicyEditor({
  policy,
  onPolicyChange,
}: {
  policy: InvestmentPolicySettings;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
}) {
  const numericFields = [
    ["monthlyContributionTarget", "Aporte mensual objetivo", "USD"],
    ["salaryInvestmentPercent", "Salario a invertir", "%"],
    ["emergencyFundMonths", "Colchon objetivo", "meses"],
    ["rebalanceTolerancePercent", "Tolerancia desbalance", "pp"],
  ] as const;
  const ruleFields = [
    ["drawdownRule", "Caidas fuertes"],
    ["strongRallyRule", "Subidas fuertes"],
    ["bitcoinRule", "Bitcoin"],
    ["goldRule", "Oro"],
    ["individualStocksRule", "Acciones individuales"],
    ["realEstateRule", "Inmuebles"],
    ["noTouchRule", "No tocar el plan"],
  ] as const;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <h3 className="text-xl font-semibold text-stone-950">Reglas editables</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Cambiar reglas no crea movimientos. Usalo como revision consciente del plan.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {numericFields.map(([key, label, suffix]) => (
          <label key={key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">{label}</span>
            <div className={inputShellClass}>
              <input className={inputClass} inputMode="decimal" min="0" type="number" value={policy[key] as number} onChange={(event) => onPolicyChange(key, event.target.value)} />
              <span className="ml-2 text-sm font-semibold text-stone-500">{suffix}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {ruleFields.map(([key, label]) => (
          <label key={key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">{label}</span>
            <textarea className="libertad-field min-h-20 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900" value={policy[key] as string} onChange={(event) => onPolicyChange(key, event.target.value)} />
          </label>
        ))}
      </div>
    </section>
  );
}
```

Add status helper:

```tsx
function ruleStatusClass(status: "alineada" | "advertencia" | "violada") {
  if (status === "violada") {
    return "border-red-200 bg-red-50 text-red-950";
  }
  if (status === "advertencia") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}
```

- [ ] **Step 3: Wire panel in dashboard**

In `src/components/libertad-dashboard.tsx`, import:

```ts
import { InvestmentPolicyPanel } from "@/components/libertad-dashboard/investment-policy-panel";
```

Add handler:

```ts
function markInvestmentPolicyReviewed() {
  updateInvestmentPolicy("lastReviewedAt", new Date().toISOString());
}
```

Render:

```tsx
{activeSection === "politica" ? (
  <InvestmentPolicyPanel
    portfolio={targetPortfolio}
    policy={targetPortfolio.policy}
    onPolicyChange={updateInvestmentPolicy}
    onMarkReviewed={markInvestmentPolicyReviewed}
  />
) : null}
```

- [ ] **Step 4: Run lint and commit**

Run: `npm run lint`

Expected: no lint errors.

Commit:

```bash
git add src/components/libertad-dashboard.tsx src/components/libertad-dashboard/types.ts src/components/libertad-dashboard/investment-policy-panel.tsx
git commit -m "Agregar vista de politica de inversion"
```

### Task 4: Policy Signals In Cartera And Decision Mode

**Files:**
- Modify: `src/components/libertad-dashboard/portfolio-panel.tsx`
- Modify: `src/components/libertad-dashboard/decision-mode-panel.tsx`
- Modify: `src/components/libertad-dashboard.tsx`

- [ ] **Step 1: Compact policy in Cartera**

In `portfolio-panel.tsx`, replace the full `InvestmentPolicyPanel` editor usage with a compact warning summary or remove the editor if the dedicated page exists. Keep Cartera focused on asset allocation.

Use:

```tsx
<div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
  <p className="text-sm font-semibold text-stone-950">Politica conectada</p>
  <p className="mt-1 text-sm leading-6 text-stone-600">
    La edicion completa vive en Politica. Esta cartera usa tolerancia, BTC, oro e inmuebles para detectar desalineaciones.
  </p>
</div>
```

- [ ] **Step 2: Add decision policy summary**

In `decision-mode-panel.tsx`, accept `policyAnalysis` or `portfolio` as prop:

```ts
export function DecisionModePanel({
  context,
  portfolio,
}: {
  context: FreedomInputs;
  portfolio: TargetPortfolioAnalysis;
}) {
```

Compute:

```ts
const policyAnalysis = useMemo(
  () => analyzeInvestmentPolicy({ portfolio, decision: analysis }),
  [portfolio, analysis],
);
```

Render a small policy block:

```tsx
<section className="libertad-surface rounded-lg p-5 sm:p-6">
  <h3 className="text-xl font-semibold text-stone-950">Politica aplicable</h3>
  <p className="mt-2 text-sm leading-6 text-stone-600">
    {policyAnalysis.primaryAction}
  </p>
  {policyAnalysis.activeWarnings.slice(0, 3).map((warning) => (
    <div key={warning.id} className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">{warning.label}</p>
      <p className="mt-1 leading-6">{warning.action}</p>
    </div>
  ))}
</section>
```

- [ ] **Step 3: Pass portfolio from dashboard**

In `src/components/libertad-dashboard.tsx`, update:

```tsx
<DecisionModePanel context={effectiveInputs} portfolio={targetPortfolio} />
```

- [ ] **Step 4: Run tests and lint, then commit**

Run:

```bash
npm run test:parser
npm run lint
```

Expected: both pass.

Commit:

```bash
git add src/components/libertad-dashboard.tsx src/components/libertad-dashboard/portfolio-panel.tsx src/components/libertad-dashboard/decision-mode-panel.tsx
git commit -m "Mostrar politica en cartera y decisiones"
```

### Task 5: Roadmap And Changelog

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Add changelog entry**

At the top of `CHANGELOG.md`, add:

```md
## v1.9.0 - Politica Personal de Inversion

* Nueva seccion Politica para revisar reglas de inversion antes de actuar.
* La politica existente de cartera ahora muestra cumplimiento, advertencias y accion principal.
* Reglas nuevas para subidas fuertes, no tocar el plan, ultima revision y friccion de cambios.
* Modo Decision muestra advertencias de politica para inversiones, BTC, oro, inmuebles y decisiones con impulso/FOMO.
* Cartera conserva asignacion objetivo y deriva advertencias desde la politica sin crear movimientos reales.
```

- [ ] **Step 2: Mark roadmap section as closed**

Under `v1.9.0 Politica Personal de Inversion`, add:

```md
Estado:

* vista dedicada de Politica implementada;
* reglas activas, advertencias y violaciones visibles;
* politica conectada con Cartera y Modo Decision;
* cambios de politica no crean transacciones ni modifican datos confirmados;
* persistencia reutiliza configuracion existente de cartera objetivo.
```

Update priority list to start at `v2.1.0`.

- [ ] **Step 3: Commit docs**

Run: `git diff --check`

Expected: no whitespace errors.

Commit:

```bash
git add CHANGELOG.md ROADMAP.md
git commit -m "Actualizar roadmap de politica de inversion"
```

### Task 6: Final Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run full checks**

Run:

```bash
npm run test:parser
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 2: Review git state**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: only unrelated `.codex/hooks.json` deletion remains unstaged if still present.

- [ ] **Step 3: Final report**

Report:

- branch name;
- commit hashes created;
- checks run;
- migration status from previous block;
- whether push was performed.

## Plan Self-Review

- Spec coverage: model fields, analyzer, dedicated view, cartera connection, decision connection, docs, and checks are covered.
- Placeholder scan: no implementation step depends on unspecified behavior.
- Type consistency: `InvestmentPolicySettings`, `InvestmentPolicyAnalysis`, and `InvestmentPolicyDecisionContext` names are consistent across tasks.
