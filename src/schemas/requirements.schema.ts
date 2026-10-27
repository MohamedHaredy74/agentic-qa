import { z } from "zod";

export const RequirementRuleSchema = z.object({ id: z.string().regex(/^BR-\d{3}$/), description: z.string().min(1), sourceReference: z.string().min(1) });
export const RequirementGapSchema = z.object({ id: z.string().regex(/^GAP-\d{3}$/), description: z.string().min(1), severity: z.enum(["critical", "high", "medium", "low"]) });
export const RequirementsAnalysisSchema = z.object({ rules: z.array(RequirementRuleSchema), gaps: z.array(RequirementGapSchema), assumptions: z.array(z.object({ description: z.string().min(1) })), summary: z.string().min(1) }).superRefine((value, ctx) => {
  const ids = value.rules.map((rule) => rule.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Business rule IDs must be unique." });
});
export type RequirementsAnalysis = z.infer<typeof RequirementsAnalysisSchema>;
