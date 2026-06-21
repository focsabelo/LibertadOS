import type { FreedomInputs } from "@/lib/finance";

export type Field = {
  id: keyof FreedomInputs;
  label: string;
  description?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  placeholder?: string;
};

export const fields: Field[] = [
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
    id: "estimatedMonthlyIncome",
    label: "Ingreso base mensual",
    description:
      "Base manual para calcular margen; confirmar un cobro en Notas registra el ingreso real del mes.",
    prefix: "USD",
    step: "100",
  },
  {
    id: "desiredMonthlySpend",
    label: "Gasto mensual deseado",
    description: "Nivel de vida mensual que queres poder sostener.",
    prefix: "USD",
    step: "100",
  },
  {
    id: "monthlyContribution",
    label: "Aporte mensual",
    description: "Lo que planeas invertir o separar cada mes; no es tu salario.",
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

export const baseFinancialInputKeys = [
  "netWorth",
  "investedCapital",
  "estimatedMonthlyIncome",
  "desiredMonthlySpend",
  "monthlyContribution",
] as const;

export type AppSection =
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

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const primaryModules: {
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
    description: "Captura y revision",
  },
  {
    id: "margen",
    label: "Margen",
    description: "Libertad mensual",
  },
  {
    id: "configuracion",
    label: "Configuracion",
    description: "Datos base",
  },
];

export const secondaryModules: {
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
    description: "Asignacion objetivo",
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
    description: "Inflacion de vida",
  },
  {
    id: "semana",
    label: "Semana",
    description: "Ejecucion semanal",
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

export const modules = [...primaryModules, ...secondaryModules];
