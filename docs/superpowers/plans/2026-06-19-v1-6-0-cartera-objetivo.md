# v1.6.0 Cartera Objetivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an editable target portfolio panel in the Libertad OS dashboard with objective percentages, current amounts, derived confirmed investments, imbalance bars, and status labels.

**Architecture:** Keep portfolio calculations in `src/lib/finance.ts`, investment category detection in `src/lib/financial-notes.ts`, and dashboard state/UI in `src/components/libertad-dashboard.tsx`. Do not add dependencies; use declarative React and Tailwind for compact accessible bars instead of D3 because this is a small categorical comparison.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, localStorage, existing parser regression script.

---

## Files Affected

- Modify `src/lib/finance.ts`: add portfolio asset types, defaults, settings normalization, derived current amounts, balance calculations, and warning state.
- Modify `src/lib/financial-notes.ts`: classify compatible investment categories for ETF USA, ETF Europa, Emergentes, Oro, Bitcoin, and Bienes raices.
- Modify `src/components/libertad-dashboard.tsx`: add target portfolio localStorage state, compute derived portfolio analysis, render compact editable panel.
- Modify `tests/parser-regression.ts`: add tests for target sum, non-100 target sum, empty portfolio, derived confirmed investment, manual amount, and three balance statuses.
- Modify `ROADMAP.md`: mark v1.6.0 as closed after verification.
- Modify `CHANGELOG.md`: add v1.6.0 release notes after verification.

## Pre-Implementation Checks

- [ ] **Step 1: Read the local Next.js docs required by AGENTS.md**

Run:

```bash
Get-Content -Raw node_modules/next/dist/docs/01-app/index.md
Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
```

Expected: both files print local Next.js App and CSS guidance without errors.

- [ ] **Step 2: Confirm frontend skills have been consulted**

Confirm these files were read in the active session:

```bash
Get-Content -Raw .agents/skills/frontend/SKILL.md
Get-Content -Raw .agents/skills/frontend2/SKILL.md
Get-Content -Raw .agents/skills/frontend3/SKILL.md
```

Expected: the three frontend skill docs print successfully. Apply them as follows: `frontend-design` for the dashboard panel, `d3-viz` for accessible data visualization principles without adding D3, and `web-design-guidelines` for labels, focus, number formatting, empty states, and responsive behavior.

### Task 1: Add Portfolio Regression Tests

**Files:**
- Modify: `tests/parser-regression.ts`
- Test: `tests/parser-regression.ts`

- [ ] **Step 1: Extend finance imports**

Modify the import from `../src/lib/finance` to include these exports:

```ts
  analyzeTargetPortfolio,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  type TargetPortfolioSettings,
  type TargetPortfolioTransaction,
```

- [ ] **Step 2: Add portfolio test types**

Add this block after `type DebtLoadCase`:

```ts
type PortfolioCase = {
  name: string;
  settings: TargetPortfolioSettings;
  transactions: TargetPortfolioTransaction[];
  targetTotalPercent: number;
  targetWarning: boolean;
  totalCurrentAmount: number;
  asset: string;
  currentAmount: number;
  currentSource: "manual" | "derivado";
  status: "sobrepeso" | "bajo_peso" | "alineado";
};
```

- [ ] **Step 3: Add portfolio cases**

Add this block after `const debtLoadCases` and before the final `console.log`:

```ts
const portfolioCases: PortfolioCase[] = [
  {
    name: "Objetivos suman 100",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 0,
    asset: "etf_usa",
    currentAmount: 0,
    currentSource: "manual",
    status: "alineado",
  },
  {
    name: "Objetivos no suman 100",
    settings: {
      targets: {
        ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
        bitcoin: 10,
      },
      manualAmounts: DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts,
    },
    transactions: [],
    targetTotalPercent: 105,
    targetWarning: true,
    totalCurrentAmount: 0,
    asset: "bitcoin",
    currentAmount: 0,
    currentSource: "manual",
    status: "alineado",
  },
  {
    name: "Cartera vacia queda alineada",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 0,
    asset: "oro",
    currentAmount: 0,
    currentSource: "manual",
    status: "alineado",
  },
  {
    name: "Inversion confirmada alimenta actual derivado",
    settings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    transactions: [portfolioTx("etf_usa", 3000)],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 3000,
    asset: "etf_usa",
    currentAmount: 3000,
    currentSource: "derivado",
    status: "sobrepeso",
  },
  {
    name: "Monto manual alimenta actual sin derivado",
    settings: {
      targets: DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
      manualAmounts: {
        ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts,
        oro: 500,
      },
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 500,
    asset: "oro",
    currentAmount: 500,
    currentSource: "manual",
    status: "sobrepeso",
  },
  {
    name: "Estados bajo peso y alineado",
    settings: {
      targets: DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets,
      manualAmounts: {
        etf_usa: 450,
        etf_europa: 20,
        emergentes: 150,
        oro: 100,
        bitcoin: 50,
        bienes_raices: 50,
      },
    },
    transactions: [],
    targetTotalPercent: 100,
    targetWarning: false,
    totalCurrentAmount: 820,
    asset: "etf_europa",
    currentAmount: 20,
    currentSource: "manual",
    status: "bajo_peso",
  },
];

for (const testCase of portfolioCases) {
  runPortfolioCase(testCase);
}
```

- [ ] **Step 4: Add portfolio helpers**

Add these helpers near the existing `debtTx` and `runDebtLoadCase` helpers:

```ts
function portfolioTx(
  category: string,
  amount: number,
  patch: Partial<TargetPortfolioTransaction> = {},
): TargetPortfolioTransaction {
  return {
    type: "inversion",
    amount,
    category,
    intent: "real",
    ignored: false,
    ...patch,
  };
}

function runPortfolioCase(expected: PortfolioCase) {
  const analysis = analyzeTargetPortfolio(
    expected.settings,
    expected.transactions,
  );
  const asset = analysis.assets.find(
    (item) => item.assetClass === expected.asset,
  );

  assert(asset, `${expected.name}: expected asset ${expected.asset}`);
  assertEqual(
    analysis.targetTotalPercent,
    expected.targetTotalPercent,
    expected.name,
    "targetTotalPercent",
  );
  assertEqual(
    analysis.targetWarning,
    expected.targetWarning,
    expected.name,
    "targetWarning",
  );
  assertEqual(
    analysis.totalCurrentAmount,
    expected.totalCurrentAmount,
    expected.name,
    "totalCurrentAmount",
  );
  assertEqual(
    asset.currentAmount,
    expected.currentAmount,
    expected.name,
    "asset.currentAmount",
  );
  assertEqual(
    asset.currentSource,
    expected.currentSource,
    expected.name,
    "asset.currentSource",
  );
  assertEqual(asset.status, expected.status, expected.name, "asset.status");
}
```

- [ ] **Step 5: Run tests and verify failure**

Run:

```bash
npm run test:parser
```

Expected: FAIL because `analyzeTargetPortfolio`, `DEFAULT_TARGET_PORTFOLIO_SETTINGS`, and target portfolio types are not exported yet.

### Task 2: Implement Portfolio Finance Model

**Files:**
- Modify: `src/lib/finance.ts`
- Test: `tests/parser-regression.ts`

- [ ] **Step 1: Add portfolio types and defaults**

Add this block after `export type ConfirmedDebtLoadAnalysis`:

```ts
export type PortfolioAssetClass =
  | "etf_usa"
  | "etf_europa"
  | "emergentes"
  | "oro"
  | "bitcoin"
  | "bienes_raices";

export type PortfolioCurrentSource = "manual" | "derivado";
export type PortfolioBalanceStatus = "sobrepeso" | "bajo_peso" | "alineado";

export type TargetPortfolioTransaction = {
  type: string;
  amount: number;
  category?: string;
  intent?: string;
  ignored?: boolean;
};

export type TargetPortfolioSettings = {
  targets: Record<PortfolioAssetClass, number>;
  manualAmounts: Record<PortfolioAssetClass, number>;
};

export type TargetPortfolioAsset = {
  assetClass: PortfolioAssetClass;
  label: string;
  targetPercent: number;
  currentAmount: number;
  currentSource: PortfolioCurrentSource;
  currentPercent: number;
  expectedAmount: number;
  imbalanceAmount: number;
  imbalancePercent: number;
  status: PortfolioBalanceStatus;
};

export type TargetPortfolioAnalysis = {
  assets: TargetPortfolioAsset[];
  targetTotalPercent: number;
  targetWarning: boolean;
  totalCurrentAmount: number;
  alignedCount: number;
  overweightCount: number;
  underweightCount: number;
  largestImbalance?: TargetPortfolioAsset;
};

export const PORTFOLIO_ASSET_CLASSES: readonly {
  assetClass: PortfolioAssetClass;
  label: string;
}[] = [
  { assetClass: "etf_usa", label: "ETF USA" },
  { assetClass: "etf_europa", label: "ETF Europa" },
  { assetClass: "emergentes", label: "Emergentes" },
  { assetClass: "oro", label: "Oro" },
  { assetClass: "bitcoin", label: "Bitcoin" },
  { assetClass: "bienes_raices", label: "Bienes raices" },
];

export const DEFAULT_TARGET_PORTFOLIO_SETTINGS: TargetPortfolioSettings = {
  targets: {
    etf_usa: 45,
    etf_europa: 20,
    emergentes: 15,
    oro: 10,
    bitcoin: 5,
    bienes_raices: 5,
  },
  manualAmounts: {
    etf_usa: 0,
    etf_europa: 0,
    emergentes: 0,
    oro: 0,
    bitcoin: 0,
    bienes_raices: 0,
  },
};

const PORTFOLIO_ALIGNMENT_TOLERANCE = 2;
```

- [ ] **Step 2: Add portfolio analyzer**

Add this function after `analyzeConfirmedDebtLoad`:

```ts
export function analyzeTargetPortfolio(
  settings: TargetPortfolioSettings,
  transactions: TargetPortfolioTransaction[] = [],
): TargetPortfolioAnalysis {
  const normalizedSettings = normalizeTargetPortfolioSettings(settings);
  const derivedAmounts = targetPortfolioDerivedAmounts(transactions);
  const targetTotalPercent = PORTFOLIO_ASSET_CLASSES.reduce(
    (total, asset) => total + normalizedSettings.targets[asset.assetClass],
    0,
  );
  const currentAmounts = PORTFOLIO_ASSET_CLASSES.map((asset) => {
    const derivedAmount = derivedAmounts[asset.assetClass];
    const manualAmount = normalizedSettings.manualAmounts[asset.assetClass];

    return {
      ...asset,
      currentAmount: derivedAmount > 0 ? derivedAmount : manualAmount,
      currentSource:
        derivedAmount > 0
          ? ("derivado" as const)
          : ("manual" as const),
    };
  });
  const totalCurrentAmount = currentAmounts.reduce(
    (total, asset) => total + asset.currentAmount,
    0,
  );
  const assets = currentAmounts.map((asset) => {
    const targetPercent = normalizedSettings.targets[asset.assetClass];
    const currentPercent =
      totalCurrentAmount > 0
        ? (asset.currentAmount / totalCurrentAmount) * 100
        : 0;
    const expectedAmount = (totalCurrentAmount * targetPercent) / 100;
    const imbalanceAmount = asset.currentAmount - expectedAmount;
    const imbalancePercent = currentPercent - targetPercent;
    const status = portfolioBalanceStatus(
      imbalancePercent,
      totalCurrentAmount,
    );

    return {
      assetClass: asset.assetClass,
      label: asset.label,
      targetPercent,
      currentAmount: asset.currentAmount,
      currentSource: asset.currentSource,
      currentPercent,
      expectedAmount,
      imbalanceAmount,
      imbalancePercent,
      status,
    };
  });
  const largestImbalance = [...assets].sort(
    (first, second) =>
      Math.abs(second.imbalancePercent) - Math.abs(first.imbalancePercent),
  )[0];

  return {
    assets,
    targetTotalPercent,
    targetWarning: Math.abs(targetTotalPercent - 100) > 0.1,
    totalCurrentAmount,
    alignedCount: assets.filter((asset) => asset.status === "alineado").length,
    overweightCount: assets.filter((asset) => asset.status === "sobrepeso").length,
    underweightCount: assets.filter((asset) => asset.status === "bajo_peso").length,
    largestImbalance:
      largestImbalance && totalCurrentAmount > 0 ? largestImbalance : undefined,
  };
}
```

- [ ] **Step 3: Add portfolio helpers**

Add these helpers after `analyzeTargetPortfolio`:

```ts
export function normalizeTargetPortfolioSettings(
  settings: Partial<TargetPortfolioSettings> = {},
): TargetPortfolioSettings {
  return {
    targets: PORTFOLIO_ASSET_CLASSES.reduce(
      (targets, asset) => ({
        ...targets,
        [asset.assetClass]: Math.max(
          0,
          settings.targets?.[asset.assetClass] ??
            DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets[asset.assetClass],
        ),
      }),
      {} as Record<PortfolioAssetClass, number>,
    ),
    manualAmounts: PORTFOLIO_ASSET_CLASSES.reduce(
      (manualAmounts, asset) => ({
        ...manualAmounts,
        [asset.assetClass]: Math.max(
          0,
          settings.manualAmounts?.[asset.assetClass] ??
            DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts[asset.assetClass],
        ),
      }),
      {} as Record<PortfolioAssetClass, number>,
    ),
  };
}

function targetPortfolioDerivedAmounts(
  transactions: TargetPortfolioTransaction[],
) {
  const amounts = { ...DEFAULT_TARGET_PORTFOLIO_SETTINGS.manualAmounts };

  for (const transaction of transactions) {
    if (
      transaction.type !== "inversion" ||
      transaction.intent !== "real" ||
      transaction.ignored ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      continue;
    }

    const assetClass = portfolioAssetClassFromCategory(transaction.category);

    if (assetClass) {
      amounts[assetClass] += transaction.amount;
    }
  }

  return amounts;
}

export function portfolioAssetClassFromCategory(
  category?: string,
): PortfolioAssetClass | undefined {
  if (!category) {
    return undefined;
  }

  const normalizedCategory = normalizePortfolioCategory(category);
  const matches: Record<PortfolioAssetClass, string[]> = {
    etf_usa: ["etf_usa", "etf usa", "sp500", "s&p500", "s&p 500", "voo", "vti", "qqq"],
    etf_europa: ["etf_europa", "etf europa", "europa", "vwcg", "imeu"],
    emergentes: ["emergentes", "mercados emergentes", "emerging", "eem", "iemg"],
    oro: ["oro", "gold", "gld"],
    bitcoin: ["bitcoin", "btc"],
    bienes_raices: ["bienes_raices", "bienes raices", "real estate", "reits", "reit", "inmueble", "propiedad"],
  };

  return PORTFOLIO_ASSET_CLASSES.find((asset) =>
    matches[asset.assetClass].includes(normalizedCategory),
  )?.assetClass;
}

function portfolioBalanceStatus(
  imbalancePercent: number,
  totalCurrentAmount: number,
): PortfolioBalanceStatus {
  if (totalCurrentAmount <= 0) {
    return "alineado";
  }

  if (imbalancePercent > PORTFOLIO_ALIGNMENT_TOLERANCE) {
    return "sobrepeso";
  }

  if (imbalancePercent < -PORTFOLIO_ALIGNMENT_TOLERANCE) {
    return "bajo_peso";
  }

  return "alineado";
}

function normalizePortfolioCategory(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
```

- [ ] **Step 4: Run parser tests**

Run:

```bash
npm run test:parser
```

Expected: portfolio finance tests pass or parser category tests fail until Task 3 adds compatible categories.

### Task 3: Add Compatible Investment Categories

**Files:**
- Modify: `src/lib/financial-notes.ts`
- Modify: `tests/parser-regression.ts`
- Test: `tests/parser-regression.ts`

- [ ] **Step 1: Add parser regression cases**

Add these objects to the main `cases` array:

```ts
  {
    text: "Inverti 1000 en ETF USA VOO",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 1000,
    category: "etf_usa",
    freedomImpact: 0,
  },
  {
    text: "Inverti 300 en Bitcoin BTC",
    type: "inversion",
    intent: "real",
    confirmable: true,
    amount: 300,
    category: "bitcoin",
    freedomImpact: 0,
  },
  {
    text: "Quiero invertir 500 en oro",
    type: "inversion",
    intent: "intencion",
    confirmable: false,
    amount: 500,
    category: "oro",
    freedomImpact: 0,
  },
```

- [ ] **Step 2: Run parser tests and verify category failure**

Run:

```bash
npm run test:parser
```

Expected: FAIL because investment categories still return `inversion` for compatible asset text.

- [ ] **Step 3: Update `detectCategory` investment branch**

Replace the existing branch:

```ts
  if (hasAny(text, ["etf", "bitcoin", "acciones", "bonos", "inversion"])) {
    return "inversion";
  }
```

with:

```ts
  if (hasAny(text, ["etf usa", "s&p", "sp500", "voo", "vti", "qqq"])) {
    return "etf_usa";
  }

  if (hasAny(text, ["etf europa", "europa", "vwcg", "imeu"])) {
    return "etf_europa";
  }

  if (hasAny(text, ["emergentes", "mercados emergentes", "emerging", "eem", "iemg"])) {
    return "emergentes";
  }

  if (hasAny(text, ["oro", "gold", "gld"])) {
    return "oro";
  }

  if (hasAny(text, ["bitcoin", "btc"])) {
    return "bitcoin";
  }

  if (
    hasAny(text, [
      "bienes raices",
      "real estate",
      "reits",
      "reit",
      "inmueble",
      "propiedad",
    ])
  ) {
    return "bienes_raices";
  }

  if (hasAny(text, ["etf", "acciones", "bonos", "inversion"])) {
    return "inversion";
  }
```

- [ ] **Step 4: Preserve investment type override**

Replace this code in `buildItem`:

```ts
  if (category === "inversion") {
    type = "inversion";
  }
```

with:

```ts
  if (
    [
      "inversion",
      "etf_usa",
      "etf_europa",
      "emergentes",
      "oro",
      "bitcoin",
      "bienes_raices",
    ].includes(category)
  ) {
    type = "inversion";
  }
```

- [ ] **Step 5: Run parser tests**

Run:

```bash
npm run test:parser
```

Expected: PASS with the final line including `Parser regression tests passed`.

### Task 4: Build Editable Dashboard Panel

**Files:**
- Modify: `src/components/libertad-dashboard.tsx`
- Test: `npm run lint`, `npm run build`, browser inspection

- [ ] **Step 1: Extend finance imports**

Add these imports from `@/lib/finance`:

```ts
  analyzeTargetPortfolio,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  normalizeTargetPortfolioSettings,
  type PortfolioAssetClass,
  type TargetPortfolioSettings,
```

- [ ] **Step 2: Add portfolio storage key**

Add this after `const STORAGE_KEY`:

```ts
const PORTFOLIO_STORAGE_KEY = "libertad-os-target-portfolio-v1";
```

- [ ] **Step 3: Add portfolio state**

Inside `LibertadDashboard`, add this state after `inputs`:

```ts
  const [portfolioSettings, setPortfolioSettings] =
    useState<TargetPortfolioSettings>(DEFAULT_TARGET_PORTFOLIO_SETTINGS);
```

- [ ] **Step 4: Load portfolio state without touching existing keys**

Inside the existing initial `useEffect`, after dashboard inputs load, add:

```ts
      const storedPortfolio = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);

      if (storedPortfolio) {
        setPortfolioSettings(
          normalizeTargetPortfolioSettings(JSON.parse(storedPortfolio)),
        );
      }
```

- [ ] **Step 5: Persist portfolio settings**

Add a new effect after the existing dashboard storage effect:

```ts
  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(
        PORTFOLIO_STORAGE_KEY,
        JSON.stringify(portfolioSettings),
      );
    }
  }, [hasLoaded, portfolioSettings]);
```

- [ ] **Step 6: Compute portfolio analysis**

Add this memo after `confirmedDebtLoad`:

```ts
  const targetPortfolio = useMemo(
    () => analyzeTargetPortfolio(portfolioSettings, confirmedTransactions),
    [portfolioSettings, confirmedTransactions],
  );
```

- [ ] **Step 7: Add update helpers**

Add these functions near `updateInput`:

```ts
  function updatePortfolioTarget(assetClass: PortfolioAssetClass, value: string) {
    const parsedValue = Number(value);

    setPortfolioSettings((current) =>
      normalizeTargetPortfolioSettings({
        ...current,
        targets: {
          ...current.targets,
          [assetClass]: Number.isFinite(parsedValue) ? parsedValue : 0,
        },
      }),
    );
  }

  function updatePortfolioManualAmount(
    assetClass: PortfolioAssetClass,
    value: string,
  ) {
    const parsedValue = Number(value);

    setPortfolioSettings((current) =>
      normalizeTargetPortfolioSettings({
        ...current,
        manualAmounts: {
          ...current.manualAmounts,
          [assetClass]: Number.isFinite(parsedValue) ? parsedValue : 0,
        },
      }),
    );
  }
```

- [ ] **Step 8: Render the panel**

Insert this component call between `DebtLoadPanel` and `LifestyleInflationPanel`:

```tsx
        <TargetPortfolioPanel
          analysis={targetPortfolio}
          manualAmounts={portfolioSettings.manualAmounts}
          onManualAmountChange={updatePortfolioManualAmount}
          onTargetChange={updatePortfolioTarget}
        />
```

- [ ] **Step 9: Add `TargetPortfolioPanel` component**

Add this component before `DebtLoadPanel`:

```tsx
function TargetPortfolioPanel({
  analysis,
  manualAmounts,
  onManualAmountChange,
  onTargetChange,
}: {
  analysis: ReturnType<typeof analyzeTargetPortfolio>;
  manualAmounts: TargetPortfolioSettings["manualAmounts"];
  onManualAmountChange: (assetClass: PortfolioAssetClass, value: string) => void;
  onTargetChange: (assetClass: PortfolioAssetClass, value: string) => void;
}) {
  const largestImbalance = analysis.largestImbalance;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Cartera objetivo
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Objetivo vs actual. Lectura descriptiva de asignacion patrimonial;
            no es recomendacion financiera.
          </p>
        </div>
        <div
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
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Los objetivos no suman 100%. Podes seguir editando sin perder la
          lectura actual.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        <MetricCard
          label="Principal desbalance"
          value={
            largestImbalance
              ? `${largestImbalance.label} ${percentFormatter.format(
                  Math.abs(largestImbalance.imbalancePercent),
                )} pp`
              : "Sin datos"
          }
          tone={largestImbalance ? "amber" : "neutral"}
        />
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
```

- [ ] **Step 10: Add row component and helpers**

Add this code before `FireRow`:

```tsx
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
  const imbalanceWidth = Math.min(100, Math.abs(asset.imbalancePercent) * 2);
  const status = portfolioStatusCopy(asset.status);

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_150px_120px] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">{asset.label}</p>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${status.classes}`}
            >
              {status.label}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-600">
              {asset.currentSource === "derivado" ? "Derivado" : "Manual"}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full ${status.barClass}`}
              style={{ width: `${imbalanceWidth}%` }}
            />
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
            className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition focus-visible:border-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
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
            Actual manual
          </span>
          <input
            className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-950 outline-none transition disabled:bg-stone-100 disabled:text-stone-500 focus-visible:border-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            disabled={asset.currentSource === "derivado"}
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

        <div>
          <p className="text-xs font-semibold text-stone-600">Desbalance</p>
          <p className="mt-2 text-sm font-semibold text-stone-950">
            {currencyFormatter.format(asset.imbalanceAmount)}
          </p>
          <p className="text-xs text-stone-500">
            {percentFormatter.format(asset.imbalancePercent)} pp
          </p>
        </div>
      </div>
    </div>
  );
}

function portfolioStatusCopy(status: "sobrepeso" | "bajo_peso" | "alineado") {
  const copy = {
    sobrepeso: {
      label: "Sobrepeso",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
      barClass: "bg-amber-600",
    },
    bajo_peso: {
      label: "Bajo peso",
      classes: "border-sky-200 bg-sky-50 text-sky-950",
      barClass: "bg-sky-600",
    },
    alineado: {
      label: "Alineado",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
      barClass: "bg-emerald-700",
    },
  };

  return copy[status];
}
```

- [ ] **Step 11: Run frontend detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/components/libertad-dashboard.tsx src/components/financial-notes-module.tsx src/app/globals.css
```

Expected: JSON output. Treat findings as evidence and fix relevant panel issues before moving on.

### Task 5: Update Roadmap, Changelog, and Verify

**Files:**
- Modify: `ROADMAP.md`
- Modify: `CHANGELOG.md`
- Test: full verification commands

- [ ] **Step 1: Update `ROADMAP.md`**

Change the v1.6.0 heading from:

```md
## v1.6.0 Cartera Objetivo - proximo modulo
```

to:

```md
## v1.6.0 Cartera Objetivo - cerrado
```

Add this state block under the existing `Mostrar` list:

```md
Estado:

* panel agregado al dashboard;
* objetivos editables por clase de activo;
* actual manual o derivado de inversiones confirmadas compatibles;
* advertencia cuando los objetivos no suman 100%;
* desbalance y estado por clase sin recomendacion financiera.
```

- [ ] **Step 2: Update `CHANGELOG.md`**

Add this section after v1.5.0:

```md
## v1.6.0 - Cartera Objetivo

* Panel de cartera objetivo en el dashboard.
* Clases de activo: ETF USA, ETF Europa, Emergentes, Oro, Bitcoin y Bienes raices.
* Objetivos editables con advertencia cuando no suman 100%.
* Montos actuales manuales o derivados de inversiones confirmadas compatibles.
* Desbalance absoluto, desbalance porcentual y estado por clase: sobrepeso, bajo peso o alineado.
* Inversiones no confirmadas, intenciones, pensamientos, negaciones y simulaciones fuera de la cartera actual.
* Visualizacion sobria de objetivo vs actual sin recomendacion financiera.
```

- [ ] **Step 3: Run parser tests**

Run:

```bash
npm run test:parser
```

Expected: PASS and output ending with parser, lifestyle, debt load, and portfolio test counts.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no ESLint errors.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS with a successful Next.js production build.

- [ ] **Step 6: Browser inspection**

Run:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`. Verify the dashboard renders, the cartera objetivo panel appears, target inputs edit without layout shift, manual inputs work when no derived amount exists, derived rows disable manual amount editing, and the warning appears when objectives do not sum to 100%.

## Plan Self-Review

- Spec coverage: every model field, rule, UI requirement, and test case from the spec maps to Tasks 1 through 5.
- Gap scan: no empty sections or undefined feature names remain.
- Type consistency: `PortfolioAssetClass`, `TargetPortfolioSettings`, `TargetPortfolioTransaction`, and `analyzeTargetPortfolio` are introduced before later tasks use them.
- Scope check: this is one dashboard module with minimal parser support; no unrelated financial formulas are changed.
