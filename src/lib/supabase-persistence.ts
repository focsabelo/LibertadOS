import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_FREEDOM_INPUTS,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  normalizeBotOpera24hsInvestment,
  normalizeTargetPortfolioSettings,
  type BotOpera24hsInvestment,
  type FreedomInputs,
  type InvestmentPolicySettings,
  type TargetPortfolioSettings,
  type WeeklyExecutionItemId,
  type WeeklyExecutionReview,
} from "./finance";
import {
  analyzeFinancialNote,
  type ConfirmedFinancialTransaction,
  type FinancialNote,
} from "./financial-notes";
import { createMoney } from "./money";
import {
  fixedMonthlyExpenseDraftToRow,
  fixedMonthlyExpenseFromRow,
  type FixedMonthlyExpense,
  type FixedMonthlyExpenseDraft,
} from "./fixed-monthly-expenses";

type JsonRecord = Record<string, unknown>;

export type DashboardData = {
  inputs: FreedomInputs;
  portfolioSettings: TargetPortfolioSettings;
  botOperaInvestment: BotOpera24hsInvestment;
  weeklyExecutionReviews: WeeklyExecutionReview[];
  roadmapSimulatedContribution: number;
  onboardingSeen: boolean;
};

export type NotesData = {
  notes: FinancialNote[];
  transactions: ConfirmedFinancialTransaction[];
};

export type DashboardSettingsPayload = {
  user_id: string;
  inputs: FreedomInputs;
  roadmap_simulated_contribution: number;
  onboarding_seen: boolean;
};

export function createDefaultDashboardData(): DashboardData {
  return {
    inputs: DEFAULT_FREEDOM_INPUTS,
    portfolioSettings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    botOperaInvestment: DEFAULT_BOT_OPERA24HS_INVESTMENT,
    weeklyExecutionReviews: [],
    roadmapSimulatedContribution: 0,
    onboardingSeen: false,
  };
}

export function createDashboardSettingsPayload({
  userId,
  data,
}: {
  userId: string;
  data: Pick<
    DashboardData,
    "inputs" | "roadmapSimulatedContribution" | "onboardingSeen"
  >;
}): DashboardSettingsPayload {
  return {
    user_id: userId,
    inputs: data.inputs,
    roadmap_simulated_contribution: data.roadmapSimulatedContribution,
    onboarding_seen: data.onboardingSeen,
  };
}

export function normalizeDashboardData(rows: {
  settings?: Partial<{
    inputs: Partial<FreedomInputs>;
    roadmap_simulated_contribution: number;
    onboarding_seen: boolean;
  }> | null;
  portfolio?: Partial<{
    targets: Partial<TargetPortfolioSettings["targets"]>;
    manual_amounts: Partial<TargetPortfolioSettings["manualAmounts"]>;
    policy: Partial<InvestmentPolicySettings>;
  }> | null;
  bot?: Partial<BotOpera24hsInvestment> | null;
  weeklyReviews?: JsonRecord[] | null;
  rules?: { scope?: string; data?: unknown }[] | null;
}): DashboardData {
  const defaults = createDefaultDashboardData();
  const rules = rows.rules ?? [];
  const investmentPolicyRule = rules.find(
    (rule) => rule.scope === "investment_policy",
  );
  const botRule = rules.find(
    (rule) => rule.scope === "bot_opera24hs_reinvestment",
  );
  const policyFromRule = asRecord(investmentPolicyRule?.data);
  const botRuleData = asRecord(botRule?.data);
  const bot = rows.bot ?? {};

  return {
    inputs: {
      ...defaults.inputs,
      ...rows.settings?.inputs,
    },
    portfolioSettings: normalizeTargetPortfolioSettings({
      targets: rows.portfolio?.targets as TargetPortfolioSettings["targets"],
      manualAmounts: rows.portfolio
        ?.manual_amounts as TargetPortfolioSettings["manualAmounts"],
      policy: {
        ...rows.portfolio?.policy,
        ...policyFromRule,
      },
    }),
    botOperaInvestment: normalizeBotOpera24hsInvestment({
      ...bot,
      reinvestmentRule:
        typeof botRuleData.reinvestmentRule === "string"
          ? botRuleData.reinvestmentRule
          : bot.reinvestmentRule,
    }),
    weeklyExecutionReviews: (rows.weeklyReviews ?? []).map(
      weeklyExecutionReviewFromRow,
    ),
    roadmapSimulatedContribution: Number.isFinite(
      rows.settings?.roadmap_simulated_contribution,
    )
      ? Math.max(0, rows.settings?.roadmap_simulated_contribution ?? 0)
      : defaults.roadmapSimulatedContribution,
    onboardingSeen: Boolean(rows.settings?.onboarding_seen),
  };
}

export async function loadDashboardData(
  supabase: SupabaseClient,
  userId: string,
) {
  const [settings, portfolio, bot, weeklyReviews, rules] = await Promise.all([
    supabase
      .from("dashboard_settings")
      .select("inputs, roadmap_simulated_contribution, onboarding_seen")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("target_portfolios")
      .select("targets, manual_amounts, policy")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("bot_opera24hs_investments")
      .select(
        "bot_number, start_date, initial_capital, monthly_contribution, reinvestment_rule, reinvestment_minimum, monthly_results",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("weekly_execution_reviews")
      .select("week_key, completed_item_ids")
      .eq("user_id", userId),
    supabase.from("investment_rules").select("scope, data").eq("user_id", userId),
  ]);

  throwFirstError(
    settings.error,
    portfolio.error,
    bot.error,
    weeklyReviews.error,
    rules.error,
  );

  return normalizeDashboardData({
    settings: settings.data as Parameters<typeof normalizeDashboardData>[0]["settings"],
    portfolio: portfolio.data as Parameters<typeof normalizeDashboardData>[0]["portfolio"],
    bot: bot.data
      ? {
          name: "Bot especulacion (trading algoritmico)",
          botNumber: bot.data.bot_number,
          startDate: bot.data.start_date,
          initialCapital: bot.data.initial_capital,
          monthlyContribution: bot.data.monthly_contribution,
          reinvestmentRule: bot.data.reinvestment_rule,
          reinvestmentMinimum: bot.data.reinvestment_minimum,
          monthlyResults: bot.data.monthly_results,
        }
      : null,
    weeklyReviews: weeklyReviews.data as JsonRecord[] | null,
    rules: rules.data,
  });
}

export async function saveDashboardSettings(
  supabase: SupabaseClient,
  userId: string,
  data: Pick<
    DashboardData,
    "inputs" | "roadmapSimulatedContribution" | "onboardingSeen"
  >,
) {
  const { error } = await supabase.from("dashboard_settings").upsert(
    createDashboardSettingsPayload({ userId, data }),
    { onConflict: "user_id" },
  );

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function saveTargetPortfolio(
  supabase: SupabaseClient,
  userId: string,
  settings: TargetPortfolioSettings,
) {
  const normalized = normalizeTargetPortfolioSettings(settings);
  const { error } = await supabase.from("target_portfolios").upsert(
    {
      user_id: userId,
      targets: normalized.targets,
      manual_amounts: normalized.manualAmounts,
      policy: normalized.policy,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  await saveInvestmentRule(supabase, userId, "investment_policy", normalized.policy);
}

export async function saveBotOpera24hsInvestment(
  supabase: SupabaseClient,
  userId: string,
  investment: BotOpera24hsInvestment,
) {
  const normalized = normalizeBotOpera24hsInvestment(investment);
  const { error } = await supabase.from("bot_opera24hs_investments").upsert(
    {
      user_id: userId,
      name: normalized.name,
      bot_number: normalized.botNumber,
      start_date: normalized.startDate,
      initial_capital: normalized.initialCapital,
      monthly_contribution: normalized.monthlyContribution,
      reinvestment_rule: normalized.reinvestmentRule,
      reinvestment_minimum: normalized.reinvestmentMinimum,
      monthly_results: normalized.monthlyResults,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  await saveInvestmentRule(supabase, userId, "bot_opera24hs_reinvestment", {
    reinvestmentRule: normalized.reinvestmentRule,
  });
}

export async function saveWeeklyExecutionReview(
  supabase: SupabaseClient,
  userId: string,
  review: WeeklyExecutionReview,
) {
  const { error } = await supabase.from("weekly_execution_reviews").upsert(
    weeklyExecutionReviewToRow(userId, review),
    { onConflict: "user_id,week_key" },
  );

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function saveInvestmentRule(
  supabase: SupabaseClient,
  userId: string,
  scope: string,
  data: unknown,
) {
  const { error } = await supabase.from("investment_rules").upsert(
    {
      user_id: userId,
      scope,
      data,
    },
    { onConflict: "user_id,scope" },
  );

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function loadNotesData(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotesData> {
  const [notesResponse, transactionsResponse] = await Promise.all([
    supabase
      .from("financial_notes")
      .select(
        "id, folder, currency, title, body, created_at, updated_at, analysis, confirmed_transaction_ids, pending_reconfirmation",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("confirmed_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("confirmed_at", { ascending: false }),
  ]);

  throwFirstError(notesResponse.error, transactionsResponse.error);

  const notes = (notesResponse.data ?? []).map((row) => {
    const note = {
      id: row.id,
      folder: row.folder,
      currency: String(row.currency ?? "UYU"),
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      analysis: row.analysis,
      confirmedTransactionIds: row.confirmed_transaction_ids ?? [],
      pendingReconfirmation: row.pending_reconfirmation,
    } as FinancialNote;

    return note.confirmedTransactionIds.length > 0
      ? note
      : {
          ...note,
          analysis: analyzeFinancialNote(note.body, new Date(), {
            defaultCurrency: note.currency,
          }),
        };
  });
  const noteIds = new Set(notes.map((note) => note.id));
  const transactions = (transactionsResponse.data ?? [])
    .map(transactionFromRow)
    .filter((transaction) => noteIds.has(transaction.noteId));

  return { notes, transactions };
}

export async function loadConfirmedTransactions(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("confirmed_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("confirmed_at", { ascending: false });

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  return (data ?? []).map(transactionFromRow);
}

export async function loadFixedMonthlyExpenses(
  supabase: SupabaseClient,
  userId: string,
): Promise<FixedMonthlyExpense[]> {
  const { data, error } = await supabase
    .from("fixed_monthly_expenses")
    .select(
      "id, name, category, monthly_amount, currency, is_active, note, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  return (data ?? []).map(fixedMonthlyExpenseFromRow);
}

export async function createFixedMonthlyExpense(
  supabase: SupabaseClient,
  userId: string,
  expense: FixedMonthlyExpenseDraft,
): Promise<FixedMonthlyExpense> {
  const { data, error } = await supabase
    .from("fixed_monthly_expenses")
    .insert({
      user_id: userId,
      ...fixedMonthlyExpenseDraftToRow(expense),
    })
    .select(
      "id, name, category, monthly_amount, currency, is_active, note, created_at, updated_at",
    )
    .single();

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  return fixedMonthlyExpenseFromRow(data as JsonRecord);
}

export async function updateFixedMonthlyExpense(
  supabase: SupabaseClient,
  userId: string,
  expense: FixedMonthlyExpense,
): Promise<FixedMonthlyExpense> {
  const { data, error } = await supabase
    .from("fixed_monthly_expenses")
    .update(fixedMonthlyExpenseDraftToRow(expense))
    .eq("id", expense.id)
    .eq("user_id", userId)
    .select(
      "id, name, category, monthly_amount, currency, is_active, note, created_at, updated_at",
    )
    .single();

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }

  return fixedMonthlyExpenseFromRow(data as JsonRecord);
}

export async function deleteFixedMonthlyExpense(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string,
) {
  const { error } = await supabase
    .from("fixed_monthly_expenses")
    .delete()
    .eq("user_id", userId)
    .eq("id", expenseId);

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function upsertFinancialNote(
  supabase: SupabaseClient,
  userId: string,
  note: FinancialNote,
) {
  const { error } = await supabase.from("financial_notes").upsert({
    id: note.id,
    user_id: userId,
    folder: note.folder,
    currency: note.currency,
    title: note.title,
    body: note.body,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    analysis: note.analysis,
    confirmed_transaction_ids: note.confirmedTransactionIds,
    pending_reconfirmation: Boolean(note.pendingReconfirmation),
  });

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function deleteFinancialNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
) {
  const { error } = await supabase
    .from("financial_notes")
    .delete()
    .eq("user_id", userId)
    .eq("id", noteId);

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function saveFinancialNoteDraft(
  supabase: SupabaseClient,
  userId: string,
  note: FinancialNote,
  options: { deleteConfirmedTransactions?: boolean } = {
    deleteConfirmedTransactions: true,
  },
) {
  const { error } = await supabase.rpc("save_financial_note_draft", {
    ...financialNoteRpcPayload(note),
    p_user_id: userId,
    p_delete_confirmed_transactions:
      options.deleteConfirmedTransactions ?? true,
  });

  if (error) {
    throw actionError(
      "No se pudo guardar la edicion de la nota. El dashboard no fue actualizado. Revisa tu conexion y volve a intentar.",
      error,
    );
  }
}

export async function confirmFinancialNoteWithTransactions(
  supabase: SupabaseClient,
  userId: string,
  note: FinancialNote,
  transactions: ConfirmedFinancialTransaction[],
) {
  if (transactions.length === 0) {
    throw new Error("No hay movimientos confirmables para guardar.");
  }

  const { error } = await supabase.rpc("confirm_financial_note", {
    ...financialNoteRpcPayload(note),
    p_user_id: userId,
    p_transactions: transactions.map((transaction) =>
      transactionToRow(userId, transaction),
    ),
  });

  if (error) {
    throw actionError(
      "No se pudo confirmar la nota. No se guardaron movimientos en el dashboard. Revisa tu conexion y volve a intentar.",
      error,
    );
  }
}

export async function upsertConfirmedTransactions(
  supabase: SupabaseClient,
  userId: string,
  transactions: ConfirmedFinancialTransaction[],
) {
  if (transactions.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("confirmed_transactions")
    .upsert(transactions.map((transaction) => transactionToRow(userId, transaction)));

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

export async function deleteTransactionsForNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
) {
  const { error } = await supabase
    .from("confirmed_transactions")
    .delete()
    .eq("user_id", userId)
    .eq("note_id", noteId);

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

function financialNoteRpcPayload(note: FinancialNote) {
  return {
    p_note_id: note.id,
    p_folder: note.folder,
    p_currency: note.currency,
    p_title: note.title,
    p_body: note.body,
    p_created_at: note.createdAt,
    p_updated_at: note.updatedAt,
    p_analysis: note.analysis,
    p_confirmed_transaction_ids: note.confirmedTransactionIds,
    p_pending_reconfirmation: Boolean(note.pendingReconfirmation),
  };
}

function transactionToRow(
  userId: string,
  transaction: ConfirmedFinancialTransaction,
) {
  return {
    id: transaction.id,
    user_id: userId,
    note_id: transaction.noteId,
    note_title: transaction.noteTitle,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    category: transaction.category,
    date: transaction.date,
    recurring: transaction.recurring,
    impulse: transaction.impulse,
    core_expense: transaction.coreExpense,
    intent: transaction.intent,
    freedom_impact: transaction.freedomImpact,
    source_text: transaction.sourceText,
    income_increase: Boolean(transaction.incomeIncrease),
    ignored: Boolean(transaction.ignored),
    usd_conversion: transaction.usdConversion ?? null,
    debt: transaction.debt ?? null,
    anti_error_review: transaction.antiErrorReview ?? null,
    confirmed_at: transaction.confirmedAt,
  };
}

function transactionFromRow(row: JsonRecord): ConfirmedFinancialTransaction {
  const amount = Number(row.amount ?? 0);
  const currency = String(row.currency ?? "USD");
  const usdConversion =
    row.usd_conversion as ConfirmedFinancialTransaction["usdConversion"];

  return {
    id: String(row.id),
    noteId: String(row.note_id),
    noteTitle: String(row.note_title),
    type: row.type as ConfirmedFinancialTransaction["type"],
    amount,
    currency,
    money: createMoney({
      amount,
      currency,
      usdConversion,
    }),
    category: String(row.category ?? ""),
    date: String(row.date ?? ""),
    recurring: Boolean(row.recurring),
    impulse: Boolean(row.impulse),
    coreExpense: Boolean(row.core_expense),
    intent: row.intent as ConfirmedFinancialTransaction["intent"],
    confidence:
      (row.confidence as ConfirmedFinancialTransaction["confidence"]) ?? "alta",
    freedomImpact: Number(row.freedom_impact ?? 0),
    sourceText: String(row.source_text ?? ""),
    incomeIncrease: Boolean(row.income_increase),
    ignored: Boolean(row.ignored),
    usdConversion,
    debt: row.debt as ConfirmedFinancialTransaction["debt"],
    antiErrorReview:
      row.anti_error_review as ConfirmedFinancialTransaction["antiErrorReview"],
    confirmedAt: String(row.confirmed_at),
  };
}

export function weeklyExecutionReviewToRow(
  userId: string,
  review: WeeklyExecutionReview,
) {
  return {
    user_id: userId,
    week_key: review.weekKey,
    completed_item_ids: review.completedItemIds,
  };
}

export function weeklyExecutionReviewFromRow(row: JsonRecord): WeeklyExecutionReview {
  return {
    weekKey: String(row.week_key ?? ""),
    completedItemIds: Array.isArray(row.completed_item_ids)
      ? row.completed_item_ids
          .filter((item): item is string => typeof item === "string")
          .map((item) => item as WeeklyExecutionItemId)
      : [],
  };
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function throwFirstError(...errors: unknown[]) {
  const error = errors.find(Boolean);

  if (error) {
    throw normalizeSupabasePersistenceError(error);
  }
}

function actionError(message: string, error: unknown) {
  const detail = normalizeSupabasePersistenceError(error).message;

  return new Error(`${message} Detalle tecnico: ${detail}`);
}

export function normalizeSupabasePersistenceError(error: unknown) {
  const detail = supabaseErrorText(error);
  const lowerDetail = detail.toLowerCase();
  const code = supabaseErrorCode(error);
  const missingTable =
    code === "42P01" ||
    code === "PGRST205" ||
    lowerDetail.includes("could not find table") ||
    lowerDetail.includes("could not find the table") ||
    (lowerDetail.includes("relation") && lowerDetail.includes("does not exist"));
  const missingFunction =
    code === "42883" ||
    code === "PGRST202" ||
    lowerDetail.includes("could not find the function") ||
    (lowerDetail.includes("function") && lowerDetail.includes("does not exist"));

  if (missingTable) {
    const table = extractMissingObjectName(detail, "table");

    return new Error(
      `Falta aplicar una migracion de Supabase. La tabla${
        table ? ` ${table}` : ""
      } no existe en el proyecto. Ejecuta las migraciones de supabase/migrations en el SQL Editor y vuelve a cargar la app.`,
    );
  }

  if (missingFunction) {
    const functionName = extractMissingObjectName(detail, "function");

    return new Error(
      `Falta aplicar una migracion de Supabase. La funcion RPC${
        functionName ? ` ${functionName}` : ""
      } no existe. Ejecuta 20260620160000_atomic_financial_note_confirmation.sql en el SQL Editor y vuelve a intentar.`,
    );
  }

  return error instanceof Error ? error : new Error(detail);
}

function supabaseErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }

  return String(error);
}

function supabaseErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : "";
  }

  return "";
}

function extractMissingObjectName(detail: string, kind: "table" | "function") {
  const quotedMatch =
    detail.match(/'(public\.[^']+|[^']+)'/) ?? detail.match(/"([^"]+)"/);

  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const kindMatch = detail.match(new RegExp(`${kind}\\s+([\\w.]+)`, "i"));

  return kindMatch?.[1] ?? "";
}
