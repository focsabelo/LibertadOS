# CSV exports and multi-account ledger design

## Decision

Libertad OS will add two connected capabilities:

1. CSV exports for confirmed and user-owned financial data.
2. Financial accounts whose balances are derived from an auditable ledger, with internal transfers, controlled adjustments, and explicit migrations from existing sources.

The implementation must preserve the product's confirmation boundary, avoid double counting, keep legacy data working, and remain a calm personal-finance tool rather than exposing accounting machinery in the interface.

## Scope

### Included

- One automatically created `Cuenta principal` with a zero balance.
- User-created accounts with a name, purpose, currency, classification state, and active/archived status.
- Balances derived from immutable ledger entries.
- Opening balances represented as audited ledger events.
- Income and expense entries created atomically when a financial note is confirmed.
- A required account selection for each newly confirmed financial item, defaulting to `Cuenta principal`.
- Internal transfers between accounts.
- Cross-currency transfers that store the amount sent, amount received, and effective exchange rate.
- Manual adjustments with a mandatory reason and date.
- Reversals instead of destructive movement deletion or editing.
- Explicit migration of existing `Efectivo` wealth assets into accounts.
- Explicit linking of investment and bot accounts to existing portfolio sources.
- Visible mixed-mode status when legacy transactions without accounts coexist with account-backed transactions.
- Individual CSV downloads for supported datasets.

### Excluded

- Bank synchronization or external financial-provider connections.
- Daily net-worth snapshots and historical snapshot exports.
- Automatic migration or inferred linking of old data.
- Free editing of current account balances.
- Deleting ledger history.
- A full double-entry accounting interface, reconciliation workflow, or general ledger terminology in the UI.
- Importing CSV data back into Libertad OS.

## Architecture

Use a lightweight immutable ledger internally. The UI exposes familiar accounts, transfers, adjustments, and activity; it does not expose debit/credit concepts.

The data model has three main objects:

- `financial_accounts`: account identity, currency, purpose, classification, optional link to a legacy source, and archive state.
- `account_events`: the user-meaningful action and its audit metadata, such as opening balance, confirmed income, confirmed expense, transfer, adjustment, migration, or reversal.
- `account_entries`: signed changes to one account produced by an event. A transfer produces one negative source entry and one positive destination entry. Income produces a positive entry; expense produces a negative entry.

An account balance is always the sum of its entries. No mutable balance column is the source of truth.

### Event rules

- Opening balance: one signed entry, created only through account creation or explicit migration.
- Confirmed income: one positive entry linked to the confirmed transaction.
- Confirmed expense or debt outflow: one negative entry linked to the confirmed transaction.
- Transfer: two entries under one event. It never changes net worth, cash flow, income, expense, or saving rate.
- Cross-currency transfer: the source and destination entries keep their native amounts. The event stores both amounts and the effective exchange rate.
- Adjustment: one signed entry with a mandatory reason. It represents a real correction, not free balance editing.
- Reversal: a new event with counter-entries linked to the original event. The original remains immutable and visible.

Account currency becomes immutable after the first ledger entry. Accounts can only be archived with a zero balance. Archived accounts and events remain exportable.

## Account classification

Account purposes are practical labels such as daily cash, personal reserve, property reserve, investment vault, bot operational capital, and other. Purpose does not by itself determine financial treatment.

Classification is explicit:

- `liquid`: contributes to liquid net worth.
- `restricted_liquid`: contributes to net worth and restricted liquidity, not freely available liquidity.
- `investment`: contributes to invested/productive capital only after classification is resolved.
- `bot_operational`: contributes to bot operational capital only after an explicit link to the Bot source.
- `unclassified`: does not silently enter dashboard totals.

An investment-like account starts unresolved unless the user either links it to an existing portfolio source or explicitly confirms that its value is not represented elsewhere. Until resolved, the app displays it as `Pendiente de clasificación` and excludes it from productive-capital metrics and dashboard totals.

## Double-counting prevention and migrations

### Existing cash assets

An existing wealth asset with category `efectivo` can be converted through an explicit preview flow. Migration:

1. Shows the source asset, destination account name, currency, and opening amount.
2. Requires user confirmation.
3. Creates the account and opening event.
4. Records the source wealth-asset ID on the account.
5. Preserves the original wealth-asset record as migration history.
6. Excludes that source asset from effective net-worth calculations while its migrated account is the active source.

Cash assets with associated debt cannot be migrated until reviewed. Nothing is migrated or removed automatically.

### Portfolio and bot sources

Investment and bot accounts require explicit linking when an equivalent value already exists in Cartera or Bot. Once linked, the account balance becomes the active value source for the linked metric. Existing manual values and bot history remain stored for audit but are excluded from the effective calculation while the link is active.

### Confirmed transactions

Newly confirmed note items require an account. Confirmation writes the note, confirmed transactions, ledger events, and ledger entries atomically in one Supabase operation.

Account-backed transactions affect net worth through account balances and must not also be added through the legacy transaction delta. Legacy transactions without an account retain their current behavior. The dashboard and Accounts screen show a mixed-mode notice with the count of legacy unassigned transactions whenever both sources are present.

No historical transaction is assigned to an account automatically.

## Currency treatment

Every account has one native currency. Every entry is stored in that currency.

For cross-currency transfers, the source amount, received amount, and effective exchange rate are immutable audit data. The transfer remains net-worth neutral at the event level; small valuation differences caused by the current reporting exchange rate are presented as conversion effects, not income or spending.

Dashboard totals use the app's current trusted conversion flow. If a required quote is unavailable, the app shows a partial total and identifies the accounts that could not be converted. It must not silently invent a rate.

## Interface

### Navigation and Accounts screen

Add `Cuentas` to the primary navigation. The screen contains:

- Total available liquidity, restricted liquidity, and the number of unresolved accounts.
- An account list with native balance, USD equivalent when available, purpose, classification, and status.
- Clear actions for `Transferir`, `Ajustar`, `Nueva cuenta`, and account activity.
- Inline expandable forms rather than modal-heavy flows.
- A chronological activity list showing event type, source/destination, native amounts, exchange rate when applicable, date, reason, and reversal relationship.
- Empty, loading, saving, validation, partial-conversion, and persistence-error states.
- A migration section for eligible `Efectivo` wealth assets.
- A persistent mixed-mode notice when old unassigned transactions coexist with account-backed movements.

Controls retain the existing restrained stone/emerald visual language, visible keyboard focus, readable financial numerals, and responsive layouts.

### Note confirmation

Every confirmable financial item displays an account selector. `Cuenta principal` is selected by default. Confirmation is blocked if the selected account is archived, incompatible, or unavailable. A failed atomic save leaves both the transaction and account balance unchanged.

### Adjustments and reversals

Adjustment input requires direction, amount, date, and reason. The UI labels adjustments as corrections and warns that they are audit records. Existing events offer a reversal action rather than edit/delete. Reversal requires confirmation and a reason.

## CSV exports

Add an `Exportar datos` section to Configuración with independent downloads for:

- Confirmed transactions.
- Confirmed notes.
- Financial accounts.
- Account events and entries.
- Wealth assets.
- Fixed monthly expenses.
- Current roadmap state.

Snapshot history is not offered until snapshots exist. No empty or misleading snapshot export is created.

Exports preserve stable IDs, dates, native currencies and amounts, USD conversions when known, linkage IDs, source text, confirmation state, archived state, and audit reasons. Roadmap rows include an export timestamp because roadmap status is derived at export time.

### CSV safety and compatibility

- Encode files as UTF-8 with a BOM for Excel compatibility.
- Use consistent RFC 4180 quoting and CRLF row endings.
- Preserve embedded commas, quotation marks, and line breaks.
- Treat financial amounts as numeric fields rather than user text.
- Neutralize formula injection in user-controlled string cells beginning with `=`, `+`, `-`, or `@` by prefixing a single quote before CSV escaping.
- Generate files in the browser without adding a dependency.

## Persistence and security

All schema changes live in a new Supabase migration. Every new private table enables RLS. Select, insert, update, and permitted archival operations require `auth.uid() = user_id`. Ledger rows must reference accounts owned by the same authenticated user.

Database functions validate ownership, account status, currency consistency, positive amounts, required reasons, transfer source/destination differences, and balanced event structure. Atomic functions cover note confirmation with ledger entries, transfers, adjustments, reversals, and explicit migrations.

Client code uses only the existing public Supabase URL and anonymous key with the authenticated session. No service-role behavior or client-side RLS bypass is introduced.

## Failure behavior

- Atomic persistence error: show an inline error and write nothing.
- Missing FX quote: keep native balances visible, mark aggregate totals partial, and identify omitted conversions.
- Invalid transfer: prevent same-account transfers, non-positive amounts, archived accounts, and missing received amount for cross-currency transfers.
- Insufficient source balance: block the transfer; negative balances are not allowed in this scope.
- Duplicate submission: use stable IDs/idempotent database behavior so retries do not duplicate ledger events.
- Legacy mixed mode: show a notice; do not force migration.
- Unresolved investment classification: show the balance locally but exclude it from dashboard totals until resolved.

## Testing strategy

Implementation follows red-green-refactor TDD. Focused regression tests cover:

- Balance derivation from opening, income, expense, adjustment, transfer, and reversal entries.
- Same-currency and cross-currency transfers.
- Transfer neutrality for net worth, cash flow, spending, and saving rate.
- Rejection of invalid or overdrawn transfers.
- Explicit cash-asset migration and source exclusion without data deletion.
- Investment/bot linking and productive-capital double-count prevention.
- Mixed legacy/account-backed transaction calculations and visible status derivation.
- Atomic note confirmation payloads and failure normalization.
- Account normalization and persistence mappings.
- RLS and ownership clauses in the migration.
- CSV quoting, embedded line breaks, BOM, CRLF, numeric values, and formula-injection protection.
- Every export dataset and derived roadmap rows.
- Existing parser, finance, navigation, and Supabase persistence regressions.

After focused tests, run the complete existing regression script, lint, and a production build because the change affects persistence, financial calculations, navigation, and user flows.

## Acceptance criteria

- Account balances cannot be freely edited and always reconcile to immutable ledger entries.
- A confirmed note updates its chosen account atomically.
- Internal transfers never appear as spending or income and do not change total net worth.
- Cross-currency transfers retain both native amounts and their effective exchange rate.
- Adjustments and corrections are fully auditable.
- Existing data continues to work without automatic migration.
- Mixed mode is visible whenever legacy and account-backed transaction models coexist.
- Cash, investment, portfolio, and bot values are counted at most once.
- Unclassified investment accounts do not silently increase productive capital or dashboard totals.
- CSV downloads are complete for the implemented datasets and safe to open in Excel/Sheets.
- No private row can be accessed across users under RLS.
