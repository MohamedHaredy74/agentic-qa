import { validateGeneratedAutomation } from "./tools/automation-validator.tool.js";
const plan = { scenarios: [{ id: "TC-001", title: "Smoke", type: "Positive" as const, priority: "high" as const, preconditions: [], steps: ["Open page"], expectedResult: "Heading is visible", ruleIds: ["BR-001"] }], limitations: [] };
const result = { testFileName: "smoke.spec.ts", coveredScenarioIds: ["TC-001"], limitations: [], code: String.raw`import { test, expect } from "@playwright/test";
test("TC-001: heading is visible", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
});` };
validateGeneratedAutomation(result, plan);
console.log("Generated-test safety and TypeScript validation verified.");
