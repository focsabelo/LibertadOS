import { existsSync, readFileSync } from "fs";
import { join } from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const projectRoot = process.cwd();
const financeFacadePath = join(projectRoot, "src", "lib", "finance.ts");
const financeModulesPath = join(projectRoot, "src", "lib", "finance");
const expectedFinanceModules = [
  "types.ts",
  "constants.ts",
  "utils.ts",
  "transactions.ts",
  "fixed-expenses.ts",
  "fire.ts",
  "income-increase.ts",
  "confirmed-debt-load.ts",
  "monthly-review.ts",
  "weekly-execution.ts",
  "lifestyle-inflation.ts",
  "bot-opera24hs.ts",
  "financial-margin.ts",
  "calculations.ts",
  "wealth-assets.ts",
  "wealth-roadmap.ts",
  "owned-businesses.ts",
];
const financeFacadeLines = readFileSync(financeFacadePath, "utf8")
  .split(/\r?\n/)
  .filter((line) => line.trim().length > 0);

assert(
  existsSync(financeModulesPath),
  "finance domain modules should live under src/lib/finance",
);
for (const moduleName of expectedFinanceModules) {
  assert(
    existsSync(join(financeModulesPath, moduleName)),
    `finance module ${moduleName} should exist under src/lib/finance`,
  );
}
assert(
  financeFacadeLines.length <= 120,
  `src/lib/finance.ts should stay a small public facade, received ${financeFacadeLines.length} non-empty lines`,
);
