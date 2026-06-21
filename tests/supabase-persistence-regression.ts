import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  type FreedomInputs,
  type WeeklyExecutionReview,
} from "../src/lib/finance";
import {
  createDashboardSettingsPayload,
  createDefaultDashboardData,
  confirmFinancialNoteWithTransactions,
  normalizeSupabasePersistenceError,
  normalizeDashboardData,
  saveFinancialNoteDraft,
  weeklyExecutionReviewFromRow,
  weeklyExecutionReviewToRow,
} from "../src/lib/supabase-persistence";
import type {
  ConfirmedFinancialTransaction,
  FinancialNote,
} from "../src/lib/financial-notes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

const userId = "00000000-0000-4000-8000-000000000001";
const inputs: FreedomInputs = {
  netWorth: 123,
  investedCapital: 45,
  desiredMonthlySpend: 67,
  monthlyContribution: 89,
  expectedAnnualReturn: 5,
};

const payload = createDashboardSettingsPayload({
  userId,
  data: {
    inputs,
    roadmapSimulatedContribution: 999,
    onboardingSeen: true,
  },
});

assertEqual(payload.user_id, userId, "dashboard payload carries user_id");
assertEqual(payload.inputs.netWorth, 123, "dashboard payload carries inputs");
assertEqual(
  payload.roadmap_simulated_contribution,
  999,
  "dashboard payload carries roadmap simulation",
);
assertEqual(payload.onboarding_seen, true, "dashboard payload carries onboarding");

const defaults = createDefaultDashboardData();

assertEqual(
  defaults.portfolioSettings.targets.etf_usa,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets.etf_usa,
  "default portfolio settings are preserved",
);
assertEqual(
  defaults.botOperaInvestment.botNumber,
  DEFAULT_BOT_OPERA24HS_INVESTMENT.botNumber,
  "default bot settings are preserved",
);
assertEqual(defaults.inputs.netWorth, 0, "default net worth starts empty");
assertEqual(
  defaults.inputs.investedCapital,
  0,
  "default invested capital starts empty",
);
assertEqual(
  defaults.inputs.desiredMonthlySpend,
  0,
  "default monthly spend starts empty",
);
assertEqual(
  defaults.inputs.monthlyContribution,
  0,
  "default monthly contribution starts empty",
);

const normalized = normalizeDashboardData({
  settings: {
    inputs: {
      netWorth: 10,
    },
  },
  portfolio: {
    targets: {
      etf_usa: 60,
    },
  },
  bot: {
    monthlyResults: [{ month: "2026-05", amount: 12 }],
  },
});

assertEqual(normalized.inputs.netWorth, 10, "partial settings override defaults");
assertEqual(
  normalized.portfolioSettings.targets.etf_usa,
  60,
  "partial portfolio overrides defaults",
);
assertEqual(
  normalized.portfolioSettings.targets.oro,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS.targets.oro,
  "missing portfolio fields fall back to defaults",
);
assertEqual(
  normalized.botOperaInvestment.monthlyResults[0]?.amount,
  12,
  "partial bot rows normalize monthly results",
);
assert(
  normalized.roadmapSimulatedContribution === 0,
  "missing roadmap simulation starts empty",
);

const missingTableError = normalizeSupabasePersistenceError({
  code: "PGRST205",
  message:
    "Could not find the table 'public.dashboard_settings' in the schema cache",
});
assert(
  missingTableError.message.includes("Falta aplicar una migracion"),
  "missing table error explains migration action",
);
assert(
  missingTableError.message.includes("public.dashboard_settings"),
  "missing table error names table when available",
);

const missingFunctionError = normalizeSupabasePersistenceError({
  code: "PGRST202",
  message: "Could not find the function public.confirm_financial_note",
});
assert(
  missingFunctionError.message.includes(
    "20260620160000_atomic_financial_note_confirmation.sql",
  ),
  "missing RPC error points to the atomic confirmation migration",
);

const weeklyReview: WeeklyExecutionReview = {
  weekKey: "2026-W25",
  completedItemIds: ["review_income", "define_weekly_action"],
};
const weeklyReviewRow = weeklyExecutionReviewToRow(userId, weeklyReview);

assertEqual(
  weeklyReviewRow.user_id,
  userId,
  "weekly review row carries user_id",
);
assertEqual(
  weeklyReviewRow.week_key,
  "2026-W25",
  "weekly review row carries week key",
);
assertEqual(
  weeklyReviewRow.completed_item_ids.length,
  2,
  "weekly review row carries completed ids",
);

const mappedWeeklyReview = weeklyExecutionReviewFromRow({
  week_key: weeklyReviewRow.week_key,
  completed_item_ids: weeklyReviewRow.completed_item_ids,
});

assertEqual(
  mappedWeeklyReview.weekKey,
  "2026-W25",
  "mapped weekly review restores week key",
);
assertEqual(
  mappedWeeklyReview.completedItemIds[1],
  "define_weekly_action",
  "mapped weekly review restores completed ids",
);

const note: FinancialNote = {
  id: "00000000-0000-4000-8000-000000000201",
  folder: "Captura rapida",
  currency: "UYU",
  title: "Gaste 100 en comida",
  body: "Gaste 100 en comida",
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-06-20T12:01:00.000Z",
  analysis: [],
  confirmedTransactionIds: ["00000000-0000-4000-8000-000000000301"],
  pendingReconfirmation: false,
};

const transaction: ConfirmedFinancialTransaction = {
  id: "00000000-0000-4000-8000-000000000301",
  noteId: note.id,
  noteTitle: note.title,
  type: "gasto",
  amount: 100,
  currency: "USD",
  category: "comida",
  date: "2026-06-20",
  recurring: false,
  impulse: false,
  coreExpense: true,
  intent: "real",
  freedomImpact: 2500,
  sourceText: "Gaste 100 en comida",
  ignored: false,
  confirmedAt: "2026-06-20T12:02:00.000Z",
};

type RpcCall = {
  name: string;
  args: Record<string, unknown>;
};

function createRpcOnlySupabase(error?: Error) {
  const calls: RpcCall[] = [];

  return {
    calls,
    client: {
      rpc(name: string, args: Record<string, unknown>) {
        calls.push({ name, args });
        return Promise.resolve({ error: error ?? null });
      },
      from(table: string) {
        throw new Error(`Unexpected table write to ${table}`);
      },
    } as unknown as SupabaseClient,
  };
}

async function assertRejects(
  action: () => Promise<unknown>,
  expectedMessage: string,
) {
  try {
    await action();
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes(expectedMessage),
      `expected error to include "${expectedMessage}", received "${
        error instanceof Error ? error.message : String(error)
      }"`,
    );
    return;
  }

  throw new Error(`expected action to reject with "${expectedMessage}"`);
}

async function runAsyncCases() {
  const confirmationSupabase = createRpcOnlySupabase();
  await confirmFinancialNoteWithTransactions(
    confirmationSupabase.client,
    userId,
    note,
    [transaction],
  );

  assertEqual(
    confirmationSupabase.calls.length,
    1,
    "confirm note uses one RPC call",
  );
  assertEqual(
    confirmationSupabase.calls[0].name,
    "confirm_financial_note",
    "confirm note uses atomic RPC",
  );
  assertEqual(
    (confirmationSupabase.calls[0].args.p_transactions as unknown[]).length,
    1,
    "confirm note sends transactions with the note",
  );
  assertEqual(
    confirmationSupabase.calls[0].args.p_currency,
    "UYU",
    "confirm note sends note currency",
  );

  const failedConfirmationSupabase = createRpcOnlySupabase(
    new Error("network unavailable"),
  );
  await assertRejects(
    () =>
      confirmFinancialNoteWithTransactions(
        failedConfirmationSupabase.client,
        userId,
        note,
        [transaction],
      ),
    "No se pudo confirmar la nota",
  );

  const draftSupabase = createRpcOnlySupabase();
  await saveFinancialNoteDraft(draftSupabase.client, userId, {
    ...note,
    confirmedTransactionIds: [],
    pendingReconfirmation: true,
  });

  assertEqual(
    draftSupabase.calls[0].name,
    "save_financial_note_draft",
    "confirmed note edits use draft RPC",
  );
  assertEqual(
    draftSupabase.calls[0].args.p_delete_confirmed_transactions,
    true,
    "draft RPC clears persisted transactions when reconfirmation is pending",
  );
  assertEqual(
    draftSupabase.calls[0].args.p_currency,
    "UYU",
    "draft RPC sends note currency",
  );
}

runAsyncCases().catch((error) => {
  throw error;
});
