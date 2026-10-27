import { z } from "zod";

export const ExplorationResultSchema = z.object({ pages: z.array(z.object({ url: z.string().url(), title: z.string(), elements: z.array(z.object({ role: z.string().nullable(), accessibleName: z.string().nullable(), testId: z.string().nullable(), locator: z.string().min(1), confidence: z.number().min(0).max(1) })) })), observations: z.array(z.string()), limitations: z.array(z.string()) });
export type ExplorationResult = z.infer<typeof ExplorationResultSchema>;
