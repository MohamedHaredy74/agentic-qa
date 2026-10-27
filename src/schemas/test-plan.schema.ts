import { z } from "zod";

export const TestScenarioSchema = z.object({ id: z.string().regex(/^TC-\d{3}$/), title: z.string().min(1), type: z.enum(["Positive", "Negative", "Boundary"]), priority: z.enum(["critical", "high", "medium", "low"]), preconditions: z.array(z.string()), steps: z.array(z.string().min(1)).min(1), expectedResult: z.string().min(1), ruleIds: z.array(z.string().regex(/^BR-\d{3}$/)).min(1) });
export const TestPlanSchema = z.object({ scenarios: z.array(TestScenarioSchema).min(1), limitations: z.array(z.string()).default([]) }).superRefine((plan, ctx) => {
 const ids = plan.scenarios.map((scenario) => scenario.id);
 if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Scenario IDs must be unique." });
});
export type TestPlan = z.infer<typeof TestPlanSchema>;
