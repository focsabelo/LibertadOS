"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { shouldResetPrivateDataForAuthChange } from "@/lib/auth-state";
import { FinancialNotesModule } from "@/components/financial-notes-module";
import {
  AccessState,
  AuthPanel,
  saveStatusLabel,
  SyncStatusPill,
} from "@/components/libertad-dashboard/auth-panel";
import {
  DebtLoadPanel,
  FinancialMarginPanel,
  LifestyleInflationPanel,
} from "@/components/libertad-dashboard/financial-health-panels";
import { DecisionModePanel } from "@/components/libertad-dashboard/decision-mode-panel";
import { FireLeversPanel } from "@/components/libertad-dashboard/fire-levers-panel";
import { FixedMonthlyExpensesPanel } from "@/components/libertad-dashboard/fixed-monthly-expenses-panel";
import {
  currencyFormatter,
  numberFormatter,
  percentFormatter,
} from "@/components/libertad-dashboard/formatting";
import {
  inputClass,
  inputShellClass,
} from "@/components/libertad-dashboard/form-styles";
import {
  SectionPlaceholder,
  TargetPortfolioPanel,
} from "@/components/libertad-dashboard/portfolio-panel";
import {
  MetricCard,
  SignalRow,
} from "@/components/libertad-dashboard/shared-components";
import {
  baseFinancialInputKeys,
  fields,
  modules,
  primaryModules,
  secondaryModules,
  type AppSection,
  type SaveStatus,
} from "@/components/libertad-dashboard/types";
import {
  WeeklyExecutionPanel,
  WealthRoadmapPanel,
} from "@/components/libertad-dashboard/weekly-roadmap-panel";
import type { ConfirmedFinancialTransaction } from "@/lib/financial-notes";
import {
  createFixedMonthlyExpenseDraft,
  type FixedMonthlyExpense,
  type FixedMonthlyExpenseDraft,
} from "@/lib/fixed-monthly-expenses";
import {
  analyzeBotOpera24hs,
  analyzeConfirmedDebtLoad,
  analyzeFinancialMargin,
  analyzeLifestyleInflation,
  analyzeTargetPortfolio,
  analyzeWeeklyExecution,
  analyzeWealthRoadmap,
  annualSpend,
  calculateEffectiveInputs,
  confirmedTransactionsSummary,
  completionPercent,
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_FREEDOM_INPUTS,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  estimateYearsToTarget,
  freedomNumber,
  normalizeBotOpera24hsInvestment,
  normalizeTargetPortfolioSettings,
  type BotOpera24hsInvestment,
  type FreedomInputs,
  type InvestmentPolicySettings,
  type PortfolioAssetClass,
  type TargetPortfolioSettings,
  type WeeklyExecutionItemId,
  type WeeklyExecutionReview,
} from "@/lib/finance";
import {
  getSupabaseClient,
  getSupabaseConfigError,
} from "@/lib/supabase-client";
import {
  createFixedMonthlyExpense,
  deleteFixedMonthlyExpense,
  loadConfirmedTransactions,
  loadDashboardData,
  loadFixedMonthlyExpenses,
  saveBotOpera24hsInvestment,
  saveDashboardSettings,
  saveTargetPortfolio,
  saveWeeklyExecutionReview,
  updateFixedMonthlyExpense,
} from "@/lib/supabase-persistence";

const UY_DOLAR_API_USD_URL = "https://uy.dolarapi.com/v1/cotizaciones/usd";

type DolarApiUsdResponse = {
  compra?: number;
  venta?: number;
};

async function fetchDashboardUsdRate() {
  const response = await fetch(UY_DOLAR_API_USD_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la cotizacion USD/UYU.");
  }

  const data = (await response.json()) as DolarApiUsdResponse;
  const venta = Number(data.venta);
  const compra = Number(data.compra);

  if (Number.isFinite(venta) && venta > 0) {
    return venta;
  }

  if (Number.isFinite(compra) && compra > 0) {
    return compra;
  }

  throw new Error("La cotizacion USD/UYU recibida no es valida.");
}

function sortFixedMonthlyExpenses(expenses: FixedMonthlyExpense[]) {
  return [...expenses].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "es");
  });
}


function nextBotOperaMonth(month?: string) {
  if (!month) {
    return new Date().toISOString().slice(0, 7);
  }

  const [year, monthNumber] = month.split("-").map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return new Date().toISOString().slice(0, 7);
  }

  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));

  return nextMonth.toISOString().slice(0, 7);
}

export function LibertadDashboard() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const supabaseConfigError = useMemo(() => getSupabaseConfigError(), []);
  const [inputs, setInputs] = useState<FreedomInputs>(DEFAULT_FREEDOM_INPUTS);
  const [portfolioSettings, setPortfolioSettings] =
    useState<TargetPortfolioSettings>(DEFAULT_TARGET_PORTFOLIO_SETTINGS);
  const [botOperaInvestment, setBotOperaInvestment] =
    useState<BotOpera24hsInvestment>(DEFAULT_BOT_OPERA24HS_INVESTMENT);
  const [weeklyExecutionReviews, setWeeklyExecutionReviews] = useState<
    WeeklyExecutionReview[]
  >([]);
  const [roadmapSimulatedContribution, setRoadmapSimulatedContribution] =
    useState(0);
  const [confirmedTransactions, setConfirmedTransactions] = useState<
    ConfirmedFinancialTransaction[]
  >([]);
  const [fixedMonthlyExpenses, setFixedMonthlyExpenses] = useState<
    FixedMonthlyExpense[]
  >([]);
  const [uyuPerUsdRate, setUyuPerUsdRate] = useState<number | undefined>(
    undefined,
  );
  const [fixedExpenseDraftText, setFixedExpenseDraftText] = useState("");
  const [editingFixedExpenseId, setEditingFixedExpenseId] = useState("");
  const [fixedExpenseEditDraft, setFixedExpenseEditDraft] =
    useState<FixedMonthlyExpenseDraft>(() => createFixedMonthlyExpenseDraft(""));
  const [fixedExpenseStatus, setFixedExpenseStatus] =
    useState<SaveStatus>("idle");
  const [fixedExpenseError, setFixedExpenseError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [dataLoading, setDataLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<AppSection>("dashboard");
  const skipInitialDashboardSaveRef = useRef(true);
  const skipInitialPortfolioSaveRef = useRef(true);
  const skipInitialBotSaveRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);
  const userId = session?.user.id ?? null;

  const handleTransactionsChange = useCallback(
    (transactions: ConfirmedFinancialTransaction[]) => {
      setConfirmedTransactions(transactions);
    },
    [],
  );

  const hasUyuFixedExpense = useMemo(
    () =>
      fixedMonthlyExpenses.some(
        (expense) =>
          expense.active &&
          (expense.currency ?? "").trim().toUpperCase() === "UYU",
      ),
    [fixedMonthlyExpenses],
  );

  useEffect(() => {
    if (!hasUyuFixedExpense) {
      return;
    }

    let isMounted = true;

    fetchDashboardUsdRate()
      .then((rate) => {
        if (isMounted) {
          setUyuPerUsdRate(rate);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUyuPerUsdRate(undefined);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasUyuFixedExpense]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setLoadError(error.message);
        }

        currentUserIdRef.current = data.session?.user.id ?? null;
        setSession(data.session);
      })
      .finally(() => {
        if (isMounted) {
          setAuthLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const previousUserId = currentUserIdRef.current;
      const nextUserId = session?.user.id ?? null;

      currentUserIdRef.current = nextUserId;
      setSession(session);

      if (!shouldResetPrivateDataForAuthChange(previousUserId, nextUserId)) {
        return;
      }

      setHasLoaded(false);
      setSaveStatus("idle");
      setSaveError("");
      setFixedMonthlyExpenses([]);
      setWeeklyExecutionReviews([]);
      setFixedExpenseDraftText("");
      setEditingFixedExpenseId("");
      setFixedExpenseStatus("idle");
      setFixedExpenseError("");
      skipInitialDashboardSaveRef.current = true;
      skipInitialPortfolioSaveRef.current = true;
      skipInitialBotSaveRef.current = true;
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) {
      queueMicrotask(() => {
        setHasLoaded(false);
        setConfirmedTransactions([]);
        setFixedMonthlyExpenses([]);
        setWeeklyExecutionReviews([]);
      });
      return;
    }

    let isMounted = true;

    queueMicrotask(() => {
      if (isMounted) {
        setDataLoading(true);
        setLoadError("");
      }
    });

    Promise.all([
      loadDashboardData(supabase, userId),
      loadConfirmedTransactions(supabase, userId),
      loadFixedMonthlyExpenses(supabase, userId),
    ])
      .then(([dashboardData, transactions, fixedExpenses]) => {
        if (!isMounted) {
          return;
        }

        setInputs(dashboardData.inputs);
        setPortfolioSettings(dashboardData.portfolioSettings);
        setBotOperaInvestment(dashboardData.botOperaInvestment);
        setWeeklyExecutionReviews(dashboardData.weeklyExecutionReviews);
        setRoadmapSimulatedContribution(
          dashboardData.roadmapSimulatedContribution,
        );
        setConfirmedTransactions(transactions);
        setFixedMonthlyExpenses(fixedExpenses);
        setOnboardingSeen(dashboardData.onboardingSeen);
        skipInitialDashboardSaveRef.current = true;
        skipInitialPortfolioSaveRef.current = true;
        skipInitialBotSaveRef.current = true;
        setHasLoaded(true);
      })
      .catch((error: Error) => {
        if (isMounted) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  useEffect(() => {
    function syncSectionFromHash() {
      const hashSection = window.location.hash.slice(1);
      const matchingSection = modules.find(
        (module) => module.id === hashSection,
      );

      if (matchingSection) {
        setActiveSection(matchingSection.id);
      }
    }

    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("popstate", syncSectionFromHash);
    queueMicrotask(syncSectionFromHash);

    return () => {
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("popstate", syncSectionFromHash);
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded || !supabase || !userId) {
      return;
    }

    if (skipInitialDashboardSaveRef.current) {
      skipInitialDashboardSaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveStatus("saving");
      setSaveError("");
      saveDashboardSettings(supabase, userId, {
        inputs,
        roadmapSimulatedContribution,
        onboardingSeen,
      })
        .then(() => setSaveStatus("saved"))
        .catch((error: Error) => {
          setSaveStatus("error");
          setSaveError(error.message);
        });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    hasLoaded,
    inputs,
    onboardingSeen,
    roadmapSimulatedContribution,
    supabase,
    userId,
  ]);

  useEffect(() => {
    if (!hasLoaded || !supabase || !userId) {
      return;
    }

    if (skipInitialPortfolioSaveRef.current) {
      skipInitialPortfolioSaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveStatus("saving");
      setSaveError("");
      saveTargetPortfolio(supabase, userId, portfolioSettings)
        .then(() => setSaveStatus("saved"))
        .catch((error: Error) => {
          setSaveStatus("error");
          setSaveError(error.message);
        });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [hasLoaded, portfolioSettings, supabase, userId]);

  useEffect(() => {
    if (!hasLoaded || !supabase || !userId) {
      return;
    }

    if (skipInitialBotSaveRef.current) {
      skipInitialBotSaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      setSaveStatus("saving");
      setSaveError("");
      saveBotOpera24hsInvestment(supabase, userId, botOperaInvestment)
        .then(() => setSaveStatus("saved"))
        .catch((error: Error) => {
          setSaveStatus("error");
          setSaveError(error.message);
        });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [botOperaInvestment, hasLoaded, supabase, userId]);

  const transactionSummary = useMemo(
    () => confirmedTransactionsSummary(confirmedTransactions),
    [confirmedTransactions],
  );
  const lifestyleInflation = useMemo(
    () => analyzeLifestyleInflation(confirmedTransactions),
    [confirmedTransactions],
  );
  const confirmedDebtLoad = useMemo(
    () =>
      analyzeConfirmedDebtLoad(
        confirmedTransactions,
        inputs.monthlyContribution,
      ),
    [confirmedTransactions, inputs.monthlyContribution],
  );
  const financialMargin = useMemo(
    () =>
      analyzeFinancialMargin({
        transactions: confirmedTransactions,
        fixedExpenses: fixedMonthlyExpenses,
        estimatedMonthlyIncome: inputs.estimatedMonthlyIncome,
        uyuPerUsdRate: hasUyuFixedExpense ? uyuPerUsdRate : undefined,
      }),
    [
      confirmedTransactions,
      fixedMonthlyExpenses,
      hasUyuFixedExpense,
      inputs.estimatedMonthlyIncome,
      uyuPerUsdRate,
    ],
  );
  const targetPortfolio = useMemo(
    () => analyzeTargetPortfolio(portfolioSettings, confirmedTransactions),
    [portfolioSettings, confirmedTransactions],
  );
  const botOperaAnalysis = useMemo(
    () => analyzeBotOpera24hs(botOperaInvestment),
    [botOperaInvestment],
  );
  const weeklyExecution = useMemo(() => {
    const currentWeek = analyzeWeeklyExecution({
      transactions: confirmedTransactions,
      today: new Date(),
    }).weekKey;
    const review = weeklyExecutionReviews.find(
      (item) => item.weekKey === currentWeek,
    );

    return analyzeWeeklyExecution({
      transactions: confirmedTransactions,
      review,
      today: new Date(),
    });
  }, [confirmedTransactions, weeklyExecutionReviews]);

  const effectiveInputs = useMemo(
    () => calculateEffectiveInputs(inputs, transactionSummary),
    [inputs, transactionSummary],
  );

  const metrics = useMemo(() => {
    const target = freedomNumber(effectiveInputs.desiredMonthlySpend);
    const annual = annualSpend(effectiveInputs.desiredMonthlySpend);
    const completed = completionPercent(effectiveInputs.netWorth, target);
    const years = estimateYearsToTarget({
      currentAmount: effectiveInputs.netWorth,
      targetAmount: target,
      monthlyContribution: effectiveInputs.monthlyContribution,
      annualReturnPercent: effectiveInputs.expectedAnnualReturn,
    });
    const investRatio =
      effectiveInputs.netWorth > 0
        ? (effectiveInputs.investedCapital / effectiveInputs.netWorth) * 100
        : 0;

    return {
      annual,
      target,
      completed,
      years,
      investRatio,
      remaining: Math.max(0, target - effectiveInputs.netWorth),
    };
  }, [effectiveInputs]);

  const wealthRoadmap = useMemo(
    () =>
      analyzeWealthRoadmap({
        netWorth: effectiveInputs.netWorth,
        investedCapital: effectiveInputs.investedCapital,
        monthlyContribution: inputs.monthlyContribution,
        annualReturnPercent: inputs.expectedAnnualReturn,
        simulatedMonthlyContribution: roadmapSimulatedContribution,
      }),
    [
      effectiveInputs.investedCapital,
      effectiveInputs.netWorth,
      inputs.expectedAnnualReturn,
      inputs.monthlyContribution,
      roadmapSimulatedContribution,
    ],
  );

  const yearsLabel = Number.isFinite(metrics.years)
    ? `${numberFormatter.format(metrics.years)} anos`
    : "Sin fecha estimada";
  const hasBaseFinancialInputs = baseFinancialInputKeys.some(
    (key) => inputs[key] > 0,
  );
  const hasFreedomTarget = effectiveInputs.desiredMonthlySpend > 0;
  const hasProgressBasis =
    effectiveInputs.netWorth > 0 || effectiveInputs.investedCapital > 0;
  const hasProgressCalculation = hasFreedomTarget && hasProgressBasis;
  const isGuidedEmptyState =
    !hasBaseFinancialInputs && confirmedTransactions.length === 0;

  function updateInput(key: keyof FreedomInputs, value: string) {
    const parsedValue = Number(value);

    setInputs((current) => ({
      ...current,
      [key]: Number.isFinite(parsedValue) ? parsedValue : 0,
    }));
  }

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

  function updateInvestmentPolicy(
    key: keyof InvestmentPolicySettings,
    value: string,
  ) {
    const numericFields: (keyof InvestmentPolicySettings)[] = [
      "monthlyContributionTarget",
      "salaryInvestmentPercent",
      "emergencyFundMonths",
      "rebalanceTolerancePercent",
    ];
    const nextValue = numericFields.includes(key)
      ? Number.isFinite(Number(value))
        ? Number(value)
        : 0
      : value;

    setPortfolioSettings((current) =>
      normalizeTargetPortfolioSettings({
        ...current,
        policy: {
          ...current.policy,
          [key]: nextValue,
        },
      }),
    );
  }

  function updateBotOperaField(
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">,
    value: string,
  ) {
    const numericFields: (keyof BotOpera24hsInvestment)[] = [
      "initialCapital",
      "monthlyContribution",
      "reinvestmentMinimum",
    ];
    const nextValue = numericFields.includes(key)
      ? Number.isFinite(Number(value))
        ? Number(value)
        : 0
      : value;

    setBotOperaInvestment((current) =>
      normalizeBotOpera24hsInvestment({
        ...current,
        [key]: nextValue,
      }),
    );
  }

  function updateBotOperaMonthlyResult(
    index: number,
    key: "month" | "amount",
    value: string,
  ) {
    setBotOperaInvestment((current) =>
      normalizeBotOpera24hsInvestment({
        ...current,
        monthlyResults: current.monthlyResults.map((result, resultIndex) =>
          resultIndex === index
            ? {
                ...result,
                [key]:
                  key === "amount"
                    ? Number.isFinite(Number(value))
                      ? Number(value)
                      : 0
                    : value,
              }
            : result,
        ),
      }),
    );
  }

  function addBotOperaMonth() {
    setBotOperaInvestment((current) =>
      normalizeBotOpera24hsInvestment({
        ...current,
        monthlyResults: [
          ...current.monthlyResults,
          {
            month: nextBotOperaMonth(
              current.monthlyResults[current.monthlyResults.length - 1]?.month,
            ),
            amount: 0,
          },
        ],
      }),
    );
  }

  function removeBotOperaMonth(month: string) {
    setBotOperaInvestment((current) =>
      normalizeBotOpera24hsInvestment({
        ...current,
        monthlyResults: current.monthlyResults.filter(
          (result) => result.month !== month,
        ),
      }),
    );
  }

  function updateRoadmapSimulatedContribution(value: string) {
    const parsedValue = Number(value);

    setRoadmapSimulatedContribution(
      Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0,
    );
  }

  async function handleCreateFixedExpense() {
    if (!supabase || !userId || !fixedExpenseDraftText.trim()) {
      return;
    }

    setFixedExpenseStatus("saving");
    setFixedExpenseError("");

    try {
      const createdExpense = await createFixedMonthlyExpense(
        supabase,
        userId,
        createFixedMonthlyExpenseDraft(fixedExpenseDraftText),
      );

      setFixedMonthlyExpenses((current) =>
        sortFixedMonthlyExpenses([createdExpense, ...current]),
      );
      setFixedExpenseDraftText("");
      setFixedExpenseStatus("saved");
    } catch (error) {
      setFixedExpenseStatus("error");
      setFixedExpenseError((error as Error).message);
    }
  }

  function startEditingFixedExpense(expense: FixedMonthlyExpense) {
    setEditingFixedExpenseId(expense.id);
    setFixedExpenseEditDraft({
      name: expense.name,
      category: expense.category,
      monthlyAmount: expense.monthlyAmount,
      currency: expense.currency,
      active: expense.active,
      note: expense.note,
    });
    setFixedExpenseError("");
  }

  async function saveEditedFixedExpense(expense: FixedMonthlyExpense) {
    if (!supabase || !userId) {
      return;
    }

    setFixedExpenseStatus("saving");
    setFixedExpenseError("");

    try {
      const updatedExpense = await updateFixedMonthlyExpense(supabase, userId, {
        ...expense,
        ...fixedExpenseEditDraft,
      });

      setFixedMonthlyExpenses((current) =>
        sortFixedMonthlyExpenses(
          current.map((item) =>
            item.id === updatedExpense.id ? updatedExpense : item,
          ),
        ),
      );
      setEditingFixedExpenseId("");
      setFixedExpenseStatus("saved");
    } catch (error) {
      setFixedExpenseStatus("error");
      setFixedExpenseError((error as Error).message);
    }
  }

  async function toggleFixedExpense(expense: FixedMonthlyExpense) {
    if (!supabase || !userId) {
      return;
    }

    setFixedExpenseStatus("saving");
    setFixedExpenseError("");

    try {
      const updatedExpense = await updateFixedMonthlyExpense(supabase, userId, {
        ...expense,
        active: !expense.active,
      });

      setFixedMonthlyExpenses((current) =>
        sortFixedMonthlyExpenses(
          current.map((item) =>
            item.id === updatedExpense.id ? updatedExpense : item,
          ),
        ),
      );
      setFixedExpenseStatus("saved");
    } catch (error) {
      setFixedExpenseStatus("error");
      setFixedExpenseError((error as Error).message);
    }
  }

  async function removeFixedExpense(expense: FixedMonthlyExpense) {
    if (!supabase || !userId) {
      return;
    }

    const confirmed = window.confirm(`Eliminar "${expense.name}"?`);

    if (!confirmed) {
      return;
    }

    setFixedExpenseStatus("saving");
    setFixedExpenseError("");

    try {
      await deleteFixedMonthlyExpense(supabase, userId, expense.id);
      setFixedMonthlyExpenses((current) =>
        current.filter((item) => item.id !== expense.id),
      );
      setEditingFixedExpenseId("");
      setFixedExpenseStatus("saved");
    } catch (error) {
      setFixedExpenseStatus("error");
      setFixedExpenseError((error as Error).message);
    }
  }

  async function toggleWeeklyExecutionItem(itemId: WeeklyExecutionItemId) {
    if (!supabase || !userId) {
      return;
    }

    const previousReviews = weeklyExecutionReviews;
    const existingReview = weeklyExecutionReviews.find(
      (review) => review.weekKey === weeklyExecution.weekKey,
    ) ?? {
      weekKey: weeklyExecution.weekKey,
      completedItemIds: [],
    };
    const isCompleted = existingReview.completedItemIds.includes(itemId);
    const nextReview: WeeklyExecutionReview = {
      weekKey: weeklyExecution.weekKey,
      completedItemIds: isCompleted
        ? existingReview.completedItemIds.filter((id) => id !== itemId)
        : [...existingReview.completedItemIds, itemId],
    };

    setWeeklyExecutionReviews((current) => [
      nextReview,
      ...current.filter((review) => review.weekKey !== nextReview.weekKey),
    ]);
    setSaveStatus("saving");
    setSaveError("");

    try {
      await saveWeeklyExecutionReview(supabase, userId, nextReview);
      setSaveStatus("saved");
    } catch (error) {
      setWeeklyExecutionReviews(previousReviews);
      setSaveStatus("error");
      setSaveError((error as Error).message);
    }
  }

  function selectSection(section: AppSection) {
    setActiveSection(section);
    window.history.pushState(null, "", `#${section}`);
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setConfirmedTransactions([]);
    setWeeklyExecutionReviews([]);
  }

  const needsDebtAttention = confirmedDebtLoad.highRiskCount > 0;
  const needsMarginAttention =
    financialMargin.state === "fragil" || financialMargin.state === "ajustado";
  const needsPortfolioAttention = Boolean(targetPortfolio.targetWarning);
  const needsLifestyleAttention = lifestyleInflation.risk === "alto";
  const needsWeeklyExecution = weeklyExecution.status !== "cumplido";
  const primaryAttention = needsDebtAttention
    ? "Revisar deuda confirmada"
    : needsMarginAttention
      ? "Revisar margen financiero"
      : needsLifestyleAttention
        ? "Revisar inflacion de estilo de vida"
        : needsPortfolioAttention
          ? "Ajustar objetivos de cartera"
          : needsWeeklyExecution
            ? "Cerrar sistema semanal"
            : isGuidedEmptyState
              ? "Cargar datos base"
              : confirmedTransactions.length === 0
              ? "Capturar y confirmar el primer movimiento"
              : "Mantener captura semanal";
  const weeklyAction = needsDebtAttention
    ? "Abrir deuda y revisar la presion mensual."
    : needsMarginAttention
      ? "Abrir margen y acercar el colchon al punto de tranquilidad."
      : needsLifestyleAttention
        ? "Abrir dashboard y aplicar una regla concreta al aumento."
        : needsPortfolioAttention
          ? "Abrir cartera y corregir objetivos hasta 100%."
          : weeklyExecution.recommendation;
  const primaryActionSection: AppSection = needsDebtAttention
    ? "deuda"
    : needsMarginAttention
      ? "margen"
      : needsLifestyleAttention
        ? "dashboard"
        : needsPortfolioAttention
          ? "cartera"
          : needsWeeklyExecution
            ? "semana"
            : isGuidedEmptyState
              ? "configuracion"
              : "notas";

  if (supabaseConfigError) {
    return (
      <AccessState
        title="Configura Supabase"
        body={`${supabaseConfigError} Agrega los valores en .env y reinicia el servidor.`}
      />
    );
  }

  if (!supabase) {
    return (
      <AccessState
        title="Supabase no disponible"
        body="No se puede iniciar la sesion ni cargar datos privados hasta configurar el cliente."
      />
    );
  }

  if (authLoading) {
    return <AccessState title="Cargando sesion" body="Preparando acceso seguro..." />;
  }

  if (!userId) {
    return <AuthPanel supabase={supabase} />;
  }

  if (dataLoading && !hasLoaded) {
    return (
      <AccessState
        title="Cargando tus datos"
        body="Leyendo settings, cartera, bot y transacciones confirmadas."
      />
    );
  }

  return (
    <main
      id="dashboard"
      className="min-h-screen overflow-x-hidden bg-[var(--background)] text-stone-950"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <header className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-stone-900 bg-stone-950 px-4 py-3 text-white shadow-sm sm:max-w-none sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-emerald-300">
                Libertad OS
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-normal text-white text-balance sm:text-3xl">
                Sistema personal de libertad financiera
              </h1>
              <p className="mt-1.5 max-w-[32ch] break-words text-sm leading-6 text-stone-300 sm:max-w-2xl">
                Medí tu número x25, capturá decisiones y confirmá notas antes
                de impactar datos.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <SyncStatusPill
                  label={saveStatusLabel(saveStatus)}
                  tone={saveStatus === "error" ? "red" : "green"}
                />
                {dataLoading ? (
                  <SyncStatusPill label="Cargando datos" tone="neutral" />
                ) : null}
                {loadError || saveError ? (
                  <span
                    aria-live="polite"
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-950"
                  >
                    {loadError || saveError}
                  </span>
                ) : null}
                <button
                  className="min-h-8 rounded-md border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-stone-200 transition-colors hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                  type="button"
                  onClick={handleSignOut}
                >
                  Salir
                </button>
              </div>
            </div>
            <div className="grid w-full min-w-0 max-w-full gap-2.5 overflow-hidden lg:w-[540px]">
              <nav
                className="libertad-scroll flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-1"
                aria-label="Secciones principales"
              >
                {primaryModules.map((module) => (
                  <button
                    key={module.id}
                    aria-pressed={activeSection === module.id}
                    className={`shrink-0 border-b-2 px-0.5 py-1.5 text-sm font-semibold transition-colors focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${
                      activeSection === module.id
                        ? "border-emerald-300 text-white"
                        : "border-transparent text-stone-300 hover:text-white"
                    }`}
                    type="button"
                    onClick={() => selectSection(module.id)}
                  >
                    {module.label}
                  </button>
                ))}
              </nav>

              <div className="min-w-0 max-w-full overflow-hidden border-t border-white/10 pt-2">
                <div className="flex w-full min-w-0 items-center gap-3">
                  <span className="shrink-0 text-xs font-semibold text-stone-500">
                    Avanzado
                  </span>
                  <div className="libertad-scroll flex min-w-0 max-w-full gap-3 overflow-x-auto pb-1">
                    {secondaryModules.map((module) => (
                      <button
                        key={module.id}
                        aria-pressed={activeSection === module.id}
                        className={`shrink-0 border-b py-1 text-xs font-semibold transition-colors focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${
                          activeSection === module.id
                            ? "border-stone-400 text-stone-200"
                            : "border-transparent text-stone-500 hover:text-stone-300"
                        }`}
                        type="button"
                        onClick={() => selectSection(module.id)}
                      >
                        {module.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div
          id={`${activeSection}-view`}
          className="grid gap-5 scroll-mt-6"
          aria-live="polite"
        >
          {activeSection === "dashboard" ? (
            <>
              {isGuidedEmptyState ? (
                <section className="libertad-surface rounded-lg p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold text-emerald-800">
                        Cuenta nueva
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-stone-950 text-balance">
                        Carga tus datos base o confirma una nota para activar el tablero.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        Libertad OS no usa ejemplos como datos reales. Los
                        numeros aparecen cuando cargues patrimonio, capital,
                        gasto mensual y aporte, o cuando confirmes movimientos.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        type="button"
                        onClick={() => selectSection("configuracion")}
                      >
                        Cargar datos base
                      </button>
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        type="button"
                        onClick={() => selectSection("notas")}
                      >
                        Capturar una nota
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="libertad-surface rounded-lg p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">
                        Numero de libertad financiera
                      </p>
                      <p className="libertad-number mt-2 break-words text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
                        {hasFreedomTarget
                          ? currencyFormatter.format(metrics.target)
                          : "Sin gasto mensual"}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-md border border-stone-200 bg-stone-950 px-4 py-3 text-left text-white">
                      <p className="text-sm font-medium text-stone-300">
                        Falta para la meta
                      </p>
                      <p className="libertad-number mt-1 text-2xl font-semibold text-white">
                        {hasProgressCalculation
                          ? currencyFormatter.format(metrics.remaining)
                          : "Sin calcular"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-lg border border-stone-200 bg-[#f8f7f3] p-4">
                    <div className="flex items-center justify-between gap-4 text-sm font-medium">
                      <span className="text-stone-600">Progreso total</span>
                      <span className="libertad-number text-lg font-semibold text-stone-950">
                        {hasProgressCalculation
                          ? `${percentFormatter.format(metrics.completed)}%`
                          : "Sin calcular"}
                      </span>
                    </div>
                    <div
                      aria-label={
                        hasProgressCalculation
                          ? `Progreso total ${percentFormatter.format(
                              metrics.completed,
                            )}%`
                          : "Progreso total sin calcular"
                      }
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={
                        hasProgressCalculation
                          ? Math.min(100, Math.max(0, metrics.completed))
                          : 0
                      }
                      className="libertad-meter mt-4 h-5"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-700"
                        style={{
                          width: `${
                            hasProgressCalculation
                              ? Math.min(100, Math.max(0, metrics.completed))
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 flex justify-between text-xs font-medium text-stone-500">
                      <span>Hoy</span>
                      <span>50%</span>
                      <span>Libertad</span>
                    </div>
                  </div>

                  <div className="libertad-card-grid mt-7 grid gap-3">
                    <MetricCard
                      label="Gasto anual"
                      value={
                        hasFreedomTarget
                          ? currencyFormatter.format(metrics.annual)
                          : "Sin cargar"
                      }
                    />
                    <MetricCard
                      label="Tiempo estimado"
                      value={hasProgressCalculation ? yearsLabel : "Sin calcular"}
                      tone="blue"
                    />
                    <MetricCard
                      label="Patrimonio invertido"
                      value={
                        hasProgressBasis
                          ? `${percentFormatter.format(metrics.investRatio)}%`
                          : "Sin cargar"
                      }
                      tone="green"
                    />
                  </div>
                </div>

                <aside className="rounded-lg border border-emerald-950 bg-[#11231d] p-5 text-white shadow-sm sm:p-6">
                  <p className="text-sm font-medium text-stone-300">
                    Proximos pasos
                  </p>
                  <p className="mt-4 text-3xl font-semibold text-balance">
                    {primaryAttention}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-stone-300">
                    {weeklyAction}
                  </p>
                  <div className="mt-5 grid gap-2">
                    <SignalRow
                      label="Movimientos confirmados"
                      value={confirmedTransactions.length.toString()}
                    />
                    <SignalRow
                      label="Margen mensual"
                      value={
                        isGuidedEmptyState
                          ? "Sin movimientos"
                          : currencyFormatter.format(
                              financialMargin.availableMonthlyMargin,
                        )
                      }
                    />
                  </div>
                  <div className="mt-5 grid gap-2">
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                      type="button"
                      onClick={() => selectSection("notas")}
                    >
                      Capturar nota
                    </button>
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                      type="button"
                      onClick={() => selectSection(primaryActionSection)}
                    >
                      Abrir paso sugerido
                    </button>
                  </div>
                </aside>
              </section>

              <section className="libertad-surface rounded-lg p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-950">
                      Pulso financiero
                    </h2>
                  </div>
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    type="button"
                    onClick={() => selectSection("notas")}
                  >
                    Capturar nota
                  </button>
                </div>

                <div className="libertad-card-grid mt-5 grid gap-3">
                  <MetricCard
                    label="Patrimonio actual"
                    value={
                      effectiveInputs.netWorth > 0
                        ? currencyFormatter.format(effectiveInputs.netWorth)
                        : "Sin cargar"
                    }
                    tone="green"
                  />
                  <MetricCard
                    label="Capital invertido"
                    value={
                      effectiveInputs.investedCapital > 0
                        ? currencyFormatter.format(effectiveInputs.investedCapital)
                        : "Sin cargar"
                      }
                      tone="blue"
                    />
                  <MetricCard
                    label="Margen mensual"
                    value={
                      isGuidedEmptyState
                        ? "Sin movimientos"
                        : currencyFormatter.format(
                            financialMargin.availableMonthlyMargin,
                          )
                    }
                    tone={
                      financialMargin.state === "fragil"
                        ? "red"
                        : financialMargin.state === "ajustado"
                          ? "amber"
                      : "green"
                    }
                  />
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "notas" ? (
            <FinancialNotesModule
              supabase={supabase}
              userId={userId}
              onTransactionsChange={handleTransactionsChange}
            />
          ) : null}

          {activeSection === "cartera" ? (
            <TargetPortfolioPanel
              analysis={targetPortfolio}
              botAnalysis={botOperaAnalysis}
              botInvestment={botOperaInvestment}
              manualAmounts={portfolioSettings.manualAmounts}
              policy={targetPortfolio.policy}
              onBotFieldChange={updateBotOperaField}
              onBotMonthlyResultChange={updateBotOperaMonthlyResult}
              onBotMonthAdd={addBotOperaMonth}
              onBotMonthRemove={removeBotOperaMonth}
              onManualAmountChange={updatePortfolioManualAmount}
              onPolicyChange={updateInvestmentPolicy}
              onTargetChange={updatePortfolioTarget}
            />
          ) : null}

          {activeSection === "deuda" ? (
            <DebtLoadPanel analysis={confirmedDebtLoad} />
          ) : null}

          {activeSection === "palancas" ? (
            <FireLeversPanel summary={transactionSummary} />
          ) : null}

          {activeSection === "estilo" ? (
            <LifestyleInflationPanel analysis={lifestyleInflation} />
          ) : null}

          {activeSection === "margen" ? (
            <FinancialMarginPanel
              analysis={financialMargin}
              onOpenSettings={() => selectSection("configuracion")}
            />
          ) : null}

          {activeSection === "semana" ? (
            <WeeklyExecutionPanel
              analysis={weeklyExecution}
              onOpenNotes={() => selectSection("notas")}
              onToggleItem={toggleWeeklyExecutionItem}
            />
          ) : null}

          {activeSection === "configuracion" ? (
            <>
              <section className="libertad-surface rounded-lg p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-3xl">
                    <h2 className="text-xl font-semibold text-stone-950">
                      Datos base
                    </h2>
                  </div>
                  <p className="text-sm font-medium text-stone-500">
                    Guardado automatico
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <label key={field.id} className="grid gap-2">
                      <span className="text-sm font-medium text-stone-700">
                        {field.label}
                      </span>
                      <div className={inputShellClass}>
                        {field.prefix ? (
                          <span className="mr-2 text-sm font-semibold text-stone-500">
                            {field.prefix}
                          </span>
                        ) : null}
                        <input
                          autoComplete="off"
                          className={inputClass}
                          inputMode="decimal"
                          min="0"
                          name={field.id}
                          placeholder={field.placeholder}
                          step={field.step}
                          type="number"
                          value={
                            baseFinancialInputKeys.includes(
                              field.id as (typeof baseFinancialInputKeys)[number],
                            ) && inputs[field.id] === 0
                              ? ""
                              : inputs[field.id]
                          }
                          onChange={(event) =>
                            updateInput(field.id, event.target.value)
                          }
                        />
                        {field.suffix ? (
                          <span className="ml-2 text-sm font-semibold text-stone-500">
                            {field.suffix}
                          </span>
                        ) : null}
                      </div>
                      {field.description ? (
                        <span className="text-xs leading-5 text-stone-500">
                          {field.description}
                        </span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </section>

              <FixedMonthlyExpensesPanel
                actionStatus={fixedExpenseStatus}
                draftText={fixedExpenseDraftText}
                editingExpenseId={editingFixedExpenseId}
                editDraft={fixedExpenseEditDraft}
                error={fixedExpenseError}
                expenses={fixedMonthlyExpenses}
                loading={dataLoading && !hasLoaded}
                uyuPerUsdRate={uyuPerUsdRate}
                onCancelEdit={() => setEditingFixedExpenseId("")}
                onCreate={handleCreateFixedExpense}
                onDelete={removeFixedExpense}
                onDraftTextChange={setFixedExpenseDraftText}
                onEditDraftChange={setFixedExpenseEditDraft}
                onSaveEdit={saveEditedFixedExpense}
                onStartEdit={startEditingFixedExpense}
                onToggle={toggleFixedExpense}
              />
            </>
          ) : null}

          {activeSection === "decisiones" ? (
            <DecisionModePanel context={effectiveInputs} />
          ) : null}

          {activeSection === "roadmap" ? (
            <WealthRoadmapPanel
              analysis={wealthRoadmap}
              confirmedExpenseImpact={transactionSummary.confirmedExpenses}
              monthlyContribution={inputs.monthlyContribution}
              simulatedContribution={roadmapSimulatedContribution}
              onSimulatedContributionChange={updateRoadmapSimulatedContribution}
            />
          ) : null}

          {activeSection === "macro" ? (
            <SectionPlaceholder
              title="Macro queda aislado del tablero operativo."
              body="El contexto externo podra informar decisiones, pero no debe dominar la conducta ni entrar como dato confirmado."
              action="Revisar pulso financiero"
              onAction={() => selectSection("dashboard")}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
