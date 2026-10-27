import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeRequirements } from "../agents/requirements.agent.js";
import { designTests } from "../agents/test-designer.agent.js";
import { explore } from "../agents/browser-explorer.agent.js";
import { generateAutomation } from "../agents/automation.agent.js";
import { analyzeFailures } from "../agents/failure-analyst.agent.js";
import type { Environment } from "../config/environment.js";
import { ArtifactManager } from "./artifact-manager.js";
import { createWorkflowState } from "./workflow-state.js";
import { requestApproval } from "./approval-manager.js";
import { executePlaywright } from "../tools/playwright-runner.tool.js";
import { generateReport } from "../reports/qa-report-generator.js";

export async function runWorkflow(environment: Environment): Promise<"PASSED" | "FAILED" | "BLOCKED" | "INCOMPLETE"> {
 const storyPath = path.resolve(environment.QA_STORY_PATH);
 let story: string;
 try { story = await readFile(storyPath, "utf8"); }
 catch { throw new Error(`Could not read User Story at ${storyPath}. Check QA_STORY_PATH.`); }
 if (!story.trim()) throw new Error("User Story file is empty.");
 const state = createWorkflowState(story, environment.BASE_URL);
 const artifacts = new ArtifactManager(state.runId);
 await mkdir(path.resolve("generated", "tests"), { recursive: true });
 await artifacts.initialize();
 const log = async (status: typeof state.status, message: string): Promise<void> => { state.status = status; console.log(`[${status}] ${message}`); await artifacts.persistState(state); };
 let execution: Awaited<ReturnType<typeof executePlaywright>> | undefined;
 try {
  await log("REQUIREMENTS", "Analyzing user story.");
  state.requirementsAnalysis = await analyzeRequirements(story);
  await artifacts.writeJson("requirements-analysis.json", state.requirementsAnalysis);
  const criticalGaps = state.requirementsAnalysis.gaps.filter((gap) => gap.severity === "critical");
  if (criticalGaps.length) throw new WorkflowBlockError(`Critical requirement gaps require human review: ${criticalGaps.map((gap) => gap.description).join("; ")}`);
  if (!state.requirementsAnalysis.rules.length) throw new WorkflowBlockError("Requirements analysis produced no confirmed business rules.");

  await log("TEST_DESIGN", "Designing and validating scenario coverage.");
  state.testPlan = await designTests(state.requirementsAnalysis);
  await artifacts.writeJson("test-plan.json", state.testPlan);

  await log("EXPLORATION", "Inspecting the application in read-only mode.");
  state.explorationResult = await explore(environment.BASE_URL, environment.HEADLESS);
  await artifacts.writeJson("exploration.json", state.explorationResult);

  await log("AUTOMATION", "Generating and statically validating Playwright tests.");
  state.automationResult = await generateAutomation(environment.BASE_URL, state.testPlan, state.explorationResult);
  const safeName = `${state.runId}-${state.automationResult.testFileName}`;
  const generatedDir = path.resolve("generated", "tests");
  await mkdir(generatedDir, { recursive: true });
  const generatedPath = path.join(generatedDir, safeName);
  await artifacts.writeText(path.join("generated", "tests", safeName), state.automationResult.code);
  await writeFile(generatedPath, state.automationResult.code, "utf8");
  await artifacts.writeJson("automation.json", { ...state.automationResult, testFileName: safeName, generatedPath });
  await log("APPROVAL", `Generated test saved to ${generatedPath}. Review it before approval.\n\n${state.automationResult.code}`);
  const approved = await requestApproval(environment.QA_APPROVAL_MODE, `Approve execution of ${safeName}?`);
  if (!approved) throw new WorkflowBlockError("Generated tests were not approved; execution was not started.");

  await log("EXECUTION", "Running the approved generated Playwright test.");
  execution = await executePlaywright(generatedPath, artifacts.runDirectory);
    state.executionResult = { ...execution };
  await artifacts.writeJson("execution-result.json", execution);
  await artifacts.writeJson("playwright-results.json", JSON.parse(await readFile(execution.reportPath, "utf8")));

  await log("ANALYSIS", "Analyzing recorded test failures.");
  state.failureAnalysis = await analyzeFailures(execution.failures);
  await artifacts.writeJson("failure-analysis.json", state.failureAnalysis);
  state.completedAt = new Date().toISOString();
  await log("COMPLETED", `Workflow finished with ${execution.failed} failed tests.`);
 } catch (error) {
  state.status = error instanceof WorkflowBlockError ? "BLOCKED" : "FAILED";
  state.completedAt = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${state.status}] ${message}`);
  if (execution?.failures.length) {
   try {
    state.failureAnalysis = await analyzeFailures(execution.failures);
    await artifacts.writeJson("failure-analysis.json", state.failureAnalysis);
   } catch (analysisError) {
    console.error(`[ANALYSIS] Failure analysis could not complete; raw execution evidence remains available: ${String(analysisError)}`);
   }
  }
  await artifacts.writeJson("workflow-error.json", { message, status: state.status });
  await artifacts.persistState(state);
 } finally {
  const report = generateReport(state, execution);
  await artifacts.writeJson("qa-report.json", report.json);
  await artifacts.writeText("qa-report.md", report.markdown);
  console.log(`QA report: ${path.join(artifacts.runDirectory, "qa-report.md")} (${report.json.status})`);
  return report.json.status;
 }
}

class WorkflowBlockError extends Error {}
