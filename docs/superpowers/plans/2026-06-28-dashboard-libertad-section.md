# Dashboard Actual and Libertad Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard lead with current net worth and confirmed activity while moving the full freedom target into the existing advanced section renamed `Libertad`.

**Architecture:** Keep every financial calculation and persisted value unchanged. Recompose the existing JSX in `libertad-dashboard.tsx`, preserve the internal `palancas` section ID for hash compatibility, and extend the existing navigation regression with source-level placement assertions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node-based regression tests.

---

## File map

- Modify `src/components/libertad-dashboard/types.ts`: change only the visible advanced-navigation label and description.
- Modify `tests/navigation-modules-regression.ts`: protect the new label, compact dashboard link, and detailed Libertad-section placement.
- Modify `src/components/libertad-dashboard.tsx`: replace the dashboard freedom hero with a current-state hero and render the detailed freedom block above `FireLeversPanel`.
- Modify `CHANGELOG.md`: record the user-facing dashboard and navigation change without overwriting existing entries.

### Task 1: Protect navigation and section placement with a failing regression

**Files:**
- Modify: `tests/navigation-modules-regression.ts`
- Test: `tests/navigation-modules-regression.ts`

- [ ] **Step 1: Add the failing assertions**

Add `readFileSync` and derive the dashboard and Libertad source slices:

```ts
import { readFileSync } from "node:fs";

const dashboardSource = readFileSync(
  "src/components/libertad-dashboard.tsx",
  "utf8",
);
const dashboardView = dashboardSource.split(
  'activeSection === "dashboard"',
)[1]?.split('activeSection === "notas"')[0] ?? "";
const libertadView = dashboardSource.split(
  'activeSection === "palancas"',
)[1]?.split('activeSection === "revision"')[0] ?? "";

assert(
  secondaryModuleIds.includes("palancas") &&
    secondaryModuleLabels.includes("Libertad") &&
    !secondaryModuleLabels.includes("Palancas"),
  "advanced navigation should expose the freedom plan as Libertad",
);

assert(
  dashboardView.includes("Patrimonio actual") &&
    dashboardView.includes("Ver plan de libertad") &&
    !dashboardView.includes("Numero de libertad financiera"),
  "dashboard should prioritize current wealth and link compactly to Libertad",
);

assert(
  libertadView.includes("Numero de libertad financiera") &&
    libertadView.includes("FireLeversPanel"),
  "Libertad should contain the detailed target and its levers",
);
```

- [ ] **Step 2: Run the regression and verify it fails**

Run: `npm run test:parser`

Expected: FAIL in `navigation-modules-regression` because the label is still `Palancas`, the compact link does not exist, and the detailed target remains in the dashboard.

### Task 2: Recompose Dashboard and Libertad

**Files:**
- Modify: `src/components/libertad-dashboard/types.ts`
- Modify: `src/components/libertad-dashboard.tsx`
- Test: `tests/navigation-modules-regression.ts`

- [ ] **Step 1: Rename the visible advanced module**

Keep `id: "palancas"` and change its visible metadata:

```ts
{
  id: "palancas",
  label: "Libertad",
  description: "Objetivo y palancas",
},
```

- [ ] **Step 2: Replace the dashboard freedom hero with current-state content**

In the main dashboard column, render `Patrimonio actual` as the dominant value, then retain the two operational metrics:

```tsx
<p className="text-sm font-semibold text-emerald-800">Situacion actual</p>
<h2 className="mt-1 text-xl font-semibold text-stone-950">
  Patrimonio actual
</h2>
<p className="libertad-number mt-2 break-words text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
  {effectiveInputs.netWorth !== 0
    ? currencyFormatter.format(effectiveInputs.netWorth)
    : "Sin cargar"}
</p>

<div className="libertad-card-grid mt-7 grid gap-3">
  <MetricCard
    label="Capital de inversiones"
    value={currencyFormatter.format(effectiveInputs.investedCapital)}
    tone="blue"
  />
  <MetricCard
    label="Margen mensual"
    value={
      isGuidedEmptyState
        ? "Sin movimientos"
        : currencyFormatter.format(financialMargin.availableMonthlyMargin)
    }
    tone={
      financialMargin.state === "fragil"
        ? "red"
        : financialMargin.state === "ajustado"
          ? "amber"
          : "green"
    }
  />
</div>
```

Add the compact orientation strip beneath those metrics:

```tsx
<div className="mt-5 flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <p className="text-sm font-medium text-stone-600">Progreso hacia libertad</p>
    <p className="libertad-number mt-1 text-lg font-semibold text-stone-950">
      {hasProgressCalculation
        ? `${percentFormatter.format(metrics.completed)}%`
        : "Sin calcular"}
    </p>
  </div>
  <button
    className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    type="button"
    onClick={() => selectSection("palancas")}
  >
    Ver plan de libertad
  </button>
</div>
```

- [ ] **Step 3: Keep recent activity as the next dedicated section**

Replace the current `Pulso financiero` section with this confirmed-only activity surface:

```tsx
<section className="libertad-surface rounded-lg p-5 sm:p-6">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-semibold text-emerald-800">Actividad real</p>
      <h2 className="mt-1 text-xl font-semibold text-stone-950">
        Ultimos movimientos
      </h2>
    </div>
    <button
      className="text-sm font-semibold text-stone-500 transition-colors hover:text-stone-950 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      type="button"
      onClick={() => selectSection("notas")}
    >
      Ver notas
    </button>
  </div>

  <div className="mt-4 grid gap-2">
    {recentConfirmedTransactions.length > 0 ? (
      recentConfirmedTransactions.map((transaction) => (
        <div
          key={`${transaction.noteId}-${transaction.id}`}
          className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-950">
              {transaction.noteTitle || transaction.sourceText}
            </p>
            <p className="mt-1 truncate text-xs text-stone-500">
              {transaction.category || transaction.type}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="libertad-number text-sm font-semibold text-stone-950">
              {formatConfirmedTransactionAmount(transaction)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {formatConfirmedTransactionDate(transaction)}
            </p>
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-4">
        <p className="text-sm font-semibold text-stone-950">
          Sin movimientos confirmados
        </p>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Las notas detectadas aparecen aca recien despues de confirmarlas
          manualmente.
        </p>
      </div>
    )}
  </div>
</section>
```

- [ ] **Step 4: Move the detailed target above the existing levers**

Change the `palancas` branch from a single panel to a grid containing the existing detailed target JSX followed by the existing panel:

```tsx
{activeSection === "palancas" ? (
  <section className="grid gap-5">
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-800">
            Numero de libertad financiera
          </p>
          <p className="libertad-number mt-2 break-words text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
            {hasFreedomTarget
              ? currencyFormatter.format(metrics.target)
              : "Sin gasto mensual"}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Capital de inversiones necesario para sostener tu gasto mensual:
            gasto mensual deseado x 12 x 25.
          </p>
        </div>
        <div className="shrink-0 rounded-md border border-stone-200 bg-stone-950 px-4 py-3 text-left text-white">
          <p className="text-sm font-medium text-stone-300">Falta para la meta</p>
          <p className="libertad-number mt-1 text-2xl font-semibold text-white">
            {hasProgressCalculation
              ? currencyFormatter.format(metrics.remaining)
              : "Sin calcular"}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4 text-sm font-medium">
          <span className="text-stone-600">Progreso total</span>
          <span className="libertad-number text-lg font-semibold text-stone-950">
            {hasProgressCalculation
              ? `${percentFormatter.format(metrics.completed)}%`
              : "Sin calcular"}
          </span>
        </div>
        <div
          aria-label={
            hasProgressCalculation
              ? `Progreso total ${percentFormatter.format(metrics.completed)}%`
              : "Progreso total sin calcular"
          }
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={
            hasProgressCalculation
              ? Math.min(100, Math.max(0, metrics.completed))
              : 0
          }
          className="libertad-meter mt-4 h-5"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-emerald-700"
            style={{
              width: `${
                hasProgressCalculation
                  ? Math.min(100, Math.max(0, metrics.completed))
                  : 0
              }%`,
            }}
          />
        </div>
        <div className="mt-3 flex justify-between text-xs font-medium text-stone-500">
          <span>Hoy</span>
          <span>50%</span>
          <span>Libertad</span>
        </div>
      </div>

      <div className="libertad-card-grid mt-7 grid gap-3">
        <MetricCard
          label="Gasto anual"
          value={
            hasFreedomTarget
              ? currencyFormatter.format(metrics.annual)
              : "Sin cargar"
          }
        />
        <MetricCard
          label="Tiempo estimado"
          value={hasProgressCalculation ? yearsLabel : "Sin calcular"}
          tone="blue"
        />
        <MetricCard
          label="Capital hacia libertad"
          value={currencyFormatter.format(metrics.currentFreedomCapital)}
          detail="Base usada para progreso, distinta del patrimonio total."
          tone="blue"
        />
      </div>
    </section>
    <FireLeversPanel summary={transactionSummary} />
  </section>
) : null}
```

The moved block must continue using `hasFreedomTarget`, `hasProgressCalculation`, `metrics`, `yearsLabel`, `currencyFormatter`, and `percentFormatter` exactly as before.

- [ ] **Step 5: Run focused financial and navigation regressions**

Run: `npm run test:parser`

Expected: all parser, freedom-progress, fire-levers, finance-structure, and navigation regressions PASS.

### Task 3: Document and verify the user-facing change

**Files:**
- Modify: `CHANGELOG.md`
- Verify: `src/components/libertad-dashboard.tsx`
- Verify: `src/components/libertad-dashboard/types.ts`
- Verify: `tests/navigation-modules-regression.ts`

- [ ] **Step 1: Add a changelog bullet to the current unreleased section**

Add this entry without changing unrelated existing text:

```md
* Dashboard prioriza patrimonio actual, capital de inversiones, margen y actividad confirmada; el objetivo completo pasa a la seccion avanzada Libertad con un acceso compacto desde el resumen.
```

- [ ] **Step 2: Run lint**

Run: `npm run lint -- src/components/libertad-dashboard.tsx src/components/libertad-dashboard/types.ts tests/navigation-modules-regression.ts`

Expected: exit code 0 with no lint errors in the touched files.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff -- src/components/libertad-dashboard.tsx src/components/libertad-dashboard/types.ts tests/navigation-modules-regression.ts CHANGELOG.md`

Expected: no whitespace errors; no changes to financial formulas, Supabase persistence, confirmation behavior, or unrelated user-owned work.
