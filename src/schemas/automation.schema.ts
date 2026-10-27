import { z } from "zod";

export const AutomationResultSchema = z.object({ testFileName: z.string().regex(/^[a-zA-Z0-9._-]+\.spec\.ts$/), code: z.string().min(1), coveredScenarioIds: z.array(z.string().regex(/^TC-\d{3}$/)), limitations: z.array(z.string()) });
export type AutomationResult = z.infer<typeof AutomationResultSchema>;
