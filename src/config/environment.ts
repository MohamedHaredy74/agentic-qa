import "dotenv/config";
import { z } from "zod";

const EnvironmentSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required."),
  QA_MODEL: z.string().default("gpt-4.1-mini"),
  BASE_URL: z.string().url().default("https://demo.playwright.dev/todomvc"),
  HEADLESS: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  QA_APPROVAL_MODE: z.enum(["interactive", "manual"]).default("interactive"),
  QA_STORY_PATH: z.string().default("requirements/story.md"),
});

export type Environment = z.infer<typeof EnvironmentSchema>;
export function loadEnvironment(): Environment {
  const result = EnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid QA environment configuration:\n${details}\nCopy .env.example to .env and provide the required values.`);
  }
  if (/^(your[_-]?api[_-]?key|replace[_-]?me|changeme|sk-\.\.\.)$/i.test(result.data.OPENAI_API_KEY.trim())) {
    throw new Error("OPENAI_API_KEY is an example placeholder. Set a valid key in agentic-qa/.env before running the QA workflow.");
  }
  return result.data;
}
