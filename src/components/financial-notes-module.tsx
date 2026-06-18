"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CORE_EXPENSE_CATEGORIES,
  freedomNumber,
  incomeRuleSuggestion,
  monthlyEquivalentExpense,
  type CoreExpenseCategory,
} from "@/lib/finance";
import {
  NOTE_FOLDERS,
  analyzeFinancialNote,
  createEmptyNote,
  deriveNoteTitle,
  financialTypeLabel,
  intentLabel,
  isConfirmable,
  recalculateDetectedFinancialItem,
  type ConfirmedFinancialTransaction,
  type AntiErrorRiskLevel,
  type DetectedFinancialItem,
  type FinancialFolder,
  type FinancialNote,
  type FinancialType,
  type TransactionIntent,
} from "@/lib/financial-notes";

const NOTES_STORAGE_KEY = "libertad-os-financial-notes-v2";
const TRANSACTIONS_STORAGE_KEY = "libertad-os-transactions-v2";
const CONFIRMED_NOTE_DELETE_WARNING =
  "Esta nota ya generó movimientos en el dashboard. Si la borrás, también se eliminarán esos movimientos.";

const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 0,
});

const quickCaptureActions = [
  { label: "Comida", text: "Gaste 0 en comida." },
  { label: "Transporte", text: "Gaste 0 en transporte." },
  { label: "Vivienda", text: "Pague 0 de vivienda mensual." },
  { label: "Ingreso", text: "Cobre 0." },
  { label: "Inversion", text: "Inverti 0 en ETF." },
  {
    label: "Compra grande",
    text: "Quiero comprar 0 en una compra grande. Evaluar antes de decidir.",
  },
];

type FinancialNotesModuleProps = {
  onTransactionsChange: (transactions: ConfirmedFinancialTransaction[]) => void;
};

type DetectedSummary = {
  total: number;
  real: number;
  blocked: number;
  ignored: number;
  core: number;
  impulse: number;
  antiError: number;
  highRisk: number;
  freedomImpact: number;
  potentialFreedomImpact: number;
};

export function FinancialNotesModule({
  onTransactionsChange,
}: FinancialNotesModuleProps) {
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [transactions, setTransactions] = useState<
    ConfirmedFinancialTransaction[]
  >([]);
  const [selectedFolder, setSelectedFolder] =
    useState<FinancialFolder>("Captura rapida");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const storedNotes = window.localStorage.getItem(NOTES_STORAGE_KEY);
    const storedTransactions = window.localStorage.getItem(
      TRANSACTIONS_STORAGE_KEY,
    );
    const parsedNotes = storedNotes
      ? (JSON.parse(storedNotes) as FinancialNote[]).map((note) =>
          note.confirmedTransactionIds.length > 0
            ? note
            : { ...note, analysis: analyzeFinancialNote(note.body) },
        )
      : [createEmptyNote()];
    const parsedTransactionsRaw = storedTransactions
      ? (JSON.parse(storedTransactions) as ConfirmedFinancialTransaction[])
      : [];
    const noteIds = new Set(parsedNotes.map((note) => note.id));
    const parsedTransactions = parsedTransactionsRaw.filter((transaction) =>
      noteIds.has(transaction.noteId),
    );

    queueMicrotask(() => {
      setNotes(parsedNotes);
      setTransactions(parsedTransactions);
      setSelectedNoteId(parsedNotes[0]?.id ?? "");
      onTransactionsChange(parsedTransactions);
      setHasLoaded(true);
    });
  }, [onTransactionsChange]);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [hasLoaded, notes]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions),
    );
    onTransactionsChange(transactions);
  }, [hasLoaded, onTransactionsChange, transactions]);

  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  const filteredNotes = notes.filter((note) => note.folder === selectedFolder);
  const selectedSummary = useMemo(
    () => summarizeDetectedItems(selectedNote?.analysis ?? []),
    [selectedNote],
  );

  const folderCounts = useMemo(() => {
    return NOTE_FOLDERS.reduce<Record<FinancialFolder, number>>(
      (accumulator, folder) => {
        accumulator[folder] = notes.filter((note) => note.folder === folder).length;
        return accumulator;
      },
      {} as Record<FinancialFolder, number>,
    );
  }, [notes]);

  const noteAlreadyConfirmed =
    (selectedNote?.confirmedTransactionIds.length ?? 0) > 0;
  const notePendingReconfirmation =
    Boolean(selectedNote?.pendingReconfirmation) && !noteAlreadyConfirmed;
  const confirmableCount = noteAlreadyConfirmed
    ? 0
    : selectedNote?.analysis.filter(isConfirmable).length ?? 0;

  function createNote(folder = selectedFolder) {
    const note = createEmptyNote(folder);

    setNotes((current) => [note, ...current]);
    setSelectedFolder(folder);
    setSelectedNoteId(note.id);
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  function updateSelectedNote(body: string) {
    const analysis = analyzeFinancialNote(body);
    const noteWasConfirmed =
      (selectedNote?.confirmedTransactionIds.length ?? 0) > 0;

    setNotes((current) =>
      current.map((note) =>
        note.id === selectedNoteId
          ? {
              ...note,
              body,
              title: deriveNoteTitle(body),
              updatedAt: new Date().toISOString(),
              analysis,
              confirmedTransactionIds:
                note.confirmedTransactionIds.length > 0
                  ? []
                  : note.confirmedTransactionIds,
              pendingReconfirmation:
                note.confirmedTransactionIds.length > 0
                  ? true
                  : note.pendingReconfirmation,
            }
          : note,
      ),
    );

    if (noteWasConfirmed) {
      setTransactions((current) =>
        current.filter((transaction) => transaction.noteId !== selectedNoteId),
      );
    }
  }

  function appendQuickCapture(text: string) {
    if (!selectedNote) {
      const note = createEmptyNote("Captura rapida");
      const analysis = analyzeFinancialNote(text);

      setNotes((current) => [
        {
          ...note,
          body: text,
          title: deriveNoteTitle(text),
              analysis,
              pendingReconfirmation: false,
            },
        ...current,
      ]);
      setSelectedNoteId(note.id);
      return;
    }

    const separator = selectedNote.body.trim().length > 0 ? "\n" : "";
    updateSelectedNote(`${selectedNote.body}${separator}${text}`);
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  function updateDetectedItem(
    itemId: string,
    patch: Partial<DetectedFinancialItem>,
  ) {
    const noteWasConfirmed =
      (selectedNote?.confirmedTransactionIds.length ?? 0) > 0;

    setNotes((current) =>
      current.map((note) =>
        note.id === selectedNoteId
          ? {
              ...note,
              analysis: note.analysis.map((item) =>
                item.id === itemId
                  ? recalculateDetectedFinancialItem({ ...item, ...patch })
                  : item,
              ),
              confirmedTransactionIds: [],
              pendingReconfirmation:
                note.confirmedTransactionIds.length > 0
                  ? true
                  : note.pendingReconfirmation,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );

    if (noteWasConfirmed) {
      setTransactions((current) =>
        current.filter((transaction) => transaction.noteId !== selectedNoteId),
      );
    }
  }

  function confirmDetectedItems() {
    if (!selectedNote || noteAlreadyConfirmed) {
      return;
    }

    const confirmedItems = selectedNote.analysis.filter(isConfirmable);

    if (confirmedItems.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const newTransactions = confirmedItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      noteId: selectedNote.id,
      noteTitle: selectedNote.title,
      confirmedAt: now,
    }));

    setTransactions((current) => [...newTransactions, ...current]);
    setNotes((current) =>
      current.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              confirmedTransactionIds: newTransactions.map(
                (transaction) => transaction.id,
              ),
              pendingReconfirmation: false,
            }
          : note,
      ),
    );
  }

  function deleteSelectedNote() {
    if (!selectedNote) {
      return;
    }

    const selectedId = selectedNote.id;
    const hasDashboardMovements =
      selectedNote.confirmedTransactionIds.length > 0 ||
      transactions.some((transaction) => transaction.noteId === selectedId);

    if (
      hasDashboardMovements &&
      !window.confirm(CONFIRMED_NOTE_DELETE_WARNING)
    ) {
      return;
    }

    const remainingNotes = notes.filter((note) => note.id !== selectedId);
    const nextNote = remainingNotes.find(
      (note) => note.folder === selectedFolder,
    );

    setTransactions((current) =>
      current.filter((transaction) => transaction.noteId !== selectedId),
    );
    setNotes(remainingNotes);
    setSelectedNoteId(nextNote?.id ?? "");
  }

  return (
    <section
      id="notas"
      className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
    >
      <div className="border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Notas financieras
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">
              Captura rapida con datos detectados
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Escribi como pensas. Libertad OS prepara una vista previa, pero
              nada entra al dashboard hasta que confirmes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="Nada entra al dashboard sin confirmar" tone="amber" />
            <StatusPill label={`${transactions.length} confirmados`} />
            <button
              className="h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={() => createNote("Captura rapida")}
            >
              Nueva nota
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-[210px_260px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 bg-[#f3f1ec] p-3 lg:border-b-0 lg:border-r">
          <div className="grid gap-1">
            {NOTE_FOLDERS.map((folder) => (
              <button
                key={folder}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  selectedFolder === folder
                    ? "bg-white text-stone-950 shadow-sm ring-1 ring-stone-200"
                    : "text-stone-600 hover:bg-white/70"
                }`}
                type="button"
                onClick={() => {
                  setSelectedFolder(folder);
                  setSelectedNoteId(
                    notes.find((note) => note.folder === folder)?.id ?? "",
                  );
                }}
              >
                <span className="leading-5">{folder}</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-stone-500">
                  {folderCounts[folder] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="border-b border-stone-200 bg-[#fbfaf7] lg:border-b-0 lg:border-r">
          <div className="flex min-h-14 items-center justify-between border-b border-stone-200 px-4">
            <div>
              <p className="text-sm font-semibold text-stone-800">
                {selectedFolder}
              </p>
              <p className="text-xs text-stone-500">
                {filteredNotes.length} nota(s)
              </p>
            </div>
            <button
              className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={() => createNote(selectedFolder)}
            >
              Crear
            </button>
          </div>
          <div className="max-h-[666px] overflow-auto">
            {filteredNotes.length === 0 ? (
              <EmptyState
                title="Sin notas todavia"
                body="Crea una captura o usa los accesos rapidos del editor."
              />
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  className={`block w-full border-b border-stone-200 px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-700 ${
                    note.id === selectedNoteId
                      ? "bg-white shadow-[inset_3px_0_0_#047857]"
                      : "hover:bg-white/70"
                  }`}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <p className="truncate text-sm font-semibold text-stone-950">
                    {note.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">
                    {note.body || "Escribe una captura financiera..."}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    {note.analysis.length} detectado(s) -{" "}
                    {note.confirmedTransactionIds.length} guardado(s)
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[1fr_auto]">
          {selectedNote ? (
            <>
              <div className="grid min-h-0 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-h-[360px] bg-white">
                  <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-5 py-3 sm:px-6">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                      Carga rapida
                    </span>
                    {quickCaptureActions.map((action) => (
                      <button
                        key={action.label}
                        className="min-h-11 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-emerald-300 hover:bg-white hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        type="button"
                        onClick={() => appendQuickCapture(action.text)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 p-5 sm:p-6">
                    <div className="grid gap-3 rounded-md border border-stone-200 bg-[#fbfaf7] p-4 sm:grid-cols-2">
                      <PreviewStat
                        label="Detectados"
                        value={selectedSummary.total.toString()}
                      />
                      <PreviewStat
                        label="Reales"
                        value={selectedSummary.real.toString()}
                      />
                      <PreviewStat
                        label="Revisar"
                        value={selectedSummary.blocked.toString()}
                      />
                      <PreviewStat
                        label="Filtro anti-error"
                        value={selectedSummary.antiError.toString()}
                      />
                      <PreviewStat
                        label="Impacto real x25"
                        value={currencyFormatter.format(
                          selectedSummary.freedomImpact,
                        )}
                      />
                      <PreviewStat
                        label="Impacto potencial"
                        value={currencyFormatter.format(
                          selectedSummary.potentialFreedomImpact,
                        )}
                      />
                    </div>

                    <textarea
                      ref={editorRef}
                      className="h-full min-h-[420px] w-full resize-none bg-transparent text-lg leading-8 text-stone-950 outline-none placeholder:text-stone-500"
                      placeholder="Ej: Hoy gaste 350 en comida, 90 en transporte y 1200 en ropa. Tambien cobre 28000. Separar 5% para colchon y 15% para inversion."
                      value={selectedNote.body}
                      onChange={(event) => updateSelectedNote(event.target.value)}
                    />
                  </div>
                </div>

                <DetectedDataPanel
                  items={selectedNote.analysis}
                  summary={selectedSummary}
                  onUpdateItem={updateDetectedItem}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-stone-200 bg-stone-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="text-sm leading-6 text-stone-600">
                  {noteAlreadyConfirmed
                    ? "Esta nota ya fue confirmada. Si la editas, podras volver a confirmar la nueva version."
                    : notePendingReconfirmation
                      ? "Nota editada pendiente de reconfirmación. Sus movimientos anteriores ya no cuentan en el dashboard."
                      : confirmableCount > 0
                      ? selectedSummary.antiError > 0
                        ? `${confirmableCount} movimiento(s) real(es) listos. Revisa el filtro anti-error antes de guardar.`
                        : `${confirmableCount} movimiento(s) real(es) listos para guardar.`
                      : "Intenciones, ideas o negaciones no se guardan como transacciones."}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    className="h-11 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-red-300 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    type="button"
                    onClick={deleteSelectedNote}
                  >
                    Borrar nota
                  </button>
                  <button
                    className={`h-11 rounded-md px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                      confirmableCount > 0
                        ? "bg-emerald-700 text-white hover:bg-emerald-800"
                        : "bg-stone-200 text-stone-700"
                    }`}
                    disabled={confirmableCount === 0}
                    type="button"
                    onClick={confirmDetectedItems}
                  >
                    {confirmableCount > 0
                      ? `Confirmar ${confirmableCount}`
                      : "Confirmar"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-8">
              {notes.length === 0 ? (
                <EmptyState
                  title="Sin notas todavia"
                  body="Crea una nota para empezar a capturar movimientos financieros."
                />
              ) : (
                <EmptyState
                  title="Elegi una nota"
                  body="Tambien podes crear una nueva captura desde esta carpeta."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DetectedDataPanel({
  items,
  summary,
  onUpdateItem,
}: {
  items: DetectedFinancialItem[];
  summary: DetectedSummary;
  onUpdateItem: (
    itemId: string,
    patch: Partial<DetectedFinancialItem>,
  ) => void;
}) {
  return (
    <aside className="border-t border-stone-200 bg-[#f8f7f3] p-4 xl:border-l xl:border-t-0">
      <div className="sticky top-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-600">
              Datos detectados
            </h3>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              Edita o ignora cada item antes de guardar.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusPill label={`${summary.real} reales`} tone="green" />
            {summary.antiError > 0 ? (
              <StatusPill
                label={`${summary.antiError} filtro(s)`}
                tone={summary.highRisk > 0 ? "red" : "amber"}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm leading-6 text-stone-600">
              La vista previa aparece aca cuando escribis una nota financiera.
            </div>
          ) : (
            items.map((item) => (
              <DetectedItemCard
                key={item.id}
                item={item}
                onUpdate={(patch) => onUpdateItem(item.id, patch)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function DetectedItemCard({
  item,
  onUpdate,
}: {
  item: DetectedFinancialItem;
  onUpdate: (patch: Partial<DetectedFinancialItem>) => void;
}) {
  const blocked = item.intent !== "real";
  const fireImpactLabel =
    item.intent === "real" || item.intent === "negado"
      ? "Impacto x25"
      : "Impacto x25 potencial";
  const antiErrorFireImpactLabel =
    item.intent === "real" || item.intent === "negado"
      ? "Impacto FIRE"
      : "Impacto FIRE potencial";

  return (
    <div
      className={`rounded-md border bg-white p-3 transition ${
        item.ignored
          ? "border-stone-200 opacity-60"
          : blocked
            ? "border-amber-200 bg-amber-50/30"
            : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-950">
              {financialTypeLabel(item.type)}
            </p>
            {item.coreExpense ? <StatusPill label="clave" tone="green" /> : null}
            {item.impulse ? <StatusPill label="impulsivo" tone="amber" /> : null}
            {item.antiErrorReview?.applies ? (
              <StatusPill
                label={`riesgo ${item.antiErrorReview.riskLevel}`}
                tone={riskTone(item.antiErrorReview.riskLevel)}
              />
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-600">
            {item.sourceText}
          </p>
        </div>
        <button
          className="min-h-11 rounded-md border border-stone-300 bg-white px-2 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={() => onUpdate({ ignored: !item.ignored })}
        >
          {item.ignored ? "Usar" : "Ignorar"}
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        <FieldRow label="Tipo">
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-2 text-sm text-stone-900"
            value={item.type}
            onChange={(event) =>
              onUpdate({ type: event.target.value as FinancialType })
            }
          >
            {["gasto", "ingreso", "inversion", "ahorro", "deuda", "decision"].map(
              (type) => (
                <option key={type} value={type}>
                  {financialTypeLabel(type as FinancialType)}
                </option>
              ),
            )}
          </select>
        </FieldRow>

        <FieldRow label="Monto">
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-2 text-sm text-stone-900"
            min="0"
            type="number"
            value={item.amount}
            onChange={(event) => onUpdate({ amount: Number(event.target.value) })}
          />
        </FieldRow>

        <FieldRow label="Categoria">
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-2 text-sm text-stone-900"
            value={item.category}
            onChange={(event) => onUpdate({ category: event.target.value })}
          />
        </FieldRow>

        <FieldRow label="Fecha">
          <input
            className="h-11 w-full rounded-md border border-stone-300 px-2 text-sm text-stone-900"
            type="date"
            value={item.date}
            onChange={(event) => onUpdate({ date: event.target.value })}
          />
        </FieldRow>

        <FieldRow label="Estado">
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-2 text-sm text-stone-900"
            value={item.intent}
            onChange={(event) =>
              onUpdate({ intent: event.target.value as TransactionIntent })
            }
          >
            {["real", "intencion", "pensado", "negado"].map((intent) => (
              <option key={intent} value={intent}>
                {intentLabel(intent as TransactionIntent)}
              </option>
            ))}
          </select>
        </FieldRow>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <TogglePill
          active={item.recurring}
          label="Recurrente"
          onClick={() => onUpdate({ recurring: !item.recurring })}
        />
        <TogglePill
          active={item.coreExpense}
          label="Clave"
          onClick={() => onUpdate({ coreExpense: !item.coreExpense })}
        />
        <TogglePill
          active={item.impulse}
          label="Impulsivo"
          onClick={() => onUpdate({ impulse: !item.impulse })}
        />
        <div className="rounded-md bg-stone-100 px-2 py-2 text-stone-700">
          {item.currency}
        </div>
      </div>

      <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950">
        {fireImpactLabel}: {currencyFormatter.format(item.freedomImpact)}
      </div>

      {item.antiErrorReview?.applies ? (
        <AntiErrorPanel item={item} fireImpactLabel={antiErrorFireImpactLabel} />
      ) : null}

      {item.type === "ingreso" ? <IncomeSuggestionPanel item={item} /> : null}

      {blocked ? (
        <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
          Detectado como {intentLabel(item.intent).toLowerCase()}. No se guarda
          como transaccion real. Si ya ocurrio, revisa el estado y confirmalo
          manualmente.
        </div>
      ) : null}
    </div>
  );
}

function AntiErrorPanel({
  item,
  fireImpactLabel,
}: {
  item: DetectedFinancialItem;
  fireImpactLabel: string;
}) {
  const review = item.antiErrorReview;

  if (!review) {
    return null;
  }

  const panelTone =
    review.riskLevel === "alto"
      ? "border-red-200 bg-red-50/60 text-red-950"
      : review.riskLevel === "medio"
        ? "border-amber-200 bg-amber-50/70 text-amber-950"
        : "border-emerald-200 bg-emerald-50/70 text-emerald-950";
  const chipTone =
    review.riskLevel === "alto"
      ? "border-red-200 text-red-950"
      : review.riskLevel === "medio"
        ? "border-amber-200 text-amber-950"
        : "border-emerald-200 text-emerald-950";

  return (
    <div className={`mt-3 rounded-md border px-3 py-3 text-xs leading-5 ${panelTone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Filtro anti-error</p>
          <p className="mt-0.5 text-xs opacity-80">
            Decision revisable, separada de los movimientos confirmados.
          </p>
        </div>
        <StatusPill
          label={`riesgo ${review.riskLevel}`}
          tone={riskTone(review.riskLevel)}
        />
      </div>

      <div className="mt-3 grid gap-2 rounded-md bg-white/70 p-3 sm:grid-cols-2">
        <SuggestionLine
          label="Costo mensual"
          value={formatOptionalMoney(review.monthlyCost)}
        />
        <SuggestionLine
          label="Costo anual"
          value={formatOptionalMoney(review.annualCost)}
        />
        <SuggestionLine
          label={fireImpactLabel}
          value={formatOptionalMoney(review.fireImpact)}
        />
        <SuggestionLine
          label="Si lo invierto"
          value={formatOptionalMoney(review.investmentAlternative)}
        />
      </div>

      {review.signals.length > 0 ? (
        <div className="mt-3">
          <p className="font-semibold">Senales detectadas</p>
          <ul className="mt-2 grid gap-1.5">
            {review.signals.map((signal) => (
              <li
                key={signal}
                className="grid grid-cols-[6px_minmax(0,1fr)] gap-2"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 rounded-full bg-current opacity-70"
                />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.detectedEnemies.length > 0 ? (
        <div className="mt-3">
          <p className="font-semibold">Enemigos financieros detectados</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {review.detectedEnemies.map((enemy) => (
              <span
                key={enemy}
                className={`rounded-full border bg-white px-2 py-0.5 font-medium ${chipTone}`}
              >
                {enemy}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="font-semibold">Preguntas del filtro</p>
        <ul className="mt-2 grid gap-1.5">
          {review.checklist.map((question) => (
            <li
              key={question}
              className="grid grid-cols-[14px_minmax(0,1fr)] gap-2"
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-3.5 w-3.5 rounded-[3px] border bg-white ${chipTone}`}
              />
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </div>

      {review.recommendation ? (
        <div className="mt-3 rounded-md bg-white px-3 py-2 font-semibold">
          Pausa sugerida: {review.recommendation}.
        </div>
      ) : null}

      {review.confirmableBlockReason ? (
        <div className="mt-2 rounded-md bg-white px-3 py-2">
          {review.confirmableBlockReason}
        </div>
      ) : null}
    </div>
  );
}

function IncomeSuggestionPanel({ item }: { item: DetectedFinancialItem }) {
  const suggestion = incomeRuleSuggestion(item.amount, Boolean(item.incomeIncrease));

  return (
    <div className="mt-3 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Reglas automaticas sugeridas</p>
        <span className="rounded-full bg-white px-2 py-0.5 font-medium text-sky-900">
          No confirmado
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        <SuggestionLine
          label="5% para colchon"
          value={currencyFormatter.format(suggestion.emergencyFund)}
        />
        <SuggestionLine
          label={
            suggestion.isIncreaseRule
              ? "70% ahorro/inversion"
              : "Inversion sugerida"
          }
          value={currencyFormatter.format(suggestion.suggestedInvestment)}
        />
        {suggestion.isIncreaseRule ? (
          <>
            <SuggestionLine
              label="20% mejora de vida"
              value={currencyFormatter.format(suggestion.lifestyleUpgrade)}
            />
            <SuggestionLine
              label="10% gusto personal"
              value={currencyFormatter.format(suggestion.personalTreat)}
            />
          </>
        ) : null}
        <SuggestionLine
          label="Tasa sugerida"
          value={`${percentFormatter.format(suggestion.savingRate)}%`}
        />
      </div>
      <p className="mt-2 text-sky-900">
        Sugerencia visual: no mueve dinero ni crea transacciones.
      </p>
    </div>
  );
}

function SuggestionLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatOptionalMoney(value: number) {
  return value > 0 ? currencyFormatter.format(value) : "No aplica";
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid grid-cols-[86px_minmax(0,1fr)] items-center gap-2">
      <span className="text-xs font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}

function TogglePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 rounded-md px-2 py-2 text-left font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
        active ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-700"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClasses = {
    neutral: "border-stone-200 bg-stone-50 text-stone-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function riskTone(riskLevel: AntiErrorRiskLevel) {
  if (riskLevel === "alto") {
    return "red";
  }

  if (riskLevel === "medio") {
    return "amber";
  }

  return "green";
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-white p-4">
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
}

function summarizeDetectedItems(items: DetectedFinancialItem[]): DetectedSummary {
  return items.reduce<DetectedSummary>(
    (summary, item) => {
      summary.total += 1;

      if (item.ignored) {
        summary.ignored += 1;
      } else if (item.intent === "real") {
        summary.real += 1;
      } else {
        summary.blocked += 1;
      }

      if (item.coreExpense) {
        summary.core += 1;
      }

      if (item.impulse) {
        summary.impulse += 1;
      }

      if (item.antiErrorReview?.applies) {
        summary.antiError += 1;
      }

      if (item.antiErrorReview?.riskLevel === "alto") {
        summary.highRisk += 1;
      }

      if (!item.ignored && item.intent === "real") {
        summary.freedomImpact += item.freedomImpact;
      }

      if (!item.ignored && item.intent !== "real") {
        summary.potentialFreedomImpact += item.freedomImpact;
      }

      return summary;
    },
    {
      total: 0,
      real: 0,
      blocked: 0,
      ignored: 0,
      core: 0,
      impulse: 0,
      antiError: 0,
      highRisk: 0,
      freedomImpact: 0,
      potentialFreedomImpact: 0,
    },
  );
}

export function confirmedTransactionsSummary(
  transactions: ConfirmedFinancialTransaction[],
) {
  return transactions.reduce(
    (summary, transaction) => {
      const amount = transaction.amount;

      if (transaction.type === "gasto" || transaction.type === "deuda") {
        summary.netWorthDelta -= amount;
        summary.confirmedExpenses += amount;
      }

      if (transaction.type === "ingreso" || transaction.type === "ahorro") {
        summary.netWorthDelta += amount;
      }

      if (transaction.type === "inversion") {
        summary.netWorthDelta += amount;
        summary.investedDelta += amount;
      }

      if (transaction.type === "gasto" && transaction.recurring) {
        summary.recurringMonthlyExpenses += amount;
      }

      if (transaction.type === "gasto") {
        const monthlyExpense = monthlyEquivalentExpense(
          amount,
          transaction.recurring,
        );

        summary.monthlyConfirmedExpenses += monthlyExpense;
        summary.annualConfirmedExpenses += monthlyExpense * 12;
        summary.confirmedFireNumber += freedomNumber(monthlyExpense);

        if (
          CORE_EXPENSE_CATEGORIES.includes(
            transaction.category as CoreExpenseCategory,
          )
        ) {
          summary.coreMonthlyExpenses[
            transaction.category as CoreExpenseCategory
          ] += monthlyExpense;
        }
      }

      return summary;
    },
    {
      netWorthDelta: 0,
      investedDelta: 0,
      confirmedExpenses: 0,
      recurringMonthlyExpenses: 0,
      monthlyConfirmedExpenses: 0,
      annualConfirmedExpenses: 0,
      confirmedFireNumber: 0,
      coreMonthlyExpenses: {
        vivienda: 0,
        transporte: 0,
        comida: 0,
      },
    },
  );
}
