"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { shouldResetPrivateDataForAuthChange } from "@/lib/auth-state";
import {
  FinancialNotesModule,
} from "@/components/financial-notes-module";
import type { ConfirmedFinancialTransaction } from "@/lib/financial-notes";
import {
  FIXED_MONTHLY_EXPENSE_CATEGORIES,
  FIXED_MONTHLY_EXPENSE_CURRENCIES,
  createFixedMonthlyExpenseDraft,
  summarizeActiveFixedExpenses,
  type FixedMonthlyExpense,
  type FixedMonthlyExpenseDraft,
} from "@/lib/fixed-monthly-expenses";
import {
  analyzeConfirmedDebtLoad,
  analyzeBotOpera24hs,
  analyzeFinancialMargin,
  analyzeTargetPortfolio,
  analyzeWeeklyExecution,
  analyzeWealthRoadmap,
  annualSpend,
  analyzeLifestyleInflation,
  calculateEffectiveInputs,
  confirmedTransactionsSummary,
  completionPercent,
  coreExpenseShare,
  DEFAULT_BOT_OPERA24HS_INVESTMENT,
  DEFAULT_FREEDOM_INPUTS,
  DEFAULT_TARGET_PORTFOLIO_SETTINGS,
  estimateYearsToTarget,
  fireReductionScenarios,
  freedomNumber,
  normalizeBotOpera24hsInvestment,
  normalizeTargetPortfolioSettings,
  type BotOpera24hsInvestment,
  type FreedomInputs,
  type InvestmentPolicySettings,
  type MilestoneProgress,
  type PortfolioAssetClass,
  type TargetPortfolioSettings,
  type WeeklyExecutionItemId,
  type WeeklyExecutionReview,
  type WeeklyExecutionStatus,
  type WeeklyExecutionAnalysis,
  type WealthRoadmapAnalysis,
} from "@/lib/finance";
import {
  getSupabaseClient,
  getSupabaseConfigError,
} from "@/lib/supabase-client";
import {
  createFixedMonthlyExpense,
  deleteFixedMonthlyExpense,
  loadFixedMonthlyExpenses,
  loadConfirmedTransactions,
  loadDashboardData,
  saveBotOpera24hsInvestment,
  saveDashboardSettings,
  saveTargetPortfolio,
  saveWeeklyExecutionReview,
  updateFixedMonthlyExpense,
} from "@/lib/supabase-persistence";

const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 1,
});

function formatCurrencyAmount(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${numberFormatter.format(amount)}`;
  }
}

function sortFixedMonthlyExpenses(expenses: FixedMonthlyExpense[]) {
  return [...expenses].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "es");
  });
}

type Field = {
  id: keyof FreedomInputs;
  label: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  placeholder?: string;
};

const fields: Field[] = [
  {
    id: "netWorth",
    label: "Patrimonio actual",
    prefix: "USD",
    step: "500",
  },
  {
    id: "investedCapital",
    label: "Capital invertido",
    prefix: "USD",
    step: "500",
  },
  {
    id: "desiredMonthlySpend",
    label: "Gasto mensual deseado",
    prefix: "USD",
    step: "100",
  },
  {
    id: "monthlyContribution",
    label: "Aporte mensual",
    prefix: "USD",
    step: "100",
  },
  {
    id: "expectedAnnualReturn",
    label: "Retorno anual esperado",
    suffix: "%",
    step: "0.1",
  },
];

const baseFinancialInputKeys = [
  "netWorth",
  "investedCapital",
  "desiredMonthlySpend",
  "monthlyContribution",
] as const;

type AppSection =
  | "dashboard"
  | "notas"
  | "decisiones"
  | "margen"
  | "cartera"
  | "deuda"
  | "semana"
  | "roadmap"
  | "macro"
  | "palancas"
  | "estilo"
  | "configuracion";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const primaryModules: {
  id: AppSection;
  label: string;
  description: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Resumen operativo",
  },
  {
    id: "notas",
    label: "Notas",
    description: "Captura y revisión",
  },
  {
    id: "margen",
    label: "Margen",
    description: "Libertad mensual",
  },
  {
    id: "configuracion",
    label: "Configuración",
    description: "Datos base",
  },
];

const secondaryModules: {
  id: AppSection;
  label: string;
  description: string;
}[] = [
  {
    id: "decisiones",
    label: "Decisiones",
    description: "Filtro anti-error",
  },
  {
    id: "cartera",
    label: "Cartera",
    description: "Asignación objetivo",
  },
  {
    id: "deuda",
    label: "Deuda",
    description: "Carga confirmada",
  },
  {
    id: "palancas",
    label: "Palancas",
    description: "Impacto FIRE",
  },
  {
    id: "estilo",
    label: "Estilo",
    description: "Inflación de vida",
  },
  {
    id: "semana",
    label: "Semana",
    description: "Ejecución semanal",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    description: "Hitos patrimoniales",
  },
  {
    id: "macro",
    label: "Macro",
    description: "Contexto externo",
  },
];

const modules = [...primaryModules, ...secondaryModules];

type TransactionSummary = ReturnType<typeof confirmedTransactionsSummary>;

const inputShellClass =
  "libertad-field flex h-12 items-center rounded-md bg-white px-3";

const inputClass =
  "h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-stone-950 outline-none placeholder:text-stone-500 libertad-number";

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
      }),
    [confirmedTransactions, fixedMonthlyExpenses],
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
            <SectionPlaceholder
              title="Modo decision sera el siguiente bloque de producto."
              body="Por ahora, las compras futuras siguen entrando como notas revisables. Nada se guarda como gasto real sin confirmacion."
              action="Usar Notas para capturar una decision"
              onAction={() => selectSection("notas")}
            />
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

function AccessState({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
      </section>
    </main>
  );
}

function AuthPanel({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const credentials = { email, password };
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      return;
    }

    setStatus("saved");
    setMessage(
      mode === "signin"
        ? "Sesion iniciada."
        : "Cuenta creada. Revisa tu correo si Supabase pide confirmacion.",
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-emerald-800">Libertad OS</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-950">
          Acceso privado
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Inicia sesion para ver y modificar tus datos financieros persistentes.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              autoComplete="email"
              className="libertad-field h-12 rounded-md px-3 text-sm font-semibold text-stone-950"
              name="email"
              spellCheck={false}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">
              Contrasena
            </span>
            <input
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="libertad-field h-12 rounded-md px-3 text-sm font-semibold text-stone-950"
              minLength={6}
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message ? (
            <p
              aria-live="polite"
              className={`rounded-md border px-3 py-2 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
              }`}
            >
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="min-h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={status === "saving"}
              type="submit"
            >
              {status === "saving"
                ? "Guardando…"
                : mode === "signin"
                  ? "Iniciar sesion"
                  : "Crear cuenta"}
            </button>
            <button
              className="min-h-11 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
                setStatus("idle");
              }}
            >
              {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function saveStatusLabel(status: SaveStatus) {
  if (status === "saving") {
    return "Guardando";
  }

  if (status === "saved") {
    return "Guardado";
  }

  if (status === "error") {
    return "Error al guardar";
  }

  return "Sesión activa";
}

function SyncStatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "green" | "red";
}) {
  const toneClasses = {
    neutral: "border-white/15 bg-white/[0.06] text-stone-200",
    green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    red: "border-red-300 bg-red-50 text-red-950",
  };

  return (
    <span
      aria-live="polite"
      className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function WeeklyExecutionPanel({
  analysis,
  onOpenNotes,
  onToggleItem,
}: {
  analysis: WeeklyExecutionAnalysis;
  onOpenNotes: () => void;
  onToggleItem: (itemId: WeeklyExecutionItemId) => void;
}) {
  const status = weeklyExecutionStatusCopy(analysis.status);

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-stone-950">
            Sistema semanal de ejecucion
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Revision operativa de la semana en curso. El checklist no crea
            transacciones: solo ayuda a cerrar conducta, datos confirmados y
            proxima accion.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${status.classes}`}
        >
          {status.label}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">
            Semana {analysis.weekKey}
          </p>
          <p className="libertad-number mt-3 text-4xl font-semibold">
            {analysis.scorePercent}%
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {analysis.completedCount} de {analysis.totalCount} puntos cerrados.
          </p>
          <div
            aria-label={`Ejecucion semanal ${analysis.scorePercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={analysis.scorePercent}
            className="libertad-meter mt-5 h-4 bg-white/15"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${analysis.scorePercent}%` }}
            />
          </div>
          <div className="mt-5 grid gap-2">
            <SignalRow
              label="Ingreso semanal"
              value={currencyFormatter.format(analysis.weekIncome)}
            />
            <SignalRow
              label="Gasto semanal"
              value={currencyFormatter.format(analysis.weekExpenses)}
            />
            <SignalRow
              label="Tasa de ahorro"
              value={`${percentFormatter.format(analysis.savingRate)}%`}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="libertad-soft-panel rounded-md p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Accion principal
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {analysis.recommendation}
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                type="button"
                onClick={onOpenNotes}
              >
                Capturar nota
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Aportes"
              value={analysis.investmentCount.toString()}
              tone={analysis.investmentCount > 0 ? "green" : "neutral"}
            />
            <MetricCard
              label="Compras emocionales"
              value={analysis.emotionalPurchaseCount.toString()}
              tone={analysis.emotionalPurchaseCount > 0 ? "amber" : "neutral"}
            />
            <MetricCard
              label="Deuda nueva"
              value={analysis.newDebtCount.toString()}
              tone={analysis.newDebtCount > 0 ? "red" : "neutral"}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {analysis.items.map((item) => (
          <button
            key={item.id}
            aria-pressed={item.completed}
            className={`min-h-16 rounded-md border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              item.completed
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50"
            }`}
            type="button"
            onClick={() => onToggleItem(item.id)}
          >
            <span className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                  item.completed
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-stone-300 bg-white text-transparent"
                }`}
              >
                OK
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-5 opacity-75">
                  {item.detail}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {analysis.overdueActions.length > 0 ? (
        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-800">
            Pendiente para cerrar
          </p>
          <ul className="mt-3 grid gap-2">
            {analysis.overdueActions.slice(0, 4).map((action) => (
              <li
                key={action}
                className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function weeklyExecutionStatusCopy(status: WeeklyExecutionStatus) {
  const copy = {
    pendiente: {
      label: "Pendiente",
      classes: "border-stone-200 bg-stone-50 text-stone-800",
    },
    incompleto: {
      label: "Incompleto",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    cumplido: {
      label: "Cumplido",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
  };

  return copy[status];
}

function WealthRoadmapPanel({
  analysis,
  confirmedExpenseImpact,
  monthlyContribution,
  simulatedContribution,
  onSimulatedContributionChange,
}: {
  analysis: WealthRoadmapAnalysis;
  confirmedExpenseImpact: number;
  monthlyContribution: number;
  simulatedContribution: number;
  onSimulatedContributionChange: (value: string) => void;
}) {
  const nextMilestone = analysis.nextMilestone;
  const expenseDelayMonths =
    monthlyContribution > 0 ? confirmedExpenseImpact / monthlyContribution : 0;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Roadmap patrimonial
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Hitos patrimoniales calculados con datos confirmados. La simulacion
            queda separada de la realidad.
          </p>
        </div>
        <label className="grid gap-2 sm:min-w-[260px]">
          <span className="text-sm font-semibold text-stone-700">
            Simular aporte mensual
          </span>
          <div className={inputShellClass}>
            <span className="mr-2 text-sm font-semibold text-stone-500">
              USD
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              inputMode="decimal"
              min="0"
              name="roadmap-simulated-contribution"
              step="100"
              type="number"
              value={simulatedContribution}
              onChange={(event) =>
                onSimulatedContributionChange(event.target.value)
              }
            />
          </div>
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-stone-900 bg-stone-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">
            Proximo hito
          </p>
          {nextMilestone ? (
            <>
              <h3 className="mt-3 text-3xl font-semibold text-balance">
                {nextMilestone.milestone.label}
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Te faltan{" "}
                {currencyFormatter.format(nextMilestone.distanceAmount)} para
                llegar a este hito.
              </p>
              <div
                aria-label={`${nextMilestone.milestone.label}: ${percentFormatter.format(
                  nextMilestone.progressPercent,
                )}% completado`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.min(
                  100,
                  Math.max(0, nextMilestone.progressPercent),
                )}
                className="libertad-meter mt-5 h-4 bg-white/15"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, nextMilestone.progressPercent),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-5 grid gap-2">
                <SignalRow
                  label="Aporte actual"
                  value={formatMonths(nextMilestone.estimatedMonths)}
                />
                <SignalRow
                  label="Aporte simulado"
                  value={formatMonths(nextMilestone.simulatedEstimatedMonths)}
                />
                <SignalRow
                  label="Progreso"
                  value={`${percentFormatter.format(
                    nextMilestone.progressPercent,
                  )}%`}
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Todos los hitos base aparecen alcanzados con los supuestos
              actuales.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          <MetricCard
            label="Gastos confirmados"
            value={currencyFormatter.format(confirmedExpenseImpact)}
            tone={confirmedExpenseImpact > 0 ? "amber" : "neutral"}
          />
          <MetricCard
            label="Impacto sobre hito"
            value={
              expenseDelayMonths > 0
                ? `${numberFormatter.format(expenseDelayMonths)} meses`
                : "Sin retraso detectado"
            }
            tone={expenseDelayMonths > 0 ? "amber" : "green"}
          />
          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Regla de lectura
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              El progreso real usa patrimonio e inversion confirmados. La
              simulacion solo cambia el aporte mensual supuesto.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {analysis.milestones.map((milestone) => (
          <MilestoneRow key={milestone.milestone.id} milestone={milestone} />
        ))}
      </div>
    </section>
  );
}

function MilestoneRow({ milestone }: { milestone: MilestoneProgress }) {
  const statusClasses = milestone.isReached
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : milestone.isNext
      ? "border-stone-900 bg-stone-950 text-white"
      : "border-stone-200 bg-white text-stone-800";

  return (
    <div className={`rounded-md border p-4 ${statusClasses}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_130px_150px_150px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{milestone.milestone.label}</p>
            {milestone.isNext ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                Prioritario
              </span>
            ) : null}
            {milestone.isReached ? (
              <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-950">
                Alcanzado
              </span>
            ) : null}
          </div>
          <p
            className={`mt-1 text-xs leading-5 ${
              milestone.isNext ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Base: {roadmapBasisLabel(milestone.milestone.basis)}
          </p>
          <div
            aria-label={`${milestone.milestone.label}: ${percentFormatter.format(
              milestone.progressPercent,
            )}% completado`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.min(100, Math.max(0, milestone.progressPercent))}
            className={`libertad-meter mt-3 h-3 ${
              milestone.isNext ? "bg-white/15" : ""
            }`}
            role="progressbar"
          >
            <div
              className={`h-full rounded-full ${
                milestone.isNext ? "bg-emerald-400" : "bg-emerald-700"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, milestone.progressPercent),
                )}%`,
              }}
            />
          </div>
        </div>

        <RoadmapValue label="Actual" value={currencyFormatter.format(milestone.currentAmount)} />
        <RoadmapValue label="Faltan" value={currencyFormatter.format(milestone.distanceAmount)} />
        <RoadmapValue label="Fecha estimada" value={formatMonths(milestone.estimatedMonths)} />
      </div>
    </div>
  );
}

function RoadmapValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="libertad-number mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function roadmapBasisLabel(basis: MilestoneProgress["milestone"]["basis"]) {
  return basis === "invested_capital" ? "capital invertido" : "patrimonio neto";
}

function formatMonths(months?: number) {
  if (months === undefined || !Number.isFinite(months)) {
    return "Sin fecha";
  }

  if (months <= 0) {
    return "Alcanzado";
  }

  if (months < 1) {
    return "Menos de 1 mes";
  }

  return `${numberFormatter.format(months)} meses`;
}

function FixedMonthlyExpensesPanel({
  expenses,
  draftText,
  editDraft,
  editingExpenseId,
  loading,
  error,
  actionStatus,
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

function SectionPlaceholder({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="libertad-surface rounded-lg p-6 sm:p-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-stone-950 text-balance">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{body}</p>
        <button
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onAction}
        >
          {action}
        </button>
      </div>
    </section>
  );
}

function TargetPortfolioPanel({
  analysis,
  botAnalysis,
  botInvestment,
  manualAmounts,
  policy,
  onBotFieldChange,
  onBotMonthlyResultChange,
  onBotMonthAdd,
  onBotMonthRemove,
  onManualAmountChange,
  onPolicyChange,
  onTargetChange,
}: {
  analysis: ReturnType<typeof analyzeTargetPortfolio>;
  botAnalysis: ReturnType<typeof analyzeBotOpera24hs>;
  botInvestment: BotOpera24hsInvestment;
  manualAmounts: TargetPortfolioSettings["manualAmounts"];
  policy: InvestmentPolicySettings;
  onBotFieldChange: (
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">,
    value: string,
  ) => void;
  onBotMonthlyResultChange: (
    index: number,
    key: "month" | "amount",
    value: string,
  ) => void;
  onBotMonthAdd: () => void;
  onBotMonthRemove: (month: string) => void;
  onManualAmountChange: (assetClass: PortfolioAssetClass, value: string) => void;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
  onTargetChange: (assetClass: PortfolioAssetClass, value: string) => void;
}) {
  const largestImbalance = analysis.largestImbalance;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
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
          aria-live="polite"
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
        <div
          aria-live="polite"
          className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
        >
          Los objetivos no suman 100%. Podes seguir editando sin perder la
          lectura actual.
        </div>
      ) : null}

      <div className="libertad-card-grid mt-5 grid gap-3">
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

      <BotOpera24hsPanel
        analysis={botAnalysis}
        investment={botInvestment}
        onFieldChange={onBotFieldChange}
        onMonthAdd={onBotMonthAdd}
        onMonthRemove={onBotMonthRemove}
        onMonthlyResultChange={onBotMonthlyResultChange}
      />

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

      <InvestmentPolicyPanel policy={policy} onPolicyChange={onPolicyChange} />
    </section>
  );
}

function BotOpera24hsPanel({
  analysis,
  investment,
  onFieldChange,
  onMonthAdd,
  onMonthRemove,
  onMonthlyResultChange,
}: {
  analysis: ReturnType<typeof analyzeBotOpera24hs>;
  investment: BotOpera24hsInvestment;
  onFieldChange: (
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">,
    value: string,
  ) => void;
  onMonthAdd: () => void;
  onMonthRemove: (month: string) => void;
  onMonthlyResultChange: (
    index: number,
    key: "month" | "amount",
    value: string,
  ) => void;
}) {
  const setupFields: {
    key: keyof Omit<BotOpera24hsInvestment, "name" | "monthlyResults">;
    label: string;
    type: "text" | "date" | "number";
    prefix?: string;
    suffix?: string;
    step?: string;
  }[] = [
    { key: "botNumber", label: "Tipo / numero de bot", type: "text" },
    { key: "startDate", label: "Inicio de funcionamiento", type: "date" },
    {
      key: "initialCapital",
      label: "Capital inicial",
      type: "number",
      prefix: "USD",
      step: "100",
    },
    {
      key: "monthlyContribution",
      label: "Aporte mensual",
      type: "number",
      prefix: "USD",
      step: "50",
    },
    {
      key: "reinvestmentMinimum",
      label: "Minimo para reinvertir",
      type: "number",
      prefix: "USD",
      step: "50",
    },
  ];

  return (
    <section className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-950">
            Bot Opera24hs
          </h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Registro separado para medir aportes, capital operativo y ganancias
            sin mezclar datos de notas no confirmadas.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700">
          Aportes pendientes hasta reinvertir
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setupFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
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
                className={
                  field.type === "number" ? inputClass : `${inputClass} text-sm`
                }
                inputMode={field.type === "number" ? "decimal" : undefined}
                min={field.type === "number" ? "0" : undefined}
                name={`bot-opera-${field.key}`}
                step={field.step}
                type={field.type}
                value={investment[field.key] as string | number}
                onChange={(event) =>
                  onFieldChange(field.key, event.target.value)
                }
              />
              {field.suffix ? (
                <span className="ml-2 text-sm font-semibold text-stone-500">
                  {field.suffix}
                </span>
              ) : null}
            </div>
          </label>
        ))}
      </div>

      <label className="mt-4 grid gap-2">
        <span className="text-xs font-semibold text-stone-600">
          Regla de reinversion
        </span>
        <textarea
          autoComplete="off"
          className="libertad-field min-h-20 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900"
          name="bot-opera-reinvestment-rule"
          value={investment.reinvestmentRule}
          onChange={(event) =>
            onFieldChange("reinvestmentRule", event.target.value)
          }
        />
      </label>

      <div className="libertad-card-grid mt-4 grid gap-3">
        <MetricCard
          label="Capital total aportado"
          value={currencyFormatter.format(analysis.capitalTotalContributed)}
          tone="blue"
        />
        <MetricCard
          label="Capital operativo actual"
          value={currencyFormatter.format(analysis.currentOperationalCapital)}
          tone="green"
        />
        <MetricCard
          label="Capital pendiente"
          value={currencyFormatter.format(analysis.pendingCapital)}
          tone="amber"
        />
        <MetricCard
          label="Falta para reinvertir"
          value={currencyFormatter.format(analysis.amountUntilNextReinvestment)}
        />
        <MetricCard
          label="Resultado del mes"
          value={currencyFormatter.format(analysis.currentMonthResult)}
          tone={analysis.currentMonthResult >= 0 ? "green" : "red"}
        />
        <MetricCard
          label="Rentabilidad mensual"
          value={`${percentFormatter.format(analysis.monthlyReturnPercent)}%`}
        />
        <MetricCard
          label="Rentabilidad acumulada"
          value={`${percentFormatter.format(
            analysis.accumulatedReturnPercent,
          )}%`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Historial mensual
              </p>
              <p className="text-xs leading-5 text-stone-500">
                Cada fila suma el aporte al pendiente antes de evaluar la
                reinversion.
              </p>
            </div>
            <button
              className="min-h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={onMonthAdd}
            >
              Agregar mes
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-600">
                <tr>
                  <th className="px-3 py-2">Mes</th>
                  <th className="px-3 py-2">Dejo</th>
                  <th className="px-3 py-2">Operativo</th>
                  <th className="px-3 py-2">Pendiente aporte</th>
                  <th className="px-3 py-2">Pendiente ganancia</th>
                  <th className="px-3 py-2">Reinvertido</th>
                  <th className="px-3 py-2">Rent.</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {analysis.history.map((month, index) => (
                  <tr key={`${month.month}-${index}`}>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Mes ${index + 1}`}
                        className="libertad-field h-10 w-32 rounded-md px-2 text-sm font-semibold text-stone-950"
                        type="month"
                        value={investment.monthlyResults[index]?.month ?? month.month}
                        onChange={(event) =>
                          onMonthlyResultChange(index, "month", event.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Resultado ${month.month}`}
                        className="libertad-field h-10 w-28 rounded-md px-2 text-sm font-semibold text-stone-950 libertad-number"
                        inputMode="decimal"
                        step="10"
                        type="number"
                        value={investment.monthlyResults[index]?.amount ?? 0}
                        onChange={(event) =>
                          onMonthlyResultChange(
                            index,
                            "amount",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="libertad-number px-3 py-2 font-semibold text-stone-900">
                      {currencyFormatter.format(month.operationalCapitalEnd)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.pendingContributionCapital)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.pendingProfitCapital)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {currencyFormatter.format(month.reinvestedAmount)}
                    </td>
                    <td className="libertad-number px-3 py-2 text-stone-700">
                      {percentFormatter.format(month.monthlyReturnPercent)}%
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="min-h-10 rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Quitar el mes ${month.month} del historial?`,
                            )
                          ) {
                            onMonthRemove(month.month);
                          }
                        }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-900">
            Separacion de capital
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            El aporte mensual no genera resultado hasta pasar al capital
            operativo. Las ganancias pendientes tambien se muestran aparte para
            no inflar el total aportado.
          </p>
          <div className="mt-3 grid gap-2">
            <FireRow
              label="Aportes pendientes"
              value={currencyFormatter.format(
                analysis.pendingContributionCapital,
              )}
              detail="Dinero aportado, todavia fuera del bot operativo."
            />
            <FireRow
              label="Ganancias pendientes"
              value={currencyFormatter.format(analysis.pendingProfitCapital)}
              detail="Resultado acumulado aun no reinvertido."
            />
            <FireRow
              label="Ganancia acumulada"
              value={currencyFormatter.format(analysis.accumulatedResult)}
              detail="No se suma al capital total aportado."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InvestmentPolicyPanel({
  policy,
  onPolicyChange,
}: {
  policy: InvestmentPolicySettings;
  onPolicyChange: (key: keyof InvestmentPolicySettings, value: string) => void;
}) {
  const numericFields: {
    key: keyof InvestmentPolicySettings;
    label: string;
    prefix?: string;
    suffix?: string;
    step: string;
  }[] = [
    {
      key: "monthlyContributionTarget",
      label: "Aporte mensual objetivo",
      prefix: "USD",
      step: "100",
    },
    {
      key: "salaryInvestmentPercent",
      label: "Salario a invertir",
      suffix: "%",
      step: "1",
    },
    {
      key: "emergencyFundMonths",
      label: "Colchon objetivo",
      suffix: "meses",
      step: "1",
    },
    {
      key: "rebalanceTolerancePercent",
      label: "Tolerancia desbalance",
      suffix: "pp",
      step: "0.5",
    },
  ];
  const ruleFields: {
    key: keyof InvestmentPolicySettings;
    label: string;
  }[] = [
    { key: "drawdownRule", label: "Caidas fuertes" },
    { key: "bitcoinRule", label: "Bitcoin" },
    { key: "goldRule", label: "Oro" },
    { key: "individualStocksRule", label: "Acciones individuales" },
    { key: "realEstateRule", label: "Inmuebles" },
  ];

  return (
    <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-950">
            Politica personal de inversion
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
            Reglas editables para que la cartera tenga criterio antes que
            impulsos. Cambiarlas no crea movimientos.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700">
          Plan, no opinion macro
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {numericFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
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
                name={`policy-${field.key}`}
                step={field.step}
                type="number"
                value={policy[field.key] as number}
                onChange={(event) =>
                  onPolicyChange(field.key, event.target.value)
                }
              />
              {field.suffix ? (
                <span className="ml-2 text-sm font-semibold text-stone-500">
                  {field.suffix}
                </span>
              ) : null}
            </div>
          </label>
        ))}
      </div>

      <label className="mt-4 grid gap-2 md:max-w-sm">
        <span className="text-xs font-semibold text-stone-600">
          Frecuencia de rebalanceo
        </span>
        <select
          autoComplete="off"
          className="libertad-field h-12 rounded-md bg-white px-3 text-sm font-semibold text-stone-950"
          name="policy-rebalance-frequency"
          value={policy.rebalanceFrequency}
          onChange={(event) =>
            onPolicyChange("rebalanceFrequency", event.target.value)
          }
        >
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
      </label>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {ruleFields.map((field) => (
          <label key={field.key} className="grid gap-2">
            <span className="text-xs font-semibold text-stone-600">
              {field.label}
            </span>
            <textarea
              autoComplete="off"
              className="libertad-field min-h-20 resize-y rounded-md bg-white px-3 py-2 text-sm leading-6 text-stone-900"
              name={`policy-${field.key}`}
              value={policy[field.key] as string}
              onChange={(event) =>
                onPolicyChange(field.key, event.target.value)
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function FinancialMarginPanel({
  analysis,
  compact = false,
  onOpenSettings,
}: {
  analysis: ReturnType<typeof analyzeFinancialMargin>;
  compact?: boolean;
  onOpenSettings: () => void;
}) {
  const state = financialMarginStateCopy(analysis.state);
  const calmProgress =
    analysis.calmPointAmount > 0
      ? Math.min(100, (analysis.emergencyFund / analysis.calmPointAmount) * 100)
      : 0;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Margen financiero
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Mide libertad mensual real: ingreso confirmado, gastos activos,
            deuda mensual y colchon. Los gastos fijos son supuestos separados.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${state.classes}`}
        >
          Estado {state.label}
        </div>
      </div>

      <div className="libertad-card-grid mt-5 grid gap-3">
        <MetricCard
          label="Margen disponible"
          value={currencyFormatter.format(analysis.availableMonthlyMargin)}
          tone={state.metricTone}
        />
        <MetricCard
          label="Meses de colchon"
          value={`${numberFormatter.format(analysis.monthsCovered)} meses`}
          tone={analysis.monthsCovered >= 3 ? "green" : "amber"}
        />
        <MetricCard
          label="Presion de deuda"
          value={`${percentFormatter.format(analysis.debtPressurePercent)}%`}
          tone={analysis.debtPressurePercent >= 20 ? "red" : "neutral"}
        />
        <MetricCard
          label="Tasa de ahorro"
          value={`${percentFormatter.format(analysis.savingRate)}%`}
          tone={analysis.savingRate >= 10 ? "green" : "amber"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <div className="libertad-soft-panel rounded-md p-4">
          <div className="flex items-center justify-between gap-4 text-sm font-medium">
            <span className="text-stone-700">Punto de tranquilidad</span>
            <span className="libertad-number text-base font-semibold text-stone-950">
              {currencyFormatter.format(analysis.emergencyFund)} /{" "}
              {currencyFormatter.format(analysis.calmPointAmount)}
            </span>
          </div>
          <div
            aria-label={`Colchon cubierto ${percentFormatter.format(calmProgress)}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={calmProgress}
            className="libertad-meter mt-4 h-4"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-700"
              style={{ width: `${calmProgress}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Faltan{" "}
            <span className="libertad-number font-semibold text-stone-950">
              {currencyFormatter.format(analysis.calmPointDistance)}
            </span>{" "}
            para cubrir seis meses del gasto mensual actual.
          </p>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-800">
            Lectura practica
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {state.body}
          </p>
          <p className="mt-3 text-sm font-semibold text-stone-950">
            {analysis.recommendation}
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Composicion mensual
            </p>
            <div className="mt-3 grid gap-2">
              <FireRow
                label="Ingreso confirmado"
                value={currencyFormatter.format(analysis.monthlyIncome)}
                detail={`Mes ${analysis.monthKey}; solo movimientos reales.`}
              />
              <FireRow
                label="Gastos fijos"
                value={currencyFormatter.format(analysis.fixedMonthlyExpenses)}
                detail="Supuestos activos mas gastos recurrentes confirmados."
              />
              <FireRow
                label="Gastos variables"
                value={currencyFormatter.format(analysis.variableMonthlyExpenses)}
                detail="Gastos no recurrentes confirmados este mes."
              />
              <FireRow
                label="Deuda mensual"
                value={currencyFormatter.format(analysis.debtMonthlyPayments)}
                detail="Cuotas confirmadas, aunque hayan nacido en meses anteriores."
              />
            </div>
          </div>

          <div className="libertad-soft-panel rounded-md p-4">
            <p className="text-sm font-semibold text-stone-800">
              Libertad de decision
            </p>
            <div className="mt-3 grid gap-2">
              <FireRow
                label="Esenciales"
                value={currencyFormatter.format(analysis.essentialExpenses)}
                detail="Vivienda, transporte, comida, servicios, salud y deuda."
              />
              <FireRow
                label="No esenciales"
                value={currencyFormatter.format(analysis.nonEssentialExpenses)}
                detail="Lo que puede revisarse antes de tocar el plan."
              />
              <FireRow
                label="Dependencia del sueldo"
                value={financialMarginDependencyLabel(
                  analysis.paycheckDependency,
                )}
                detail="Cuanto pesa el siguiente ingreso para sostener el mes."
              />
              <FireRow
                label="Cambiar de trabajo"
                value={financialMarginCapacityLabel(
                  analysis.changeJobCapacity,
                )}
                detail="Lectura por meses cubiertos, no recomendacion laboral."
              />
            </div>
          </div>

          <div className="rounded-md border border-stone-200 bg-white p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Senales
                </p>
                <ul className="mt-3 grid gap-2">
                  {analysis.signals.map((signal) => (
                    <li
                      key={signal}
                      className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                      />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                type="button"
                onClick={onOpenSettings}
              >
                Revisar gastos fijos
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function financialMarginStateCopy(state: ReturnType<typeof analyzeFinancialMargin>["state"]) {
  const copy = {
    fragil: {
      label: "fragil",
      classes: "border-red-200 bg-red-50 text-red-950",
      metricTone: "red",
      body: "Tu margen actual es fragil: dependes demasiado del siguiente sueldo o el mes queda negativo.",
    },
    ajustado: {
      label: "ajustado",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
      metricTone: "amber",
      body: "Tu margen es positivo, pero todavia hay poca holgura para errores, deuda o cambios de ingreso.",
    },
    estable: {
      label: "estable",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
      metricTone: "green",
      body: "Tu margen sostiene el mes y ya existe capacidad de decir no sin romper el plan.",
    },
    fuerte: {
      label: "fuerte",
      classes: "border-emerald-300 bg-emerald-100 text-emerald-950",
      metricTone: "green",
      body: "Tu margen y colchon dan buena libertad mensual; el riesgo principal es agregar gastos fijos nuevos.",
    },
  } as const;

  return copy[state];
}

function financialMarginDependencyLabel(
  dependency: ReturnType<typeof analyzeFinancialMargin>["paycheckDependency"],
) {
  const labels = {
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  return labels[dependency];
}

function financialMarginCapacityLabel(
  capacity: ReturnType<typeof analyzeFinancialMargin>["changeJobCapacity"],
) {
  const labels = {
    baja: "Baja",
    limitada: "Limitada",
    moderada: "Moderada",
    alta: "Alta",
  };

  return labels[capacity];
}

function DebtLoadPanel({
  analysis,
}: {
  analysis: ReturnType<typeof analyzeConfirmedDebtLoad>;
}) {
  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Carga de deuda confirmada
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Solo usa deudas confirmadas. Las intenciones y analisis potenciales
            quedan fuera del dashboard.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${
            analysis.highRiskCount > 0
              ? "border-red-200 bg-red-50 text-red-950"
              : analysis.count > 0
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-stone-200 bg-stone-50 text-stone-700"
          }`}
        >
          {analysis.count > 0
            ? `${analysis.count} deuda(s)`
            : "Sin deuda confirmada"}
        </div>
      </div>

      {analysis.count === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          Cuando confirmes una deuda real, aca vas a ver cuota mensual, costo
          anual e impacto sobre el numero FIRE.
        </div>
      ) : (
        <>
          <div className="libertad-card-grid mt-5 grid gap-3">
            <MetricCard
              label="Presion mensual"
              value={currencyFormatter.format(analysis.monthlyMarginImpact)}
              tone={analysis.monthlyMarginImpact > 0 ? "amber" : "neutral"}
            />
            <MetricCard
              label="Costo anual"
              value={currencyFormatter.format(analysis.annualCost)}
            />
            <MetricCard
              label="Deuda total"
              value={currencyFormatter.format(analysis.principalBalance)}
              tone="red"
            />
            <MetricCard
              label="Impacto FIRE"
              value={currencyFormatter.format(analysis.fireImpact)}
              tone="green"
            />
            <MetricCard
              label="Margen disponible"
              value={currencyFormatter.format(analysis.monthlyDecisionMargin)}
              tone={
                analysis.debtPressureRisk === "alto"
                  ? "red"
                  : analysis.debtPressureRisk === "medio"
                    ? "amber"
                    : "green"
              }
            />
            <MetricCard
              label="Presion sobre margen"
              value={
                analysis.debtPressureRisk === "sin_datos"
                  ? "Sin aporte base"
                  : `${percentFormatter.format(analysis.debtPressurePercent)}%`
              }
              tone={
                analysis.debtPressureRisk === "alto"
                  ? "red"
                  : analysis.debtPressureRisk === "medio"
                    ? "amber"
                    : "neutral"
              }
            />
          </div>

          {analysis.freedomWarning ? (
            <div
              aria-live="polite"
              className={`mt-5 rounded-md border px-4 py-3 text-sm leading-6 ${
                analysis.debtPressureRisk === "alto"
                  ? "border-red-200 bg-red-50 text-red-950"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {analysis.freedomWarning}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Dependencia del sueldo
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Las cuotas confirmadas consumen{" "}
                {percentFormatter.format(analysis.salaryDependencyIncrease)}%
                del aporte mensual cargado en tus datos base. Quedan{" "}
                {currencyFormatter.format(analysis.monthlyDecisionMargin)} para
                decidir sin tocar el plan.
              </p>
              <div className="mt-3 grid gap-2">
                <FireRow
                  label="Pago minimo"
                  value={analysis.minimumPaymentCount.toString()}
                  detail="Senal de tarjeta con presion alta."
                />
                <FireRow
                  label="Riesgo alto"
                  value={analysis.highRiskCount.toString()}
                  detail="Lectura descriptiva, no recomendacion automatica."
                />
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">
                Senales de deuda
              </p>
              {analysis.signals.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {analysis.signals.slice(0, 4).map((signal) => (
                    <li
                      key={signal}
                      className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                      />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No hay senales fuertes ademas del costo mensual confirmado.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function LifestyleInflationPanel({
  analysis,
}: {
  analysis: ReturnType<typeof analyzeLifestyleInflation>;
}) {
  const riskCopy = {
    bajo: {
      label: "Bajo",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
    },
    medio: {
      label: "Medio",
      classes: "border-amber-200 bg-amber-50 text-amber-950",
    },
    alto: {
      label: "Alto",
      classes: "border-red-200 bg-red-50 text-red-950",
    },
    "sin-datos": {
      label: "Sin datos",
      classes: "border-stone-200 bg-stone-50 text-stone-700",
    },
  } as const;
  const currentSavingRate = `${percentFormatter.format(
    analysis.current.savingRate,
  )}%`;
  const previousSavingRate = `${percentFormatter.format(
    analysis.previous.savingRate,
  )}%`;
  const absorbedPercent = `${percentFormatter.format(
    analysis.absorbedByExpensesPercent,
  )}%`;
  const risk = riskCopy[analysis.risk];
  const hasPositiveIncomeIncrease = analysis.incomeIncrease > 0;
  const absorbedExpense = Math.max(0, analysis.expenseIncrease);
  const increaseRule = analysis.increaseRule;

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Inflación del Estilo de Vida
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Compara solo transacciones confirmadas para ver si un aumento de
            ingreso se está convirtiendo en libertad o en consumo.
          </p>
        </div>
        <div
          className={`inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-semibold ${risk.classes}`}
        >
          Riesgo {risk.label}
        </div>
      </div>

      {!analysis.hasComparison ? (
        <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
          No hay suficiente historial para detectar inflación del estilo de vida
          todavía.
        </div>
      ) : (
        <>
          <div className="libertad-card-grid mt-5 grid gap-3">
            <MetricCard
              label="Ingreso confirmado"
              value={currencyFormatter.format(analysis.current.income)}
              tone="green"
            />
            <MetricCard
              label="Gasto confirmado"
              value={currencyFormatter.format(analysis.current.expenses)}
              tone="amber"
            />
            <MetricCard
              label="Ahorro estimado"
              value={currencyFormatter.format(analysis.current.estimatedSavings)}
              tone={analysis.current.estimatedSavings >= 0 ? "blue" : "red"}
            />
            <MetricCard label="Tasa de ahorro" value={currentSavingRate} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Comparación contra mes anterior
              </p>
              <div className="mt-3 grid gap-2">
                <FireRow
                  label="Aumento de ingresos"
                  value={currencyFormatter.format(analysis.incomeIncrease)}
                  detail={`Antes: ${currencyFormatter.format(
                    analysis.previous.income,
                  )}`}
                />
                <FireRow
                  label="Aumento de gastos"
                  value={currencyFormatter.format(analysis.expenseIncrease)}
                  detail={`Antes: ${currencyFormatter.format(
                    analysis.previous.expenses,
                  )}`}
                />
                <FireRow
                  label="Aumento absorbido por gasto"
                  value={absorbedPercent}
                  detail={`Tasa previa: ${previousSavingRate}`}
                />
              </div>
            </div>

            <div
              className={`rounded-md border p-4 ${
                analysis.alert
                  ? "border-red-200 bg-red-50/70 text-red-950"
                  : "border-stone-200 bg-stone-50 text-stone-800"
              }`}
            >
              <p className="text-sm font-semibold">Lectura práctica</p>
              <p className="mt-2 text-sm leading-6">
                {hasPositiveIncomeIncrease
                  ? `${currencyFormatter.format(
                      absorbedExpense,
                    )} de tu aumento fueron absorbidos por nuevos gastos. Capturaste ${currencyFormatter.format(
                      analysis.capturedForFreedom,
                    )} para libertad.`
                  : "No hay aumento de ingreso confirmado este mes. El detector queda atento a cambios reales."}
              </p>
              <p className="mt-3 text-sm font-semibold">
                {analysis.recommendation}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <p className="text-sm font-semibold text-stone-800">
                Señales detectadas
              </p>
              {analysis.signals.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {analysis.signals.map((signal) => (
                    <li
                      key={signal}
                      className="grid grid-cols-[8px_minmax(0,1fr)] gap-2 text-sm leading-6 text-stone-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-2 w-2 rounded-full bg-stone-500"
                      />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No aparecen señales fuertes de inflación del estilo de vida en
                  la comparación actual.
                </p>
              )}
            </div>

            <div className="libertad-soft-panel rounded-md p-4">
              <p className="text-sm font-semibold text-stone-800">
                Conexiones FIRE
              </p>
              <div className="mt-3 grid gap-2">
                {increaseRule ? (
                  <>
                    <FireRow
                      label="70% ahorro/inversion"
                      value={currencyFormatter.format(
                        increaseRule.suggestedInvestment,
                      )}
                      detail="Parte del aumento protegida para libertad."
                    />
                    <FireRow
                      label="20% mejora de vida"
                      value={currencyFormatter.format(
                        increaseRule.lifestyleUpgrade,
                      )}
                      detail="Disfrute controlado sin absorber todo el aumento."
                    />
                    <FireRow
                      label="10% gusto personal"
                      value={currencyFormatter.format(
                        increaseRule.personalTreat,
                      )}
                      detail="Permiso acotado, separado del plan."
                    />
                  </>
                ) : (
                  <FireRow
                    label="70/20/10"
                    value="Sin aumento"
                    detail="Aparece cuando hay aumento confirmado."
                  />
                )}
                <FireRow
                  label="Vivienda, transporte, comida"
                  value={currencyFormatter.format(
                    analysis.current.coreExpenses.vivienda +
                      analysis.current.coreExpenses.transporte +
                      analysis.current.coreExpenses.comida,
                  )}
                  detail="Gastos críticos confirmados este mes."
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FireLeversPanel({ summary }: { summary: TransactionSummary }) {
  const coreCategories = [
    { key: "vivienda", label: "Vivienda" },
    { key: "transporte", label: "Transporte" },
    { key: "comida", label: "Comida" },
  ] as const;
  const totalCoreMonthly = coreCategories.reduce(
    (total, category) => total + summary.coreMonthlyExpenses[category.key],
    0,
  );

  return (
    <section className="libertad-surface rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">
            Palancas FIRE
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            Los gastos confirmados se convierten a una lectura mensual. Los
            gastos unicos se anualizan para medir su impacto sobre el numero x25.
          </p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Reducir gasto mensual baja la meta x25.
        </div>
      </div>

      <div className="libertad-card-grid mt-5 grid gap-3">
        <MetricCard
          label="Gasto mensual confirmado"
          value={currencyFormatter.format(summary.monthlyConfirmedExpenses)}
          tone="amber"
        />
        <MetricCard
          label="Gasto anual estimado"
          value={currencyFormatter.format(summary.annualConfirmedExpenses)}
        />
        <MetricCard
          label="Numero FIRE confirmado"
          value={currencyFormatter.format(summary.confirmedFireNumber)}
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="libertad-soft-panel rounded-md p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-800">
              Categorias criticas
            </p>
            <p className="text-sm font-semibold text-stone-950">
              {currencyFormatter.format(totalCoreMonthly)}
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            {coreCategories.map((category) => {
              const amount = summary.coreMonthlyExpenses[category.key];
              const share = coreExpenseShare(
                amount,
                summary.monthlyConfirmedExpenses,
              );

              return (
                <FireRow
                  key={category.key}
                  label={category.label}
                  value={currencyFormatter.format(amount)}
                  detail={`${percentFormatter.format(share)}% del gasto`}
                />
              );
            })}
          </div>
        </div>

        <div className="libertad-soft-panel rounded-md p-4">
          <p className="text-sm font-semibold text-stone-800">
            Impacto de reducir gasto mensual
          </p>
          <div className="mt-3 grid gap-2">
            {fireReductionScenarios().map((scenario) => (
              <FireRow
                key={scenario.monthlyReduction}
                label={`${currencyFormatter.format(
                  scenario.monthlyReduction,
                )}/mes menos`}
                value={`-${currencyFormatter.format(scenario.fireReduction)}`}
                detail="menos de numero FIRE"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
  const imbalanceWidth = Math.min(50, Math.abs(asset.imbalancePercent));
  const status = portfolioStatusCopy(asset.status);
  const imbalanceSide =
    asset.imbalancePercent < 0 ? "right-1/2" : "left-1/2";

  return (
    <div className="libertad-soft-panel rounded-md p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_150px_120px] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">
              {asset.label}
            </p>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-semibold ${status.classes}`}
            >
              {status.label}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-600">
              {asset.currentSource === "derivado" ? "Derivado" : "Manual"}
            </span>
          </div>
          <div
            aria-label={`${asset.label}: desbalance ${percentFormatter.format(
              asset.imbalancePercent,
            )} puntos porcentuales`}
            className="relative mt-3 h-3 overflow-hidden rounded-full bg-white ring-1 ring-stone-200"
            role="img"
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-full w-px bg-stone-300"
            />
            <div
              className={`absolute top-0 h-full rounded-full ${imbalanceSide} ${status.barClass}`}
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
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950 libertad-number"
            inputMode="decimal"
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
            autoComplete="off"
            className="libertad-field h-11 rounded-md px-3 text-sm font-semibold text-stone-950 disabled:bg-stone-100 disabled:text-stone-500 libertad-number"
            disabled={asset.currentSource === "derivado"}
            inputMode="decimal"
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
          <p className="libertad-number mt-2 text-sm font-semibold text-stone-950">
            {currencyFormatter.format(asset.imbalanceAmount)}
          </p>
          <p className="libertad-number text-xs text-stone-500">
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

function FireRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs leading-5 text-stone-500">{detail}</p>
      </div>
      <p className="libertad-number shrink-0 text-right text-sm font-semibold text-stone-950">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const toneClasses = {
    neutral: "border-stone-200 bg-stone-50 text-stone-950",
    green: "border-emerald-100 bg-emerald-50 text-emerald-950",
    blue: "border-sky-100 bg-sky-50 text-sky-950",
    amber: "border-amber-100 bg-amber-50 text-amber-950",
    red: "border-red-100 bg-red-50 text-red-950",
  };

  return (
    <div className={`min-w-0 rounded-md border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="libertad-number mt-2 break-words text-[1.35rem] font-semibold leading-tight">
        {value}
      </p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white/8 px-3 py-2">
      <p className="min-w-0 text-sm text-stone-300">{label}</p>
      <p className="libertad-number shrink-0 text-right text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
