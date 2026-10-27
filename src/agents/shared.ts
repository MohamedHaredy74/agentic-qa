import { Agent, run } from "@openai/agents";
import type { z } from "zod";

export async function runStructured<T extends z.ZodType>(name: string, instructions: string, schema: T, input: string): Promise<z.infer<T>> {
 const agent = new Agent({ name, instructions, outputType: schema, model: process.env.QA_MODEL || "gpt-4.1-mini" });
 const result = await run(agent, input, { maxTurns: 3 });
 return schema.parse(result.finalOutput);
}
