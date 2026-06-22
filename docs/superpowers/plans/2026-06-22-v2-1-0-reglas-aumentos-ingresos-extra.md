# v2.1.0 Reglas de Aumentos e Ingresos Extra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated income-increase module that turns confirmed raises and extra income into an editable 70/20/10 execution rule.

**Architecture:** Add pure finance analysis on top of the existing lifestyle-inflation comparison, then render a focused dashboard panel. Keep the editable rule local for v2.1.0 and avoid new persistence or confirmed records.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, Tailwind CSS, existing parser regression command.

---

### Task 1: Analyzer And Tests

**Files:**
- Modify: `src/lib/finance.ts`
- Modify: `tests/parser-regression.ts`

- [ ] **Step 1: Add failing tests**

Import `analyzeIncomeIncrease`, `normalizeIncomeIncreaseRuleSettings`, and `DEFAULT_INCOME_INCREASE_RULE_SETTINGS` from `src/lib/finance.ts`.

Add tests asserting:

* default rule is 70/20/10;
* invalid percentages normalize to defaults;
* a USD 500 confirmed income increase produces USD 350 investment, USD 100 lifestyle, USD 50 treat, and USD 25 emergency fund;
* expense increase reduces captured freedom;
* no increase returns `hasIncrease: false`.

- [ ] **Step 2: Run parser tests**

Run: `npm run test:parser`

Expected: TypeScript fails because the new exports do not exist.

- [ ] **Step 3: Implement analyzer**

Add types and functions in `src/lib/finance.ts`:

* `IncomeIncreaseRuleSettings`
* `IncomeIncreasePlan`
* `IncomeIncreaseAnalysis`
* `DEFAULT_INCOME_INCREASE_RULE_SETTINGS`
* `normalizeIncomeIncreaseRuleSettings`
* `analyzeIncomeIncrease`

Use `LifestyleInflationAnalysis` as input and keep all output simulated.

- [ ] **Step 4: Run parser tests**

Run: `npm run test:parser`

Expected: passes.

### Task 2: Dedicated UI

**Files:**
- Create: `src/components/libertad-dashboard/income-increase-panel.tsx`
- Modify: `src/components/libertad-dashboard/types.ts`
- Modify: `src/components/libertad-dashboard.tsx`

- [ ] **Step 1: Add navigation module**

Add `"aumentos"` to `AppSection` and secondary modules with label `Aumentos` and description `Ingresos extra`.

- [ ] **Step 2: Create panel**

Create a client component that accepts:

* `analysis: IncomeIncreaseAnalysis`
* `settings: IncomeIncreaseRuleSettings`
* `onSettingsChange: (key: keyof IncomeIncreaseRuleSettings, value: string) => void`
* `onOpenNotes: () => void`

Render metrics, editable percent fields, simulated impact, and empty state.

- [ ] **Step 3: Wire dashboard state**

In `libertad-dashboard.tsx`, keep rule settings in `useState`, compute `incomeIncreaseAnalysis` with `useMemo`, route attention to `aumentos` when a high-risk increase is detected, and render the new panel.

- [ ] **Step 4: Run lint**

Run: `npm run lint`

Expected: passes.

### Task 3: Docs And Verification

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Update docs**

Add changelog entry and mark `v2.1.0` as closed in `ROADMAP.md`.

- [ ] **Step 2: Run full checks**

Run:

```bash
npm run test:parser
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 3: Commit scoped changes**

Stage only files touched for this feature. Do not stage `.codex/hooks.json`.

Commit message:

```bash
git commit -m "Agregar reglas de aumentos e ingresos extra"
```

## Plan Self-Review

Spec coverage: analyzer, UI, navigation, docs, and verification are covered.

Placeholder scan: no TBD or undefined behavior remains.

Type consistency: names match the spec and planned imports.
