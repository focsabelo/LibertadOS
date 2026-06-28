import { readFileSync } from "node:fs";
import {
  modules,
  primaryModules,
  secondaryModules,
} from "../src/components/libertad-dashboard/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const secondaryModuleIds = secondaryModules.map((module) => String(module.id));
const secondaryModuleLabels = secondaryModules.map((module) => module.label);
const primaryModuleIds = primaryModules.map((module) => String(module.id));
const primaryModuleLabels = primaryModules.map((module) => module.label);
const moduleIds = modules.map((module) => String(module.id));
const moduleLabels = modules.map((module) => module.label);
const dashboardSource = readFileSync(
  "src/components/libertad-dashboard.tsx",
  "utf8",
);
const dashboardView =
  dashboardSource
    .split('activeSection === "dashboard"')[1]
    ?.split('activeSection === "notas"')[0] ?? "";
const libertadView =
  dashboardSource
    .split('activeSection === "palancas"')[1]
    ?.split('activeSection === "revision"')[0] ?? "";

assert(
  !secondaryModuleIds.includes("macro") && !secondaryModuleLabels.includes("Macro"),
  "advanced navigation should not include Macro",
);

assert(
  !moduleIds.includes("macro") && !moduleLabels.includes("Macro"),
  "application navigation should not expose Macro",
);

assert(
  primaryModuleIds.includes("revision") && primaryModuleLabels.includes("Revision"),
  "primary navigation should expose monthly review",
);

assert(
  !secondaryModuleIds.includes("revision") && !secondaryModuleLabels.includes("Revision"),
  "advanced navigation should not duplicate monthly review",
);

assert(
  secondaryModuleIds.includes("cartera") &&
    secondaryModuleLabels.includes("Inversiones") &&
    !secondaryModuleLabels.includes("Cartera"),
  "advanced navigation should expose Cartera as Inversiones",
);

assert(
  secondaryModuleIds.includes("negocios") &&
    secondaryModuleLabels.includes("Negocios propios"),
  "advanced navigation should expose owned businesses",
);

assert(
  !secondaryModuleIds.includes("semana") && !secondaryModuleLabels.includes("Semana"),
  "advanced navigation should keep weekly execution inside Revision",
);

assert(
  secondaryModuleIds.includes("palancas") &&
    secondaryModuleLabels.includes("Libertad") &&
    !secondaryModuleLabels.includes("Palancas"),
  "advanced navigation should expose the freedom plan as Libertad",
);

assert(
  dashboardView.includes("Patrimonio actual") &&
    dashboardView.includes("Ver plan de libertad") &&
    !dashboardView.includes("Numero de libertad financiera"),
  "dashboard should prioritize current wealth and link compactly to Libertad",
);

assert(
  libertadView.includes("Numero de libertad financiera") &&
    libertadView.includes("FireLeversPanel"),
  "Libertad should contain the detailed target and its levers",
);
