import { randomUUID } from "node:crypto";
import type { RequirementsAnalysis } from "../schemas/requirements.schema.js";
import type { TestPlan } from "../schemas/test-plan.schema.js";
import type { ExplorationResult } from "../schemas/exploration.schema.js";
import type { AutomationResult } from "../schemas/automation.schema.js";
import type { FailureAnalysis } from "../schemas/failure.schema.js";

export type WorkflowStatus = "STARTED" | "REQUIREMENTS" | "TEST_DESIGN" | "EXPLORATION" | "AUTOMATION" | "APPROVAL" | "EXECUTION" | "ANALYSIS" | "COMPLETED" | "BLOCKED" | "FAILED";
export interface WorkflowState {
 runId: string; status: WorkflowStatus; userStory: string; baseURL: string; requirementsAnalysis?: RequirementsAnalysis; testPlan?: TestPlan; explorationResult?: ExplorationResult; automationResult?: AutomationResult; executionResult?: Record<string, unknown>; failureAnalysis?: FailureAnalysis; startedAt: string; completedAt?: string;
}
export function createWorkflowState(userStory: string, baseURL: string): WorkflowState { return { runId: randomUUID(), status: "STARTED", userStory, baseURL, startedAt: new Date().toISOString() }; }
