import {
  FIXED_MONTHLY_EXPENSE_CATEGORIES,
  FIXED_MONTHLY_EXPENSE_CURRENCIES,
  createFixedMonthlyExpenseDraft,
  fixedMonthlyExpenseUsdEquivalent,
  summarizeActiveFixedExpenses,
  type FixedMonthlyExpense,
  type FixedMonthlyExpenseDraft,
} from "@/lib/fixed-monthly-expenses";
import { formatCurrencyAmount } from "./formatting";
import type { SaveStatus } from "./types";

export function FixedMonthlyExpensesPanel({
  expenses,
  draftText,
  editDraft,
  editingExpenseId,
  loading,
  error,
  actionStatus,
  uyuPerUsdRate,
  onDraftTextChange,
  onEditDraftChange,
  onCreate,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete,
}: {
  expenses: FixedMonthlyExpense[];
  draftText: string;
  editDraft: FixedMonthlyExpenseDraft;
  editingExpenseId: string;
  loading: boolean;
  error: string;
  actionStatus: SaveStatus;
  uyuPerUsdRate?: number;
  onDraftTextChange: (value: string) => void;
  onEditDraftChange: (value: FixedMonthlyExpenseDraft) => void;
  onCreate: () => void;
  onStartEdit: (expense: FixedMonthlyExpense) => void;
  onCancelEdit: () => void;
  onSaveEdit: (expense: FixedMonthlyExpense) => void;
  onToggle: (expense: FixedMonthlyExpense) => void;
  onDelete: (expense: FixedMonthlyExpense) => void;
}) {
  const parsedDraft = draftText.trim()
    ? createFixedMonthlyExpenseDraft(draftText)
    : null;
  const activeTotals = summarizeActiveFixedExpenses(expenses);
  const totalLabel =
    activeTotals.length > 0
      ? activeTotals
          .map((total) => formatCurrencyAmount(total.currency, total.amount))
          .join(" + ")
      : formatCurrencyAmount("USD", 0);
  const usdEquivalent = fixedMonthlyExpenseUsdEquivalent(
    activeTotals,
    uyuPerUsdRate,
  );
  const usdEquivalentLabel =
    usdEquivalent !== undefined
      ? formatCurrencyAmount("USD", usdEquivalent)
      : "";

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-stone-950">
            Gastos fijos mensuales
          </h2>
        </div>
        <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
          <p className="text-xs font-medium text-stone-500">
            Total gastos fijos mensuales
          </p>
          <p className="libertad-number mt-1 text-base font-semibold text-stone-950">
            {totalLabel}
            {usdEquivalentLabel ? (
              <span className="ml-2 whitespace-nowrap text-sm font-semibold text-stone-500">
                equiv. {usdEquivalentLabel}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">
            Nuevo gasto fijo
          </span>
          <textarea
            autoComplete="off"
            className="libertad-field libertad-ledger min-h-28 resize-y rounded-md bg-white px-4 py-3 text-base leading-8 text-stone-950 placeholder:text-stone-500"
            name="fixed-expense-capture"
            placeholder="Ej: Alquiler apartamento UYU 42000…"
            value={draftText}
            onChange={(event) => onDraftTextChange(event.target.value)}
          />
        </label>

        <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">
            Lectura previa
          </p>
          {parsedDraft ? (
            <div className="mt-3 grid gap-2">
              <FixedExpensePreviewStat label="Nombre" value={parsedDraft.name} />
              <FixedExpensePreviewStat label="Categoria" value={parsedDraft.category} />
              <FixedExpensePreviewStat
                label="Monto mensual"
                value={formatCurrencyAmount(
                  parsedDraft.currency,
                  parsedDraft.monthlyAmount,
                )}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Escribe una linea; los campos quedan editables despues.
            </p>
          )}
          <button
            className="mt-4 h-11 w-full rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:bg-stone-300 disabled:text-stone-600"
            disabled={actionStatus === "saving" || !draftText.trim()}
            type="button"
            onClick={onCreate}
          >
            {actionStatus === "saving" ? "Guardando…" : "Crear gasto fijo"}
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4 min-h-6">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-950">
            {error}
          </p>
        ) : actionStatus === "saved" ? (
          <p className="text-sm font-medium text-emerald-800">Guardado.</p>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
        <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[var(--surface-muted)] px-4 py-2">
          <p className="text-sm font-semibold text-stone-800">
            Lista de gastos fijos
          </p>
          <p className="text-xs font-medium text-stone-500">
            {expenses.length} registro(s)
          </p>
        </div>

        {loading ? (
          <div className="grid gap-2 bg-white p-4">
            <div className="h-14 animate-pulse rounded-md bg-stone-100" />
            <div className="h-14 animate-pulse rounded-md bg-stone-100" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white p-4">
            <EmptyState
              title="Sin gastos fijos"
              body="Crea el primero con una linea de texto y luego ajusta los campos."
            />
          </div>
        ) : (
          <div className="divide-y divide-stone-200 bg-white">
            {expenses.map((expense) =>
              editingExpenseId === expense.id ? (
                <FixedExpenseEditRow
                  key={expense.id}
                  draft={editDraft}
                  expense={expense}
                  saving={actionStatus === "saving"}
                  onCancel={onCancelEdit}
                  onChange={onEditDraftChange}
                  onDelete={() => onDelete(expense)}
                  onSave={() => onSaveEdit(expense)}
                />
              ) : (
                <FixedExpenseListRow
                  key={expense.id}
                  expense={expense}
                  saving={actionStatus === "saving"}
                  onDelete={() => onDelete(expense)}
                  onEdit={() => onStartEdit(expense)}
                  onToggle={() => onToggle(expense)}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FixedExpenseListRow({
  expense,
  saving,
  onEdit,
  onToggle,
  onDelete,
}: {
  expense: FixedMonthlyExpense;
  saving: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-stone-950">
            {expense.name}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              expense.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-stone-50 text-stone-600"
            }`}
          >
            {expense.active ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          {expense.category} -{" "}
          <span className="libertad-number font-semibold text-stone-900">
            {formatCurrencyAmount(expense.currency, expense.monthlyAmount)}
          </span>
        </p>
        {expense.note ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
            {expense.note}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:text-stone-400"
          disabled={saving}
          type="button"
          onClick={onToggle}
        >
          {expense.active ? "Desactivar" : "Activar"}
        </button>
        <button
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:text-stone-400"
          disabled={saving}
          type="button"
          onClick={onEdit}
        >
          Editar
        </button>
        <button
          className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:text-red-900 disabled:opacity-45"
          disabled={saving}
          type="button"
          onClick={onDelete}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function FixedExpenseEditRow({
  expense,
  draft,
  saving,
  onChange,
  onSave,
  onCancel,
  onDelete,
}: {
  expense: FixedMonthlyExpense;
  draft: FixedMonthlyExpenseDraft;
  saving: boolean;
  onChange: (draft: FixedMonthlyExpenseDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 bg-stone-50 px-4 py-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Nombre</span>
          <input
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950"
            name={`fixed-expense-name-${expense.id}`}
            type="text"
            value={draft.name}
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Categoria</span>
          <select
            autoComplete="off"
            className="libertad-field h-11 rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
            name={`fixed-expense-category-${expense.id}`}
            value={draft.category}
            onChange={(event) =>
              onChange({
                ...draft,
                category: event.target.value as FixedMonthlyExpenseDraft["category"],
              })
            }
          >
            {FIXED_MONTHLY_EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">
            Monto mensual
          </span>
          <input
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950"
            inputMode="decimal"
            min="0"
            name={`fixed-expense-amount-${expense.id}`}
            step="1"
            type="number"
            value={draft.monthlyAmount}
            onChange={(event) =>
              onChange({
                ...draft,
                monthlyAmount: Number.isFinite(Number(event.target.value))
                  ? Number(event.target.value)
                  : 0,
              })
            }
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Moneda</span>
          <select
            autoComplete="off"
            className="libertad-field h-11 rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
            name={`fixed-expense-currency-${expense.id}`}
            value={draft.currency}
            onChange={(event) =>
              onChange({ ...draft, currency: event.target.value })
            }
          >
            {FIXED_MONTHLY_EXPENSE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2">
        <input
          checked={draft.active}
          className="h-4 w-4 accent-emerald-700"
          name={`fixed-expense-active-${expense.id}`}
          type="checkbox"
          onChange={(event) =>
            onChange({ ...draft, active: event.target.checked })
          }
        />
        <span className="text-sm font-medium text-stone-700">
          Gasto fijo activo
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-700">
          Nota opcional
        </span>
        <textarea
          autoComplete="off"
          className="libertad-field min-h-24 resize-y rounded-md px-3 py-2 text-sm leading-6 text-stone-950"
          name={`fixed-expense-note-${expense.id}`}
          value={draft.note}
          onChange={(event) =>
            onChange({ ...draft, note: event.target.value })
          }
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          className="h-10 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:text-red-900 disabled:opacity-45"
          disabled={saving}
          type="button"
          onClick={onDelete}
        >
          Eliminar
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:text-stone-400"
            disabled={saving}
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:bg-stone-300 disabled:text-stone-600"
            disabled={saving}
            type="button"
            onClick={onSave}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FixedExpensePreviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="libertad-number mt-1 break-words text-base font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-white p-4">
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
}
