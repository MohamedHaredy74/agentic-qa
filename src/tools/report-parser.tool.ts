import { readFile } from "node:fs/promises";

export interface ParsedFailure { testName: string; error: string; }
export interface ParsedExecution { passed: number; failed: number; skipped: number; total: number; failures: ParsedFailure[]; exitCode?: number; durationMs?: number; }
export async function parsePlaywrightReport(filePath: string): Promise<ParsedExecution> {
 const raw = JSON.parse(await readFile(filePath, "utf8")) as { suites?: unknown[]; stats?: Record<string, number> };
 const failures: ParsedFailure[] = [];
 const visit = (suite: any): void => {
  for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
   const failed = (test.results ?? []).find((result: any) => result.status === "failed" || result.status === "timedOut");
   if (failed) failures.push({ testName: spec.title, error: failed.error?.message ?? failed.errors?.map((e: any) => e.message).join("\n") ?? failed.status });
  }
  for (const child of suite.suites ?? []) visit(child);
 };
 for (const suite of raw.suites ?? []) visit(suite);
 const stats = raw.stats ?? {};
 const passed = stats.expected ?? 0;
 const failed = stats.unexpected ?? failures.length;
 const skipped = stats.skipped ?? 0;
 return { passed, failed, skipped, total: passed + failed + skipped, failures };
}
