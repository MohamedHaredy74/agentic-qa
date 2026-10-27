import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { parsePlaywrightReport, type ParsedExecution } from "./report-parser.tool.js";

export interface ExecutionResult extends ParsedExecution { exitCode: number; durationMs: number; reportPath: string; }
export async function executePlaywright(testFile: string, runDirectory: string, timeoutMs = 180_000): Promise<ExecutionResult> {
 const root = process.cwd();
 const absoluteTest = path.resolve(testFile);
 const safeGeneratedRoot = path.resolve(root, "generated", "tests");
 if (!absoluteTest.startsWith(`${safeGeneratedRoot}${path.sep}`) || !absoluteTest.endsWith(".spec.ts")) throw new Error("Executor only accepts generated .spec.ts tests in generated/tests.");
 await mkdir(path.join(runDirectory, "test-results"), { recursive: true });
 await mkdir(path.join(runDirectory, "html-report"), { recursive: true });
 const reportPath = path.join(runDirectory, "playwright-results.json");
 const started = Date.now();
 const cli = path.join(root, "node_modules", "@playwright", "test", "cli.js");
 const args = [cli, "test", absoluteTest, "--workers=1", "--reporter=json,html"];
 const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath, PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(runDirectory, "html-report"), PLAYWRIGHT_HTML_OPEN: "never", PLAYWRIGHT_TEST_OUTPUT_DIR: path.join(runDirectory, "test-results") }, shell: false, stdio: ["ignore", "pipe", "pipe"] });
 let stdout = ""; let stderr = "";
 child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
 child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
 const exitCode = await new Promise<number>((resolve, reject) => {
  const timeout = setTimeout(() => { child.kill("SIGTERM"); setTimeout(() => child.kill("SIGKILL"), 5000); reject(new Error(`Playwright execution exceeded ${timeoutMs}ms.`)); }, timeoutMs);
  child.once("error", (error) => { clearTimeout(timeout); reject(error); });
  child.once("close", (code) => { clearTimeout(timeout); resolve(code ?? 1); });
 });
 let parsed;
 try { parsed = await parsePlaywrightReport(reportPath); }
 catch (error) { throw new Error(`Playwright finished with exit code ${exitCode}, but its JSON report could not be read. ${stderr}\n${stdout}\n${String(error)}`); }
 return { exitCode, durationMs: Date.now() - started, reportPath, ...parsed };
}
