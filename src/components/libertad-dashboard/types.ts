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
    id: "investedCapital",
    label: "Capital de inversiones",
    prefix: "USD",
    step: "500",
  },
  {
    id: "estimatedMonthlyIncome",
    label: "Sueldo mensual confirmado",
    description:
      "Ingreso fijo del mes. Notas queda para gastos e ingresos extra.",
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
  "investedCapital",
  "estimatedMonthlyIncome",
  "desiredMonthlySpend",
  "monthlyContribution",
] as const;

export type AppSection =
  | "dashboard"
  | "notas"
  | "decisiones"
  | "politica"
  | "revision"
  | "margen"
  | "cartera"
  | "deuda"
  | "roadmap"
  | "palancas"
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
    id: "revision",
    label: "Revision",
    description: "Cierre mensual",
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
    id: "politica",
    label: "Politica",
    description: "Reglas del plan",
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
    description: "Numero libertad",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    description: "Hitos patrimoniales",
  },
];

export const modules = [...primaryModules, ...secondaryModules];
