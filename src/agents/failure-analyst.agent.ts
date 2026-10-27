import { FailureAnalysisSchema, type FailureAnalysis } from "../schemas/failure.schema.js";
import { runStructured } from "./shared.js";
import type { ParsedFailure } from "../tools/report-parser.tool.js";

export async function analyzeFailures(failures: ParsedFailure[]): Promise<FailureAnalysis> {
 if (!failures.length) return { summary: "No failed tests were reported.", failures: [] };
 const fallback = (): FailureAnalysis => FailureAnalysisSchema.parse({ summary: "AI failure analysis was unavailable; execution evidence is preserved and failures are marked unknown.", failures: failures.map((failure) => ({ testName: failure.testName, classification: "UNKNOWN", evidence: failure.error || "Failure recorded without detailed error.", possibleRootCause: "Insufficient evidence for a reliable conclusion.", suggestedAction: "Review the failed test and attached Playwright artifacts." })) });
 try {
  return await runStructured("Failure Analyst", "Classify only from supplied execution evidence. Avoid certainty without evidence. PRODUCT_DEFECT means an approved requirement appears violated; TEST_SCRIPT_ISSUE is likely locator/assertion/script; ENVIRONMENT_ISSUE indicates infrastructure; otherwise UNKNOWN. Do not propose changing assertions merely to pass.", FailureAnalysisSchema, JSON.stringify(failures));
 } catch { return fallback(); }
}
