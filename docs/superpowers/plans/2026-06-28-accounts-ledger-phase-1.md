# Accounts Ledger Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a usable first account-ledger phase with automatic balances, audited opening balances/transfers/adjustments/reversals, liquid-net-worth integration, explicit cash-asset migration, and a dedicated Accounts screen.

**Architecture:** Add a pure TypeScript account domain module, three RLS-protected Supabase tables, and narrowly scoped `security definer` RPCs for every ledger mutation. Direct browser writes to ledger history remain revoked; each RPC checks `auth.uid()`, row ownership, and financial invariants before writing atomically. The dashboard loads normalized account data, calculates balances from immutable entries, includes only resolved liquid accounts in net worth, excludes explicitly migrated cash assets, and renders all account actions through one focused panel.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase/PostgreSQL, existing TypeScript regression runner.

---

## Phase boundaries

This plan implements Phase 1 only. It deliberately stops before:

- assigning accounts during financial-note confirmation;
- mixed-mode legacy transaction messaging;
- portfolio and bot account linking;
- CSV exports.

Investment and bot accounts may be created in Phase 1, but remain `unclassified`, display `Pendiente de clasificación`, and do not enter dashboard totals. Phase 2 will connect them safely.

## File map

- Create `src/lib/accounts.ts`: account types, row normalization, balance derivation, validation, USD summary, and migration exclusion IDs.
- Create `tests/accounts-regression.ts`: pure account-domain regression coverage.
- Create `tests/accounts-migration-regression.ts`: migration security and invariant checks.
- Create `supabase/migrations/20260628120000_create_financial_account_ledger.sql`: tables, indexes, RLS, immutable-ledger policies, and atomic RPCs.
- Modify `src/lib/supabase-persistence.ts`: load and mutate account ledger through typed wrappers.
- Modify `tests/supabase-persistence-regression.ts`: account row mapping and RPC payload coverage.
- Create `src/components/libertad-dashboard/accounts-panel.tsx`: account summary, creation, transfer, adjustment, migration, activity, and reversal UI.
- Modify `src/components/libertad-dashboard/types.ts`: add `cuentas` to primary navigation.
- Modify `tests/navigation-modules-regression.ts`: require the Accounts destination.
- Modify `src/components/libertad-dashboard.tsx`: account state, load/reset/action handlers, FX loading, net-worth integration, and section rendering.
- Modify `src/lib/finance/types.ts`: allow the effective-input calculation to receive resolved account net worth.
- Modify `src/lib/finance/calculations.ts`: exclude migrated cash assets and add resolved account value once.
- Modify `tests/finance-structure-regression.ts`: prevent liquid-account and migrated-cash double counting.
- Modify `package.json`: include the two account regressions in `test:parser`.
- Modify `CHANGELOG.md`: record the user-facing Phase 1 account ledger.

### Task 1: Pure account domain with balance derivation

**Files:**
- Create: `src/lib/accounts.ts`
- Create: `tests/accounts-regression.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the account regression to the test command**

Insert the compiled test immediately before `supabase-persistence-regression.js`:

```json
"node .tmp/parser-tests/tests/accounts-regression.js"
```

- [ ] **Step 2: Write the failing account-domain regression**

Create fixtures for two USD accounts and one UYU account. Assert these behaviors against exports from `src/lib/accounts.ts`:

```ts
import {
  accountBalance,
  accountMigrationSourceIds,
  analyzeFinancialAccounts,
  normalizeFinancialAccount,
  normalizeAccountEntry,
  type AccountEntry,
  type FinancialAccount,
} from "../src/lib/accounts";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const accounts: FinancialAccount[] = [
  {
    id: "account-bank",
    name: "Banco",
    purpose: "daily_cash",
    currency: "USD",
    classification: "liquid",
    classificationResolved: true,
    createdAt: "2026-06-28T12:00:00.000Z",
    updatedAt: "2026-06-28T12:00:00.000Z",
  },
  {
    id: "account-reserve",
    name: "Reserva personal",
    purpose: "personal_reserve",
    currency: "USD",
    classification: "restricted_liquid",
    classificationResolved: true,
    migratedWealthAssetId: "cash-legacy",
    createdAt: "2026-06-28T12:00:00.000Z",
    updatedAt: "2026-06-28T12:00:00.000Z",
  },
  {
    id: "account-pesos",
    name: "Banco UYU",
    purpose: "daily_cash",
    currency: "UYU",
    classification: "liquid",
    classificationResolved: true,
    createdAt: "2026-06-28T12:00:00.000Z",
    updatedAt: "2026-06-28T12:00:00.000Z",
  },
];

const entries: AccountEntry[] = [
  { id: "e1", eventId: "open-bank", accountId: "account-bank", amount: 5000, currency: "USD", createdAt: "2026-06-28T12:00:00.000Z" },
  { id: "e2", eventId: "transfer", accountId: "account-bank", amount: -1000, currency: "USD", createdAt: "2026-06-28T12:05:00.000Z" },
  { id: "e3", eventId: "transfer", accountId: "account-reserve", amount: 1000, currency: "USD", createdAt: "2026-06-28T12:05:00.000Z" },
  { id: "e4", eventId: "open-uyu", accountId: "account-pesos", amount: 41000, currency: "UYU", createdAt: "2026-06-28T12:10:00.000Z" },
];

assertEqual(accountBalance("account-bank", entries), 4000, "bank balance is entry-derived");
assertEqual(accountBalance("account-reserve", entries), 1000, "reserve receives transfer");

const summary = analyzeFinancialAccounts({ accounts, entries, uyuPerUsdRate: 41 });
assertEqual(summary.availableLiquidityUsd, 5000, "available liquidity converts UYU");
assertEqual(summary.restrictedLiquidityUsd, 1000, "restricted reserve remains separate");
assertEqual(summary.netWorthUsd, 6000, "resolved liquid accounts count once");
assertEqual(summary.partial, false, "known rate produces complete total");

const partial = analyzeFinancialAccounts({ accounts, entries });
assertEqual(partial.partial, true, "missing quote marks totals partial");
assertEqual(partial.unconvertedAccountIds[0], "account-pesos", "partial total names omitted account");

assertEqual(accountMigrationSourceIds(accounts).has("cash-legacy"), true, "migration source is excluded elsewhere");
assertEqual(normalizeFinancialAccount({ id: "x", name: " Bot ", purpose: "bot_operational", currency: "USD" }).classification, "unclassified", "investment-like account defaults unresolved");
assertEqual(normalizeAccountEntry({ id: "e", event_id: "v", account_id: "x", amount: "25", currency: "USD", created_at: "2026-06-28" }).amount, 25, "entry mapper restores numeric amount");
```

- [ ] **Step 3: Run the test to verify RED**

Run:

```powershell
npm run test:parser
```

Expected: TypeScript compilation fails because `src/lib/accounts.ts` does not exist.

- [ ] **Step 4: Implement the account domain**

Define these exact public types:

```ts
export type AccountCurrency = "USD" | "UYU";
export type AccountPurpose =
  | "daily_cash"
  | "personal_reserve"
  | "property_reserve"
  | "investment_vault"
  | "bot_operational"
  | "other";
export type AccountClassification =
  | "liquid"
  | "restricted_liquid"
  | "investment"
  | "bot_operational"
  | "unclassified";
export type AccountEventKind =
  | "opening_balance"
  | "transfer"
  | "adjustment"
  | "migration"
  | "reversal";

export type FinancialAccount = {
  id: string;
  name: string;
  purpose: AccountPurpose;
  currency: AccountCurrency;
  classification: AccountClassification;
  classificationResolved: boolean;
  migratedWealthAssetId?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountEvent = {
  id: string;
  kind: AccountEventKind;
  occurredOn: string;
  reason: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  sourceAmount?: number;
  destinationAmount?: number;
  effectiveExchangeRate?: number;
  reversedEventId?: string;
  createdAt: string;
};

export type AccountEntry = {
  id: string;
  eventId: string;
  accountId: string;
  amount: number;
  currency: AccountCurrency;
  createdAt: string;
};

export type AccountBalanceView = {
  account: FinancialAccount;
  nativeBalance: number;
  usdBalance?: number;
  conversionMissing: boolean;
};

export type FinancialAccountsAnalysis = {
  balances: AccountBalanceView[];
  availableLiquidityUsd: number;
  restrictedLiquidityUsd: number;
  netWorthUsd: number;
  unresolvedAccountIds: string[];
  unconvertedAccountIds: string[];
  partial: boolean;
};

export type CreateAccountInput = {
  accountId: string;
  openingEventId: string;
  name: string;
  purpose: AccountPurpose;
  currency: AccountCurrency;
  openingBalance: number;
  occurredOn: string;
};

export type TransferInput = {
  eventId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: number;
  destinationAmount: number;
  occurredOn: string;
  reason: string;
};

export type AdjustmentInput = {
  eventId: string;
  accountId: string;
  amount: number;
  occurredOn: string;
  reason: string;
};

export type ReversalInput = {
  eventId: string;
  originalEventId: string;
  occurredOn: string;
  reason: string;
};

export type CashMigrationInput = {
  accountId: string;
  eventId: string;
  wealthAssetId: string;
  name: string;
  currency: AccountCurrency;
  amount: number;
  occurredOn: string;
};
```

Implement and export:

```ts
export function accountBalance(accountId: string, entries: AccountEntry[]) {
  return roundMoney(
    entries.reduce(
      (total, entry) => total + (entry.accountId === accountId ? entry.amount : 0),
      0,
    ),
  );
}

export function accountMigrationSourceIds(accounts: FinancialAccount[]) {
  return new Set(
    accounts
      .map((account) => account.migratedWealthAssetId)
      .filter((id): id is string => Boolean(id)),
  );
}
```

`analyzeFinancialAccounts` must:

- exclude archived and unresolved accounts from aggregate totals;
- treat `liquid` as available liquidity;
- treat `restricted_liquid` as restricted liquidity;
- exclude `investment`, `bot_operational`, and `unclassified` in Phase 1;
- convert UYU with `balance / uyuPerUsdRate` only when the rate is finite and positive;
- list unresolved/missing-rate account IDs;
- return native balance rows for every account;
- round monetary outputs to two decimals.

Normalization must trim names, accept only known unions, coerce numeric row values, map snake_case columns, and default investment/bot purposes to unresolved `unclassified`.

Account creation classification follows one conservative mapping:

```ts
export function defaultAccountClassification(purpose: AccountPurpose) {
  if (purpose === "daily_cash") {
    return { classification: "liquid" as const, classificationResolved: true };
  }

  if (purpose === "personal_reserve" || purpose === "property_reserve") {
    return {
      classification: "restricted_liquid" as const,
      classificationResolved: true,
    };
  }

  return {
    classification: "unclassified" as const,
    classificationResolved: false,
  };
}
```

- [ ] **Step 5: Run GREEN and commit the domain unit**

Run `npm run test:parser`. Expected: all existing and account regressions pass.

Commit only `package.json`, `src/lib/accounts.ts`, and `tests/accounts-regression.ts`:

```powershell
git add -- package.json src/lib/accounts.ts tests/accounts-regression.ts
git commit -m "feat: add financial account domain"
```

### Task 2: Supabase ledger schema, RLS, and atomic RPCs

**Files:**
- Create: `supabase/migrations/20260628120000_create_financial_account_ledger.sql`
- Create: `tests/accounts-migration-regression.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a failing migration contract test**

The test reads the migration file and asserts exact security/invariant fragments:

```ts
import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const sql = readFileSync(
  "supabase/migrations/20260628120000_create_financial_account_ledger.sql",
  "utf8",
).toLowerCase();

for (const table of ["financial_accounts", "account_events", "account_entries"]) {
  assert(sql.includes(`alter table public.${table} enable row level security`), `${table} enables RLS`);
  assert(sql.includes(`auth.uid() = user_id`), `${table} read policies scope rows to auth user`);
}

for (const fn of [
  "ensure_primary_financial_account",
  "create_financial_account",
  "record_account_transfer",
  "record_account_adjustment",
  "reverse_account_event",
  "migrate_cash_asset_to_account",
  "archive_financial_account",
]) {
  assert(sql.includes(`function public.${fn}`), `${fn} exists`);
}

assert(sql.includes("security definer"), "mutations use narrow privileged RPCs");
assert(sql.includes("not allowed"), "RPCs verify auth.uid ownership");
assert(sql.includes("insufficient account balance"), "RPCs reject overdrafts");
assert(sql.includes("revoke insert, update, delete"), "browser roles cannot mutate ledger tables directly");
assert(!sql.includes("create policy \"users can delete own account entries\""), "entries have no delete policy");
```

Add `node .tmp/parser-tests/tests/accounts-migration-regression.js` after the domain test in `test:parser`.

- [ ] **Step 2: Run RED**

Run `npm run test:parser`. Expected: failure because the migration file does not exist.

- [ ] **Step 3: Create the migration**

Create tables with these required columns and constraints:

```sql
create table public.financial_accounts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  purpose text not null check (purpose in ('daily_cash','personal_reserve','property_reserve','investment_vault','bot_operational','other')),
  currency text not null check (currency in ('USD','UYU')),
  classification text not null check (classification in ('liquid','restricted_liquid','investment','bot_operational','unclassified')),
  classification_resolved boolean not null default false,
  migrated_wealth_asset_id text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.account_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('opening_balance','transfer','adjustment','migration','reversal')),
  occurred_on date not null,
  reason text not null default '',
  source_account_id uuid,
  destination_account_id uuid,
  source_amount numeric,
  destination_amount numeric,
  effective_exchange_rate numeric,
  reversed_event_id uuid,
  created_at timestamptz not null default now(),
  foreign key (source_account_id, user_id) references public.financial_accounts(id, user_id),
  foreign key (destination_account_id, user_id) references public.financial_accounts(id, user_id),
  unique (id, user_id),
  foreign key (reversed_event_id, user_id) references public.account_events(id, user_id)
);

create table public.account_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid not null,
  account_id uuid not null,
  amount numeric not null check (amount <> 0),
  currency text not null check (currency in ('USD','UYU')),
  created_at timestamptz not null default now(),
  foreign key (event_id, user_id) references public.account_events(id, user_id),
  foreign key (account_id, user_id) references public.financial_accounts(id, user_id)
);
```

Add indexes for `(user_id, archived_at)`, `(user_id, occurred_on desc)`, `(user_id, account_id)`, and unique `migrated_wealth_asset_id` per user when not null.

Enable RLS on all three tables with own-row select policies. Revoke direct insert, update, and delete privileges on all three tables from browser roles. All mutations happen through narrowly scoped `security definer` RPCs with `set search_path = public`, an explicit `auth.uid() = p_user_id` check, and ownership validation for every referenced row.

Each mutation RPC must:

- accept client-generated account/event IDs;
- return early when the owned event ID already exists, making retries idempotent;
- lock affected account rows with `for update`;
- reject archived accounts;
- reject non-positive amounts;
- reject source equals destination;
- check native currency and cross-currency destination amount;
- calculate current source balance from entries and reject overdrafts;
- insert the event and all entries within the same PostgreSQL transaction;
- require nonblank reasons for adjustment and reversal;
- forbid reversing a reversal or reversing the same event twice.

`ensure_primary_financial_account` inserts one zero-balance USD `Cuenta principal` with `daily_cash`, resolved `liquid`, using a deterministic UUID derived inside PostgreSQL from the user ID only when the user has no accounts.

`migrate_cash_asset_to_account` stores `migrated_wealth_asset_id` and creates a `migration` opening entry. It rejects non-positive values; debt validation remains in the client because wealth assets currently live in settings JSON.

Add no update/delete policies for events or entries and no destructive RPC.

- [ ] **Step 4: Run GREEN and inspect security**

Run:

```powershell
npm run test:parser
rg -n "enable row level security|auth.uid\(\) = user_id|security definer|revoke insert|delete policy" supabase/migrations/20260628120000_create_financial_account_ledger.sql
```

Expected: regression suite passes; output shows RLS and ownership checks and no ledger delete policy.

- [ ] **Step 5: Commit the migration unit**

```powershell
git add -- package.json tests/accounts-migration-regression.ts supabase/migrations/20260628120000_create_financial_account_ledger.sql
git commit -m "feat: add private account ledger schema"
```

### Task 3: Account persistence adapters

**Files:**
- Modify: `src/lib/supabase-persistence.ts`
- Modify: `tests/supabase-persistence-regression.ts`

- [ ] **Step 1: Write failing row-mapping and RPC tests**

Import the new adapters and assert:

```ts
const mappedAccount = financialAccountFromRow({
  id: "account-bank",
  name: "Banco",
  purpose: "daily_cash",
  currency: "USD",
  classification: "liquid",
  classification_resolved: true,
  created_at: "2026-06-28T12:00:00.000Z",
  updated_at: "2026-06-28T12:00:00.000Z",
});
assertEqual(mappedAccount.classificationResolved, true, "account mapper restores classification state");

const rpc = createRpcOnlySupabase();
await recordAccountTransfer(rpc.client, userId, {
  eventId: "00000000-0000-4000-8000-000000000401",
  sourceAccountId: "00000000-0000-4000-8000-000000000402",
  destinationAccountId: "00000000-0000-4000-8000-000000000403",
  sourceAmount: 100,
  destinationAmount: 4100,
  occurredOn: "2026-06-28",
  reason: "Reserva mensual",
});
assertEqual(rpc.calls[0].name, "record_account_transfer", "transfer uses atomic RPC");
assertEqual(rpc.calls[0].args.p_destination_amount, 4100, "transfer sends received amount");
```

Add equivalent calls for create account, adjustment, reversal, cash migration, and archive. Ensure error wrappers mention that no account movement was saved.

- [ ] **Step 2: Run RED**

Run `npm run test:parser`. Expected: missing exports from `supabase-persistence.ts`.

- [ ] **Step 3: Implement typed persistence**

Export:

```ts
export type AccountsData = {
  accounts: FinancialAccount[];
  events: AccountEvent[];
  entries: AccountEntry[];
};

export async function loadAccountsData(supabase: SupabaseClient, userId: string): Promise<AccountsData>;
export async function createFinancialAccount(supabase: SupabaseClient, userId: string, input: CreateAccountInput): Promise<void>;
export async function recordAccountTransfer(supabase: SupabaseClient, userId: string, input: TransferInput): Promise<void>;
export async function recordAccountAdjustment(supabase: SupabaseClient, userId: string, input: AdjustmentInput): Promise<void>;
export async function reverseAccountEvent(supabase: SupabaseClient, userId: string, input: ReversalInput): Promise<void>;
export async function migrateCashAssetToAccount(supabase: SupabaseClient, userId: string, input: CashMigrationInput): Promise<void>;
export async function archiveFinancialAccount(supabase: SupabaseClient, userId: string, accountId: string): Promise<void>;
```

`loadAccountsData` first calls `ensure_primary_financial_account`, then selects owned account/event/entry rows ordered by creation/date. Map rows through the pure normalizers. Mutation wrappers call exactly one RPC and use `actionError` with an action-specific Spanish message.

Update missing-function guidance so account RPC errors point to `20260628120000_create_financial_account_ledger.sql`, while note RPC errors continue pointing to their existing migration.

- [ ] **Step 4: Run GREEN and commit**

Run `npm run test:parser`. Expected: all persistence regressions pass.

```powershell
git add -- src/lib/supabase-persistence.ts tests/supabase-persistence-regression.ts
git commit -m "feat: persist account ledger operations"
```

### Task 4: Liquid account net-worth integration and cash migration exclusion

**Files:**
- Modify: `src/lib/finance/types.ts`
- Modify: `src/lib/finance/calculations.ts`
- Modify: `src/lib/finance/wealth-assets.ts`
- Modify: `tests/finance-structure-regression.ts`

- [ ] **Step 1: Write failing double-count regressions**

Add cases asserting:

```ts
const effectiveWithAccounts = calculateEffectiveInputs(
  baseInputs,
  emptyTransactionSummary,
  {
    wealthAssets: [
      {
        id: "cash-legacy",
        name: "Efectivo anterior",
        category: "efectivo",
        estimatedValue: 5000,
        debtBalance: 0,
        countsAsInvestmentCapital: false,
      },
    ],
    excludedWealthAssetIds: new Set(["cash-legacy"]),
    resolvedAccountNetWorth: 5000,
  },
);
assertEqual(effectiveWithAccounts.netWorth, 5000, "migrated cash is replaced, not duplicated");
```

Add a second case with an unrelated home asset plus account liquidity and assert both sum. Add a third case proving unresolved investment account value is absent from `resolvedAccountNetWorth` through `analyzeFinancialAccounts`.

- [ ] **Step 2: Run RED**

Run `npm run test:parser`. Expected: options are not recognized or the cash value equals 10000.

- [ ] **Step 3: Implement calculation options**

Extend `analyzeWealthAssets` with an optional exclusion set:

```ts
export function analyzeWealthAssets(
  assets: WealthAsset[] = [],
  options: { excludedAssetIds?: ReadonlySet<string> } = {},
): WealthAssetsSummary {
  return assets
    .filter((asset) => !options.excludedAssetIds?.has(asset.id))
    .reduce<WealthAssetsSummary>(
      (summary, asset) => {
        const estimatedValue = Math.max(0, Number.isFinite(asset.estimatedValue) ? asset.estimatedValue : 0);
        const debtBalance = Math.max(0, Number.isFinite(asset.debtBalance) ? asset.debtBalance : 0);
        const netAmount = estimatedValue - debtBalance;
        return {
          totalEstimatedValue: summary.totalEstimatedValue + estimatedValue,
          totalDebtBalance: summary.totalDebtBalance + debtBalance,
          netWorthAmount: summary.netWorthAmount + netAmount,
          investmentCapitalAmount: asset.countsAsInvestmentCapital
            ? summary.investmentCapitalAmount + netAmount
            : summary.investmentCapitalAmount,
        };
      },
      {
        totalEstimatedValue: 0,
        totalDebtBalance: 0,
        netWorthAmount: 0,
        investmentCapitalAmount: 0,
      },
    );
}
```

Extend `calculateEffectiveInputs` options with:

```ts
resolvedAccountNetWorth?: number;
excludedWealthAssetIds?: ReadonlySet<string>;
```

Pass exclusions into `analyzeWealthAssets` and add normalized `resolvedAccountNetWorth` to non-investment net worth exactly once. Preserve the existing portfolio and transaction behavior.

- [ ] **Step 4: Run GREEN and commit**

Run `npm run test:parser`. Expected: finance regressions pass.

```powershell
git add -- src/lib/finance/types.ts src/lib/finance/calculations.ts src/lib/finance/wealth-assets.ts tests/finance-structure-regression.ts
git commit -m "feat: include resolved accounts in net worth"
```

### Task 5: Accounts navigation and focused UI

**Files:**
- Create: `src/components/libertad-dashboard/accounts-panel.tsx`
- Modify: `src/components/libertad-dashboard/types.ts`
- Modify: `tests/navigation-modules-regression.ts`

- [ ] **Step 1: Write the failing navigation assertion**

```ts
assert(
  primaryModuleIds.includes("cuentas") && primaryModuleLabels.includes("Cuentas"),
  "primary navigation should expose financial accounts",
);
```

- [ ] **Step 2: Run RED**

Run `npm run test:parser`. Expected: navigation regression fails.

- [ ] **Step 3: Add Accounts to navigation**

Add `"cuentas"` to `AppSection` and insert this primary module before Configuración:

```ts
{
  id: "cuentas",
  label: "Cuentas",
  description: "Liquidez y transferencias",
}
```

- [ ] **Step 4: Implement the Accounts panel**

Export one component with controlled props:

```ts
type AccountsPanelProps = {
  accounts: FinancialAccount[];
  events: AccountEvent[];
  entries: AccountEntry[];
  summary: FinancialAccountsAnalysis;
  wealthAssets: WealthAsset[];
  status: SaveStatus;
  error: string;
  onCreate: (input: CreateAccountInput) => Promise<void>;
  onTransfer: (input: TransferInput) => Promise<void>;
  onAdjust: (input: AdjustmentInput) => Promise<void>;
  onReverse: (input: ReversalInput) => Promise<void>;
  onMigrateCash: (input: CashMigrationInput) => Promise<void>;
  onArchive: (accountId: string) => Promise<void>;
};
```

The rendered structure must contain:

- `<section aria-labelledby="accounts-title">` with available liquidity, restricted liquidity, and partial-conversion status;
- account rows with native balance, USD equivalent, purpose/classification, archived state, and unresolved label;
- inline create form with name, purpose, USD/UYU currency, opening amount, date, and explicit checkbox confirming a nonzero opening amount is not already represented as `Efectivo`;
- transfer form with source, destination, date, source amount, conditional received amount, computed effective rate, and reason;
- adjustment form with account, add/subtract direction, amount, date, and mandatory reason;
- migration list containing only unlinked `efectivo` assets with zero debt and buttons that open a confirmation summary;
- blocked migration copy for cash assets with debt;
- event history ordered newest first with transfer/adjustment/migration/reversal labels;
- reversal controls requiring a reason and excluding already reversed/reversal events;
- archive control disabled unless the account balance is zero;
- inline `aria-live="polite"` status and error messages;
- visible focus rings and minimum 40px controls using existing `libertad-field`, stone, and emerald classes.

Use local component state only for form drafts and disclosure state. Generate UUIDs through `crypto.randomUUID()` at submission time. Do not add dependencies or use `window.alert()`.

- [ ] **Step 5: Run focused verification and commit**

Run:

```powershell
npm run test:parser
npx eslint src/components/libertad-dashboard/accounts-panel.tsx src/components/libertad-dashboard/types.ts tests/navigation-modules-regression.ts
```

Expected: tests and focused lint pass.

```powershell
git add -- src/components/libertad-dashboard/accounts-panel.tsx src/components/libertad-dashboard/types.ts tests/navigation-modules-regression.ts
git commit -m "feat: add accounts workspace"
```

### Task 6: Dashboard state, actions, FX, and section rendering

**Files:**
- Modify: `src/components/libertad-dashboard.tsx`

- [ ] **Step 1: Establish the compile-failing integration**

Import `AccountsPanel`, account analysis helpers/types, and persistence functions. Add typed state and render `<AccountsPanel>` for `activeSection === "cuentas"` before Configuración. Run `npx tsc --noEmit` and verify RED because required props/handlers are not yet defined.

- [ ] **Step 2: Add account load/reset behavior**

Add:

```ts
const [accountsData, setAccountsData] = useState<AccountsData>({
  accounts: [],
  events: [],
  entries: [],
});
const [accountStatus, setAccountStatus] = useState<SaveStatus>("idle");
const [accountError, setAccountError] = useState("");
```

Load `loadAccountsData(supabase, userId)` with dashboard, transactions, and fixed expenses. Reset all three account arrays/status/errors on sign-out and auth-user changes.

Compute:

```ts
const hasUyuAccount = accountsData.accounts.some(
  (account) => !account.archivedAt && account.currency === "UYU",
);
const accountAnalysis = useMemo(
  () => analyzeFinancialAccounts({
    accounts: accountsData.accounts,
    entries: accountsData.entries,
    uyuPerUsdRate,
  }),
  [accountsData, uyuPerUsdRate],
);
```

Extend the existing FX fetch trigger to run when either a UYU fixed expense or UYU account exists.

- [ ] **Step 3: Add reload-after-mutation handlers**

Create one helper:

```ts
async function runAccountAction(action: () => Promise<void>) {
  if (!supabase || !userId) return;
  setAccountStatus("saving");
  setAccountError("");
  try {
    await action();
    setAccountsData(await loadAccountsData(supabase, userId));
    setAccountStatus("saved");
  } catch (error) {
    setAccountStatus("error");
    setAccountError((error as Error).message);
    throw error;
  }
}
```

Wrap create, transfer, adjustment, reversal, cash migration, and archive persistence functions. The component catches rejected submission promises only to preserve its draft; the dashboard owns the visible error state.

- [ ] **Step 4: Integrate net worth without double counting**

Compute `migratedAssetIds = accountMigrationSourceIds(accountsData.accounts)` and pass:

```ts
{
  investmentCapitalAmount: targetPortfolio.totalCurrentAmount > 0
    ? targetPortfolio.totalCurrentAmount
    : undefined,
  wealthAssets,
  excludedWealthAssetIds: migratedAssetIds,
  resolvedAccountNetWorth: accountAnalysis.netWorthUsd,
}
```

Keep account totals out of invested capital in Phase 1. If `accountAnalysis.partial`, show the dashboard net-worth metric with supporting copy that some account balances remain unconverted.

- [ ] **Step 5: Render and verify GREEN**

Render `AccountsPanel` with all handlers. Run:

```powershell
npm run test:parser
npx eslint src/components/libertad-dashboard.tsx src/components/libertad-dashboard/accounts-panel.tsx
npx tsc --noEmit
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit dashboard integration**

```powershell
git add -- src/components/libertad-dashboard.tsx
git commit -m "feat: connect account ledger to dashboard"
```

### Task 7: Phase 1 changelog and verification checkpoint

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add the scoped changelog entry**

Under the current unreleased/latest section, add bullets stating:

```markdown
* Cuentas agrega saldos derivados de movimientos auditables, transferencias internas, ajustes con motivo y reversos sin edición libre del saldo.
* Las cuentas líquidas confirmadas forman parte del patrimonio sin duplicar activos `Efectivo` migrados explícitamente.
* Las cuentas de inversión y Bot quedan pendientes de clasificación hasta su vinculación en una fase posterior.
```

Preserve all pre-existing user edits in `CHANGELOG.md` and stage only the new bullets.

- [ ] **Step 2: Run full fresh verification**

```powershell
npm run test:parser
npm run lint
npm run build
```

Expected: every command exits 0 with no test failures, lint errors, or build errors.

- [ ] **Step 3: Review the migration and diff**

```powershell
git status --short
git diff --check
git diff --stat
git diff -- supabase/migrations/20260628120000_create_financial_account_ledger.sql
```

Verify:

- no `.env` or credentials appear;
- only Phase 1 files are included;
- pre-existing unrelated documentation/skill changes remain unstaged;
- all private tables enable RLS and scope access by `auth.uid() = user_id`;
- account events and entries have no update/delete path;
- investment/bot accounts remain excluded from Phase 1 totals.

- [ ] **Step 4: Commit the changelog only after checks pass**

```powershell
git add -p -- CHANGELOG.md
git commit -m "docs: record account ledger phase one"
```

- [ ] **Step 5: Stop at the Phase 1 checkpoint**

Report:

- verification commands and results;
- migration filename and the requirement to run it in Supabase;
- commit hashes and files changed;
- that nothing was pushed;
- that Vercel should not deploy successfully until the Supabase migration is applied;
- deferred Phase 2 work: note account assignment, mixed-mode notice, portfolio/bot linking;
- deferred Phase 3 work: CSV exports.

Do not begin Phase 2 until the user reviews the Phase 1 result.
