import { z } from "zod";

export const FailureAnalysisSchema = z.object({ summary: z.string(), failures: z.array(z.object({ testName: z.string(), classification: z.enum(["PRODUCT_DEFECT", "TEST_SCRIPT_ISSUE", "ENVIRONMENT_ISSUE", "UNKNOWN"]), evidence: z.string(), possibleRootCause: z.string(), suggestedAction: z.string() })) });
export type FailureAnalysis = z.infer<typeof FailureAnalysisSchema>;
