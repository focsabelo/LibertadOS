import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  normalizeBotOpera24hsInvestment,
  normalizeTargetPortfolioSettings,
  type BotOpera24hsInvestment,
  type FreedomInputs,
  type InvestmentPolicySettings,
  type TargetPortfolioSettings,
} from "./finance";
import {
  analyzeFinancialNote,
  type ConfirmedFinancialTransaction,
  type FinancialNote,
} from "./financial-notes";

type JsonRecord = Record<string, unknown>;

export type DashboardData = {
  inputs: FreedomInputs;
  portfolioSettings: TargetPortfolioSettings;
  botOperaInvestment: BotOpera24hsInvestment;
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

const DEFAULT_INPUTS: FreedomInputs = {
  netWorth: 85000,
  investedCapital: 62000,
  desiredMonthlySpend: 3000,
  monthlyContribution: 1800,
  expectedAnnualReturn: 7,
};

const defaultRoadmapContribution = DEFAULT_INPUTS.monthlyContribution + 500;

export function createDefaultDashboardData(): DashboardData {
  return {
    inputs: DEFAULT_INPUTS,
    portfolioSettings: DEFAULT_TARGET_PORTFOLIO_SETTINGS,
    botOperaInvestment: DEFAULT_BOT_OPERA24HS_INVESTMENT,
    roadmapSimulatedContribution: defaultRoadmapContribution,
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
  const [settings, portfolio, bot, rules] = await Promise.all([
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
    supabase.from("investment_rules").select("scope, data").eq("user_id", userId),
  ]);

  throwFirstError(settings.error, portfolio.error, bot.error, rules.error);

  return normalizeDashboardData({
    settings: settings.data as Parameters<typeof normalizeDashboardData>[0]["settings"],
    portfolio: portfolio.data as Parameters<typeof normalizeDashboardData>[0]["portfolio"],
    bot: bot.data
      ? {
          name: "Bot Opera24hs",
          botNumber: bot.data.bot_number,
          startDate: bot.data.start_date,
          initialCapital: bot.data.initial_capital,
          monthlyContribution: bot.data.monthly_contribution,
          reinvestmentRule: bot.data.reinvestment_rule,
          reinvestmentMinimum: bot.data.reinvestment_minimum,
          monthlyResults: bot.data.monthly_results,
        }
      : null,
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
    throw error;
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
    throw error;
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
    throw error;
  }

  await saveInvestmentRule(supabase, userId, "bot_opera24hs_reinvestment", {
    reinvestmentRule: normalized.reinvestmentRule,
  });
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
    throw error;
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
        "id, folder, title, body, created_at, updated_at, analysis, confirmed_transaction_ids, pending_reconfirmation",
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
      : { ...note, analysis: analyzeFinancialNote(note.body) };
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
    throw error;
  }

  return (data ?? []).map(transactionFromRow);
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
    title: note.title,
    body: note.body,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    analysis: note.analysis,
    confirmed_transaction_ids: note.confirmedTransactionIds,
    pending_reconfirmation: Boolean(note.pendingReconfirmation),
  });

  if (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
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
    debt: transaction.debt ?? null,
    anti_error_review: transaction.antiErrorReview ?? null,
    confirmed_at: transaction.confirmedAt,
  };
}

function transactionFromRow(row: JsonRecord): ConfirmedFinancialTransaction {
  return {
    id: String(row.id),
    noteId: String(row.note_id),
    noteTitle: String(row.note_title),
    type: row.type as ConfirmedFinancialTransaction["type"],
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    category: String(row.category ?? ""),
    date: String(row.date ?? ""),
    recurring: Boolean(row.recurring),
    impulse: Boolean(row.impulse),
    coreExpense: Boolean(row.core_expense),
    intent: row.intent as ConfirmedFinancialTransaction["intent"],
    freedomImpact: Number(row.freedom_impact ?? 0),
    sourceText: String(row.source_text ?? ""),
    incomeIncrease: Boolean(row.income_increase),
    ignored: Boolean(row.ignored),
    debt: row.debt as ConfirmedFinancialTransaction["debt"],
    antiErrorReview:
      row.anti_error_review as ConfirmedFinancialTransaction["antiErrorReview"],
    confirmedAt: String(row.confirmed_at),
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
    throw error;
  }
}
