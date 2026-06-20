import {
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  type FreedomInputs,
} from "../src/lib/finance";
import {
  createDashboardSettingsPayload,
  createDefaultDashboardData,
  normalizeDashboardData,
} from "../src/lib/supabase-persistence";

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
  normalized.roadmapSimulatedContribution > 0,
  "missing roadmap simulation falls back to a positive default",
);
