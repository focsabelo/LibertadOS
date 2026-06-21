import { modules, secondaryModules } from "../src/components/libertad-dashboard/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const secondaryModuleIds = secondaryModules.map((module) => String(module.id));
const secondaryModuleLabels = secondaryModules.map((module) => module.label);
const moduleIds = modules.map((module) => String(module.id));
const moduleLabels = modules.map((module) => module.label);

assert(
  !secondaryModuleIds.includes("macro") && !secondaryModuleLabels.includes("Macro"),
  "advanced navigation should not include Macro",
);

assert(
  !moduleIds.includes("macro") && !moduleLabels.includes("Macro"),
  "application navigation should not expose Macro",
);
