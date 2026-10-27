import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AutomationResult } from "../schemas/automation.schema.js";
import type { TestPlan } from "../schemas/test-plan.schema.js";

const require = createRequire(import.meta.url);
const ts = require("typescript") as {
 createSourceFile: (fileName: string, source: string, target: number, setParentNodes: boolean, scriptKind: number) => { parseDiagnostics: Array<{ messageText: unknown }> };
 ScriptTarget: { Latest: number };
 ScriptKind: { TS: number };
 flattenDiagnosticMessageText: (messageText: unknown, newLine: string) => string;
};

export function validateGeneratedAutomation(result: AutomationResult, plan: TestPlan): void {
 if (!result.testFileName.endsWith(".spec.ts") || result.testFileName.includes("..") || result.testFileName.includes("/") || result.testFileName.includes("\\")) throw new Error("Generated test path is not a safe .spec.ts filename.");
 const code = result.code;
 for (const [pattern, name] of [[/test\s*\.\s*only\s*\(/, "test.only"], [/test\s*\.\s*skip\s*\(/, "test.skip"], [/waitForTimeout\s*\(/, "waitForTimeout"], [/process|globalThis|require\s*\(|\beval\s*\(|\bFunction\s*\(/, "runtime or environment access"], [/fetch\s*\(|WebSocket|XMLHttpRequest/, "network access outside the browser"]] as const) if (pattern.test(code)) throw new Error(`Generated test contains prohibited capability: ${name}.`);
 const imports = [...code.matchAll(/\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/g)].map((match) => match[1] ?? match[2]);
 if (imports.some((specifier) => specifier !== "@playwright/test")) throw new Error("Generated tests may import only @playwright/test.");
 if (!code.includes("@playwright/test") || !/\btest\s*\(/.test(code) || !/\bexpect\s*\(/.test(code)) throw new Error("Generated test must use Playwright test() and expect().");
 const planned = new Set(plan.scenarios.map((scenario) => scenario.id));
 for (const scenario of plan.scenarios) if (!code.includes(scenario.id) || !result.coveredScenarioIds.includes(scenario.id)) throw new Error(`Generated test code or metadata does not map to ${scenario.id}.`);
 const unknown = result.coveredScenarioIds.filter((id) => !planned.has(id));
 if (unknown.length) throw new Error(`Automation metadata references unknown scenarios: ${unknown.join(", ")}.`);
 const parsed = ts.createSourceFile(result.testFileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
 if (parsed.parseDiagnostics.length) throw new Error(`Generated TypeScript syntax error: ${parsed.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, " ")).join("; ")}`);
 const compiler = path.resolve("node_modules", "typescript", "bin", "tsc");
 const validationRoot = path.resolve("generated", "tests");
 mkdirSync(validationRoot, { recursive: true });
 const temporaryDirectory = mkdtempSync(path.join(validationRoot, ".qa-validation-"));
 const temporaryFile = path.join(temporaryDirectory, `${randomUUID()}.ts`);
 try {
  writeFileSync(temporaryFile, code, "utf8");
  const typecheck = spawnSync(process.execPath, [compiler, "--noEmit", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--strict", "--skipLibCheck", "--types", "node", temporaryFile], { encoding: "utf8", shell: false });
  if (typecheck.error) throw new Error(`Could not run generated-test typecheck: ${typecheck.error.message}`);
  if (typecheck.status !== 0) throw new Error(`Generated Playwright test failed TypeScript validation:\n${typecheck.stdout}\n${typecheck.stderr}`);
 } finally { rmSync(temporaryDirectory, { recursive: true, force: true }); }
}
